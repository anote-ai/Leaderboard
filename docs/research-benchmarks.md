# Anote Research Benchmarks

Anote's research benchmarks appear on the leaderboard next to public benchmarks. Each page links
to the paper, the GitHub repository and the anote.ai blog post, and has a "Cite this benchmark"
BibTeX block. Seeded rows are results reported by the benchmark authors. Every row records its
source file (pinned to a commit), and no score is estimated or back-filled.

Definitions live in `backend/scripts/research_benchmarks.py`. After editing them, run
`python backend/scripts/export_seo_catalog.py` so the frontend build (prerendered pages, sitemap)
picks up the change. Research datasets are added automatically to existing deployments on the
next backend start (`_ensure_required_datasets`), together with their reported results.

## Fit with existing task types

| Benchmark | Eval data and scoring in the repo | Task type | Status |
|---|---|---|---|
| EnterpriseBench (`research-enterprisebench`, HF `anote-ai/research-enterpriseBench`) | Instruction → expected tool call; syntactic score (name + argument Jaccard) and state-aware policy checks (PVR, MTCS, FCR) | New: `tool_calling` | **Listed** at `/dataset/enterprisebench` with reported PVR results and an HF import recipe; automated scoring designed below, not built |
| RetrievalBench (`research-retrievalbench`) | 12 BEIR-style domains × 4 chunkers × 4 retrievers; NDCG@10, Recall@10, MRR, MAP | `retrieval` | **Added**: finance (FiQA) domain, 16 configurations from paper Table 2 |
| Financial Document Retrieval (`research-financialdocumentretrieval`) | 133 FinanceBench questions; answer-containment exact match and ROUGE-L | `document_qa` | **Added**: 7 RAG conditions from the blog post (matches `results/runs`) |
| Semantic Chunking (`research-semanticchunking`) | 14 FinanceBench questions; ROUGE-L F1, two runs | `document_qa` | **Added**: 3 conditions, Run 1 and Run 2 |
| AnnotateBench (`research-annotatebench`) | Annotation strategies × label budgets; macro-F1 of a TF-IDF classifier on 10 datasets | `text_classification` | **Added**: Financial PhraseBank, 4 strategies at their best budget |
| OrchestraBench (`research-orchestratebench`) | Exp 1: 26 gold routing cases, 4 labels, accuracy | `text_classification` | **Added and scorable**: gold labels shipped as ground truth |
| DevIntent (`research-devintent`) | 49 HumanEval+ spec pairs; generated code executed against stated and hidden tests; Intent Violation Rate | New: `code_execution` | **Deferred**: needs sandboxed execution |
| AnoteCodeBench (`research-codebench`) | Multi-rollout agent runs; reliability@k, security-adjusted reliability, SWE-bench pilot | New: `code_execution` (multi-rollout) | **Deferred**: needs rollouts, execution and security scanning |
| MetaRoute-Bench (`research-metarouting`) | Routing policies run in a seeded simulator; success, cost, latency and budget compliance | New: `routing_policy` | **Deferred**: the score is success under a cost budget, not answer correctness |

FinanceBench-derived datasets (Financial Document Retrieval, Semantic Chunking) ship without
questions: the FinanceBench repository states no license, so those pages show reported results only.
RetrievalBench and AnnotateBench are also display-only, since their inputs are corpora and label
budgets rather than per-item predictions.

## Importing EnterpriseBench from Hugging Face

The seeded `EnterpriseBench` card shows the paper's results. To attach the task data, run the
recipe in `eval_core/hf_dataset_recipes.py` (it needs the `datasets` package and network access to
huggingface.co):

```bash
curl -X POST "$API/public/import_hf_dataset" \
  -H "Content-Type: application/json" -H "X-API-Key: $KEY" \
  -d '{"dataset_name": "anote-ai/research-enterpriseBench", "split": "test", "limit": 500, "replace_existing": true}'
```

