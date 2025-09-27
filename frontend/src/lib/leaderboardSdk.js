// Simple SDK for the leaderboard API (browser-friendly)
const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_ENDPOINT || "http://localhost:5001";

async function http(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || `${method} ${path} failed`;
    throw new Error(msg);
  }
  return data;
}

export const LeaderboardSDK = {
  addDataset: (payload) => http('POST', '/api/leaderboard/add_dataset', payload),
  addModel: (payload) => http('POST', '/api/leaderboard/add_model', payload),
  listDatasets: () => http('GET', '/api/leaderboard/list'),
  getLeaderboard: () => http('GET', '/public/get_leaderboard'),
  getSourceSentences: (params = {}) => {
    const url = new URL(`${API_BASE}/public/get_source_sentences`);
    if (params.dataset_name) url.searchParams.set('dataset_name', params.dataset_name);
    if (params.count) url.searchParams.set('count', String(params.count));
    if (params.start_idx) url.searchParams.set('start_idx', String(params.start_idx));
    return fetch(url.toString()).then(async (res) => {
      const data = await res.json();
      if (!res.ok || data.success !== true) {
        throw new Error(data?.error || 'Failed to fetch source sentences');
      }
      return data;
    });
  },
  submitModel: (payload) => http('POST', '/public/submit_model', payload),
};

export default LeaderboardSDK;

