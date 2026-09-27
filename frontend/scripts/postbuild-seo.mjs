#!/usr/bin/env node
// Runs after `react-scripts build` (see package.json "build").
//
// 1. Writes build/sitemap.xml (home, FAQ, one URL per dataset in src/seo/datasetCatalog.json).
// 2. Writes build/robots.txt pointing at the sitemap (Disallow-all for staging builds).
// 3. Copies the untouched CRA index.html to build/app-shell.html (SPA fallback for other routes).
// 4. Prerenders build/index.html, build/faq/index.html and build/dataset/<slug>/index.html:
//    each gets its own <title>, meta description, canonical, Open Graph/Twitter tags, JSON-LD,
//    and a static HTML version of the page inside #root, so crawlers that don't run JS still
//    see real content. React's createRoot() replaces #root on load, and react-helmet replaces
//    the prerendered head tags (they carry data-react-helmet="true").
//
// No headless browser: the HTML comes from the same data and seoCore.mjs helpers the app uses.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FAQ_DESCRIPTION,
  FAQ_TITLE,
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
  absoluteUrl,
  datasetPath,
  datasetSeo,
  faqAnswerText,
  faqJsonLd,
  formatScore,
  homeJsonLd,
  isLowerBetter,
  metricLabel,
  normalizeSiteUrl,
  rankModels,
  serializeJsonLd,
  taskLabel,
  truncateAtWord,
} from "../src/seo/seoCore.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = join(ROOT, "build");
const SITE_URL = normalizeSiteUrl(process.env.REACT_APP_SITE_URL);
const STAGING_API = "https://api.tryanote-staging.com";
const NOINDEX = process.env.REACT_APP_API_ENDPOINT === STAGING_API || process.env.SEO_NOINDEX === "1";

const readJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
const catalog = readJson("src/seo/datasetCatalog.json");
const faq = readJson("src/seo/faq.json");
const template = readFileSync(join(BUILD, "index.html"), "utf8");

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const esc = escapeHtml;
const HELMET = 'data-react-helmet="true"';

