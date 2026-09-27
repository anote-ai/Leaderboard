import { Helmet } from "react-helmet";
import {
  SITE_NAME,
  absoluteUrl,
  normalizeSiteUrl,
  serializeJsonLd,
  truncateAtWord,
} from "./seoCore.mjs";

export const SITE_URL = normalizeSiteUrl(process.env.REACT_APP_SITE_URL);
const OG_IMAGE = `${SITE_URL}/logo.png`;

/**
 * Per-route <head> tags: title, description, canonical, Open Graph, Twitter, JSON-LD.
 * The innermost <Seo> wins (react-helmet dedupes by name/property and rel=canonical).
 */
export default function Seo({ title, description, path, jsonLd, noindex = false, type = "website" }) {
  const canonical = path ? absoluteUrl(SITE_URL, path) : null;
  const desc = description ? truncateAtWord(description) : null;
  return (
    <Helmet>
      {title && <title>{title}</title>}
      {desc && <meta name="description" content={desc} />}
      {canonical && !noindex && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      {title && <meta property="og:title" content={title} />}
      {desc && <meta property="og:description" content={desc} />}
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:image" content={OG_IMAGE} />
      <meta name="twitter:card" content="summary" />
      {title && <meta name="twitter:title" content={title} />}
      {desc && <meta name="twitter:description" content={desc} />}
      <meta name="twitter:image" content={OG_IMAGE} />
      {jsonLd && <script type="application/ld+json">{serializeJsonLd(jsonLd)}</script>}
    </Helmet>
  );
}
