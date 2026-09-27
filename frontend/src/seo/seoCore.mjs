// Shared SEO logic for the React app (react-helmet) and the build-time prerender
// script (scripts/postbuild-seo.mjs). Keep this module dependency-free: Node imports
// it directly, without webpack or Babel.

export const DEFAULT_SITE_URL = "https://leaderboard.anote.ai";
export const SITE_NAME = "Anote Model Leaderboard";
export const ORGANIZATION = {
  "@type": "Organization",
  name: "Anote",
  url: "https://anote.ai",
};

export const HOME_TITLE = "LLM Leaderboard for Finance, RAG & Classification Benchmarks | Anote";
export const HOME_DESCRIPTION =
  "Compare GPT, Claude, Gemini, Llama and open-source models on real-world benchmarks: FinanceBench retrieval, RAG question answering, financial sentiment, MMLU, ARC and more. Open, reproducible rankings from Anote.";
export const FAQ_TITLE = "Leaderboard FAQ: Metrics, Submissions & Methodology | Anote";
export const FAQ_DESCRIPTION =
  "How the Anote Model Leaderboard scores models, which metric to use for each task, how to submit your own model, and how it differs from MMLU, HELM and Chatbot Arena.";

const META_DESCRIPTION_MAX = 160;

const METRIC_LABELS = {
  accuracy: "Accuracy",
  f1: "F1",
  f1_macro: "Macro F1",
  macro_f1: "Macro F1",
  exact_match: "Exact Match",
  exact: "Exact Match",
  retrieval_accuracy: "Retrieval Accuracy",
  "ndcg@10": "NDCG@10",
  ndcg_at_10: "NDCG@10",
  mrr: "MRR",
  rouge_l: "ROUGE-L",
  rouge_l_f1: "ROUGE-L F1",
  bleu: "BLEU",
  bertscore: "BERTScore",
  median_distance_error: "Median Distance Error (km)",
  policy_compliance_rate: "Policy Compliance Rate",
};

// Phrases people search for, e.g. "FinanceBench Leaderboard: Model Accuracy Comparison".
const METRIC_TITLE_PHRASES = {
  accuracy: "Model Accuracy Comparison",
  f1: "Model F1 Score Comparison",
  f1_macro: "Model Macro-F1 Comparison",
  macro_f1: "Model Macro-F1 Comparison",
  exact_match: "Model Answer Accuracy Comparison",
  exact: "Model Answer Accuracy Comparison",
  retrieval_accuracy: "Retrieval Accuracy Comparison",
  "ndcg@10": "NDCG@10 Retrieval Comparison",
  ndcg_at_10: "NDCG@10 Retrieval Comparison",
  rouge_l: "ROUGE-L Model Comparison",
  rouge_l_f1: "ROUGE-L Model Comparison",
  bleu: "Translation BLEU Comparison",
  bertscore: "Translation BERTScore Comparison",
  median_distance_error: "Geolocation Error Comparison",
  policy_compliance_rate: "Agent Policy Compliance Comparison",
};

const TASK_LABELS = {
  text_classification: "Text classification",
  retrieval: "Retrieval",
  document_qa: "Document question answering",
  line_qa: "Question answering",
  translation: "Translation",
  named_entity_recognition: "Named entity recognition",
  ner: "Named entity recognition",
  geolocation: "Geolocation",
  tool_calling: "Agent tool calling",
};

const LOWER_IS_BETTER = new Set(["median_distance_error", "mean_distance_error"]);

export function normalizeSiteUrl(url) {
  const raw = String(url || "").trim().replace(/\/+$/, "");
  return raw || DEFAULT_SITE_URL;
}

