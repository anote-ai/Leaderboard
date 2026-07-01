from __future__ import annotations

import json
import time

try:
    import app as app_module
except ImportError:
    import backend.app as app_module  # type: ignore


app = app_module.app


def reset_store() -> None:
    app_module._STORE["submissions"].clear()
    app_module._STORE["evaluations"].clear()
    app_module._STORE["datasets"].clear()
    app_module._STORE.setdefault("submission_counts", {}).clear()
    app_module.LEADERBOARD_DATA.clear()
    app_module._AUTO_SEED_DONE = False


def make_jwt(sub: str) -> str:
    import jwt as pyjwt

    return pyjwt.encode({"sub": sub}, "dev-secret", algorithm="HS256")


def auth_headers(sub: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_jwt(sub)}"}


def seed_classification_dataset(name: str = "workflow_classification") -> None:
    app_module._STORE["datasets"].append({
        "name": name,
        "task_type": "text_classification",
        "evaluation_metric": "accuracy",
        "reference_data": {
            "source_texts": ["great", "bad"],
            "labels": ["positive", "negative"],
            "label_names": ["positive", "negative"],
        },
    })


def test_async_submit_job_completes_and_is_owner_scoped(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_JWT_SECRET", "dev-secret")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()
    seed_classification_dataset()

    with app.test_client() as c:
        response = c.post("/public/submit_model", json={
            "benchmarkDatasetName": "workflow_classification",
            "modelName": "async-model",
            "modelResults": ["positive", "negative"],
            "sentence_ids": [0, 1],
            "async": True,
        }, headers=auth_headers("async-owner"))
        assert response.status_code == 202
        job_id = response.get_json()["job_id"]

        other_user = c.get(f"/public/eval_jobs/{job_id}", headers=auth_headers("other-user"))
        assert other_user.status_code == 404

        final_body = None
        for _ in range(40):
            poll = c.get(f"/public/eval_jobs/{job_id}", headers=auth_headers("async-owner"))
            assert poll.status_code == 200
            final_body = poll.get_json()
            if final_body["status"] == "completed":
                break
            time.sleep(0.05)

        assert final_body["status"] == "completed"
        assert final_body["success"] is True
        assert final_body["score"] == 1.0
        assert final_body["submission_id"] >= 1


def test_my_submissions_rejects_malformed_cursor_without_crashing(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_API_KEYS", "workflow-key")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()

    with app.test_client() as c:
        response = c.get(
            "/public/my_submissions?submitter_id=user-one&cursor=not-a-valid-cursor",
            headers={"X-API-Key": "workflow-key"},
        )

    assert response.status_code == 400
    body = response.get_json()
    assert body["success"] is False
    assert body["error"] == "Invalid cursor"


def test_private_submission_detail_requires_owner(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_JWT_SECRET", "dev-secret")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()
    seed_classification_dataset()

    with app.test_client() as c:
        submitted = c.post("/public/submit_model", json={
            "benchmarkDatasetName": "workflow_classification",
            "modelName": "private-model",
            "modelResults": ["positive", "negative"],
            "sentence_ids": [0, 1],
            "is_public": False,
        }, headers=auth_headers("private-owner"))
        assert submitted.status_code == 200
        submission_id = submitted.get_json()["submission_id"]

        anonymous = c.get(f"/public/submissions/{submission_id}")
        assert anonymous.status_code == 401

        other_user = c.get(f"/public/submissions/{submission_id}", headers=auth_headers("other-user"))
        assert other_user.status_code == 403

        owner = c.get(f"/public/submissions/{submission_id}", headers=auth_headers("private-owner"))
        assert owner.status_code == 200
        body = owner.get_json()
        assert body["success"] is True
        assert body["submission"]["model_results"] == ["positive", "negative"]


def test_my_submissions_memory_response_includes_visibility(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_JWT_SECRET", "dev-secret")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()
    seed_classification_dataset()

    with app.test_client() as c:
        submitted = c.post("/public/submit_model", json={
            "benchmarkDatasetName": "workflow_classification",
            "modelName": "private-row",
            "modelResults": ["positive", "negative"],
            "sentence_ids": [0, 1],
            "is_public": False,
        }, headers=auth_headers("row-owner"))
        assert submitted.status_code == 200

        mine = c.get("/public/my_submissions", headers=auth_headers("row-owner"))
        assert mine.status_code == 200
        rows = mine.get_json()["submissions"]
        assert rows[0]["model_name"] == "private-row"
        assert rows[0]["is_public"] is False


def test_submission_format_exposes_allowed_outputs_without_answers(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()
    app_module._STORE["datasets"].append({
        "name": "workflow_mcq",
        "task_type": "multiple_choice_qa",
        "evaluation_metric": "accuracy",
        "reference_data": {
            "ground_truth": [
                {"id": 0, "question": "Pick one", "options": {"A": "Alpha", "B": "Beta"}, "answer": "B"},
            ],
        },
    })

    with app.test_client() as c:
        response = c.get("/public/submission_format?dataset=workflow_mcq")

    assert response.status_code == 200
    body = response.get_json()
    assert body["task_type_normalized"] == "multiple_choice_qa"
    assert body["allowed_outputs"] == ["A", "B"]
    assert body["submit_model_body"]["modelResults"] == ["A"]


def test_run_llm_submission_validates_dataset_and_provider_failure(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()
    seed_classification_dataset("llm_workflow")

    with app.test_client() as c:
        missing = c.post("/public/run_llm_submission", json={
            "benchmarkDatasetName": "missing",
            "modelName": "llm",
            "provider": "not-a-provider",
        })
        assert missing.status_code == 404

        bad_provider = c.post("/public/run_llm_submission", json={
            "benchmarkDatasetName": "llm_workflow",
            "modelName": "llm",
            "provider": "not-a-provider",
            "batch_size": 1,
        })
        assert bad_provider.status_code == 202
        job_id = bad_provider.get_json()["job_id"]
        final_body = None
        for _ in range(40):
            poll = c.get(f"/public/eval_jobs/{job_id}")
            assert poll.status_code == 200
            final_body = poll.get_json()
            if final_body["status"] == "failed":
                break
            time.sleep(0.05)
        assert final_body["status"] == "failed"
        assert "Unknown provider" in final_body["error"]


# ---------------------------------------------------------------------------
# Prediction Inspector — /public/submissions/<id>/examples global stats
# ---------------------------------------------------------------------------

def _seed_dataset_with_n_items(n: int, name: str = "stats_dataset") -> None:
    """Seed a classification dataset with n items."""
    app_module._STORE["datasets"].append({
        "name": name,
        "task_type": "text_classification",
        "evaluation_metric": "accuracy",
        "reference_data": {
            "source_texts": [f"text {i}" for i in range(n)],
            "labels": ["pos" if i % 2 == 0 else "neg" for i in range(n)],
            "label_names": ["pos", "neg"],
        },
    })


def _get_examples(client, submission_id: int, owner: str, **params):
    qs = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"/public/submissions/{submission_id}/examples" + (f"?{qs}" if qs else "")
    return client.get(url, headers=auth_headers(owner))


def test_examples_global_stats_mixed_correct_wrong(monkeypatch):
    """stats reflects the full unfiltered item list even when a page filter is applied."""
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_JWT_SECRET", "dev-secret")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()
    _seed_dataset_with_n_items(4, "mixed_dataset")

    with app.test_client() as c:
        # Submit: first two correct, last two wrong
        resp = c.post("/public/submit_model", json={
            "benchmarkDatasetName": "mixed_dataset",
            "modelName": "mixed-model",
            "modelResults": ["pos", "neg", "neg", "pos"],  # ids 0,1 correct; 2,3 wrong
            "sentence_ids": [0, 1, 2, 3],
        }, headers=auth_headers("stats-owner"))
        assert resp.status_code == 200
        sid = resp.get_json()["submission_id"]

        # Filter=all, page 1
        r = _get_examples(c, sid, "stats-owner", filter="all", offset=0, limit=25)
        assert r.status_code == 200
        body = r.get_json()

        stats = body["stats"]
        assert stats["total_examples"] == 4
        assert stats["scored_examples"] == 4
        assert stats["correct_examples"] == 2
        assert stats["wrong_examples"] == 2
        assert abs(stats["accuracy"] - 0.5) < 1e-4

        # Filter=correct should still return the same global stats
        r2 = _get_examples(c, sid, "stats-owner", filter="correct", offset=0, limit=25)
        assert r2.status_code == 200
        body2 = r2.get_json()
        stats2 = body2["stats"]
        assert stats2["correct_examples"] == 2
        assert stats2["wrong_examples"] == 2
        assert abs(stats2["accuracy"] - 0.5) < 1e-4
        # But the returned examples list should only contain correct items
        assert all(ex["correct"] is True for ex in body2["examples"])


def test_examples_global_stats_all_null_correct(monkeypatch):
    """When no item has a correct field (e.g. translation task), accuracy must be null."""
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_JWT_SECRET", "dev-secret")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()

    # Manually inject a submission with item_results where correct=None (translation-style)
    ds = {
        "name": "trans_dataset",
        "task_type": "translation",
        "evaluation_metric": "bleu",
        "reference_data": {
            "source_texts": ["hello", "world"],
            "reference_translations": ["hola", "mundo"],
        },
    }
    app_module._STORE["datasets"].append(ds)

    # Inject submission + evaluation directly to bypass actual BLEU scoring
    app_module._STORE["submissions"].append({
        "id": 999,
        "benchmark_dataset_id": None,
        "model_name": "trans-model",
        "submitted_by": "trans-owner",
        "submitter_id": "trans-owner",
        "model_results": ["hola", "mundo"],
        "is_public": True,
        "created": "2024-01-01T00:00:00",
    })
    app_module._STORE["evaluations"].append({
        "submission_id": 999,
        "evaluation_details": json.dumps({
            "item_results": [
                {"id": "0", "ground_truth": "hola", "prediction": "hola", "correct": None},
                {"id": "1", "ground_truth": "mundo", "prediction": "mundo", "correct": None},
            ]
        }),
    })

    with app.test_client() as c:
        r = _get_examples(c, 999, "trans-owner", filter="all", offset=0, limit=25)
        assert r.status_code == 200
        body = r.get_json()

    stats = body["stats"]
    assert stats["total_examples"] == 2
    assert stats["scored_examples"] == 0
    assert stats["correct_examples"] == 0
    assert stats["accuracy"] is None  # must be null, not NaN or Infinity


def test_examples_global_stats_stable_across_pages(monkeypatch):
    """Global stats are identical regardless of which page (offset) is fetched."""
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_JWT_SECRET", "dev-secret")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()
    _seed_dataset_with_n_items(4, "paged_dataset")

    with app.test_client() as c:
        resp = c.post("/public/submit_model", json={
            "benchmarkDatasetName": "paged_dataset",
            "modelName": "paged-model",
            "modelResults": ["pos", "neg", "pos", "neg"],  # all correct
            "sentence_ids": [0, 1, 2, 3],
        }, headers=auth_headers("page-owner"))
        assert resp.status_code == 200
        sid = resp.get_json()["submission_id"]

        # Page 1 (items 0-1)
        r1 = _get_examples(c, sid, "page-owner", filter="all", offset=0, limit=2)
        assert r1.status_code == 200
        stats1 = r1.get_json()["stats"]

        # Page 2 (items 2-3)
        r2 = _get_examples(c, sid, "page-owner", filter="all", offset=2, limit=2)
        assert r2.status_code == 200
        stats2 = r2.get_json()["stats"]

        # Global stats must be identical for both pages
        assert stats1 == stats2
        assert stats1["total_examples"] == 4
        assert stats1["scored_examples"] == 4
        assert abs(stats1["accuracy"] - 1.0) < 1e-4
