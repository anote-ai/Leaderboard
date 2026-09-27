"""Anote research benchmarks shown on the leaderboard.

Every score below is copied from a result reported in the benchmark's own paper, blog post or
committed result files; ``source`` on each model row says exactly where. Nothing is estimated
or back-filled: ``detailed_scores`` holds only metrics the source reports.

Benchmarks whose evaluation does not fit an existing task type (DevIntent, AnoteCodeBench,
MetaRoute-Bench, and automated scoring for EnterpriseBench) are described in
``docs/research-benchmarks.md`` instead of being added here.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

BLOG_BASE = "https://anote.ai/blog"
ARXIV_PLACEHOLDER = "XXXX.XXXXX"


def _blob(repo: str, sha: str, path: str) -> str:
    return f"https://github.com/anote-ai/{repo}/blob/{sha}/{path}"


def _bibtex(
    key: str,
    title: str,
    authors: str,
    repo_url: str,
    year: int = 2026,
    arxiv_id: Optional[str] = None,
) -> str:
    """BibTeX entry; uses an arXiv placeholder until the paper has an ID."""
    eprint = arxiv_id or ARXIV_PLACEHOLDER
    note = "Preprint" if arxiv_id else "Preprint; arXiv ID pending"
    return (
        f"@misc{{{key},\n"
        f"  title         = {{{title}}},\n"
        f"  author        = {{{authors}}},\n"
        f"  year          = {{{year}}},\n"
        f"  eprint        = {{{eprint}}},\n"
        f"  archivePrefix = {{arXiv}},\n"
        f"  howpublished  = {{\\url{{{repo_url}}}}},\n"
        f"  note          = {{{note}}}\n"
        f"}}"
    )


# ---------------------------------------------------------------------------
# EnterpriseBench
# ---------------------------------------------------------------------------
_EB_SHA = "4632f1c0d3420b8d9de64f4737081b561ce3c06c"
_EB_REPO = "https://github.com/anote-ai/research-enterprisebench"
_EB_PAPER_DRAFT = _blob("research-enterprisebench", _EB_SHA, "PAPER_DRAFT.md")

ENTERPRISEBENCH_HF_ID = "anote-ai/research-enterpriseBench"
ENTERPRISEBENCH_NAME = "EnterpriseBench"

ENTERPRISEBENCH: Dict[str, Any] = {
    "name": ENTERPRISEBENCH_NAME,
    "task_type": "tool_calling",
    "evaluation_metric": "policy_compliance_rate",
    "url": f"https://huggingface.co/datasets/{ENTERPRISEBENCH_HF_ID}",
    "description": (
        "EnterpriseBench tests whether tool-calling LLM agents behave safely on enterprise workflows, "
        "not just whether they call the right function. On 16 policy-annotated tasks across eight workflow "
        "categories (email, CRM, HR, data pipelines, calendar, documents, IT support, finance), agents are "
        "ranked by policy compliance rate: the share of tasks with no policy violation (1 minus the paper's "
        "Policy Violation Rate). Automated scoring of new submissions needs a tool-calling evaluator that is "
        "not built yet; rows below are the paper's reported results."
    ),
    "models": [
        {
            "rank": 1,
            "model": "Reference agent (always returns the ground-truth tool call)",
            "score": 0.5,
            "ci": "0.25 - 0.75",
            "updated": "Jul 2026",
            "source": f"EnterpriseBench paper draft, Section 5.1 (PVR 50% [95% CI 25-75%], 8 of 16 tasks): {_EB_PAPER_DRAFT}",
            "detailed_scores": {
                "policy_compliance_rate": 0.5,
                "policy_violation_rate": 0.5,
                "multi_turn_consistency": 1.0,
                "syntactic_accuracy": 1.0,
            },
        },
        {
            "rank": 2,
            "model": "GPT-4o-mini",
            "score": 0.4375,
            "ci": "0.19 - 0.69",
            "updated": "Jul 2026",
            "source": f"EnterpriseBench paper draft, Section 5.2 (PVR 56% [95% CI 31-81%], 9 of 16 tasks): {_EB_PAPER_DRAFT}",
            "detailed_scores": {
                "policy_compliance_rate": 0.4375,
                "policy_violation_rate": 0.5625,
                "multi_turn_consistency": 1.0,
                "cost_per_task_usd": 0.00003,
            },
        },
    ],
    "research": {
        "benchmark": "EnterpriseBench",
        "seo_description": "EnterpriseBench leaderboard: do tool-calling LLM agents follow enterprise policy? Policy compliance of GPT-4o-mini and a reference agent on 16 workflow tasks.",
        "blog_url": f"{BLOG_BASE}/frontier-enterprisebench",
        "repo_url": _EB_REPO,
        "hf_url": f"https://huggingface.co/datasets/{ENTERPRISEBENCH_HF_ID}",
        "paper_url": "https://drive.google.com/file/d/19x90258PK1woXf8NuRo-DchR4xGYvpTg/view?usp=drive_link",
        "paper_title": "EnterpriseBench: Do Syntactic Tool-Calling Benchmarks Predict Deployment Trustworthiness?",
        "arxiv_id": None,
        "extra_links": [
            {"label": "OpenReview", "url": "https://openreview.net/forum?id=Je4Xot4y7E&noteId=Je4Xot4y7E"},
        ],
        "notes": (
            "Scores are 1 - PVR from the paper draft; the confidence interval is the paper's PVR interval mirrored. "
            "The two agents' intervals overlap, so the ranking is not statistically significant."
        ),
        "bibtex": _bibtex(
            "oyemami2026enterprisebench",
            "EnterpriseBench: Do Syntactic Tool-Calling Benchmarks Predict Deployment Trustworthiness?",
            "Oyemami, Aye",
            _EB_REPO,
        ),
    },
}


# ---------------------------------------------------------------------------
# RetrievalBench (finance domain, FiQA)
# ---------------------------------------------------------------------------
_RB_SHA = "1145eaf7671bb7689201124352b646f80a7278a6"
_RB_REPO = "https://github.com/anote-ai/research-retrievalbench"
_RB_RESULTS = _blob("research-retrievalbench", _RB_SHA, "results/fiqa/chunking_results.json")
_RB_SOURCE = f"RetrievalBench paper Table 2 (finance rows); values and CIs from {_RB_RESULTS}"

# (system label, chunker label, ndcg@10, ci_low, ci_high, recall@10, mrr, map)
_RB_ROWS = [
    ("OpenAI text-embedding-3-small", "fixed-512", 0.7394, 0.7128, 0.7662, 0.8153, 0.7922, 0.6639),
    ("OpenAI text-embedding-3-small", "recursive", 0.7256, 0.6977, 0.7547, 0.8022, 0.7799, 0.6488),
    ("BGE-small-en-v1.5", "fixed-512", 0.6771, 0.6472, 0.7092, 0.7355, 0.7499, 0.6012),
    ("OpenAI text-embedding-3-small", "sentence", 0.676, 0.6458, 0.7037, 0.7596, 0.7369, 0.5919),
    ("E5-small-v2", "fixed-512", 0.665, 0.6327, 0.6963, 0.7279, 0.7345, 0.5875),
    ("BGE-small-en-v1.5", "recursive", 0.6626, 0.6309, 0.6927, 0.7242, 0.7363, 0.5854),
    ("BGE-small-en-v1.5", "sentence", 0.6274, 0.5971, 0.6589, 0.6928, 0.7051, 0.5456),
    ("E5-small-v2", "recursive", 0.6244, 0.5908, 0.6571, 0.6839, 0.6991, 0.5469),
    ("E5-small-v2", "sentence", 0.6066, 0.5738, 0.6389, 0.6732, 0.6865, 0.5239),
    ("OpenAI text-embedding-3-small", "semantic", 0.5852, 0.5538, 0.6155, 0.6932, 0.6397, 0.492),
    ("BGE-small-en-v1.5", "semantic", 0.4853, 0.454, 0.5182, 0.5822, 0.5514, 0.3932),
    ("E5-small-v2", "semantic", 0.4713, 0.4351, 0.5043, 0.5283, 0.561, 0.3931),
    ("BM25", "fixed-512", 0.3457, 0.3153, 0.375, 0.3996, 0.43, 0.2748),
    ("BM25", "recursive", 0.3288, 0.2971, 0.3583, 0.3796, 0.4112, 0.2604),
    ("BM25", "sentence", 0.2846, 0.2571, 0.312, 0.3547, 0.3514, 0.2163),
    ("BM25", "semantic", 0.2535, 0.2266, 0.2788, 0.3133, 0.3259, 0.1879),
]

RETRIEVALBENCH: Dict[str, Any] = {
    "name": "RetrievalBench (Finance, FiQA)",
    "task_type": "retrieval",
    "evaluation_metric": "ndcg@10",
    "url": _RB_REPO,
    "description": (
        "RetrievalBench treats document chunking and embedding-model choice as experimental variables in "
        "cross-domain retrieval. This leaderboard shows the finance domain (FiQA: 2,000 documents, 500 queries): "
        "every combination of four chunking strategies (fixed-512, sentence, recursive, semantic) and four "
        "retrievers (BM25 and three dense embedders), ranked by NDCG@10. In this domain fixed-512 chunking beats "
        "semantic chunking by 26-41% relative NDCG@10 for every dense embedder."
    ),
    "models": [
        {
            "rank": i + 1,
            "model": f"{system} + {chunker} chunking",
            "score": ndcg,
            "ci": f"{lo:.4f} - {hi:.4f}",
            "updated": "Jul 2026",
            "source": _RB_SOURCE,
            "detailed_scores": {"ndcg@10": ndcg, "recall@10": recall, "mrr": mrr, "map": map_},
        }
        for i, (system, chunker, ndcg, lo, hi, recall, mrr, map_) in enumerate(_RB_ROWS)
    ],
    "research": {
        "benchmark": "RetrievalBench",
        "seo_description": "RetrievalBench finance (FiQA) leaderboard: NDCG@10 for 4 chunking strategies x BM25, OpenAI, BGE and E5 retrievers. Best: OpenAI + fixed-512 chunks (0.739).",
        "blog_url": f"{BLOG_BASE}/frontier-retrievalbench",
        "repo_url": _RB_REPO,
        "paper_url": "https://drive.google.com/file/d/1VyIlt8kjBquqWq67m0xMZ-av22NO4sxZ/view?usp=sharing",
        "paper_title": "RetrievalBench: Chunking and Embedding Choice as First-Class Variables in Cross-Domain Retrieval Evaluation",
        "arxiv_id": None,
        "extra_links": [
            {"label": "OpenReview", "url": "https://openreview.net/forum?id=nbFVGlmM45&noteId=nbFVGlmM45"},
        ],
        "notes": (
            "Scores are on a subsampled corpus (2,000 documents plus all relevant documents), so compare rows "
            "with each other, not with full-corpus BEIR leaderboards. The other 11 domains are in the repository."
        ),
        "bibtex": _bibtex(
            "liang2026retrievalbench",
            "RetrievalBench: Chunking and Embedding Choice as First-Class Variables in Cross-Domain Retrieval Evaluation",
            "Liang, Hannah and others",
            _RB_REPO,
        ),
    },
}


# ---------------------------------------------------------------------------
# Financial Document Retrieval (FinDocRetrieval)
# ---------------------------------------------------------------------------
_FD_SHA = "c8619d1da900f0a3f071559ade4464f998d90b3e"
_FD_REPO = "https://github.com/anote-ai/research-financialdocumentretrieval"
_FD_SOURCE = "FinDocRetrieval blog post results table: " + _blob(
    "research-financialdocumentretrieval", _FD_SHA, "blog_post.md"
)

# (label, exact_match, rouge_l, latency_s, numeric_rouge_l, numeric_exact_match),
# ranked by exact match; ties broken by ROUGE-L
_FD_ROWS = [
    ("GPT-4o RAG + semantic chunking (C1)", 0.135, 0.172, 37.0, 0.021, 0.340),
    ("GPT-4o RAG baseline, fixed 512-token chunks (C0)", 0.128, 0.177, 12.3, 0.028, 0.277),
    ("GPT-4o RAG + cross-encoder reranking (C3)", 0.128, 0.175, 35.3, 0.024, 0.319),
    ("GPT-4o RAG + recursive chunking (C2)", 0.120, 0.177, 11.2, 0.026, 0.277),
    ("GPT-4o RAG + metadata enrichment (C4)", 0.105, 0.170, 10.8, 0.024, 0.128),
    ("GPT-4o RAG + hybrid, all techniques (C6)", 0.098, 0.179, 49.8, 0.018, 0.234),
    ("GPT-4o RAG + HyDE query expansion (C5)", 0.098, 0.167, 13.2, 0.017, 0.098),
]

FINANCIAL_DOCUMENT_RETRIEVAL: Dict[str, Any] = {
    "name": "Financial Document Retrieval (FinanceBench)",
    "task_type": "document_qa",
    "evaluation_metric": "exact_match",
    "url": _FD_REPO,
    "description": (
        "A seven-condition ablation of RAG retrieval techniques on 133 FinanceBench analyst questions over "
        "10-K, 10-Q and earnings filings: semantic and recursive chunking, cross-encoder reranking, metadata "
        "enrichment, HyDE query expansion and a full hybrid, all answering with GPT-4o. Ranked by exact match, "
        "counted when the gold answer appears in the model's answer; ROUGE-L F1 is reported alongside because "
        "the two metrics rank the conditions differently."
    ),
    "models": [
        {
            "rank": i + 1,
            "model": label,
            "score": em,
            "updated": "Aug 2026",
            "source": _FD_SOURCE,
            "detailed_scores": {
                "exact_match": em,
                "rouge_l": rouge,
                "latency_s": latency,
                "numeric_rouge_l": num_rouge,
                "numeric_exact_match": num_em,
            },
        }
        for i, (label, em, rouge, latency, num_rouge, num_em) in enumerate(_FD_ROWS)
    ],
    "research": {
        "benchmark": "Financial Document Retrieval",
        "seo_description": "FinanceBench RAG leaderboard: 7 retrieval setups (semantic chunking, reranking, HyDE, hybrid) with GPT-4o on 133 SEC-filing questions, by exact match.",
        "blog_url": f"{BLOG_BASE}/frontier-financial-document-retrieval",
        "repo_url": _FD_REPO,
        "paper_url": "https://drive.google.com/file/d/11b4exi4WBwYKM_12Syt_k-MytRRCpKxA/view?usp=drive_link",
        "paper_title": (
            "When Standard Retrieval Optimizations Fail: A Cost-Aware Ablation Study of RAG Pipelines "
            "for Financial Document Question Answering"
        ),
        "arxiv_id": None,
        "extra_links": [],
        "notes": (
            "Numbers are from the blog post, which matches the per-question run files in results/runs. "
            "The 'Ablation Design' table in the repository README (F1 0.52-0.66) does not match those runs."
        ),
        "bibtex": _bibtex(
            "hong2026findocretrieval",
            "When Standard Retrieval Optimizations Fail: A Cost-Aware Ablation Study of RAG Pipelines for Financial Document Question Answering",
            "Hong, Elaine",
            _FD_REPO,
        ),
    },
}


# ---------------------------------------------------------------------------
# Semantic Chunking for FinanceBench QA
# ---------------------------------------------------------------------------
_SC_SHA = "44b4ed55d50b4a8ab5aa3800f6afa394f2f00921"
_SC_REPO = "https://github.com/anote-ai/Research-semanticchunking"
_SC_SOURCE = "Semantic chunking README 'Ablation Design' table (Run 1 and Run 2 mean ROUGE-L F1): " + _blob(
    "research-semanticchunking", _SC_SHA, "README.md"
)

SEMANTIC_CHUNKING: Dict[str, Any] = {
    "name": "Semantic Chunking for FinanceBench QA",
    "task_type": "document_qa",
    "evaluation_metric": "rouge_l",
    "url": _SC_REPO,
    "description": (
        "Does semantic-boundary chunking or a hybrid retrieval pipeline beat plain fixed chunking on financial "
        "filings? A controlled three-condition ablation on a stratified 14-question FinanceBench sample, with "
        "Claude generating every answer and TF-IDF/BM25 retrieval. Ranked by mean ROUGE-L F1 in Run 1; Run 2, an "
        "independent repeat, is shown alongside. Neither enhancement beat the baseline in either run."
    ),
    "models": [
        {
            "rank": 1,
            "model": "Claude + fixed word-based chunking, TF-IDF (C0 baseline)",
            "score": 0.152,
            "updated": "Jul 2026",
            "source": _SC_SOURCE,
            "detailed_scores": {"rouge_l": 0.152, "rouge_l_run2": 0.145},
        },
        {
            "rank": 2,
            "model": "Claude + hybrid: structure-aware chunks, BM25/TF-IDF fusion, metadata, HyDE, reranking (C6)",
            "score": 0.128,
            "updated": "Jul 2026",
            "source": _SC_SOURCE,
            "detailed_scores": {"rouge_l": 0.128, "rouge_l_run2": 0.124},
        },
        {
            "rank": 3,
            "model": "Claude + semantic paragraph/sentence-boundary chunking (C1)",
            "score": 0.117,
            "updated": "Jul 2026",
            "source": _SC_SOURCE,
            "detailed_scores": {"rouge_l": 0.117, "rouge_l_run2": 0.123},
        },
    ],
    "research": {
        "benchmark": "Semantic Chunking for FinanceBench QA",
        "seo_description": "Semantic vs. fixed chunking on FinanceBench: ROUGE-L of baseline, semantic and hybrid retrieval pipelines for financial document QA across two independent runs.",
        "blog_url": f"{BLOG_BASE}/frontier-semantic-chunking",
        "repo_url": _SC_REPO,
        "paper_url": "https://github.com/anote-ai/Research-semanticchunking/blob/main/paper.pdf",
        "paper_title": "Semantic Chunking and Hybrid Retrieval for Financial Document QA: An Ablation Study on FinanceBench",
        "arxiv_id": None,
        "extra_links": [{"label": "OpenReview", "url": "https://openreview.net/forum?id=fMXab2aae9"}],
        "notes": (
            "14 questions: enough to catch a large effect, not fine distinctions. C1's shortfall vs. the baseline is "
            "significant in Run 1 (95% CI [-0.073, -0.002]); C6's is not significant in either run."
        ),
        "bibtex": _bibtex(
            "uzoama2026semanticchunking",
            "Semantic Chunking and Hybrid Retrieval for Financial Document QA: An Ablation Study on FinanceBench",
            "Uzoama, Ebuka Chidubem Prudence",
            _SC_REPO,
        ),
    },
}


# ---------------------------------------------------------------------------
# AnnotateBench (Financial PhraseBank)
# ---------------------------------------------------------------------------
_AB_SHA = "dee5335cc2f989e21142bbd1b6239c2cf324982d"
_AB_REPO = "https://github.com/anote-ai/research-annotatebench"
_AB_SOURCE = "AnnotateBench results/benchmark_best_by_strategy.csv (mean of 5 seeds, base cost scenario): " + _blob(
    "research-annotatebench", _AB_SHA, "results/benchmark_best_by_strategy.csv"
)
_AB_CI_SOURCE = "95% CI from results/paper_core_summary.csv: " + _blob(
    "research-annotatebench", _AB_SHA, "results/paper_core_summary.csv"
)

# (strategy label, budget, mean macro-F1, std, mean accuracy, mean total cost USD)
_AB_ROWS = [
    ("Uncertainty active learning", 500, 0.7546, 0.0149, 0.8300, 48.6),
    ("Hybrid active learning", 1000, 0.7506, 0.0026, 0.8375, 99.2),
    ("Random sampling", 1000, 0.7158, 0.0126, 0.8168, 95.2),
    ("Diversity active learning", 1000, 0.6681, 0.0285, 0.8009, 98.2),
]

ANNOTATEBENCH: Dict[str, Any] = {
    "name": "AnnotateBench (Financial PhraseBank)",
    "task_type": "text_classification",
    "evaluation_metric": "macro_f1",
    "url": _AB_REPO,
    "description": (
        "AnnotateBench compares annotation strategies under fixed labeling budgets: how much labeled data does "
        "each strategy need? This leaderboard shows Financial PhraseBank sentiment classification with a TF-IDF + "
        "logistic-regression classifier trained on the labels each strategy selects, reported at each strategy's "
        "best budget (500 or 1,000 labels) and ranked by test macro-F1, averaged over five seeds."
    ),
    "models": [
        {
            "rank": i + 1,
            "model": f"{label} ({budget:,} labels) + TF-IDF logistic regression",
            "score": f1,
            **({"ci": "0.7416 - 0.7676"} if i == 0 else {}),
            "updated": "Aug 2026",
            "source": _AB_SOURCE + ("; " + _AB_CI_SOURCE if i == 0 else ""),
            "detailed_scores": {
                "macro_f1": f1,
                "macro_f1_std": std,
                "accuracy": acc,
                "label_budget": budget,
                "annotation_cost_usd": cost,
            },
        }
        for i, (label, budget, f1, std, acc, cost) in enumerate(_AB_ROWS)
    ],
    "research": {
        "benchmark": "AnnotateBench",
        "seo_description": "AnnotateBench leaderboard: macro-F1 of active learning vs. random annotation strategies on Financial PhraseBank at 500-1,000 labels, with annotation cost.",
        "blog_url": f"{BLOG_BASE}/frontier-annotatebench",
        "repo_url": _AB_REPO,
        "hf_url": "https://huggingface.co/datasets/anote-ai/annotatebench-results",
        "paper_url": "https://drive.google.com/file/d/1u091t3_a_T6RU4rw1qhJK33PX3qQPvg0/view?usp=sharing",
        "paper_title": "AnnotateBench: How Much Labeled Data Do Text-Classification Annotation Strategies Need?",
        "arxiv_id": None,
        "extra_links": [],
        "notes": (
            "Rows are annotation strategies, each at the budget where it scored best, so budgets differ between rows. "
            "The other nine datasets are in the repository."
        ),
        "bibtex": _bibtex(
            "zhang2026annotatebench",
            "AnnotateBench: How Much Labeled Data Do Text-Classification Annotation Strategies Need?",
            "Zhang, Aitong",
            _AB_REPO,
        ),
    },
}


# ---------------------------------------------------------------------------
# OrchestraBench (Experiment 1: routing decisions)
# ---------------------------------------------------------------------------
_OB_SHA = "5c3738c19d99cbe9aa152b0ea9b7d903ea4f93db"
_OB_REPO = "https://github.com/anote-ai/research-orchestratebench"
_OB_PAPER_SOURCE = "OrchestraBench PAPER.md Section 5.1 table: " + _blob("research-orchestratebench", _OB_SHA, "PAPER.md")
_OB_CSV_SOURCE = "OrchestraBench data/measured/exp1_baselines.csv: " + _blob(
    "research-orchestratebench", _OB_SHA, "data/measured/exp1_baselines.csv"
)
_OB_GOLD_SOURCE = _blob(
    "research-orchestratebench", _OB_SHA, "src/orchestratebench/routing_comparison.py"
)

# (task description, gold routing decision, case type) from make_routing_eval_set().
ORCHESTRABENCH_GOLD: List[List[str]] = [
    ["Look up the current account balance for customer #4821.", "direct_tool", "aligned"],
    ["Fetch the latest invoice PDF for order 9931.", "direct_tool", "aligned"],
    ["Retrieve the contract section covering termination clauses.", "direct_tool", "aligned"],
    ["Pull the employee's remaining PTO balance for this year.", "direct_tool", "aligned"],
    ["Compute the 30-day moving average from the attached sales CSV.", "code_execution", "aligned"],
    ["Parse the server log file and count error codes by hour.", "code_execution", "aligned"],
    ["Run the unit-test suite and report which tests fail.", "code_execution", "aligned"],
    ["Generate a bar chart from the quarterly revenue table.", "code_execution", "aligned"],
    ["Plan and execute a full quarterly financial close across AP, AR, and reconciliation.", "decompose", "aligned"],
    ["Onboard a new enterprise client: provision accounts, configure SSO, migrate data, and schedule training.", "decompose", "aligned"],
    ["Design, draft, review, and submit an RFP response with three distinct technical subsections.", "decompose", "aligned"],
    ["Coordinate the product launch: marketing, engineering sign-off, and a staged rollout plan.", "decompose", "aligned"],
    ["Explain the difference between gross margin and net margin.", "reason_only", "aligned"],
    ["Summarize the single biggest risk here in one sentence.", "reason_only", "aligned"],
    ["Which of these two options is riskier, and why?", "reason_only", "aligned"],
    ["Rephrase this paragraph to be more concise.", "reason_only", "aligned"],
    ["Break this initiative into sub-tasks, assign owners, and sequence them by dependency.", "decompose", "adversarial"],
    ["Write a Python script to deduplicate the customer list and run it.", "code_execution", "adversarial"],
    ["Just look up the CEO's name in the latest company filing.", "direct_tool", "adversarial"],
    ["What does the acronym 'EBITDA' stand for?", "reason_only", "adversarial"],
    ["Create a multi-step migration plan: audit, map, transfer, validate.", "decompose", "adversarial"],
    ["Calculate the correlation matrix for these five metrics programmatically.", "code_execution", "adversarial"],
    ["Find the phone number listed on page 2 of the document.", "direct_tool", "adversarial"],
    ["Is 17 a prime number?", "reason_only", "adversarial"],
    ["Plan the team offsite: venue, agenda, travel, and budget, in order.", "decompose", "adversarial"],
    ["Run a regex over the dataset to extract every email address.", "code_execution", "adversarial"],
]

ORCHESTRABENCH: Dict[str, Any] = {
    "name": "OrchestraBench Routing",
    "task_type": "text_classification",
    "evaluation_metric": "accuracy",
    "url": _OB_REPO,
    "description": (
        "OrchestraBench evaluates the orchestration layer of multi-agent LLM systems. This leaderboard is its "
        "routing experiment: given a task description, choose decompose, direct_tool, code_execution or "
        "reason_only. 26 expert-labelled cases: 16 where surface cues match intent and 10 adversarial cases "
        "where they mislead. Ranked by accuracy; submissions are scored automatically against the gold labels."
    ),
    "reference_data": {
        "source_texts": [text for text, _, _ in ORCHESTRABENCH_GOLD],
        "ground_truth": [label for _, label, _ in ORCHESTRABENCH_GOLD],
    },
    "models": [
        {
            "rank": 1,
            "model": "LLM-as-Router (Claude Sonnet 4.6)",
            "score": 1.0,
            "updated": "Jul 2026",
            "source": _OB_PAPER_SOURCE,
            "detailed_scores": {"accuracy": 1.0, "accuracy_aligned": 1.0, "accuracy_adversarial": 1.0},
        },
        {
            "rank": 2,
            "model": "TF-IDF description router",
            "score": 0.9231,
            "updated": "Jul 2026",
            "source": _OB_CSV_SOURCE,
            "detailed_scores": {"accuracy": 0.9231, "accuracy_aligned": 0.875, "accuracy_adversarial": 1.0},
        },
        {
            "rank": 3,
            "model": "HeuristicPolicy (keyword/flag rules)",
            "score": 0.6154,
            "updated": "Jul 2026",
            "source": f"{_OB_PAPER_SOURCE}; exact value from {_OB_CSV_SOURCE}",
            "detailed_scores": {"accuracy": 0.6154, "accuracy_aligned": 1.0, "accuracy_adversarial": 0.0},
        },
        {
            "rank": 4,
            "model": "FixedPolicy (always the same decision)",
            "score": 0.2308,
            "updated": "Jul 2026",
            "source": f"{_OB_PAPER_SOURCE}; exact value from {_OB_CSV_SOURCE}",
            "detailed_scores": {"accuracy": 0.2308, "accuracy_aligned": 0.25, "accuracy_adversarial": 0.2},
        },
    ],
    "research": {
        "benchmark": "OrchestraBench",
        "seo_description": "OrchestraBench routing leaderboard: accuracy choosing decompose, tool, code or reason for 26 agent tasks. Claude Sonnet 4.6 router 1.00 vs keyword rules 0.62.",
        "blog_url": f"{BLOG_BASE}/frontier-orchestrabench",
        "repo_url": _OB_REPO,
        "hf_url": "https://huggingface.co/datasets/anote-ai/Orchestratebench",
        "paper_url": "https://arxiv.org/abs/2608.05263",
        "paper_title": "OrchestraBench: Evaluating Multi-Agent Orchestration Failure Modes, Recovery, and Decomposition Quality",
        "arxiv_id": "2608.05263",
        "extra_links": [{"label": "Papers With Code", "url": "https://paperswithcode.co/paper/2608.05263"}],
        "notes": (
            "The paper's policies also see task flags (requires_code, requires_retrieval); leaderboard submissions "
            f"see only the description text. Gold labels: {_OB_GOLD_SOURCE}. The oracle ceiling row is omitted."
        ),
        "bibtex": _bibtex(
            "chen2026orchestrabench",
            "OrchestraBench: Evaluating Multi-Agent Orchestration Failure Modes, Recovery, and Decomposition Quality",
            "Chen, Yidian and Gu, Yingzi and Vidra, Natan and Setty, Spurthi and Zheng, Sharon",
            _OB_REPO,
            arxiv_id="2608.05263",
        ),
    },
}


RESEARCH_DATASETS: List[Dict[str, Any]] = [
    ENTERPRISEBENCH,
    RETRIEVALBENCH,
    FINANCIAL_DOCUMENT_RETRIEVAL,
    SEMANTIC_CHUNKING,
    ANNOTATEBENCH,
    ORCHESTRABENCH,
]
