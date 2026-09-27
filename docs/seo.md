# SEO and Prerendering

The leaderboard is a Create React App SPA served from S3 + CloudFront. This page covers how
search engines see it and what has to be configured on AWS.

## What ships in the build

`npm run build` runs `react-scripts build` and then `scripts/postbuild-seo.mjs`, which writes:

| File | Purpose |
|---|---|
| `build/index.html` | Home page, prerendered |
| `build/faq/index.html` | FAQ, prerendered, with `FAQPage` JSON-LD |
| `build/dataset/<slug>/index.html` | One prerendered page per seeded dataset |
| `build/app-shell.html` | The untouched CRA `index.html`, used as the SPA fallback for every other route |
| `build/sitemap.xml` | Home, FAQ and every seeded dataset page |
| `build/robots.txt` | Points to the sitemap; `Disallow: /` for staging builds |

Each prerendered page carries its own `<title>`, meta description, canonical URL, Open Graph and
Twitter tags, JSON-LD, and a static HTML version of the page (heading, description, ranking
table, links) inside `#root`. Crawlers that do not run JavaScript see real content. In a browser,
React's `createRoot()` replaces `#root` and `react-helmet` takes over the head tags; the
prerendered tags carry `data-react-helmet="true"`, so Helmet replaces them rather than duplicating
them.

No headless browser is involved. Pages are generated from `src/seo/datasetCatalog.json`,
`src/seo/faq.json` and the helpers in `src/seo/seoCore.mjs`, which the React app also uses. This is
cheaper and more deterministic than `react-snap`, which needs Puppeteer and a bundled Chromium in CI.

## Where the dataset list comes from

`frontend/src/seo/datasetCatalog.json` is generated from the seeded datasets in
`backend/scripts/seed_real_benchmarks.py`:

```bash
python backend/scripts/export_seo_catalog.py
```

`backend/tests/test_seo.py` fails if the committed catalog is stale, so edit the seed data and
re-export in the same change.

Datasets created at runtime (Hugging Face imports, admin adds) are not in the build. They still
work as SPA routes, and the backend lists them at:

```text
GET https://api-leaderboard.anote.ai/public/sitemap.xml
```

To advertise that sitemap as well, build with
`SEO_EXTRA_SITEMAPS=https://api-leaderboard.anote.ai/public/sitemap.xml`; it is added to
`robots.txt`. The sitemap protocol allows this cross-host reference because the `robots.txt` on
`leaderboard.anote.ai` lists it. Alternatively, add a CloudFront behavior for
`/sitemap-datasets.xml` that forwards to the API origin with the path rewritten to
`/public/sitemap.xml`.

## URLs

Dataset pages live at `/dataset/<slug>`, for example `/dataset/financebench-retrieval-accuracy`.
Slugs are lowercase ASCII with dashes; the rules are implemented twice and must stay identical:
`datasetSlug` in `frontend/src/seo/seoCore.mjs` and `dataset_slug` in `backend/seo_utils.py`
(both have tests with the same cases). `GET /public/dataset_details?name=` accepts a slug or a
dataset name. Old `/dataset/<URL-encoded name>` links still work: the SPA replaces them with the
slug URL, and the canonical tag always points at the slug.

## CloudFront configuration (one-time)

The S3 REST origin does not map `/dataset/foo` to `dataset/foo/index.html` on its own.

1. **CloudFront Function.** Create a function from
   `aws_deploy/cloudfront/spa-prerender-rewrite.js` (runtime `cloudfront-js-2.0`), publish it, and
   associate it with the distribution's default cache behavior as a **viewer request** function.
   It rewrites `/faq` and `/dataset/<slug>` to their prerendered `index.html` and every other SPA
   route to `/app-shell.html`. Static files pass through.
2. **Error responses.** Point the 403 and 404 custom error responses at `/app-shell.html` with
   response code 200 (instead of `/index.html`). This covers datasets added after the last build.
3. **Default root object** stays `index.html`.

Until step 1 is done, the site behaves exactly as before (all routes fall back to `index.html`,
now the prerendered home page); only the per-dataset prerendered HTML is not served.

The deploy workflow uploads all `*.html` with `no-cache` and `sitemap.xml`/`robots.txt` with a
one-hour cache; hashed assets stay immutable.

## Local Docker / nginx

`frontend/nginx.conf` serves `$uri`, then `$uri/index.html`, then `/app-shell.html`, which gives
the same behavior as the CloudFront function.

## Checking a build

```bash
cd frontend
npm run build
grep -o '<title>[^<]*' build/dataset/financebench-retrieval-accuracy/index.html
cat build/sitemap.xml build/robots.txt
```

Validate JSON-LD with Google's Rich Results Test or the Schema.org validator after deploying.
