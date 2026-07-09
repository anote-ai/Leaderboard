import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getLeaderboardJwt } from "../../utils/leaderboardAuth";
import { loginPath } from "../../constants/RouteConstants";

const PAGE_SIZES = [25, 50, 100];
const FILTERS = ["all", "correct", "wrong"];

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
  const [searchParams, setSearchParams] = useSearchParams();
  const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_ENDPOINT || "http://localhost:5001";

  // View state lives in the URL so any view is linkable/bookmarkable.
  const shareToken = searchParams.get("share") || "";
  const rawFilter = searchParams.get("filter") || "all";
  const filter = FILTERS.includes(rawFilter) ? rawFilter : "all";
  const rawSize = parseInt(searchParams.get("size") || "", 10);
  const pageSize = PAGE_SIZES.includes(rawSize) ? rawSize : PAGE_SIZES[0];
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const offset = (page - 1) * pageSize;
  const isSharedView = Boolean(shareToken);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [shareState, setShareState] = useState("idle"); // idle | working | copied

  const updateParams = useCallback((updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === undefined || v === "") next.delete(k);
        else next.set(k, String(v));
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const jwt = getLeaderboardJwt();
        const headers = !shareToken && jwt ? { Authorization: `Bearer ${jwt}` } : {};
        const url = new URL(`${API_BASE}/public/submissions/${id}/examples`);
        url.searchParams.set("filter", filter);
        url.searchParams.set("offset", offset);
        url.searchParams.set("limit", pageSize);
        if (shareToken) url.searchParams.set("share", shareToken);
        const res = await fetch(url.toString(), { headers });
        const json = await res.json();
        if (cancelled) return;
        if (res.status === 401) { setError(shareToken ? "share-invalid" : "auth"); return; }
        if (res.status === 403) { setError("forbidden"); return; }
        if (!res.ok || json.success === false) {
          setError(json.error || "Failed to load examples");
          return;
        }
        setData(json);
      } catch (e) {
        if (!cancelled) setError(e.message || "Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [API_BASE, id, filter, offset, pageSize, shareToken]);

  const setFilter = (f) => updateParams({ filter: f === "all" ? null : f, page: null });
  const setPage = (p) => updateParams({ page: p <= 1 ? null : p });
  const setPageSize = (s) => updateParams({ size: s === PAGE_SIZES[0] ? null : s, page: null });

  const handleExport = async () => {
    setExporting(true);
    try {
      const url = new URL(`${API_BASE}/public/submissions/${id}/examples/export`);
      url.searchParams.set("filter", filter);
      if (shareToken) url.searchParams.set("share", shareToken);
      const jwt = getLeaderboardJwt();
      const headers = !shareToken && jwt ? { Authorization: `Bearer ${jwt}` } : {};
      const res = await fetch(url.toString(), { headers });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `submission-${id}-examples-${filter}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (e) {
      window.alert(e.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    setShareState("working");
    try {
      const jwt = getLeaderboardJwt();
      const res = await fetch(`${API_BASE}/public/submissions/${id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error || `Could not create share link (${res.status})`);
      }
      const shareUrl = new URL(window.location.href);
      shareUrl.searchParams.set("share", json.share_token);
      shareUrl.searchParams.delete("page");
      try {
        await navigator.clipboard.writeText(shareUrl.toString());
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 2500);
      } catch {
        setShareState("idle");
        window.prompt("Copy this read-only share link:", shareUrl.toString());
      }
    } catch (e) {
      setShareState("idle");
      window.alert(e.message || "Could not create share link");
    }
  };

  const total = data?.total ?? 0;
  const examples = data?.examples ?? [];
  const correctCount = data?.examples?.filter((e) => e.correct === true).length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const filterTabs = [
    { value: "all", label: "All" },
    { value: "correct", label: "Correct" },
    { value: "wrong", label: "Wrong" },
  ];

  const actionBtn = "px-3.5 py-1.5 rounded-lg border border-gray-700 text-xs font-semibold text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";
  const pageBtn = "px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#111827] pb-24 px-4 text-gray-100">
      <div className="w-full max-w-5xl mt-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
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
          {isSharedView && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-400/30">
              Read-only shared view
            </span>
          )}
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

        {/* Invalid or expired share link */}
        {error === "share-invalid" && (
          <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-8 text-center">
            <p className="text-yellow-100 font-semibold">This share link is invalid or has expired.</p>
            <p className="text-yellow-300/70 text-sm mt-1">Ask the submitter for a fresh link.</p>
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
        {error && !["auth", "forbidden", "share-invalid"].includes(error) && (
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
                <span className="text-2xl font-bold text-white tabular-nums">{total}</span>
                <span className="text-[11px] text-gray-500 mt-0.5">total</span>
              </div>
              {total > 0 && data.examples.some((e) => e.correct !== null && e.correct !== undefined) && (
                <>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex flex-col items-center min-w-[80px]">
                    <span className="text-2xl font-bold text-emerald-300 tabular-nums">
                      {filter === "all"
                        ? `${((data.examples.filter((e) => e.correct === true).length / data.examples.filter((e) => e.correct !== null).length) * 100).toFixed(0)}%`
                        : correctCount}
                    </span>
                    <span className="text-[11px] text-emerald-400/70 mt-0.5">
                      {filter === "all" ? "accuracy (this page)" : "correct"}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Filter tabs + actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex gap-2">
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting || total === 0}
                  className={actionBtn}
                >
                  {exporting ? "Exporting…" : "⬇ Export CSV"}
                </button>
                {!isSharedView && (
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={shareState === "working"}
                    className={[
                      actionBtn,
                      shareState === "copied" ? "border-emerald-400/50 text-emerald-300" : "",
                    ].join(" ")}
                  >
                    {shareState === "copied" ? "✓ Link copied" : shareState === "working" ? "Creating…" : "🔗 Share"}
                  </button>
                )}
              </div>
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
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-800/40">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      Page {currentPage} of {totalPages} · {total} examples
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-gray-500">
                      Rows
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="bg-[#111827] border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-gray-500"
                      >
                        {PAGE_SIZES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setPage(1)}
                        className={pageBtn}
                      >
                        « First
                      </button>
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setPage(currentPage - 1)}
                        className={pageBtn}
                      >
                        ← Prev
                      </button>
                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage(currentPage + 1)}
                        className={pageBtn}
                      >
                        Next →
                      </button>
                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage(totalPages)}
                        className={pageBtn}
                      >
                        Last »
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