- The recipe reads the task schema from the EnterpriseBench README (`task_id`, `vertical`,
  `instruction`, `tool_schema`, `expected_call`, `expected_output`, `difficulty`). It also accepts
  common variants (`prompt`, `tool_call`, `tool_name` + `arguments`, JSON-encoded cells) and keeps
  policy fields (`policy_ids`, `pre_state`, `post_state`, `turns`) in each item's metadata.
- If the `test` split does not exist, it falls back to `train`.
- `replace_existing` refreshes the seeded card's reference data and keeps its results.
- A row without an instruction or an expected tool call fails the import with the columns it
  found; it does not fall back to the generic importer.
- The recipe was written without access to the live dataset card (huggingface.co was unreachable
  from the build environment). Run the import with `"preview_only": true` first to confirm the
  schema.

## Minimal designs for new task types

All three follow the existing pattern: `task_type` on `benchmark_datasets`, an evaluator
registered in `eval_core/evaluators.get_evaluator`, and scores stored in
`evaluation_results.evaluation_details.detailed_scores`. Until an evaluator exists, the task type is
listed in `UNSCORED_TASK_TYPES` (`blueprints/submissions.py`) so submissions fail with a clear
message.

### `tool_calling` (EnterpriseBench)

- **Submission**: one JSON object per task: `{"name": str, "arguments": {...}, "claims_done": bool?, "turn_decisions": {...}?}`.
- **Reference**: `ground_truth[i].answer` (expected call) plus metadata `pre_state`, `policy_ids`
  and `post_state`, as written by the HF recipe.
- **Scoring**: reuse `enterprisebench.evaluate` and `enterprisebench.policy` logic, vendored or as
  an optional dependency behind an import flag:
  - `syntactic_accuracy` = 0.4·name match + 0.35·argument-key Jaccard + 0.25·argument-value Jaccard;
  - `policy_violation_rate` = share of tasks where a policy `check_fn(pre_state, action, post_state)` fires;
  - `policy_compliance_rate` = 1 − PVR (primary, higher is better);
  - `multi_turn_consistency` when `turn_decisions` are present.
- **Safety**: policy rules must be data-driven (rule ids mapped to vetted Python checks in the
  backend), never code shipped inside the dataset.
- **Size**: one evaluator class plus policy-rule registry; roughly 300 lines and tests.

### `code_execution` (DevIntent, AnoteCodeBench)

- **Submission**: code per task (DevIntent: n samples per spec pair; CodeBench: k rollouts per task).
- **Scoring**: run each solution in an isolated sandbox (container per job, no network,
  CPU/memory/time limits) against stated and hidden tests.
  - DevIntent: `ivr` = solutions passing stated tests but failing a hidden constraint / solutions passing stated tests.
  - CodeBench: `reliability@k` over full-task success, `security_adjusted_reliability@k` with a static scan (`eval`, `exec`, `os.system`, unsafe `yaml.load`).
- **Infrastructure**: the Flask process must not execute user code. Scoring needs a job queue
  (the roadmap's Redis/Celery item) and a separate execution worker, which is why this is deferred.
- **Seeding once built**: DevIntent reports IVR 54.5% (Claude Sonnet 4.6) and 63.5% (GPT-4.1)
  from `compute_ci.py`. CodeBench reports reliability@5 for three agents in its README (H4).

### `routing_policy` (MetaRoute-Bench)

- **Submission**: per task, the chosen action set (e.g. `["retrieve", "execute_code"]`) and
  optionally the final answer.
- **Scoring**: replay the actions in the seeded offline simulator from `research-metarouting`
  (deterministic, no API keys) to get `success_rate`, `mean_cost`, `budget_compliance` and
  `route_exact_match`. Rank by a utility that combines success and cost, as the paper does.
- **Why not `line_qa`**: the executable split has prompts with exact answers, but an LLM answering
  directly skips the routing and cost trade-off the benchmark measures. Its scores would not be
  comparable with the paper's policies.
