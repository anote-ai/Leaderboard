import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "How is this different from MMLU, HELM, BIG-Bench, or Chatbot Arena?",
    answer:
      "Those benchmarks test general capability on academic tasks. Anote tests performance on your specific task and data. A model that scores 90% on MMLU might score 60% on your customer support classification problem. The only way to know is to test on your data. Anote lets you benchmark any model against real-world datasets — including your own — so the results are directly actionable.",
  },
  {
    question: "How do I know the results are accurate?",
    answer:
      "Every benchmark result is reproducible. Prompts are constructed deterministically from the dataset, model outputs are collected via the provider's API, and scores are computed with established metrics (accuracy, F1, BLEU, BERTScore). The scoring code is open source so you can inspect it. For translation tasks, we use BERTScore for Asian languages (Japanese, Chinese, Korean) where BLEU is unreliable, and BLEU for Spanish and Arabic where n-gram overlap is meaningful.",
  },
  {
    question: "Can someone game the leaderboard?",
    answer:
      "Dataset inputs are public — there is no hidden test set. Anote is not a competition leaderboard; it's a benchmarking platform. You run your model against a dataset and see where it ranks compared to others who ran against the same dataset. If you fine-tune on the benchmark data, your score will reflect that, but a careful reader will notice the submission name and draw their own conclusions.",
  },
  {
    question: "Which metric should I use for my task?",
    answer: (
      <ul className="space-y-1.5 mt-1">
        <li><span className="text-gray-200 font-medium">Text classification</span> — Accuracy (overall correctness) or F1 (balances precision and recall, better when classes are unequal)</li>
        <li><span className="text-gray-200 font-medium">Translation (Spanish, Arabic)</span> — BLEU (measures n-gram overlap with a reference translation; 0–1, higher is better)</li>
        <li><span className="text-gray-200 font-medium">Translation (Japanese, Chinese, Korean)</span> — BERTScore (semantic similarity using embeddings; n-gram overlap is meaningless for these scripts)</li>
        <li><span className="text-gray-200 font-medium">Q&A / document retrieval</span> — Exact Match or BERTScore depending on whether answers are expected to match word-for-word or semantically</li>
        <li><span className="text-gray-200 font-medium">Summarization</span> — ROUGE-L (longest common subsequence overlap with a reference summary)</li>
      </ul>
    ),
  },
  {
    question: "How do I submit my own model?",
    answer: (
      <ol className="space-y-1.5 mt-1 list-decimal list-inside">
        <li>Go to <span className="text-[#28b2fb]">Submit</span> in the navigation bar and log in.</li>
        <li>Choose a benchmark dataset from the dropdown.</li>
        <li>Select your model provider (OpenAI, Anthropic, Google, Ollama, or a custom endpoint) and enter credentials if required.</li>
        <li>Submit — the platform runs your model against the dataset and scores it automatically.</li>
        <li>Your result appears in the leaderboard under the dataset you chose.</li>
      </ol>
    ),
  },
  {
    question: "What is BERTScore and why is it better than BLEU for some languages?",
    answer:
      "BLEU counts exact n-gram matches between a model's output and a reference. It works well for European languages because similar meanings often use the same words. For Japanese, Chinese, and Korean, word segmentation is ambiguous and characters carry more meaning than individual words, so n-gram overlap is nearly zero even for good translations. BERTScore instead computes the cosine similarity of contextual embeddings (from a multilingual BERT model), which captures semantic meaning regardless of the surface form. Scores are between 0 and 1; values above 0.85 are generally considered high quality.",
  },
  {
    question: "Where can I find the evaluation datasets?",
    answer:
      "Each dataset card in the leaderboard includes a link to the source (HuggingFace, GitHub, or the original paper). You can also import datasets directly from HuggingFace Hub using the Create Leaderboard feature. If you need direct access to a dataset that isn't linked, email nvidra@anote.ai.",
  },
  {
    question: "How many times can I submit?",
    answer:
      "There is no strict limit. You're welcome to submit as many times as you like, but for the most meaningful comparison, submit when there are substantial updates or improvements to your model.",
  },
  {
    question: "Do I need to share my model weights?",
    answer:
      "No. You only need to provide a way for the platform to run inference — either by selecting a hosted provider (OpenAI, Anthropic, Google) and providing your API key, or by pointing to a local Ollama endpoint. Model weights, code, and training data are never required.",
  },
];

function ChevronIcon({ open }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-white mb-2">Frequently Asked Questions</h1>
      <p className="text-gray-400 mb-8 text-sm">
        Why trust these results? How do we differ from MMLU and HELM? Which metric should you use?
      </p>

      <div className="space-y-2">
        {FAQ_ITEMS.map((item, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-800/60 bg-gray-900/40 overflow-hidden"
          >
            <button
              type="button"
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              onClick={() => toggle(i)}
              aria-expanded={openIndex === i}
            >
              <span className="text-sm font-medium text-gray-200">{item.question}</span>
              <ChevronIcon open={openIndex === i} />
            </button>
            {openIndex === i && (
              <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-gray-800/40 pt-3">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-[#28b2fb]/20 bg-[#28b2fb]/5 px-5 py-4">
        <p className="text-sm text-gray-300">
          Still have questions?{" "}
          <a
            href="mailto:nvidra@anote.ai"
            className="text-[#28b2fb] hover:underline"
          >
            Email us
          </a>{" "}
          or{" "}
          <a
            href="https://anote.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#28b2fb] hover:underline"
          >
            visit anote.ai
          </a>
          .
        </p>
      </div>
    </div>
  );
}