/** Must match backend/seo_utils.py::dataset_slug. */
export function datasetSlug(name) {
  return String(name || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function datasetPath(name) {
  const slug = datasetSlug(name);
  return slug ? `/dataset/${slug}` : `/dataset/${encodeURIComponent(String(name || ""))}`;
}

/** Find a catalog entry by URL segment: a slug, or a legacy URL-encoded dataset name. */
export function findCatalogEntry(catalog, segment) {
  if (!segment || !Array.isArray(catalog)) return null;
  const lowered = String(segment).trim().toLowerCase();
  return (
    catalog.find((d) => String(d.name || "").trim().toLowerCase() === lowered) ||
    catalog.find((d) => d.slug === lowered || datasetSlug(d.name) === lowered) ||
    null
  );
}

export function metricKey(metric) {
  return String(metric || "").trim().toLowerCase().replace(/\s+/g, "_");
}

export function metricLabel(metric) {
  const key = metricKey(metric);
  if (!key) return "Score";
  return (
    METRIC_LABELS[key] ||
    key.replace(/_/g, " ").replace(/\b([a-z])/g, (c) => c.toUpperCase())
  );
}

export function taskLabel(taskType) {
  const key = String(taskType || "").trim().toLowerCase();
  return TASK_LABELS[key] || (key ? key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) : "Benchmark");
}

export function isLowerBetter(dataset) {
  if (dataset && typeof dataset.lower_is_better === "boolean") return dataset.lower_is_better;
  return LOWER_IS_BETTER.has(metricKey(dataset && dataset.evaluation_metric));
}

/** "FinanceBench - Retrieval Accuracy" -> "FinanceBench". */
export function datasetBaseName(name) {
  const text = String(name || "").trim();
  const [head] = text.split(/\s+[-–—:|]\s+/);
  return (head || text).trim();
}

export function formatScore(score) {
  if (typeof score !== "number" || Number.isNaN(score)) return score == null ? "" : String(score);
  if (Math.abs(score) >= 10) return score.toFixed(1);
  // Up to three decimals, at least two: 0.632, 0.90, 1.00.
  return score.toFixed(3).replace(/(\.\d\d)0$/, "$1");
}

export function rankModels(models, dataset) {
  const list = Array.isArray(models) ? models.filter((m) => m && m.model) : [];
  const lower = isLowerBetter(dataset);
  const withRank = list.every((m) => typeof m.rank === "number");
  return [...list].sort((a, b) => {
    if (withRank) return a.rank - b.rank;
    const sa = typeof a.score === "number" ? a.score : lower ? Infinity : -Infinity;
    const sb = typeof b.score === "number" ? b.score : lower ? Infinity : -Infinity;
    return lower ? sa - sb : sb - sa;
  });
}

export function truncateAtWord(text, max = META_DESCRIPTION_MAX) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, "")}…`;
}

function firstSentence(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  const match = clean.match(/^(.+?[.!?])(\s|$)/);
  return match ? match[1] : clean;
}

export function datasetTitle(dataset) {
  const base = datasetBaseName(dataset && dataset.name) || "Benchmark";
  const key = metricKey(dataset && dataset.evaluation_metric);
  const phrase = METRIC_TITLE_PHRASES[key] || `${metricLabel(key)} Model Comparison`;
  const lead = /leaderboard/i.test(base) ? base : `${base} Leaderboard`;
  return `${lead}: ${phrase} | Anote`;
}

export function datasetDescription(dataset, models) {
  const ranked = rankModels(models, dataset).slice(0, 3);
  const top = ranked.map((m) => `${m.model} (${formatScore(m.score)})`).join(", ");
  const task = taskLabel(dataset && dataset.task_type);
  const metric = metricLabel(dataset && dataset.evaluation_metric);
  if (dataset && dataset.research && dataset.research.seo_description) {
    // Research benchmarks carry a hand-written description (their configuration names are too long).
    return truncateAtWord(dataset.research.seo_description);
  }
  const base = datasetBaseName(dataset && dataset.name) || "Benchmark";
  const lower = isLowerBetter(dataset) ? ", lower is better" : "";
  const parts = [`${base} leaderboard ranking AI models by ${metric}${lower}.`];
  if (top) parts.push(`Top: ${top}.`);
  else parts.push(`${task} benchmark.`);
  const about = firstSentence(dataset && dataset.description);
  if (about) parts.push(about);
  return truncateAtWord(parts.join(" "));
}

export function absoluteUrl(siteUrl, path) {
  return `${normalizeSiteUrl(siteUrl)}${path && path.startsWith("/") ? path : `/${path || ""}`}`;
}

/** schema.org Dataset + ranked ItemList for a dataset page. */
export function datasetJsonLd(dataset, models, siteUrl) {
  const pageUrl = absoluteUrl(siteUrl, datasetPath(dataset.name));
  const ranked = rankModels(models, dataset);
  const metric = metricLabel(dataset.evaluation_metric);
  const research = dataset.research || {};
  const sameAs = [dataset.url, research.hf_url, research.repo_url].filter(
    (u, i, arr) => typeof u === "string" && /^https?:\/\//.test(u) && arr.indexOf(u) === i,
  );
  const datasetNode = {
    "@type": "Dataset",
    "@id": `${pageUrl}#dataset`,
    name: dataset.name,
    description:
      String(dataset.description || "").trim() ||
      `${taskLabel(dataset.task_type)} benchmark ranking AI models by ${metric}.`,
    url: pageUrl,
    creator: ORGANIZATION,
    publisher: ORGANIZATION,
    keywords: [taskLabel(dataset.task_type), metric, "LLM leaderboard", "AI benchmark"],
    measurementTechnique: metric,
    variableMeasured: metric,
    includedInDataCatalog: {
      "@type": "DataCatalog",
      name: SITE_NAME,
      url: normalizeSiteUrl(siteUrl),
    },
  };
  if (sameAs.length) datasetNode.sameAs = sameAs;
  if (dataset.license) datasetNode.license = dataset.license;
  if (research.paper_url) {
    datasetNode.citation = research.paper_title
      ? { "@type": "ScholarlyArticle", name: research.paper_title, url: research.paper_url }
      : research.paper_url;
  }
  if (research.blog_url) datasetNode.subjectOf = { "@type": "BlogPosting", url: research.blog_url };
  const itemList = {
    "@type": "ItemList",
    "@id": `${pageUrl}#rankings`,
    name: `${dataset.name} rankings`,
    description: `Models ranked by ${metric}${isLowerBetter(dataset) ? " (lower is better)" : ""}.`,
    itemListOrder: isLowerBetter(dataset)
      ? "https://schema.org/ItemListOrderAscending"
      : "https://schema.org/ItemListOrderDescending",
    numberOfItems: ranked.length,
    itemListElement: ranked.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.model,
      description: `${metric}: ${formatScore(m.score)}`,
    })),
  };
  return { "@context": "https://schema.org", "@graph": [datasetNode, itemList] };
}

export function datasetSeo(dataset, models, siteUrl) {
  return {
    title: datasetTitle(dataset),
    description: datasetDescription(dataset, models),
    path: datasetPath(dataset.name),
    jsonLd: datasetJsonLd(dataset, models, siteUrl),
  };
}

export function homeJsonLd(catalog, siteUrl) {
  const base = normalizeSiteUrl(siteUrl);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: SITE_NAME,
        url: `${base}/`,
        publisher: ORGANIZATION,
      },
      {
        "@type": "ItemList",
        name: "Benchmark leaderboards",
        itemListElement: (catalog || []).map((d, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: d.name,
          url: absoluteUrl(base, datasetPath(d.name)),
        })),
      },
    ],
  };
}

export function faqJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (items || []).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: faqAnswerText(item) },
    })),
  };
}

/** Plain-text answer for an entry of src/seo/faq.json. */
export function faqAnswerText(item) {
  if (!item) return "";
  if (Array.isArray(item.bullets)) {
    return item.bullets.map((b) => (b.term ? `${b.term}: ${b.text}` : b.text)).join(" ");
  }
  if (Array.isArray(item.steps)) {
    return item.steps.map((s, i) => `${i + 1}. ${s}`).join(" ");
  }
  return String(item.answer || "");
}

/** Serialize JSON-LD for an inline <script>; escapes "<" so "</script>" can't break out. */
export function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
