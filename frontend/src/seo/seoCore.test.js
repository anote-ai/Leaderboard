import catalog from "./datasetCatalog.json";
import faq from "./faq.json";
import {
  datasetDescription,
  datasetJsonLd,
  datasetPath,
  datasetSlug,
  datasetTitle,
  faqJsonLd,
  findCatalogEntry,
  rankModels,
  serializeJsonLd,
  truncateAtWord,
} from "./seoCore.mjs";

describe("datasetSlug", () => {
  it("matches the backend slug rules (backend/seo_utils.py)", () => {
    expect(datasetSlug("FinanceBench - Retrieval Accuracy")).toBe("financebench-retrieval-accuracy");
    expect(datasetSlug("SST-2 Sentiment (Sample)")).toBe("sst-2-sentiment-sample");
    expect(datasetSlug("  Café  Überset  ")).toBe("cafe-uberset");
    expect(datasetSlug("!!!")).toBe("");
  });

  it("falls back to the encoded name when the slug is empty", () => {
    expect(datasetPath("日本語")).toBe(`/dataset/${encodeURIComponent("日本語")}`);
  });

  it("agrees with the slugs baked into the exported catalog", () => {
    for (const entry of catalog) {
      expect(datasetSlug(entry.name)).toBe(entry.slug);
      expect(datasetPath(entry.name)).toBe(entry.path);
    }
  });
});

describe("findCatalogEntry", () => {
  it("finds entries by slug and by legacy decoded name", () => {
    const first = catalog[0];
    expect(findCatalogEntry(catalog, first.slug)).toBe(first);
    expect(findCatalogEntry(catalog, first.name.toUpperCase())).toBe(first);
    expect(findCatalogEntry(catalog, "no-such-dataset")).toBeNull();
  });
});

describe("dataset titles and descriptions", () => {
  const financebench = {
    name: "FinanceBench - Retrieval Accuracy",
    task_type: "retrieval",
    evaluation_metric: "accuracy",
    description: "Questions about SEC filings. More detail here.",
  };

  it("targets '<Name> Leaderboard: <metric phrase> | Anote'", () => {
    expect(datasetTitle(financebench)).toBe("FinanceBench Leaderboard: Model Accuracy Comparison | Anote");
  });

  it("puts the top three models in the description and stays under 160 chars", () => {
    const models = [
      { model: "C", score: 0.5 },
      { model: "A", score: 0.9 },
      { model: "B", score: 0.7 },
      { model: "D", score: 0.1 },
    ];
    const desc = datasetDescription(financebench, models);
    expect(desc).toContain("Top: A (0.90), B (0.70), C (0.50).");
    expect(desc).not.toContain("D (0.10)");
    expect(desc.length).toBeLessThanOrEqual(160);
  });

  it("ranks lower-is-better metrics ascending", () => {
    const geo = { name: "Geo", evaluation_metric: "median_distance_error" };
    const ranked = rankModels([{ model: "far", score: 900 }, { model: "near", score: 10 }], geo);
    expect(ranked.map((m) => m.model)).toEqual(["near", "far"]);
  });

  it("truncates at a word boundary", () => {
    const out = truncateAtWord("word ".repeat(60), 40);
    expect(out.length).toBeLessThanOrEqual(40);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("JSON-LD", () => {
  it("describes the dataset and its ranked models", () => {
    const ld = datasetJsonLd(
      {
        name: "X - Accuracy",
        task_type: "text_classification",
        evaluation_metric: "accuracy",
        url: "https://huggingface.co/datasets/x",
        license: "https://opensource.org/licenses/MIT",
      },
      [{ model: "m2", score: 0.2 }, { model: "m1", score: 0.8 }],
      "https://leaderboard.example.com/",
    );
    const [ds, list] = ld["@graph"];
    expect(ds["@type"]).toBe("Dataset");
    expect(ds.url).toBe("https://leaderboard.example.com/dataset/x-accuracy");
    expect(ds.creator.name).toBe("Anote");
    expect(ds.sameAs).toEqual(["https://huggingface.co/datasets/x"]);
    expect(ds.license).toBe("https://opensource.org/licenses/MIT");
    expect(list["@type"]).toBe("ItemList");
    expect(list.itemListElement.map((i) => i.name)).toEqual(["m1", "m2"]);
    expect(list.itemListElement[0].position).toBe(1);
  });

  it("builds an FAQPage with plain-text answers", () => {
    const ld = faqJsonLd(faq);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(faq.length);
    for (const q of ld.mainEntity) expect(q.acceptedAnswer.text.length).toBeGreaterThan(20);
  });

  it("escapes </script> when serializing", () => {
    expect(serializeJsonLd({ a: "</script><b>" })).not.toContain("</script>");
  });
});

describe("research benchmarks", () => {
  const research = catalog.filter((d) => d.research);

  it("every research dataset links its paper, repo and anote.ai blog post and has BibTeX", () => {
    expect(research.length).toBeGreaterThan(0);
    for (const d of research) {
      expect(d.research.paper_url).toMatch(/^https:\/\//);
      expect(d.research.repo_url).toMatch(/^https:\/\/github\.com\/anote-ai\//);
      expect(d.research.blog_url).toMatch(/^https:\/\/anote\.ai\/blog\/frontier-/);
      expect(d.research.bibtex).toMatch(/^@misc\{/);
      for (const m of d.models) expect(m.source).toBeTruthy();
    }
  });

  it("uses the hand-written description and cites the paper in JSON-LD", () => {
    const d = research[0];
    expect(datasetDescription(d, d.models)).toBe(d.research.seo_description);
    const [ds] = datasetJsonLd(d, d.models, "https://leaderboard.anote.ai")["@graph"];
    expect(ds.citation.url).toBe(d.research.paper_url);
    expect(ds.subjectOf.url).toBe(d.research.blog_url);
  });
});
