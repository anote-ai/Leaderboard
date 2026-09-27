import { useState } from "react";
import copy from "copy-to-clipboard";
import ReactGA from "react-ga4";

function ExternalLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-3 py-1 rounded-md border border-[#defe47]/30 text-[#defe47] text-sm hover:bg-[#defe47]/10"
    >
      {children}
    </a>
  );
}

// github.com/anote-ai/<repo>/blob/<sha>/<path> -> <repo>/<path>
function shortUrl(url) {
  return url.replace(/^https:\/\/github\.com\/anote-ai\//, "").replace(/\/blob\/[0-9a-f]{40}\//, "/");
}

/**
 * Links, citation and result provenance for an Anote research benchmark
 * (catalog entries with a `research` block, see backend/scripts/research_benchmarks.py).
 */
export default function ResearchBenchmarkPanel({ dataset }) {
  const [copied, setCopied] = useState(false);
  const research = dataset?.research;
  if (!research) return null;

  const sources = Array.from(new Set((dataset.models || []).map((m) => m.source).filter(Boolean)));
  const paperLabel = research.arxiv_id ? `Paper (arXiv:${research.arxiv_id})` : "Paper";

  const onCopy = () => {
    copy(research.bibtex);
    setCopied(true);
    ReactGA.event({ category: "Leaderboard", action: "copy_bibtex", label: research.benchmark });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section aria-labelledby="research-heading" className="mt-6 border border-gray-800 rounded-xl p-4 bg-black/20">
      <h2 id="research-heading" className="text-white font-semibold text-base mt-0 mb-1">
        Anote research benchmark
      </h2>
      {research.paper_title && <p className="text-gray-300 text-sm mb-3">{research.paper_title}</p>}
      <div className="flex flex-wrap gap-2">
        {research.paper_url && <ExternalLink href={research.paper_url}>{paperLabel}</ExternalLink>}
        {research.repo_url && <ExternalLink href={research.repo_url}>GitHub repository</ExternalLink>}
        {research.blog_url && <ExternalLink href={research.blog_url}>Blog post</ExternalLink>}
        {research.hf_url && <ExternalLink href={research.hf_url}>Hugging Face dataset</ExternalLink>}
        {(research.extra_links || []).map((link) => (
          <ExternalLink key={link.url} href={link.url}>
            {link.label}
          </ExternalLink>
        ))}
      </div>
      {research.notes && <p className="text-gray-400 text-xs mt-3">{research.notes}</p>}

      {research.bibtex && (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-white font-semibold text-sm my-0">Cite this benchmark</h3>
            <button
              type="button"
              onClick={onCopy}
              className="px-2.5 py-1 rounded-md border border-gray-700 text-gray-300 text-xs hover:bg-gray-700/40"
            >
              {copied ? "Copied" : "Copy BibTeX"}
            </button>
          </div>
          <pre className="text-xs text-gray-200 bg-gray-950 border border-gray-800 rounded-lg p-3 overflow-x-auto whitespace-pre">
            {research.bibtex}
          </pre>
          {!research.arxiv_id && (
            <p className="text-gray-500 text-xs mt-1">The arXiv ID is a placeholder until the preprint is posted.</p>
          )}
        </div>
      )}

      {sources.length > 0 && (
        <div className="mt-5">
          <h3 className="text-white font-semibold text-sm my-0 mb-1">Where these numbers come from</h3>
          <p className="text-gray-400 text-xs mb-2">
            Seeded rows are results reported by the benchmark authors, copied from these sources.
          </p>
          <ul className="list-disc pl-5 text-xs text-gray-300 space-y-1 break-words">
            {sources.map((source) => (
              <li key={source}>
                {source.split(/(https:\/\/[^\s;]+)/).map((part, i) =>
                  /^https:\/\//.test(part) ? (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[#28b2fb] hover:underline">
                      {shortUrl(part)}
                    </a>
                  ) : (
                    part
                  ),
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
