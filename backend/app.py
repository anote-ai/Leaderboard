import os
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid

# Optional imports for evaluation
try:
    from nltk.translate.bleu_score import sentence_bleu
except Exception:
    sentence_bleu = None

# Optional BERTScore
def _optional_bertscore(predictions, references):
    try:
        from bert_score import BERTScorer
        scorer = BERTScorer(model_type='bert-base-multilingual-cased')
        P, R, F1 = scorer.score(predictions, references)
        return float(F1.mean().item())
    except Exception:
        # Library not available; fall back to 0.0 rather than failing
        return 0.0

# Optional MySQL connection
def get_db_connection():
    try:
        import mysql.connector  # type: ignore
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'agents'),
            port=int(os.getenv('DB_PORT', '3306')),
        )
        cursor = conn.cursor(dictionary=True)
        return conn, cursor
    except Exception as e:
        # Database might not be configured in local dev. Return None to use in-memory fallback.
        print(f"Warning: DB connection not available: {e}")
        return None, None


app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False
CORS(app, resources={r"/*": {"origins": [
    'http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000', 'http://localhost:5001'
]}})


# Simple health endpoint
@app.get('/health')
def health():
    return jsonify({"ok": True, "time": datetime.utcnow().isoformat()})


# ---------------------------
# Leaderboard helpers
# ---------------------------
def _get_bleu(translations, references, weights=(0.5, 0.5, 0, 0)):
    if not translations or not references or len(translations) != len(references):
        return 0.0
    if sentence_bleu is None:
        return 0.0
    try:
        scores = []
        for ref, hyp in zip(references, translations):
            ref_tokens = ref.split()
            hyp_tokens = hyp.split()
            score = sentence_bleu([ref_tokens], hyp_tokens, weights=weights)
            scores.append(score)
        return float(sum(scores) / len(scores))
    except Exception:
        return 0.0


# In-memory fallback storage when DB is not available
_STORE = {
    "submissions": [],  # {id, benchmark_dataset_name, model_name, results, created}
    "evaluations": [],  # {submission_id, score, metric, created}
}

# UI-oriented datasets store (for add_dataset/add_model endpoints)
LEADERBOARD_DATA = []  # list of dicts with fields per README


# Small Spanish reference list to make BLEU behave reasonably if HF datasets are unavailable
_SPANISH_REFERENCES = [
    "Este es un ejemplo de oración para evaluación.",
    "La investigación todavía se encuentra en una etapa inicial.",
    "Como otros expertos, es escéptico sobre una cura definitiva.",
    "Actualmente tenemos resultados prometedores en nuestros estudios.",
    "El sistema se evalúa con métricas estándar de la industria."
]


@app.get('/public/get_source_sentences')
def get_source_sentences():
    """Return source sentences users should translate.

    Query params:
      - dataset_name (optional): defaults to 'flores_spanish_translation'
      - count (optional): number of sentences to return (default 3)
      - start_idx (optional): starting index in the pool (default 0)
    """
    dataset_name = request.args.get('dataset_name', 'flores_spanish_translation')
    try:
        count = int(request.args.get('count', 3))
        start_idx = int(request.args.get('start_idx', 0))
    except ValueError:
        return jsonify({"success": False, "error": "Invalid count or start_idx"}), 400

    # For now, we support Spanish by default with a local pool.
    # This keeps the endpoint functional without external dependencies.
    if dataset_name.startswith('flores_spanish_translation'):
        pool = _SPANISH_REFERENCES
    else:
        # Fallback to the same pool for other languages to keep API responsive
        pool = _SPANISH_REFERENCES

    if start_idx < 0:
        start_idx = 0
    end_idx = min(start_idx + count, len(pool))
    selected = pool[start_idx:end_idx]
    sentence_ids = list(range(start_idx, end_idx))

    return jsonify({
        "success": True,
        "dataset_name": dataset_name,
        "sentence_ids": sentence_ids,
        "source_sentences": selected,
        "count": len(selected),
    })


