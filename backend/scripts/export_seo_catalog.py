#!/usr/bin/env python3
"""Export the seeded public datasets to ``frontend/src/seo/datasetCatalog.json``.

The frontend build reads this file to prerender ``/dataset/<slug>`` pages and write
``sitemap.xml`` without calling the backend. Re-run after editing
``seed_real_benchmarks.DATASETS``; ``tests/test_seo.py`` fails when the file is stale.

Usage (from the repo root):
  python backend/scripts/export_seo_catalog.py          # write the file
  python backend/scripts/export_seo_catalog.py --check  # exit 1 if it is out of date
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List

_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from scripts.seed_real_benchmarks import DATASETS  # noqa: E402
from seo_utils import dataset_path, dataset_slug  # noqa: E402

CATALOG_PATH = _BACKEND.parent / "frontend" / "src" / "seo" / "datasetCatalog.json"

# Metrics where a smaller number is better; the SPA and JSON-LD rank these ascending.
LOWER_IS_BETTER = {"median_distance_error", "mean_distance_error"}

# Optional per-dataset keys copied verbatim when present.
PASSTHROUGH_KEYS = ("license", "research")


def build_catalog() -> List[Dict[str, Any]]:
    catalog: List[Dict[str, Any]] = []
    for ds in DATASETS:
        entry: Dict[str, Any] = {
            "name": ds["name"],
            "slug": dataset_slug(ds["name"]),
            "path": dataset_path(ds["name"]),
            "task_type": ds["task_type"],
            "evaluation_metric": ds["evaluation_metric"],
            "lower_is_better": ds["evaluation_metric"] in LOWER_IS_BETTER,
            "url": ds.get("url"),
            "description": ds.get("description") or "",
            "models": [
                {
                    key: model[key]
                    for key in ("rank", "model", "score", "ci", "updated", "source")
                    if model.get(key) is not None
                }
                for model in sorted(ds.get("models", []), key=lambda m: m.get("rank", 0))
            ],
        }
        for key in PASSTHROUGH_KEYS:
            if ds.get(key):
                entry[key] = ds[key]
        catalog.append(entry)
    return catalog


def render() -> str:
    return json.dumps(build_catalog(), indent=2, ensure_ascii=False) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="fail if the committed catalog is stale")
    args = parser.parse_args()
    content = render()
    if args.check:
        current = CATALOG_PATH.read_text(encoding="utf-8") if CATALOG_PATH.exists() else ""
        if current != content:
            print(f"{CATALOG_PATH} is out of date; run backend/scripts/export_seo_catalog.py", file=sys.stderr)
            return 1
        return 0
    CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CATALOG_PATH.write_text(content, encoding="utf-8")
    print(f"Wrote {len(build_catalog())} datasets to {CATALOG_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
