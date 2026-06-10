import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_ENDPOINT || "http://localhost:5001";

function decodeParam(value) {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function formatMetricKey(metric) {
  if (!metric) return "Score";
  return String(metric)
    .replace(/_/g, " ")
    .replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

function formatScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "N/A";
  if (n >= 0 && n <= 1) return (n * 100).toFixed(1);
  return n.toFixed(Math.abs(n) < 1 ? 3 : 1);
}

function formatDate(value) {
  if (!value) return "Unknown";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}

function inferProvider(modelName) {
  const name = String(modelName || "").toLowerCase();
  if (name.includes("gpt") || name.includes("openai")) return "OpenAI";
  if (name.includes("claude") || name.includes("anthropic")) return "Anthropic";
  if (name.includes("gemini") || name.includes("palm")) return "Google";
  if (name.includes("llama") || name.includes("meta-")) return "Meta";
  if (name.includes("mistral") || name.includes("mixtral")) return "Mistral";
  if (name.includes("qwen")) return "Alibaba";
  if (name.includes("phi")) return "Microsoft";
  if (name.includes("gemma")) return "Google DeepMind";
  return "Unknown";
}

function aggregateModel(entries, modelName) {
  const target = String(modelName || "").toLowerCase();
  const rows = (entries || [])
    .filter((entry) => String(entry.model_name || "").toLowerCase() === target)
    .map((entry) => ({
      ...entry,
      display_score:
        typeof entry.composite_score === "number"
          ? entry.composite_score
          : Number(entry.score),
    }))
    .sort((a, b) => Number(b.display_score || 0) - Number(a.display_score || 0));

  const best = rows[0];
  const latest = rows
    .filter((row) => row.submitted_at)
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0];
  const submitters = Array.from(new Set(rows.map((row) => row.submitted_by).filter(Boolean)));
  const taskTypes = Array.from(new Set(rows.map((row) => row.task_type).filter(Boolean)));
  const sources = Array.from(
    new Set(rows.map((row) => row.metadata?.source || (Number(row.submission_id) < 0 ? "Seeded benchmark" : "User submission")).filter(Boolean))
  );

  return {
    rows,
    best,
    latest,
    submitters,
    taskTypes,
    sources,
    provider: inferProvider(modelName),
  };
}

