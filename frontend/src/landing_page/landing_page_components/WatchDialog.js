import React, { useEffect, useRef, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:5001';

function WatchDialog({ datasetName, onClose }) {
  const [email, setEmail] = useState('');
  const [watchType, setWatchType] = useState('beaten');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error'); setMessage('Enter a valid email address.'); return;
    }
    setStatus('loading');
    try {
      const res = await fetch(
        `${API_BASE}/public/datasets/${encodeURIComponent(datasetName)}/watch`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, watch_type: watchType }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Subscription failed');
      setStatus('success');
      setMessage("You're subscribed! You'll get an email when rankings change.");
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong. Please try again.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#0d1421] border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-white font-bold text-lg">Watch dataset</div>
            <div className="text-gray-400 text-xs mt-0.5 truncate max-w-[220px]" title={datasetName}>
              {datasetName}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white ml-2 text-xl leading-none">&times;</button>
        </div>

        {status === 'success' ? (
          <div className="text-green-400 text-sm py-4 text-center">{message}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Your email</label>
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#defe47]"
              />
            </div>
            <div>
              <div className="text-gray-300 text-sm mb-2">Notify me when</div>
              <div className="space-y-2">
                {[
                  { value: 'beaten', label: 'A new model takes the #1 spot' },
                  { value: 'top5',   label: 'Any change in the top 5' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="watch_type"
                      value={value}
                      checked={watchType === value}
                      onChange={() => setWatchType(value)}
                      className="accent-[#defe47]"
                    />
                    <span className="text-gray-200 text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            {status === 'error' && (
              <div className="text-red-400 text-xs">{message}</div>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-[#defe47] text-black font-bold py-2 rounded-lg text-sm hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default WatchDialog;
