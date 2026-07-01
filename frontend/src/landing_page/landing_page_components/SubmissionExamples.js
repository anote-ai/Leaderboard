import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLeaderboardJwt } from "../../utils/leaderboardAuth";
import { loginPath } from "../../constants/RouteConstants";

const PAGE_SIZE = 25;

function CorrectBadge({ correct }) {
  if (correct === true) return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
      Correct
    </span>
  );
  if (correct === false) return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-300 border border-red-400/30">
      Wrong
    </span>
  );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-700/60 text-gray-400 border border-gray-600/50">
      N/A
    </span>
  );
}

export default function SubmissionExamples() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_ENDPOINT || "http://localhost:5001";

  const [filter, setFilter] = useState("all");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExamples = useCallback(async (f, o) => {
    setLoading(true);
    setError(null);
    try {
      const jwt = getLeaderboardJwt();
      const headers = jwt ? { Authorization: `Bearer ${jwt}` } : {};
      const url = new URL(`${API_BASE}/public/submissions/${id}/examples`);
      url.searchParams.set("filter", f);
      url.searchParams.set("offset", o);
      url.searchParams.set("limit", PAGE_SIZE);
      const res = await fetch(url.toString(), { headers });
      const json = await res.json();
      if (res.status === 401) { setError("auth"); return; }
      if (res.status === 403) { setError("forbidden"); return; }
      if (!res.ok || json.success === false) {
        setError(json.error || "Failed to load examples");
        return;
      }
      setData(json);
    } catch (e) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [API_BASE, id]);

  useEffect(() => {
    setOffset(0);
    fetchExamples(filter, 0);
  }, [filter, fetchExamples]);

  const handlePage = (newOffset) => {
    setOffset(newOffset);
    fetchExamples(filter, newOffset);
  };

  const total = data?.total ?? 0;
  const examples = data?.examples ?? [];
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  // Global stats come from the backend (computed before pagination and filtering).
  const globalStats = data?.stats ?? null;
  const globalAccuracy = globalStats?.accuracy ?? null; // null means unscored task

  const filterTabs = [
    { value: "all", label: "All" },
    { value: "correct", label: "Correct" },
    { value: "wrong", label: "Wrong" },
  ];

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#111827] pb-24 px-4 text-gray-100">
      <div className="w-full max-w-5xl mt-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-300 transition-colors text-sm flex items-center gap-1"
          >
            ← Back
          </button>
          <div className="h-4 w-px bg-gray-700" />
          <h1 className="text-xl font-bold text-white">Prediction Inspector</h1>
          <span className="text-xs text-gray-500 font-mono bg-gray-800/60 px-2 py-0.5 rounded">
            submission #{id}
          </span>
        </div>

        {/* Auth error */}
        {error === "auth" && (
          <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-8 text-center">
            <p className="text-yellow-100 font-semibold">Sign in to inspect this submission.</p>
            <p className="text-yellow-300/70 text-sm mt-1">Per-example results are only visible to the submitter.</p>
            <button
              type="button"
              onClick={() => navigate(loginPath)}
              className="mt-4 px-4 py-2 rounded-lg bg-[#defe47] text-black text-sm font-semibold hover:bg-[#e8ff70] transition-colors"
            >
              Sign in
            </button>
          </div>
        )}

        {/* Forbidden */}
        {error === "forbidden" && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-8 text-center">
            <p className="text-red-200 font-semibold">Access denied.</p>
            <p className="text-red-300/70 text-sm mt-1">These examples belong to a different account.</p>
          </div>
        )}

        {/* Generic error */}
        {error && error !== "auth" && error !== "forbidden" && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-[#defe47] animate-spin" />
          </div>
        )}

        {/* Content */}
        {!loading && !error && data && (
          <>
            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 mb-5">
              <div className="rounded-xl border border-gray-800 bg-[#0d1421] px-4 py-3 flex flex-col items-center min-w-[80px]">
                <span className="text-2xl font-bold text-white tabular-nums">
                  {globalStats ? globalStats.total_examples : total}
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5">total</span>
              </div>
              {globalStats && globalStats.scored_examples > 0 && (
                <>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex flex-col items-center min-w-[80px]">
                    <span className="text-2xl font-bold text-emerald-300 tabular-nums">
                      {globalAccuracy !== null
                        ? `${(globalAccuracy * 100).toFixed(1)}%`
                        : "N/A"}
                    </span>
                    <span className="text-[11px] text-emerald-400/70 mt-0.5">accuracy</span>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex flex-col items-center min-w-[80px]">
                    <span className="text-2xl font-bold text-emerald-300 tabular-nums">
                      {globalStats.correct_examples}
                    </span>
                    <span className="text-[11px] text-emerald-400/70 mt-0.5">correct</span>
                  </div>
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 flex flex-col items-center min-w-[80px]">
                    <span className="text-2xl font-bold text-red-300 tabular-nums">
                      {globalStats.wrong_examples}
                    </span>
                    <span className="text-[11px] text-red-400/70 mt-0.5">wrong</span>
                  </div>
                </>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-4">
              {filterTabs.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFilter(t.value)}
                  className={[
                    "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                    filter === t.value
                      ? "bg-[#defe47]/10 border-[#defe47]/50 text-[#defe47]"
                      : "bg-transparent border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Table */}
            {examples.length === 0 ? (
              <div className="rounded-xl border border-gray-800 bg-[#0d1421] px-6 py-12 text-center text-gray-500 text-sm">
                No examples match this filter.
              </div>
            ) : (
              <div className="rounded-xl border border-gray-800 bg-[#0d1421] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-800/60">
                        <th className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 text-left px-4 py-3 w-12">#</th>
                        <th className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 text-left px-3 py-3">Input</th>
                        <th className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 text-left px-3 py-3 w-40">Ground Truth</th>
                        <th className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 text-left px-3 py-3 w-40">Prediction</th>
                        <th className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 text-center px-4 py-3 w-24">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/30">
                      {examples.map((ex, i) => (
                        <tr
                          key={ex.id ?? i}
                          className={[
                            "transition-colors",
                            ex.correct === true
                              ? "hover:bg-emerald-500/[0.04]"
                              : ex.correct === false
                                ? "hover:bg-red-500/[0.04]"
                                : "hover:bg-white/[0.02]",
                          ].join(" ")}
                        >
                          <td className="px-4 py-3 text-[11px] text-gray-600 tabular-nums font-mono">
                            {offset + i + 1}
                          </td>
                          <td className="px-3 py-3 text-gray-300 max-w-xs">
                            <div className="line-clamp-3 text-xs leading-relaxed" title={ex.input ?? ex.question ?? ex.text ?? ""}>
                              {ex.input ?? ex.question ?? ex.text ?? <span className="text-gray-600 italic">—</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-gray-300 max-w-[10rem]">
                            <div className="line-clamp-3 text-xs leading-relaxed font-mono" title={String(ex.ground_truth ?? "")}>
                              {ex.ground_truth != null ? String(ex.ground_truth) : <span className="text-gray-600 italic">—</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3 max-w-[10rem]">
                            <div
                              className={[
                                "line-clamp-3 text-xs leading-relaxed font-mono",
                                ex.correct === false ? "text-red-300" : ex.correct === true ? "text-emerald-300" : "text-gray-300",
                              ].join(" ")}
                              title={String(ex.prediction ?? "")}
                            >
                              {ex.prediction != null ? String(ex.prediction) : <span className="text-gray-600 italic">—</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <CorrectBadge correct={ex.correct} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800/40">
                    <span className="text-xs text-gray-500">
                      Page {currentPage} of {totalPages} · {total} examples
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={offset === 0}
                        onClick={() => handlePage(Math.max(0, offset - PAGE_SIZE))}
                        className="px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Prev
                      </button>
                      <button
                        type="button"
                        disabled={offset + PAGE_SIZE >= total}
                        onClick={() => handlePage(offset + PAGE_SIZE)}
                        className="px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
