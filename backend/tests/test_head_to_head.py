"""Tests for GET /public/head_to_head (per-example disagreement view)."""
from __future__ import annotations


try:
    import app as app_module
except ImportError:
    import backend.app as app_module  # type: ignore

app = app_module.app
DATASET = "SST-2 Sentiment (Sample)"

# Ground-truth labels for the seeded SST-2 sample (see test_compare_models).
GT = ["0", "1", "0", "1", "0", "0", "1", "0", "0", "1",
      "1", "1", "0", "0", "1", "1", "0", "1", "1", "1"]


def reset_store() -> None:
    app_module._STORE["submissions"].clear()
    app_module._STORE["evaluations"].clear()
    app_module._STORE["datasets"].clear()
    app_module._STORE.setdefault("submission_counts", {}).clear()
    app_module.LEADERBOARD_DATA.clear()
    app_module._AUTO_SEED_DONE = False


def seed(c):
    """Alpha is perfect; Beta predicts all-negative (0)."""
    c.get("/health")  # triggers auto-seed
    c.post("/public/submit_model", json={
        "benchmarkDatasetName": DATASET, "modelName": "Alpha",
        "modelResults": GT, "submitterId": "tester",
    })
    c.post("/public/submit_model", json={
        "benchmarkDatasetName": DATASET, "modelName": "Beta",
        "modelResults": ["0"] * 20, "submitterId": "tester",
    })


def _client(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_AUTO_SEED_IN_TESTS", "1")
    monkeypatch.setenv("REQUIRE_API_KEY", "false")
    monkeypatch.setenv("LEADERBOARD_API_KEYS", "")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()
    return app.test_client()


def test_requires_exactly_two_models(monkeypatch):
    c = _client(monkeypatch)
    seed(c)
    assert c.get(f"/public/head_to_head?models=Alpha&dataset={DATASET}").status_code == 400
    assert c.get(f"/public/head_to_head?models=Alpha,Beta,Gamma&dataset={DATASET}").status_code == 400
    # Duplicate collapses to one distinct model -> 400.
    assert c.get(f"/public/head_to_head?models=Alpha,Alpha&dataset={DATASET}").status_code == 400


def test_requires_dataset(monkeypatch):
    c = _client(monkeypatch)
    seed(c)
    assert c.get("/public/head_to_head?models=Alpha,Beta").status_code == 400


def test_unknown_model_returns_404(monkeypatch):
    c = _client(monkeypatch)
    seed(c)
    r = c.get(f"/public/head_to_head?models=Alpha,Ghost&dataset={DATASET}")
    assert r.status_code == 404
    assert r.get_json()["success"] is False


def test_bad_filter_rejected(monkeypatch):
    c = _client(monkeypatch)
    seed(c)
    assert c.get(f"/public/head_to_head?models=Alpha,Beta&dataset={DATASET}&filter=nope").status_code == 400


def test_summary_and_categories(monkeypatch):
    c = _client(monkeypatch)
    seed(c)
    r = c.get(f"/public/head_to_head?models=Alpha,Beta&dataset={DATASET}")
    assert r.status_code == 200
    body = r.get_json()
    s = body["summary"]

    # 20 aligned examples, all scored (binary classification task).
    assert s["total_aligned"] == 20
    assert s["unscored"] == 0
    assert s["a_missing"] == 0 and s["b_missing"] == 0
    # The four correctness buckets partition every scored example.
    assert s["both_correct"] + s["both_wrong"] + s["a_only"] + s["b_only"] == 20
    scored = s["both_correct"] + s["both_wrong"] + s["a_only"] + s["b_only"]
    assert abs(s["agreement_rate"] - ((s["both_correct"] + s["both_wrong"]) / scored)) < 1e-9
    # Alpha's predictions are stronger than Beta's all-negative baseline.
    assert body["scores"]["a"] > body["scores"]["b"]
    # Every returned item's category is consistent with its correctness flags.
    for it in body["items"]:
        expected = (
            "both_correct" if it["correct_a"] and it["correct_b"]
            else "both_wrong" if not it["correct_a"] and not it["correct_b"]
            else "a_only" if it["correct_a"]
            else "b_only"
        )
        assert it["category"] == expected


def test_disagreement_filter_matches_wins(monkeypatch):
    c = _client(monkeypatch)
    seed(c)
    full = c.get(f"/public/head_to_head?models=Alpha,Beta&dataset={DATASET}").get_json()["summary"]
    dis = c.get(f"/public/head_to_head?models=Alpha,Beta&dataset={DATASET}&filter=disagreement").get_json()
    # Disagreements = examples exactly one model got right.
    assert dis["total"] == full["a_only"] + full["b_only"]
    assert all(it["category"] in ("a_only", "b_only") for it in dis["items"])
    a_only = c.get(f"/public/head_to_head?models=Alpha,Beta&dataset={DATASET}&filter=a_only").get_json()
    assert a_only["total"] == full["a_only"]
    assert all(it["correct_a"] is True and it["correct_b"] is False for it in a_only["items"])


def test_swap_order_flips_sides(monkeypatch):
    c = _client(monkeypatch)
    seed(c)
    forward = c.get(f"/public/head_to_head?models=Alpha,Beta&dataset={DATASET}").get_json()
    reverse = c.get(f"/public/head_to_head?models=Beta,Alpha&dataset={DATASET}").get_json()
    assert forward["summary"]["a_only"] == reverse["summary"]["b_only"]
    assert forward["summary"]["b_only"] == reverse["summary"]["a_only"]


def test_pagination(monkeypatch):
    c = _client(monkeypatch)
    seed(c)
    page = c.get(f"/public/head_to_head?models=Alpha,Beta&dataset={DATASET}&limit=5&offset=0").get_json()
    assert len(page["items"]) == 5
    assert page["total"] == 20
    page2 = c.get(f"/public/head_to_head?models=Alpha,Beta&dataset={DATASET}&limit=5&offset=5").get_json()
    ids1 = {it["id"] for it in page["items"]}
    ids2 = {it["id"] for it in page2["items"]}
    assert ids1.isdisjoint(ids2)