const ModelCard = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const modelName = useMemo(() => decodeParam(name), [name]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        let cursor = "";
        const allEntries = [];
        for (let page = 0; page < 20; page += 1) {
          const url = new URL(`${API_BASE}/public/get_leaderboard`);
          url.searchParams.set("page_size", "100");
          if (cursor) url.searchParams.set("cursor", cursor);
          const res = await fetch(url.toString());
          const json = await res.json();
          if (!res.ok || json.success !== true) throw new Error(json.error || "Failed to load leaderboard");
          allEntries.push(...(Array.isArray(json.leaderboard) ? json.leaderboard : []));
          cursor = json.next_cursor || "";
          if (!cursor) break;
        }
        if (!ignore) setEntries(allEntries);
      } catch (e) {
        if (!ignore) setError(e.message || "Error loading model card");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    if (modelName) run();
    else setLoading(false);
    return () => {
      ignore = true;
    };
  }, [modelName]);

  const card = useMemo(() => aggregateModel(entries, modelName), [entries, modelName]);
  const metricKeys = useMemo(() => {
    const keys = new Set();
    card.rows.forEach((row) => {
      Object.entries(row.detailed_scores || {}).forEach(([key, value]) => {
        if (typeof value === "number" && !["ci_low", "ci_high"].includes(key)) keys.add(key);
      });
    });
    return Array.from(keys).slice(0, 6);
  }, [card.rows]);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-900 pb-24 mx-3">
      <div className="w-full max-w-6xl mt-6 flex justify-between gap-3">
        <button type="button" onClick={() => navigate("/")} className="px-3 py-1 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-700/40">
          Back to leaderboard
        </button>
        <button type="button" onClick={() => navigate("/compare")} className="px-3 py-1 rounded-md border border-[#defe47]/40 text-[#defe47] hover:bg-[#defe47]/10">
          Compare models
        </button>
      </div>

      <div className="w-full max-w-6xl bg-gray-900/70 rounded-xl border border-gray-800 p-6 mt-3">
        {loading ? (
          <div className="text-gray-300">Loading model card...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : card.rows.length === 0 ? (
          <div>
            <h1 className="text-2xl font-bold text-white">{modelName}</h1>
            <p className="text-gray-400 mt-3">No public leaderboard submissions were found for this model.</p>
          </div>
        ) : (
          <div>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
              <div>
                <div className="text-xs uppercase tracking-widest text-gray-500">Model card</div>
                <h1 className="text-3xl font-bold text-white mt-1 break-words">{modelName}</h1>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-2.5 py-1 rounded-full border border-gray-700 bg-gray-950 text-gray-300 text-xs">Provider: {card.provider}</span>
                  {card.taskTypes.map((task) => (
                    <span key={task} className="px-2.5 py-1 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-200 text-xs">
                      {formatMetricKey(task)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 min-w-full lg:min-w-[34rem]">
                <div className="border border-gray-800 rounded-lg bg-gray-950 p-3">
                  <div className="text-gray-500 text-xs">Best score</div>
                  <div className="text-[#defe47] text-2xl font-semibold tabular-nums">{formatScore(card.best.display_score)}</div>
                </div>
                <div className="border border-gray-800 rounded-lg bg-gray-950 p-3">
                  <div className="text-gray-500 text-xs">Benchmarks</div>
                  <div className="text-white text-2xl font-semibold tabular-nums">{card.rows.length}</div>
                </div>
                <div className="border border-gray-800 rounded-lg bg-gray-950 p-3">
                  <div className="text-gray-500 text-xs">Best rank</div>
                  <div className="text-white text-2xl font-semibold tabular-nums">#{card.best.rank || "N/A"}</div>
                </div>
                <div className="border border-gray-800 rounded-lg bg-gray-950 p-3">
                  <div className="text-gray-500 text-xs">Latest run</div>
                  <div className="text-white text-sm font-semibold mt-1">{formatDate(card.latest?.submitted_at)}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
              <div className="border border-gray-800 rounded-lg bg-black/20 p-4">
                <div className="text-white font-semibold">Attribution</div>
                <div className="text-gray-300 text-sm mt-2">{card.submitters.length ? card.submitters.join(", ") : "Not provided"}</div>
              </div>
              <div className="border border-gray-800 rounded-lg bg-black/20 p-4">
                <div className="text-white font-semibold">Result source</div>
                <div className="text-gray-300 text-sm mt-2">{card.sources.join(", ")}</div>
              </div>
              <div className="border border-gray-800 rounded-lg bg-black/20 p-4">
                <div className="text-white font-semibold">Best benchmark</div>
                <button
                  type="button"
                  className="text-[#defe47] text-sm mt-2 text-left underline"
                  onClick={() => navigate(`/dataset/${encodeURIComponent(card.best.dataset_name)}`)}
                >
                  {card.best.dataset_name}
                </button>
              </div>
            </div>

            <div className="mt-7">
              <div className="text-white font-semibold mb-3">Benchmark results</div>
              <div className="overflow-x-auto border border-gray-800 rounded-lg">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-950 text-gray-400">
                    <tr>
                      <th className="text-left px-3 py-2">Dataset</th>
                      <th className="text-left px-3 py-2">Task</th>
                      <th className="text-right px-3 py-2">Rank</th>
                      <th className="text-right px-3 py-2">Score</th>
                      <th className="text-left px-3 py-2">Primary metric</th>
                      {metricKeys.map((key) => (
                        <th key={key} className="text-right px-3 py-2">{formatMetricKey(key)}</th>
                      ))}
                      <th className="text-left px-3 py-2">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {card.rows.map((row) => (
                      <tr key={`${row.dataset_name}-${row.submission_id || row.rank}`} className="text-gray-200 hover:bg-white/[0.03]">
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="text-[#defe47] underline text-left"
                            onClick={() => navigate(`/dataset/${encodeURIComponent(row.dataset_name)}`)}
                          >
                            {row.dataset_name}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-gray-300">{formatMetricKey(row.task_type)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">#{row.rank || "N/A"}</td>
                        <td className="px-3 py-2 text-right text-[#defe47] font-semibold tabular-nums">{formatScore(row.display_score)}</td>
                        <td className="px-3 py-2 text-gray-300">{formatMetricKey(row.primary_metric || row.evaluation_metric)}</td>
                        {metricKeys.map((key) => (
                          <td key={key} className="px-3 py-2 text-right tabular-nums text-gray-300">
                            {typeof row.detailed_scores?.[key] === "number" ? formatScore(row.detailed_scores[key]) : "N/A"}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-gray-400">{formatDate(row.submitted_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelCard;
