"""SEO support: dataset slugs, slug lookup in /public/dataset_details, sitemap, exported catalog."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from xml.etree import ElementTree

try:
    import app as app_module
    from seo_utils import build_sitemap_xml, dataset_path, dataset_slug, find_by_slug
except ImportError:
    import backend.app as app_module  # type: ignore
    from backend.seo_utils import build_sitemap_xml, dataset_path, dataset_slug, find_by_slug  # type: ignore

app = app_module.app
BACKEND = Path(__file__).resolve().parents[1]
SITEMAP_NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"


def _client(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_AUTO_SEED_IN_TESTS", "1")
    monkeypatch.setenv("LEADERBOARD_SITE_URL", "https://leaderboard.example.com/")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    app_module._STORE["submissions"].clear()
    app_module._STORE["evaluations"].clear()
    app_module._STORE["datasets"].clear()
    app_module.LEADERBOARD_DATA.clear()
    app_module._AUTO_SEED_DONE = False
    return app.test_client()


def test_dataset_slug_matches_frontend_rules():
    # Same cases as frontend/src/seo/seoCore.test.js.
    assert dataset_slug("FinanceBench - Retrieval Accuracy") == "financebench-retrieval-accuracy"
    assert dataset_slug("SST-2 Sentiment (Sample)") == "sst-2-sentiment-sample"
    assert dataset_slug("  Café  Überset  ") == "cafe-uberset"
    assert dataset_slug("!!!") == ""
    assert dataset_path("日本語") == "/dataset/%E6%97%A5%E6%9C%AC%E8%AA%9E"


def test_find_by_slug():
    names = ["ARC-SMART", "FinanceBench - Retrieval Accuracy"]
    assert find_by_slug("financebench-retrieval-accuracy", names) == "FinanceBench - Retrieval Accuracy"
    assert find_by_slug("missing", names) is None
    assert find_by_slug("", names) is None


def test_build_sitemap_xml_lists_static_routes_and_datasets():
    xml = build_sitemap_xml(["B & Co", "ARC-SMART", "ARC-SMART", None], base_url="https://x.test/")
    locs = [el.text for el in ElementTree.fromstring(xml).iter(f"{SITEMAP_NS}loc")]
    assert locs == [
        "https://x.test/",
        "https://x.test/faq",
        "https://x.test/dataset/arc-smart",
        "https://x.test/dataset/b-co",
    ]


def test_dataset_details_resolves_slugs(monkeypatch):
    c = _client(monkeypatch)
    c.get("/health")  # auto-seed the built-in datasets

    by_slug = c.get("/public/dataset_details?name=financebench-retrieval-accuracy").get_json()
    assert by_slug["success"] is True
    assert by_slug["dataset"]["name"] == "FinanceBench - Retrieval Accuracy"

    by_name = c.get("/public/dataset_details", query_string={"name": "FinanceBench - Retrieval Accuracy"}).get_json()
    assert by_name["dataset"]["name"] == "FinanceBench - Retrieval Accuracy"

    missing = c.get("/public/dataset_details?name=not-a-real-dataset")
    assert missing.status_code == 404


def test_sitemap_endpoint_lists_every_public_dataset(monkeypatch):
    c = _client(monkeypatch)
    c.get("/health")
    res = c.get("/public/sitemap.xml")
    assert res.status_code == 200
    assert res.mimetype == "application/xml"
    locs = {el.text for el in ElementTree.fromstring(res.data).iter(f"{SITEMAP_NS}loc")}
    assert "https://leaderboard.example.com/" in locs
    assert "https://leaderboard.example.com/faq" in locs
    assert "https://leaderboard.example.com/dataset/financebench-retrieval-accuracy" in locs
    assert "https://leaderboard.example.com/dataset/sst-2-sentiment-sample" in locs


def test_frontend_seo_catalog_is_in_sync_with_seed_data():
    result = subprocess.run(
        [sys.executable, str(BACKEND / "scripts" / "export_seo_catalog.py"), "--check"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr
