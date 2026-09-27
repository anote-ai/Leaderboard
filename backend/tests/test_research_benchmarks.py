"""Anote research benchmarks: seeding, reported results, scoring guards, EnterpriseBench HF recipe."""
from __future__ import annotations

import json

import pytest

try:
    import app as app_module
    import hf_importer
    from eval_core import hf_dataset_recipes as recipes
    from scripts.research_benchmarks import (
        ARXIV_PLACEHOLDER,
        ENTERPRISEBENCH_NAME,
        ORCHESTRABENCH,
        RESEARCH_DATASETS,
    )
except ImportError:
    import backend.app as app_module  # type: ignore
    import backend.hf_importer as hf_importer  # type: ignore
    from backend.eval_core import hf_dataset_recipes as recipes  # type: ignore
    from backend.scripts.research_benchmarks import (  # type: ignore
        ARXIV_PLACEHOLDER,
        ENTERPRISEBENCH_NAME,
        ORCHESTRABENCH,
        RESEARCH_DATASETS,
    )

app = app_module.app


def _reset() -> None:
    app_module._STORE["submissions"].clear()
    app_module._STORE["evaluations"].clear()
    app_module._STORE["datasets"].clear()
    app_module._STORE.setdefault("submission_counts", {}).clear()
    app_module.LEADERBOARD_DATA.clear()
    app_module._AUTO_SEED_DONE = False


