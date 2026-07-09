---
name: verify
description: Build, launch, and drive the Leaderboard app end-to-end to verify a change at its runtime surface (backend API + React GUI).
---

# Verify — Anote Model Leaderboard

## Backend (Flask API)

Use the repo-root venv (`.venv/bin/python`); `backend/.venv` also works.

```bash
cd backend && ALLOWED_ORIGINS=http://localhost:<FRONTEND_PORT> \
  LEADERBOARD_JWT_SECRET=<any-long-secret> DISABLE_RATE_LIMIT=1 \
  REQUIRE_API_KEY=false LEADERBOARD_API_KEYS= \
  SQLITE_DB_PATH=<scratch>/verify.db PORT=5057 FLASK_ENV=development \
  ../.venv/bin/python app.py
```

- Poll `GET /health` until up.
- Mint a user JWT: `python -c "import jwt; print(jwt.encode({'sub':'verify-user'}, '<secret>', algorithm='HS256'))"`.
- Seed data over HTTP: `POST /public/add_dataset` (classification: `reference_data` with `source_texts`, `labels`, `label_names`), then `POST /public/submit_model` with `benchmarkDatasetName`, `modelName`, `modelResults`, `sentence_ids`. Both accept `Authorization: Bearer <jwt>`.

## Gotchas

- The local `backend/.env` sets API-key enforcement — always override `LEADERBOARD_API_KEYS=`/`REQUIRE_API_KEY=false` explicitly (dotenv does not override existing env vars). This also makes one pre-existing test fail unless `LEADERBOARD_API_KEYS= REQUIRE_API_KEY= python -m pytest ...`.
- Ports 3000/3001 are often occupied by other apps on this machine — pick a free port and pass it via `ALLOWED_ORIGINS` (CORS blocks other origins even in development).
- The SPA stores the login JWT in **sessionStorage** key `lb_jwt` (not localStorage).
- CSS `uppercase` transforms mean `innerText` checks must be case-insensitive.

## Frontend (React GUI, headless Chrome)

CRA bakes the API base at build time:

```bash
cd frontend && REACT_APP_API_BASE=http://127.0.0.1:5057 npm run build
```

No Playwright installed; use `puppeteer-core` (scratchpad `npm i puppeteer-core serve-handler`) with the installed Chrome at
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
Serve `frontend/build` with serve-handler and a `**` → `/index.html` rewrite (SPA routing), then drive pages, click buttons, screenshot.
`puppeteer-core` is ESM — use `await import("puppeteer-core")` from CJS scripts.
Enable downloads via CDP `Browser.setDownloadBehavior` to verify CSV export buttons.
