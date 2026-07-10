"""Prediction Inspector Phase 5 — share links and CSV export for per-example results."""
from __future__ import annotations

import csv
import io
from datetime import datetime, timedelta, timezone

import jwt as pyjwt

try:
    import app as app_module
except ImportError:
    import backend.app as app_module  # type: ignore


app = app_module.app

SECRET = "dev-secret"


def reset_store() -> None:
    app_module._STORE["submissions"].clear()
    app_module._STORE["evaluations"].clear()
    app_module._STORE["datasets"].clear()
    app_module._STORE.setdefault("submission_counts", {}).clear()
    app_module.LEADERBOARD_DATA.clear()
    app_module._AUTO_SEED_DONE = False


def make_jwt(sub: str) -> str:
    return pyjwt.encode({"sub": sub}, SECRET, algorithm="HS256")


def auth_headers(sub: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_jwt(sub)}"}


def seed_classification_dataset(name: str, n: int = 4) -> None:
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


def submit(client, dataset: str, owner: str, results: list[str]) -> int:
    resp = client.post("/public/submit_model", json={
        "benchmarkDatasetName": dataset,
        "modelName": f"{owner}-model",
        "modelResults": results,
        "sentence_ids": list(range(len(results))),
    }, headers=auth_headers(owner))
    assert resp.status_code == 200
    return resp.get_json()["submission_id"]


def setup_env(monkeypatch) -> None:
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_JWT_SECRET", SECRET)
    monkeypatch.delenv("LEADERBOARD_API_KEYS", raising=False)
    monkeypatch.delenv("REQUIRE_API_KEY", raising=False)
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()


def parse_csv(body: bytes) -> list[dict[str, str]]:
    return list(csv.DictReader(io.StringIO(body.decode("utf-8"))))


# ---------------------------------------------------------------------------
# CSV export
# ---------------------------------------------------------------------------

def test_export_csv_as_owner(monkeypatch):
    setup_env(monkeypatch)
    seed_classification_dataset("export_ds")

    with app.test_client() as c:
        # ids 0,1 correct; 2,3 wrong
        sid = submit(c, "export_ds", "owner-1", ["pos", "neg", "neg", "pos"])

        r = c.get(f"/public/submissions/{sid}/examples/export", headers=auth_headers("owner-1"))
        assert r.status_code == 200
        assert r.mimetype == "text/csv"
        assert f"submission-{sid}-examples-all.csv" in r.headers.get("Content-Disposition", "")

        rows = parse_csv(r.data)
        assert len(rows) == 4
        assert rows[0]["ground_truth"] == "pos"
        assert rows[0]["prediction"] == "pos"
        assert rows[0]["correct"] == "true"
        assert rows[2]["correct"] == "false"


def test_export_csv_respects_filter(monkeypatch):
    setup_env(monkeypatch)
    seed_classification_dataset("export_filter_ds")

    with app.test_client() as c:
        sid = submit(c, "export_filter_ds", "owner-2", ["pos", "neg", "neg", "pos"])

        r = c.get(
            f"/public/submissions/{sid}/examples/export?filter=wrong",
            headers=auth_headers("owner-2"),
        )
        assert r.status_code == 200
        rows = parse_csv(r.data)
        assert len(rows) == 2
        assert all(row["correct"] == "false" for row in rows)

        bad = c.get(
            f"/public/submissions/{sid}/examples/export?filter=bogus",
            headers=auth_headers("owner-2"),
        )
        assert bad.status_code == 400


def test_export_csv_requires_auth(monkeypatch):
    setup_env(monkeypatch)
    seed_classification_dataset("export_auth_ds")

    with app.test_client() as c:
        sid = submit(c, "export_auth_ds", "owner-3", ["pos", "neg", "neg", "pos"])

        assert c.get(f"/public/submissions/{sid}/examples/export").status_code == 401
        other = c.get(
            f"/public/submissions/{sid}/examples/export",
            headers=auth_headers("someone-else"),
        )
        assert other.status_code == 403


# ---------------------------------------------------------------------------
# Share links
# ---------------------------------------------------------------------------

def test_share_mint_and_anonymous_access(monkeypatch):
    setup_env(monkeypatch)
    seed_classification_dataset("share_ds")

    with app.test_client() as c:
        sid = submit(c, "share_ds", "share-owner", ["pos", "neg", "neg", "pos"])

        minted = c.post(f"/public/submissions/{sid}/share", headers=auth_headers("share-owner"))
        assert minted.status_code == 200
        body = minted.get_json()
        assert body["success"] is True
        assert body["expires_in_days"] == 30
        token = body["share_token"]

        # Anonymous read via share token
        r = c.get(f"/public/submissions/{sid}/examples?share={token}")
        assert r.status_code == 200
        payload = r.get_json()
        assert payload["total"] == 4
        assert len(payload["examples"]) == 4

        # Share token also unlocks CSV export
        exp = c.get(f"/public/submissions/{sid}/examples/export?share={token}")
        assert exp.status_code == 200
        assert len(parse_csv(exp.data)) == 4

        # Without the token, anonymous access stays locked
        assert c.get(f"/public/submissions/{sid}/examples").status_code == 401


