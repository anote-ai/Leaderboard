import { useState } from "react";
import FAQ_ITEMS from "../../seo/faq.json";
import Seo from "../../seo/Seo";
import { FAQ_DESCRIPTION, FAQ_TITLE, faqJsonLd } from "../../seo/seoCore.mjs";

function FaqAnswer({ item }) {
  if (Array.isArray(item.bullets)) {
    return (
      <ul className="space-y-1.5 mt-1">
        {item.bullets.map((b) => (
          <li key={b.term}>
            <span className="text-gray-200 font-medium">{b.term}</span> — {b.text}
          </li>
        ))}
      </ul>
    );
  }
  if (Array.isArray(item.steps)) {
    return (
      <ol className="space-y-1.5 mt-1 list-decimal list-inside">
        {item.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    );
  }
  return item.answer;
}

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
      <Seo title={FAQ_TITLE} description={FAQ_DESCRIPTION} path="/faq" jsonLd={faqJsonLd(FAQ_ITEMS)} />
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
                <FaqAnswer item={item} />
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