function headTags({ title, description, path, jsonLd }) {
  const canonical = absoluteUrl(SITE_URL, path);
  const desc = truncateAtWord(description);
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta ${HELMET} name="description" content="${esc(desc)}">`,
    NOINDEX
      ? `<meta ${HELMET} name="robots" content="noindex, nofollow">`
      : `<link ${HELMET} rel="canonical" href="${esc(canonical)}">`,
    `<meta ${HELMET} property="og:site_name" content="${esc(SITE_NAME)}">`,
    `<meta ${HELMET} property="og:type" content="website">`,
    `<meta ${HELMET} property="og:title" content="${esc(title)}">`,
    `<meta ${HELMET} property="og:description" content="${esc(desc)}">`,
    `<meta ${HELMET} property="og:url" content="${esc(canonical)}">`,
    `<meta ${HELMET} property="og:image" content="${esc(`${SITE_URL}/logo.png`)}">`,
    `<meta ${HELMET} name="twitter:card" content="summary">`,
    `<meta ${HELMET} name="twitter:title" content="${esc(title)}">`,
    `<meta ${HELMET} name="twitter:description" content="${esc(desc)}">`,
    `<meta ${HELMET} name="twitter:image" content="${esc(`${SITE_URL}/logo.png`)}">`,
  ];
  if (jsonLd) tags.push(`<script ${HELMET} type="application/ld+json">${serializeJsonLd(jsonLd)}</script>`);
  return tags.join("");
}

function applyTemplate(page) {
  let html = template;
  // Drop the template's generic title/description; the page's own tags replace them.
  html = html.replace(/<title>[\s\S]*?<\/title>/i, "");
  html = html.replace(/<meta[^>]*name="description"[^>]*>/i, "");
  if (!html.includes("</head>") || !html.includes('<div id="root"></div>')) {
    throw new Error("build/index.html has an unexpected shape; cannot prerender");
  }
  html = html.replace("</head>", `${headTags(page)}</head>`);
  return html.replace('<div id="root"></div>', `<div id="root">${page.body}</div>`);
}

function pageShell(inner) {
  const nav = `<nav><a href="/">${esc(SITE_NAME)}</a> · <a href="/faq">FAQ</a> · <a href="https://anote.ai">Anote</a></nav>`;
  return `<div class="prerendered">${nav}<main>${inner}</main></div>`;
}

function rankingTable(dataset, models) {
  const ranked = rankModels(models, dataset);
  if (!ranked.length) return "<p>No submissions yet.</p>";
  const metric = metricLabel(dataset.evaluation_metric);
  const rows = ranked
    .map(
      (m, i) =>
        `<tr><td>${typeof m.rank === "number" ? m.rank : i + 1}</td><td>${esc(m.model)}</td><td>${esc(formatScore(m.score))}</td>${
          m.updated ? `<td>${esc(m.updated)}</td>` : "<td></td>"
        }</tr>`,
    )
    .join("");
  return `<table><caption>${esc(dataset.name)} rankings by ${esc(metric)}${
    isLowerBetter(dataset) ? " (lower is better)" : ""
  }</caption><thead><tr><th>Rank</th><th>Model</th><th>${esc(metric)}</th><th>Updated</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function datasetLinks(exclude) {
  const items = catalog
    .filter((d) => d.name !== exclude)
    .map((d) => `<li><a href="${esc(datasetPath(d.name))}">${esc(d.name)}</a></li>`)
    .join("");
  return items ? `<ul>${items}</ul>` : "";
}

function datasetBody(dataset) {
  const parts = [
    `<h1>${esc(dataset.name)} Leaderboard</h1>`,
    dataset.description ? `<p>${esc(dataset.description)}</p>` : "",
    `<p>Task: ${esc(taskLabel(dataset.task_type))}. Ranking metric: ${esc(metricLabel(dataset.evaluation_metric))}.</p>`,
    dataset.url ? `<p><a href="${esc(dataset.url)}" rel="noopener">Source dataset</a></p>` : "",
    rankingTable(dataset, dataset.models),
  ];
  const research = dataset.research;
  if (research) {
    const links = [
      research.paper_url && `<li><a href="${esc(research.paper_url)}" rel="noopener">Paper</a></li>`,
      research.repo_url && `<li><a href="${esc(research.repo_url)}" rel="noopener">GitHub repository</a></li>`,
      research.hf_url && `<li><a href="${esc(research.hf_url)}" rel="noopener">Hugging Face dataset</a></li>`,
      research.blog_url && `<li><a href="${esc(research.blog_url)}" rel="noopener">Blog post</a></li>`,
    ].filter(Boolean);
    if (links.length) parts.push(`<h2>Research</h2><ul>${links.join("")}</ul>`);
    if (research.bibtex) parts.push(`<h2>Cite this benchmark</h2><pre>${esc(research.bibtex)}</pre>`);
  }
  parts.push("<h2>More benchmark leaderboards</h2>", datasetLinks(dataset.name));
  return pageShell(parts.join(""));
}

function homeBody() {
  const cards = catalog
    .map((d) => {
      const top = rankModels(d.models, d)[0];
      const topText = top ? ` Top model: ${esc(top.model)} (${esc(formatScore(top.score))} ${esc(metricLabel(d.evaluation_metric))}).` : "";
      return `<li><a href="${esc(datasetPath(d.name))}">${esc(d.name)}</a> — ${esc(taskLabel(d.task_type))}.${topText}</li>`;
    })
    .join("");
  return pageShell(`<h1>Model Leaderboard</h1><p>${esc(HOME_DESCRIPTION)}</p><h2>Benchmarks</h2><ul>${cards}</ul>`);
}

function faqBody() {
  const items = faq.map((item) => `<h2>${esc(item.question)}</h2><p>${esc(faqAnswerText(item))}</p>`).join("");
  return pageShell(`<h1>Frequently Asked Questions</h1>${items}`);
}

function writePage(path, html) {
  const file = path === "/" ? join(BUILD, "index.html") : join(BUILD, path.replace(/^\/+/, ""), "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  return file;
}

function sitemapXml(paths) {
  const urls = paths.map((p) => `  <url><loc>${esc(absoluteUrl(SITE_URL, p))}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

// Optional extra sitemaps, e.g. the backend's runtime list of datasets:
// SEO_EXTRA_SITEMAPS=https://api-leaderboard.anote.ai/public/sitemap.xml (comma-separated).
const EXTRA_SITEMAPS = String(process.env.SEO_EXTRA_SITEMAPS || "")
  .split(",")
  .map((s) => s.trim())
  .filter((s) => /^https?:\/\//.test(s));

function robotsTxt() {
  if (NOINDEX) return "User-agent: *\nDisallow: /\n";
  const sitemaps = [`${SITE_URL}/sitemap.xml`, ...EXTRA_SITEMAPS].map((u) => `Sitemap: ${u}`).join("\n");
  return `User-agent: *\nAllow: /\nDisallow: /leaderboard/admin\nDisallow: /my-submissions\nDisallow: /oauth/\n\n${sitemaps}\n`;
}

function main() {
  const pages = [
    { title: HOME_TITLE, description: HOME_DESCRIPTION, path: "/", jsonLd: homeJsonLd(catalog, SITE_URL), body: homeBody() },
    { title: FAQ_TITLE, description: FAQ_DESCRIPTION, path: "/faq", jsonLd: faqJsonLd(faq), body: faqBody() },
    ...catalog.map((d) => ({ ...datasetSeo(d, d.models, SITE_URL), body: datasetBody(d) })),
  ];
  // Render every page from the pristine template before overwriting build/index.html.
  const rendered = pages.map((page) => [page.path, applyTemplate(page)]);
  // Unprerendered SPA routes (/compare, /model/..., etc.) should fall back to the plain shell,
  // not to the prerendered home page (whose canonical points at "/"). See docs/seo.md.
  writeFileSync(join(BUILD, "app-shell.html"), template);
  for (const [path, html] of rendered) writePage(path, html);
  writeFileSync(join(BUILD, "sitemap.xml"), sitemapXml(pages.map((p) => p.path)));
  writeFileSync(join(BUILD, "robots.txt"), robotsTxt());
  console.log(`postbuild-seo: prerendered ${rendered.length} pages, wrote sitemap.xml and robots.txt (${SITE_URL}${NOINDEX ? ", noindex" : ""})`);
}

main();