def test_share_mint_requires_owner(monkeypatch):
    setup_env(monkeypatch)
    seed_classification_dataset("share_owner_ds")

    with app.test_client() as c:
        sid = submit(c, "share_owner_ds", "real-owner", ["pos", "neg", "neg", "pos"])

        assert c.post(f"/public/submissions/{sid}/share").status_code == 401
        other = c.post(f"/public/submissions/{sid}/share", headers=auth_headers("intruder"))
        assert other.status_code == 403
        missing = c.post("/public/submissions/999999/share", headers=auth_headers("real-owner"))
        assert missing.status_code == 404


def test_share_expires_in_days_clamped_and_validated(monkeypatch):
    setup_env(monkeypatch)
    seed_classification_dataset("share_clamp_ds")

    with app.test_client() as c:
        sid = submit(c, "share_clamp_ds", "clamp-owner", ["pos", "neg", "neg", "pos"])

        big = c.post(
            f"/public/submissions/{sid}/share",
            json={"expires_in_days": 500},
            headers=auth_headers("clamp-owner"),
        )
        assert big.status_code == 200
        assert big.get_json()["expires_in_days"] == 90

        bad = c.post(
            f"/public/submissions/{sid}/share",
            json={"expires_in_days": "abc"},
            headers=auth_headers("clamp-owner"),
        )
        assert bad.status_code == 400


def test_share_token_scoped_to_one_submission(monkeypatch):
    setup_env(monkeypatch)
    seed_classification_dataset("share_scope_ds")

    with app.test_client() as c:
        sid_a = submit(c, "share_scope_ds", "scope-owner", ["pos", "neg", "neg", "pos"])
        sid_b = submit(c, "share_scope_ds", "scope-owner", ["pos", "neg", "pos", "neg"])

        token_a = c.post(
            f"/public/submissions/{sid_a}/share", headers=auth_headers("scope-owner")
        ).get_json()["share_token"]

        assert c.get(f"/public/submissions/{sid_a}/examples?share={token_a}").status_code == 200
        # Token for A must not open B
        assert c.get(f"/public/submissions/{sid_b}/examples?share={token_a}").status_code == 401


def test_share_token_expired_or_tampered_rejected(monkeypatch):
    setup_env(monkeypatch)
    seed_classification_dataset("share_bad_ds")

    with app.test_client() as c:
        sid = submit(c, "share_bad_ds", "bad-owner", ["pos", "neg", "neg", "pos"])

        expired = pyjwt.encode({
            "share_submission_id": sid,
            "scope": "submission-examples",
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        }, SECRET, algorithm="HS256")
        assert c.get(f"/public/submissions/{sid}/examples?share={expired}").status_code == 401

        wrong_key = pyjwt.encode({
            "share_submission_id": sid,
            "scope": "submission-examples",
            "exp": datetime.now(timezone.utc) + timedelta(days=1),
        }, "other-secret", algorithm="HS256")
        assert c.get(f"/public/submissions/{sid}/examples?share={wrong_key}").status_code == 401

        wrong_scope = pyjwt.encode({
            "share_submission_id": sid,
            "scope": "something-else",
            "exp": datetime.now(timezone.utc) + timedelta(days=1),
        }, SECRET, algorithm="HS256")
        assert c.get(f"/public/submissions/{sid}/examples?share={wrong_scope}").status_code == 401


def test_share_token_is_not_a_login_token(monkeypatch):
    """A share token has no sub claim, so it must not authenticate owner-scoped routes."""
    setup_env(monkeypatch)
    seed_classification_dataset("share_sec_ds")

    with app.test_client() as c:
        sid = submit(c, "share_sec_ds", "sec-owner", ["pos", "neg", "neg", "pos"])

        token = c.post(
            f"/public/submissions/{sid}/share", headers=auth_headers("sec-owner")
        ).get_json()["share_token"]

        as_bearer = {"Authorization": f"Bearer {token}"}
        assert c.get("/public/my_submissions", headers=as_bearer).status_code == 401
        assert c.get(f"/public/submissions/{sid}", headers=as_bearer).status_code == 401
        assert c.delete(f"/public/submissions/{sid}", headers=as_bearer).status_code == 401


def test_share_mint_requires_secret(monkeypatch):
    """Without LEADERBOARD_JWT_SECRET, minting fails with 503 (owner authed via API key)."""
    setup_env(monkeypatch)
    seed_classification_dataset("share_nosecret_ds")

    with app.test_client() as c:
        sid = submit(c, "share_nosecret_ds", "key-owner", ["pos", "neg", "neg", "pos"])

        monkeypatch.delenv("LEADERBOARD_JWT_SECRET", raising=False)
        monkeypatch.setenv("LEADERBOARD_API_KEYS", "k1")
        r = c.post(
            f"/public/submissions/{sid}/share?submitter_id=key-owner",
            headers={"X-API-Key": "k1"},
        )
        assert r.status_code == 503
