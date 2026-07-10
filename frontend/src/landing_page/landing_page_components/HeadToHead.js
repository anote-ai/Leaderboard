import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { compareModelsPath } from "../../constants/RouteConstants";

const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_ENDPOINT || "http://localhost:5001";
const PAGE_SIZE = 25;

// A = lime (M1), B = blue (M2) — mirrors the ModelComparison color scheme.
const A_TEXT = "text-[#defe47]";
const B_TEXT = "text-[#28b2fb]";

function pctLabel(rate) {
  if (rate == null) return "—";
  return `${(rate * 100).toFixed(0)}%`;
}

function cellValue(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

function StatTile({ value, label, accent }) {
  return (
    <div className={`rounded-xl border ${accent.border} ${accent.bg} px-4 py-3 flex flex-col items-center min-w-[92px]`}>
      <span className={`text-2xl font-bold tabular-nums ${accent.text}`}>{value}</span>
      <span className="text-[11px] text-gray-400 mt-0.5 text-center leading-tight">{label}</span>
    </div>
  );
}

function VerdictBadge({ category }) {
  const map = {
    a_only: { text: "M1 only", cls: "bg-[#defe47]/15 text-[#defe47] border-[#defe47]/40" },
    b_only: { text: "M2 only", cls: "bg-[#28b2fb]/15 text-[#28b2fb] border-[#28b2fb]/40" },
    both_correct: { text: "Both right", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
    both_wrong: { text: "Both wrong", cls: "bg-red-500/15 text-red-300 border-red-400/30" },
    unscored: { text: "N/A", cls: "bg-gray-700/60 text-gray-400 border-gray-600/50" },
  };
  const m = map[category] || map.unscored;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${m.cls}`}>
      {m.text}
    </span>
  );
}

export default function HeadToHead() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const modelsParam = searchParams.get("models") || "";
  const [modelA, modelB] = modelsParam.split(",").map((s) => s.trim());
  const dataset = searchParams.get("dataset") || "";

  const [filter, setFilter] = useState("all");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sharedDatasets, setSharedDatasets] = useState([]);

  const ready = Boolean(modelA && modelB && dataset);

  // Populate the dataset switcher with datasets both models share.
  useEffect(() => {
    if (!modelA || !modelB) return;
    const url = new URL(`${API_BASE}/public/compare_models`);
    url.searchParams.set("models", `${modelA},${modelB}`);
    fetch(url.toString())
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSharedDatasets((d.comparisons || []).map((c) => c.dataset_name));
      })
      .catch(() => {});
  }, [modelA, modelB]);

  const fetchData = useCallback(async (f, o) => {
    if (!ready) return;
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE}/public/head_to_head`);
      url.searchParams.set("models", `${modelA},${modelB}`);
      url.searchParams.set("dataset", dataset);
      url.searchParams.set("filter", f);
      url.searchParams.set("offset", o);
      url.searchParams.set("limit", PAGE_SIZE);
      const res = await fetch(url.toString());
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error || "Failed to load comparison");
        setData(null);
        return;
      }
      setData(json);
    } catch (e) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [ready, modelA, modelB, dataset]);

  useEffect(() => {
    setOffset(0);
    fetchData(filter, 0);
  }, [filter, fetchData]);

  const handlePage = (newOffset) => {
    setOffset(newOffset);
    fetchData(filter, newOffset);
  };

  const swapModels = () => {
    setSearchParams({ models: `${modelB},${modelA}`, dataset });
  };

  const changeDataset = (ds) => {
    setSearchParams({ models: `${modelA},${modelB}`, dataset: ds });
  };

  const summary = data?.summary;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const isScored = summary && (summary.both_correct + summary.both_wrong + summary.a_only + summary.b_only) > 0;

  const filterTabs = useMemo(() => {
    const tabs = [{ value: "all", label: "All examples" }];
    if (isScored) {
      tabs.push(
        { value: "disagreement", label: "Disagreements" },
        { value: "a_only", label: "M1 wins" },
        { value: "b_only", label: "M2 wins" },
        { value: "both_correct", label: "Both right" },
        { value: "both_wrong", label: "Both wrong" },
      );
    }
    return tabs;
  }, [isScored]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#111827] pb-24 px-4 text-gray-100">
      <div className="w-full max-w-5xl mt-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(compareModelsPath + (modelsParam ? `?models=${encodeURIComponent(modelsParam)}` : ""))}
            className="text-gray-500 hover:text-gray-300 transition-colors text-sm flex items-center gap-1"
          >
            ← Comparison
          </button>
          <div className="h-4 w-px bg-gray-700" />
          <h1 className="text-xl font-bold text-white">Head-to-Head Inspector</h1>
        </div>

        {!ready && (
          <div className="rounded-xl border border-gray-800 bg-[#0d1421] px-6 py-12 text-center">
            <p className="text-white font-semibold mb-2">Pick two models and a shared dataset</p>
            <p className="text-gray-400 text-sm mb-5">
              This view aligns two models' predictions example-by-example so you can see exactly where they disagree.
            </p>
            <button
              type="button"
              onClick={() => navigate(compareModelsPath)}
              className="px-4 py-2 rounded-lg bg-[#defe47] text-black text-sm font-semibold hover:bg-[#e8ff70] transition-colors"
            >
              Go to Model Comparison
            </button>
          </div>
        )}

        {ready && (
          <>
            {/* Matchup bar */}
            <div className="bg-[#0d1421] border border-gray-800 rounded-2xl px-5 py-4 mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#defe47]/20 ${A_TEXT}`}>M1</span>
                <span className="text-sm text-white truncate max-w-[13rem]" title={modelA}>{modelA}</span>
                {data && <span className={`text-xs font-semibold ${A_TEXT} tabular-nums`}>{Number(data.scores.a).toFixed(4)}</span>}
              </div>
              <button
                type="button"
                onClick={swapModels}
                title="Swap sides"
                className="text-gray-500 hover:text-gray-200 text-sm px-1.5 transition-colors"
              >
                ⇄
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#28b2fb]/20 ${B_TEXT}`}>M2</span>
                <span className="text-sm text-white truncate max-w-[13rem]" title={modelB}>{modelB}</span>
                {data && <span className={`text-xs font-semibold ${B_TEXT} tabular-nums`}>{Number(data.scores.b).toFixed(4)}</span>}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-gray-600">Dataset</span>
                {sharedDatasets.length > 1 ? (
                  <select
                    value={dataset}
                    onChange={(e) => changeDataset(e.target.value)}
                    className="bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 px-2.5 py-1.5 focus:outline-none focus:border-gray-500 max-w-[16rem]"
                  >
                    {sharedDatasets.map((ds) => (
                      <option key={ds} value={ds}>{ds}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-gray-200 truncate max-w-[16rem]" title={dataset}>{dataset}</span>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200 text-sm mb-5">
                {error}
              </div>
            )}

            {/* Loading */}
            {loading && !error && (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-[#defe47] animate-spin" />
              </div>
            )}

            {!loading && !error && data && summary && (
              <>
                {/* Summary tiles */}
                <div className="flex flex-wrap items-stretch gap-3 mb-6">
                  <StatTile
                    value={pctLabel(summary.agreement_rate)}
                    label="agreement"
                    accent={{ border: "border-gray-700", bg: "bg-gray-800/40", text: "text-white" }}
                  />
                  <StatTile
                    value={summary.a_only}
                    label={<>only <span className={A_TEXT}>M1</span> right</>}
                    accent={{ border: "border-[#defe47]/30", bg: "bg-[#defe47]/10", text: A_TEXT }}
                  />
                  <StatTile
                    value={summary.b_only}
                    label={<>only <span className={B_TEXT}>M2</span> right</>}
                    accent={{ border: "border-[#28b2fb]/30", bg: "bg-[#28b2fb]/10", text: B_TEXT }}
                  />
                  <StatTile
                    value={summary.both_correct}
                    label="both right"
                    accent={{ border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-300" }}
                  />
                  <StatTile
                    value={summary.both_wrong}
                    label="both wrong"
                    accent={{ border: "border-red-500/30", bg: "bg-red-500/10", text: "text-red-300" }}
                  />
                  <StatTile
                    value={summary.total_aligned}
                    label="aligned examples"
                    accent={{ border: "border-gray-700", bg: "bg-gray-800/40", text: "text-gray-300" }}
                  />
                </div>

                {!isScored && (
                  <div className="rounded-lg border border-gray-700/60 bg-gray-800/30 px-4 py-2.5 text-xs text-gray-400 mb-4">
                    This is a generative task (e.g. translation), so there's no per-example right/wrong label — predictions are shown side by side for inspection.
                  </div>
                )}

                {/* Filter tabs */}
                <div className="flex gap-2 mb-4 flex-wrap">
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
                {items.length === 0 ? (
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
                            <th className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 text-left px-3 py-3 w-40">Ground Truth</th>
                            <th className={`text-[10px] font-semibold uppercase tracking-widest text-left px-3 py-3 ${A_TEXT}`}>M1 · {modelA}</th>
                            <th className={`text-[10px] font-semibold uppercase tracking-widest text-left px-3 py-3 ${B_TEXT}`}>M2 · {modelB}</th>
                            <th className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 text-center px-4 py-3 w-28">Verdict</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/30">
                          {items.map((it, i) => {
                            const gt = cellValue(it.ground_truth);
                            const pa = cellValue(it.prediction_a);
                            const pb = cellValue(it.prediction_b);
                            const aCls = it.correct_a === true ? "text-emerald-300" : it.correct_a === false ? "text-red-300" : "text-gray-300";
                            const bCls = it.correct_b === true ? "text-emerald-300" : it.correct_b === false ? "text-red-300" : "text-gray-300";
                            const rowHover = it.category === "a_only" ? "hover:bg-[#defe47]/[0.04]" : it.category === "b_only" ? "hover:bg-[#28b2fb]/[0.04]" : "hover:bg-white/[0.02]";
                            return (
                              <tr key={it.id ?? i} className={`transition-colors ${rowHover}`}>
                                <td className="px-4 py-3 text-[11px] text-gray-600 tabular-nums font-mono">{offset + i + 1}</td>
                                <td className="px-3 py-3 text-gray-300 max-w-[10rem]">
                                  <div className="line-clamp-3 text-xs leading-relaxed font-mono" title={gt ?? ""}>
                                    {gt != null ? gt : <span className="text-gray-600 italic">—</span>}
                                  </div>
                                </td>
                                <td className="px-3 py-3 max-w-[12rem]">
                                  <div className={`line-clamp-3 text-xs leading-relaxed font-mono ${aCls}`} title={pa ?? ""}>
                                    {pa != null ? pa : <span className="text-gray-600 italic">—</span>}
                                  </div>
                                </td>
                                <td className="px-3 py-3 max-w-[12rem]">
                                  <div className={`line-clamp-3 text-xs leading-relaxed font-mono ${bCls}`} title={pb ?? ""}>
                                    {pb != null ? pb : <span className="text-gray-600 italic">—</span>}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <VerdictBadge category={it.category} />
                                </td>
                              </tr>
                            );
                          })}
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
          </>
        )}
      </div>
    </div>
  );
}
