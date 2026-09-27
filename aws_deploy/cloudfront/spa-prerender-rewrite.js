// CloudFront Function (runtime: cloudfront-js-2.0), event type: viewer-request.
// Attach to the leaderboard.anote.ai distribution's default cache behavior.
//
// The frontend build writes prerendered HTML for SEO (frontend/scripts/postbuild-seo.mjs):
//   /                     -> index.html            (served via the default root object)
//   /faq                  -> faq/index.html
//   /dataset/<slug>       -> dataset/<slug>/index.html
// Every other SPA route gets the plain app shell (app-shell.html).
// Static files (JS, CSS, images, fonts, sitemap.xml, robots.txt, CSVs, ...) pass through; the
// extension list is explicit so SPA routes like /model/gpt-4.1 are not mistaken for files.
//
// A dataset created after the last build has no prerendered file; S3 then answers 403/404,
// and the distribution's custom error response should serve /app-shell.html with status 200
// (see docs/seo.md).

var STATIC_FILE = /\.(html|js|mjs|css|map|json|txt|xml|ico|png|jpe?g|gif|svg|webp|avif|woff2?|ttf|otf|eot|csv|pdf|webmanifest)$/i;

function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri === "/" || STATIC_FILE.test(uri)) {
    return request;
  }

  var clean = uri.replace(/\/+$/, "");
  if (clean === "/faq" || /^\/dataset\/[^/]+$/.test(clean)) {
    request.uri = clean + "/index.html";
    return request;
  }

  request.uri = "/app-shell.html";
  return request;
}
