# Anote Model Leaderboard

A transparent, community-driven benchmarking platform for evaluating and ranking AI models across multiple task types and datasets.

**Live site:** [leaderboard.anote.ai](https://leaderboard.anote.ai) &nbsp;|&nbsp; **API:** [api.anote.ai](https://api.anote.ai) &nbsp;|&nbsp; **Docs:** [docs.anote.ai](https://docs.anote.ai)

---

## What it does

- **Compare models** on text classification, NER, Q&A, and translation benchmarks
- **Submit predictions** via the web UI or REST API and get instant scores
- **Multi-language translation** — Spanish, Arabic, Japanese, Chinese, Korean
- **Dual metrics** — BLEU (n-gram exact match) and BERTScore (semantic similarity)
- **CSV benchmarking** — run any model against 20+ bundled datasets in one click
- **Hugging Face import** — pull any HF dataset split directly into the leaderboard

---

## Architecture

```
Leaderboard/
├── backend/           # Flask REST API (Python)
│   ├── app.py         # All API routes (~850 lines)
│   ├── models.py      # Model provider wrappers (OpenAI, Anthropic, Google, Ollama, echo)
│   ├── csv_bench.py   # CSV benchmark utilities
│   ├── sdk/           # Python client SDK
│   ├── database/      # MySQL schema + init scripts
│   ├── examples/      # Demo data seed scripts
│   └── pytest/        # Test suite
└── frontend/          # React 18 web app
    ├── src/
    │   ├── App.js
    │   ├── landing_page/
    │   │   ├── LandingPage.js
    │   │   └── landing_page_components/   # Leaderboard, Evaluations, Submit, etc.
    │   ├── redux/
    │   └── constants/
    └── public/
        └── benchmark_csvs/                # 20+ CSV benchmark datasets
```

**Storage:** MySQL is the primary store; the backend automatically falls back to an in-memory store when no DB is configured — no database is required to run locally.

---

## Quickstart

### 1. Backend

```bash
cd backend

# (Optional) create a virtualenv
python -m venv .venv && source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start on port 5001 (macOS reserves 5000)
PORT=5001 FLASK_ENV=development python app.py
```

Health check: `curl http://localhost:5001/health`

### 2. Seed demo data (optional)

In a separate terminal:

```bash
LEADERBOARD_API_BASE=http://localhost:5001 python backend/examples/seed_demo.py
```

This seeds two demo submissions into the `flores_spanish_translation` dataset.

### 3. Frontend

```bash
cd frontend
npm install
REACT_APP_API_ENDPOINT=http://localhost:5001 npm start
```

Open [http://localhost:3000](http://localhost:3000). The Evaluations page will show the seeded scores.

### Docker

```bash
docker compose up --build
```

Frontend at `http://localhost:3000`, API at `http://localhost:5001`.

---

## Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and fill in what you need. **All API keys are optional** — the platform works without them using the `echo` provider.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5001` | Flask server port |
| `OPENAI_API_KEY` | — | OpenAI model evaluation |
| `ANTHROPIC_API_KEY` | — | Anthropic / Claude evaluation |
| `GOOGLE_API_KEY` | — | Google Gemini evaluation |
| `XAI_API_KEY` | — | xAI Grok evaluation |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Local Ollama inference |
| `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | — | MySQL connection (optional) |
| `LEADERBOARD_API_KEYS` | — | Comma-separated write-endpoint API keys |
| `ALLOWED_ORIGINS` | dev origins | CORS allowlist (required in production) |
| `SUBMIT_MODEL_RATE_LIMIT` | `10/minute` | Per-IP rate limit for submissions |

### Frontend

| File | `REACT_APP_API_ENDPOINT` |
|---|---|
| `.env.development` | `http://localhost:5000` |
| `.env.production` | `https://api.anote.ai` |

Override locally: `REACT_APP_API_ENDPOINT=http://localhost:5001 npm start`

---

## API Reference

### Leaderboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Welcome / version info |
| `GET` | `/health` | Health check |
| `GET` | `/public/datasets` | List benchmark datasets |
| `POST` | `/public/submit_model` | Submit model predictions for scoring |
| `GET` | `/public/get_leaderboard` | Ranked model results (paginated) |
| `GET` | `/public/export/leaderboard` | Export as JSON or CSV |
| `POST` | `/api/leaderboard/add_dataset` | Add a curated dataset |
| `POST` | `/api/leaderboard/add_model` | Add a model result to a dataset |
| `GET` | `/api/leaderboard/list` | List curated datasets |

### Benchmarks & Metrics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/public/benchmark_csvs` | List bundled CSV benchmark files |
| `POST` | `/public/run_csv_benchmarks` | Run models against CSV datasets |
| `GET` | `/api/metrics` | Full metric catalog |
| `GET` | `/api/metrics/task/<task_type>` | Metrics recommended for a task type |

### Dataset Import

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/public/import_hf_dataset` | Import a Hugging Face dataset split |
| `POST` | `/api/datasets/ingest` | Ingestion-compatible alias for HF imports |
| `GET` | `/public/get_source_sentences` | Sentences for translation evaluation |
| `GET` | `/openapi.json` | OpenAPI machine-readable spec |

### Example: Add a dataset

```bash
curl -X POST http://localhost:5001/api/leaderboard/add_dataset \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Financial Phrasebank - Classification Accuracy",
    "url": "https://huggingface.co/datasets/takala/financial_phrasebank",
    "task_type": "text_classification",
    "description": "Financial sentiment classification benchmark.",
    "models": [
      { "rank": 1, "model": "Gemini", "score": 0.95, "ci": "0.93 - 0.97", "updated": "Sep 2024" }
    ]
  }'
```

### Example: Run CSV benchmarks

```bash
curl -X POST http://localhost:5001/public/run_csv_benchmarks \
  -H "Content-Type: application/json" \
  -d '{
    "models": [
      { "name": "gpt-4o", "provider": "openai", "model": "gpt-4o-mini" },
      { "name": "echo",   "provider": "echo" }
    ],
    "datasets": ["Commonsense.csv"],
    "sample_size": 25
  }'