def _client(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_AUTO_SEED_IN_TESTS", "1")
    monkeypatch.setenv("REQUIRE_API_KEY", "false")
    monkeypatch.setenv("LEADERBOARD_API_KEYS", "")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    _reset()
    return app.test_client()


# --- static data ------------------------------------------------------------------------------

def test_every_research_dataset_is_fully_cited():
    names = set()
    for ds in RESEARCH_DATASETS:
        names.add(ds["name"])
        research = ds["research"]
        assert research["blog_url"].startswith("https://anote.ai/blog/frontier-")
        assert research["repo_url"].startswith("https://github.com/anote-ai/")
        assert research["paper_url"].startswith("https://")
        assert research["bibtex"].startswith("@misc{")
        if research["arxiv_id"]:
            assert research["arxiv_id"] in research["bibtex"]
        else:
            assert ARXIV_PLACEHOLDER in research["bibtex"]
        assert len(research["seo_description"]) <= 160
        assert ds["models"], ds["name"]
        for model in ds["models"]:
            assert model["source"].strip(), (ds["name"], model["model"])
            assert "https://" in model["source"]
            # Only metrics the source reports; the primary score must be among them.
            assert model["detailed_scores"][ds["evaluation_metric"]] == model["score"]
        ranks = [m["rank"] for m in ds["models"]]
        assert ranks == list(range(1, len(ranks) + 1))
    assert len(names) == len(RESEARCH_DATASETS)


def test_orchestrabench_gold_set_matches_paper_size():
    rd = ORCHESTRABENCH["reference_data"]
    assert len(rd["source_texts"]) == 26
    assert set(rd["ground_truth"]) == {"decompose", "direct_tool", "code_execution", "reason_only"}


# --- seeding ----------------------------------------------------------------------------------

def test_fresh_store_seeds_research_datasets_with_reported_scores(monkeypatch):
    c = _client(monkeypatch)
    c.get("/health")
    for ds in RESEARCH_DATASETS:
        res = c.get("/public/dataset_details", query_string={"name": ds["name"]}).get_json()
        assert res["success"] is True, ds["name"]
        got = {m["model"]: m["score"] for m in res["top_models"]}
        for model in ds["models"][:10]:
            assert got[model["model"]] == pytest.approx(model["score"])


def test_existing_deployment_gains_research_datasets(monkeypatch):
    c = _client(monkeypatch)
    # Simulate an older deployment: leaderboard already has rows, research datasets missing.
    app_module.LEADERBOARD_DATA.append({"name": "Legacy", "task_type": "text_classification", "models": [{"model": "x", "score": 1}]})
    c.get("/health")
    names = {d.get("name") for d in app_module._STORE["datasets"]}
    for ds in RESEARCH_DATASETS:
        assert ds["name"] in names
    eb = c.get("/public/dataset_details", query_string={"name": "enterprisebench"}).get_json()
    assert eb["dataset"]["name"] == ENTERPRISEBENCH_NAME
    assert {m["model"] for m in eb["top_models"]} == {m["model"] for m in RESEARCH_DATASETS[0]["models"]}


def test_seeded_rows_keep_their_citation_and_real_detailed_scores(monkeypatch):
    c = _client(monkeypatch)
    c.get("/health")
    ev = next(
        e for e, s in zip(app_module._STORE["evaluations"], app_module._STORE["submissions"])
        if s["model_name"] == "GPT-4o-mini" and s["benchmark_dataset_name"] == ENTERPRISEBENCH_NAME
    )
    details = ev["evaluation_details"]
    assert "PAPER_DRAFT.md" in details["metadata"]["citation"]
    assert details["detailed_scores"]["policy_violation_rate"] == 0.5625
    assert "mrr" not in details["detailed_scores"]


# --- scoring ----------------------------------------------------------------------------------

def test_orchestrabench_submissions_are_scored_against_gold_labels(monkeypatch):
    c = _client(monkeypatch)
    c.get("/health")
    gold = ORCHESTRABENCH["reference_data"]["ground_truth"]
    res = c.post("/public/submit_model", json={
        "benchmarkDatasetName": ORCHESTRABENCH["name"],
        "modelName": "perfect-router",
        "modelResults": gold,
        "submitterId": "tester",
    })
    body = res.get_json()
    assert res.status_code == 200, body
    assert body["score"] == pytest.approx(1.0)


def test_tool_calling_submissions_are_rejected_clearly(monkeypatch):
    c = _client(monkeypatch)
    c.get("/health")
    res = c.post("/public/submit_model", json={
        "benchmarkDatasetName": ENTERPRISEBENCH_NAME,
        "modelName": "agent",
        "modelResults": ["{}"],
        "submitterId": "tester",
    })
    assert res.status_code == 400
    assert "not available yet" in res.get_json()["error"]
    res = c.post("/public/run_llm_submission", json={
        "benchmarkDatasetName": ENTERPRISEBENCH_NAME,
        "modelName": "echo",
        "provider": "echo",
    })
    assert res.status_code == 400


# --- EnterpriseBench HF recipe ------------------------------------------------------------------

EB_ROWS = [
    {   # README task schema, nested dict
        "task_id": "fin-001",
        "vertical": "finance",
        "instruction": "Retrieve the closing price of AAPL on 2024-03-31.",
        "tool_schema": {"name": "get_stock_price", "parameters": {"ticker": "string", "date": "string"}},
        "expected_call": {"name": "get_stock_price", "arguments": {"ticker": "AAPL", "date": "2024-03-31"}},
        "expected_output": "Result from get_stock_price",
        "difficulty": "easy",
    },
    {   # JSON-encoded cells, as HF exports often store them
        "task_id": "crm_001",
        "instruction": "Merge contacts C001 and C002.",
        "expected_call": json.dumps({"name": "merge_contacts", "arguments": {"source_ids": ["C001", "C002"]}}),
        "pre_state": json.dumps({"contacts": [{"id": "C001", "active_deals": ["D-1"]}]}),
        "policy_ids": ["CRM_POL_003"],
    },
    {   # flat tool/argument columns
        "prompt": "Check deployment status of api-gateway in production.",
        "tool_name": "get_deployment_status",
        "arguments": '{"service": "api-gateway", "environment": "production"}',
    },
]


def test_enterprisebench_rows_become_structured_ground_truth():
    gt = recipes.hf_rows_to_enterprisebench_ground_truth(EB_ROWS, "test")
    assert [g["id"] for g in gt] == ["fin-001", "crm_001", "enterprisebench_test_2"]
    assert gt[0]["answer"] == {"name": "get_stock_price", "arguments": {"ticker": "AAPL", "date": "2024-03-31"}}
    assert gt[1]["answer"]["arguments"] == {"source_ids": ["C001", "C002"]}
    assert gt[1]["metadata"]["pre_state"]["contacts"][0]["id"] == "C001"
    assert gt[2]["answer"]["name"] == "get_deployment_status"
    assert gt[2]["question"].startswith("Check deployment status")


def test_enterprisebench_row_without_a_tool_call_is_an_error():
    with pytest.raises(ValueError, match="columns present"):
        recipes.enterprisebench_row_to_ground_truth(0, "test", {"instruction": "do something"})


class _FakeDataset(list):
    pass


def test_hf_import_of_enterprisebench_targets_the_seeded_card(monkeypatch):
    calls = []

    def fake_load(name, split=None, **_):
        calls.append(split)
        if split == "test":
            raise ValueError("Unknown split 'test'")
        return _FakeDataset(EB_ROWS)

    monkeypatch.setattr(recipes, "_load_dataset", fake_load)
    payload = hf_importer.import_hf_dataset("anote-ai/research-enterpriseBench", split="test", limit=10)
    assert calls == ["test", "train"]
    assert payload["name"] == ENTERPRISEBENCH_NAME
    assert payload["task_type"] == "tool_calling"
    assert payload["evaluation_metric"] == "policy_compliance_rate"
    rd = payload["reference_data"]
    assert rd["source_texts"][0].startswith("Retrieve the closing price")
    assert rd["ground_truth"][0]["answer"]["name"] == "get_stock_price"
    assert rd["hf_dataset"] == "anote-ai/research-enterpriseBench"


def test_hf_import_of_enterprisebench_surfaces_schema_errors(monkeypatch):
    monkeypatch.setattr(recipes, "_load_dataset", lambda *a, **k: _FakeDataset([{"text": "no tool call"}]))
    with pytest.raises(hf_importer.HuggingFaceImportError, match="EnterpriseBench row 0"):
        hf_importer.import_hf_dataset("anote-ai/research-enterpriseBench", split="train")


def test_import_endpoint_can_fill_the_seeded_enterprisebench_card(monkeypatch):
    c = _client(monkeypatch)
    c.get("/health")
    monkeypatch.setattr(recipes, "_load_dataset", lambda *a, **k: _FakeDataset(EB_ROWS))
    body = {"dataset_name": "anote-ai/research-enterpriseBench", "split": "train"}

    dup = c.post("/public/import_hf_dataset", json=body)
    assert dup.status_code == 400  # seeded card already exists

    res = c.post("/public/import_hf_dataset", json={**body, "replace_existing": True})
    assert res.status_code == 200, res.get_json()
    assert res.get_json()["dataset"]["size"] == len(EB_ROWS)
    stored = next(d for d in app_module._STORE["datasets"] if d["name"] == ENTERPRISEBENCH_NAME)
    assert stored["reference_data"]["ground_truth"][1]["id"] == "crm_001"
    # Reported results survive the refresh.
    details = c.get("/public/dataset_details", query_string={"name": ENTERPRISEBENCH_NAME}).get_json()
    assert len(details["top_models"]) == 2