@app.get('/public/get_leaderboard')
def get_leaderboard():
    """Get leaderboard showing model submissions and scores.
    Supports DB if configured, otherwise returns in-memory results.
    """
    limit = int(request.args.get('limit', 100))
    conn, cursor = get_db_connection()

    if conn and cursor:
        try:
            query = (
                "SELECT ms.model_name, bd.name AS dataset_name, bd.task_type, bd.evaluation_metric, "
                "er.score, ms.created AS submitted_at "
                "FROM model_submissions ms "
                "JOIN benchmark_datasets bd ON ms.benchmark_dataset_id = bd.id "
                "JOIN evaluation_results er ON er.model_submission_id = ms.id "
                "WHERE bd.active = TRUE "
                "ORDER BY bd.name, er.score DESC "
                "LIMIT %s"
            )
            cursor.execute(query, (limit,))
            rows = cursor.fetchall()
            leaderboard = []
            for i, row in enumerate(rows):
                leaderboard.append({
                    "rank": i + 1,
                    "model_name": row['model_name'],
                    "dataset_name": row['dataset_name'],
                    "task_type": row.get('task_type'),
                    "evaluation_metric": row.get('evaluation_metric'),
                    "score": float(row['score']),
                    "submitted_at": row['submitted_at'].isoformat() if row.get('submitted_at') else None,
                })
            return jsonify({"success": True, "leaderboard": leaderboard})
        except Exception as e:
            print(f"Error reading leaderboard from DB: {e}")
        finally:
            try:
                cursor.close()
                conn.close()
            except Exception:
                pass

    # In-memory fallback
    mem = sorted(_STORE["evaluations"], key=lambda x: x["score"], reverse=True)[:limit]
    leaderboard = []
    for i, ev in enumerate(mem):
        sub = next((s for s in _STORE["submissions"] if s["id"] == ev["submission_id"]), None)
        if not sub:
            continue
        leaderboard.append({
            "rank": i + 1,
            "model_name": sub["model_name"],
            "dataset_name": sub["benchmark_dataset_name"],
            "task_type": "translation",
            "evaluation_metric": ev["metric"],
            "score": ev["score"],
            "submitted_at": sub["created"].isoformat(),
        })
    return jsonify({"success": True, "leaderboard": leaderboard})