```

### Example: Import from Hugging Face

```bash
curl -X POST http://localhost:5001/public/import_hf_dataset \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_name": "ag_news",
    "split": "test",
    "limit": 100,
    "task_type": "text_classification",
    "display_name": "AG News Test Sample"
  }'
```

### Pagination & export

```bash
# Paginated leaderboard
curl "http://localhost:5001/public/get_leaderboard?page=1&page_size=25&dataset=AG%20News%20Test%20Sample"

# Export as CSV
curl "http://localhost:5001/public/export/leaderboard?format=csv" -o leaderboard.csv
```

---

## Model Providers

The `provider` field selects the inference backend:

| Provider | Description | Requirement |
|---|---|---|
| `openai` | OpenAI API (GPT-4o, etc.) | `OPENAI_API_KEY` |
| `anthropic` | Anthropic API (Claude) | `ANTHROPIC_API_KEY` |
| `google` | Google Generative AI (Gemini) | `GOOGLE_API_KEY` |
| `ollama` | Local Ollama instance | Running Ollama at `OLLAMA_BASE_URL` |
| `echo` | Dummy provider (returns input) | None — great for dry-runs |
| `py` | Python function in `models.py` | None |

Define custom Python model wrappers in `backend/models.py`:

```python
# backend/models.py
def my_custom_model(prompt: str) -> str:
    # call your model here
    return "model output"
```

Then reference it as `{ "name": "my-model", "provider": "py", "fn": "my_custom_model" }`.

---

## Python SDK

```python
from backend.sdk.leaderboard_sdk import LeaderboardClient

client = LeaderboardClient(base_url="http://localhost:5001")

# Add a curated dataset
client.add_dataset(
    name="Financial Phrasebank - Classification Accuracy",
    task_type="text_classification",
    url="https://huggingface.co/datasets/takala/financial_phrasebank",
    description="Financial sentiment classification benchmark.",
)

# Add a model result
client.add_model(
    dataset_name="Financial Phrasebank - Classification Accuracy",
    model="Llama3",
    rank=1,
    score=0.92,
    updated="Sep 2024",
)

# List all datasets
print(client.list_datasets())

# Submit model translations for scoring
src = client.get_source_sentences(dataset_name="flores_spanish_translation", count=3)
print(client.submit_model(
    benchmark_dataset_name="flores_spanish_translation",
    model_name="my-demo-model",
    model_results=src["source_sentences"],  # echo back for demo
    sentence_ids=src["sentence_ids"],
))

# Get full leaderboard
print(client.get_leaderboard())
```

---

## Supported Task Types

| Task | Metric | Notes |
|---|---|---|
| `text_classification` | Accuracy | Single or multi-label |
| `named_entity_recognition` | F1 | Span-level evaluation |
| `document_qa` | F1 / Exact Match | Document-context Q&A |
| `line_qa` | F1 / Exact Match | Prompt-style Q&A |
| `translation` | BLEU + BERTScore | BLEU≈0 for Asian scripts; always use BERTScore for JA/ZH/KO |
| `multiple_choice` | Accuracy | CSV datasets with answer columns |

---

## Testing

```bash
cd backend
python -m pytest pytest/ -v
```

Tests cover endpoint integration, SDK usage, BLEU/BERTScore scoring for all 5 translation languages, and leaderboard ranking.

See [`backend/pytest/TESTING_GUIDE.md`](backend/pytest/TESTING_GUIDE.md) for the full guide with 13+ test scenarios.

---

## Adding Things

### New API endpoint
1. Add the route in `backend/app.py` following existing patterns.
2. Add a test in `backend/pytest/test_dataset_endpoints.py`.

### New model provider
1. Add a wrapper function in `backend/models.py`.
2. Register it in the provider dispatch logic in `app.py`.

### New CSV benchmark dataset
1. Place the `.csv` file in `frontend/public/benchmark_csvs/`.
2. Ensure headers are recognizable by `csv_bench.py`'s `infer_task_type()`.

### New frontend component
1. Create the component in `frontend/src/landing_page/landing_page_components/`.
2. Import and render it in `LandingPage.js`.
3. Add the route to `src/constants/RouteConstants.js` if it needs its own page.

---

## Security

- Set `LEADERBOARD_API_KEYS=key1,key2` to require `X-API-Key` on write endpoints.
- Set `REQUIRE_API_KEY=true` to enforce key auth globally.
- Set `ALLOWED_ORIGINS` explicitly in production (required).
- Per-endpoint rate limits: `SUBMIT_MODEL_RATE_LIMIT`, `ADD_DATASET_RATE_LIMIT`, `RUN_CSV_RATE_LIMIT`.

---

## Optional: Documentation Site

```bash
pip install mkdocs-material
mkdocs serve
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000).

---

## Contact

Questions or issues? Email [nvidra@anote.ai](mailto:nvidra@anote.ai) or visit [anote.ai](https://anote.ai).
