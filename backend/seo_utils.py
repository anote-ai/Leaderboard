"""SEO helpers shared by the dataset-detail lookup and the sitemap endpoint.

``dataset_slug`` must stay byte-for-byte compatible with ``datasetSlug`` in
``frontend/src/seo/seoCore.js``: the SPA links to ``/dataset/<slug>`` and the
backend resolves that slug back to a dataset name.
"""
from __future__ import annotations

import os
import re
import unicodedata
from typing import Iterable
from urllib.parse import quote
from xml.sax.saxutils import escape

DEFAULT_SITE_URL = "https://leaderboard.anote.ai"

# Public, indexable SPA routes that are not dataset pages.
STATIC_PUBLIC_PATHS = ("/", "/faq")


def site_url() -> str:
    """Public origin of the leaderboard SPA (no trailing slash)."""
    raw = os.getenv("LEADERBOARD_SITE_URL") or os.getenv("LEADERBOARD_FRONTEND_URL") or DEFAULT_SITE_URL
    return raw.strip().rstrip("/") or DEFAULT_SITE_URL


def dataset_slug(name: str) -> str:
    """URL slug for a dataset name, e.g. ``FinanceBench - Retrieval Accuracy`` -> ``financebench-retrieval-accuracy``."""
    text = unicodedata.normalize("NFKD", str(name or ""))
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return text


def dataset_path(name: str) -> str:
    """SPA path for a dataset page; falls back to the encoded name when the slug is empty."""
    slug = dataset_slug(name)
    return f"/dataset/{slug}" if slug else f"/dataset/{quote(str(name or ''), safe='')}"


def find_by_slug(slug: str, names: Iterable[str]) -> str | None:
    """Return the first dataset name whose slug equals ``slug`` (case-insensitive)."""
    wanted = (slug or "").strip().lower()
    if not wanted:
        return None
    for name in names:
        if name and dataset_slug(name) == wanted:
            return name
    return None


def build_sitemap_xml(dataset_names: Iterable[str], base_url: str | None = None) -> str:
    """Render a sitemap with the static public routes plus one URL per dataset."""
    base = (base_url or site_url()).rstrip("/")
    paths: list[str] = list(STATIC_PUBLIC_PATHS)
    seen = set(paths)
    for name in sorted({n for n in dataset_names if n}, key=str.lower):
        path = dataset_path(name)
        if path not in seen:
            seen.add(path)
            paths.append(path)
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path in paths:
        lines.append(f"  <url><loc>{escape(base + path)}</loc></url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"