@app.post('/public/submit_model')
def submit_model():
    """Submit model results to a benchmark dataset and compute evaluation.

    Expected JSON:
    {
      "benchmarkDatasetName": "flores_spanish_translation",
      "modelName": "my-model-v1",
      "modelResults": ["Traducción 1", ...],
      "sentence_ids": [0, 1, 2]
    }
    """
    data = request.get_json(silent=True) or {}
    benchmark_dataset_name = data.get('benchmarkDatasetName')
    model_name = data.get('modelName')
    model_results = data.get('modelResults')
    sentence_ids = data.get('sentence_ids')

    if not all([benchmark_dataset_name, model_name, isinstance(model_results, list), isinstance(sentence_ids, list)]):
        return jsonify({
            "success": False,
            "error": "Missing required fields: benchmarkDatasetName, modelName, modelResults (list), sentence_ids (list)",
        }), 400

    if len(model_results) != len(sentence_ids):
        return jsonify({
            "success": False,
            "error": "Length of sentence_ids must match length of modelResults",
        }), 400

    # Choose references. For FLORES Spanish, use our local pool subset by ids.
    if benchmark_dataset_name.startswith('flores_spanish_translation'):
        references_pool = _SPANISH_REFERENCES
        # Guard indices
        for sid in sentence_ids:
            if sid < 0 or sid >= len(references_pool):
                return jsonify({
                    "success": False,
                    "error": f"sentence_id {sid} is out of range (0-{len(references_pool)-1})",
                }), 400
        references = [references_pool[sid] for sid in sentence_ids]
    else:
        # Fallback: use same Spanish pool
        references = [
            _SPANISH_REFERENCES[i % len(_SPANISH_REFERENCES)] for i in sentence_ids
        ]

    # Determine metric
    metric = 'bertscore' if benchmark_dataset_name.endswith('_bertscore') else 'bleu'

    try:
        if metric == 'bleu':
            score = _get_bleu(model_results, references)
        else:
            score = _optional_bertscore(model_results, references)
    except Exception as e:
        print(f"Evaluation failed: {e}")
        return jsonify({"success": False, "error": "Evaluation failed"}), 500

    # Try to persist in DB; otherwise store in memory
    conn, cursor = get_db_connection()
    if conn and cursor:
        try:
            # Find dataset id (or create minimal if missing)
            cursor.execute(
                "SELECT id FROM benchmark_datasets WHERE name = %s",
                (benchmark_dataset_name,)
            )
            row = cursor.fetchone()
            if row:
                dataset_id = row['id']
            else:
                cursor.execute(
                    "INSERT INTO benchmark_datasets (name, task_type, evaluation_metric, reference_data, active) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    (benchmark_dataset_name, 'translation', metric, json.dumps([]), True)
                )
                dataset_id = cursor.lastrowid

            cursor.execute(
                "INSERT INTO model_submissions (benchmark_dataset_id, model_name, submitted_by, model_results) "
                "VALUES (%s, %s, %s, %s)",
                (dataset_id, model_name, 'public@anote.ai', json.dumps(model_results))
            )
            submission_id = cursor.lastrowid

            cursor.execute(
                "INSERT INTO evaluation_results (model_submission_id, score, evaluation_details) "
                "VALUES (%s, %s, %s)",
                (submission_id, float(score), json.dumps({"metric": metric}))
            )
            conn.commit()
        except Exception as e:
            print(f"DB write failed, storing in memory instead: {e}")
            submission_id = None
        finally:
            try:
                cursor.close()
                conn.close()
            except Exception:
                pass
    else:
        submission_id = None

    if submission_id is None:
        # In-memory fallback
        submission_id = len(_STORE["submissions"]) + 1
        _STORE["submissions"].append({
            "id": submission_id,
            "benchmark_dataset_name": benchmark_dataset_name,
            "model_name": model_name,
            "results": model_results,
            "created": datetime.utcnow(),
        })
        _STORE["evaluations"].append({
            "submission_id": submission_id,
            "score": float(score),
            "metric": metric,
            "created": datetime.utcnow(),
        })

    return jsonify({"success": True, "score": float(score)})


# ---------------------------
# Leaderboard UI API (per README)
# ---------------------------
@app.post('/api/leaderboard/add_dataset')
def add_dataset():
    data = request.get_json(silent=True) or {}
    required = ["name", "task_type"]
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({"status": "error", "message": f"Missing required fields: {', '.join(missing)}"}), 400
    dataset_id = str(uuid.uuid4())
    new_ds = {
        "id": dataset_id,
        "name": data["name"],
        "url": data.get("url"),
        "task_type": data["task_type"],
        "description": data.get("description"),
        "models": data.get("models", []),
    }
    LEADERBOARD_DATA.append(new_ds)
    return jsonify({
        "status": "success",
        "message": "Dataset added to leaderboard.",
        "dataset_id": dataset_id,
    })


@app.post('/api/leaderboard/add_model')
def add_model():
    data = request.get_json(silent=True) or {}
    required = ["dataset_name", "model", "rank", "score", "updated"]
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({"status": "error", "message": f"Missing required fields: {', '.join(missing)}"}), 400
    for ds in LEADERBOARD_DATA:
        if ds.get("name") == data["dataset_name"]:
            ds.setdefault("models", []).append({
                "rank": data["rank"],
                "model": data["model"],
                "score": data["score"],
                "ci": data.get("ci"),
                "updated": data["updated"],
            })
            # keep models sorted by rank
            ds["models"].sort(key=lambda m: (m.get("rank") is None, m.get("rank")))
            return jsonify({"status": "success", "message": "Model added to dataset on leaderboard."})
    return jsonify({"status": "error", "message": "Dataset not found."}), 404


if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    # When running via Docker-compose, external is 5001 -> container 5000
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
