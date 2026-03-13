import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Search, User, Bot, Loader2, Clock, Camera,
  Target, X, Filter, ChevronDown, Zap, RefreshCw,
} from 'lucide-react';

const PERSON_SEARCH_URL = '/api/v1/person-search'; // proxied to port 8100

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function resolveSnapshotUrl(uri) {
  if (!uri) return null;
  if (uri.startsWith('http')) return uri;
  // Strip leading "data/snapshots/" prefix since /snapshots/ mount already maps to that dir
  const stripped = uri.replace(/^data\/snapshots\//, '').replace(/^\/+/, '');
  return `/snapshots/${stripped}`;
}

function formatAgentResponse(queryText, data) {
  const { total_matches: count, latency_ms: ms, query } = data;
  const appearance = query?.appearance_text || queryText;
  if (count === 0) {
    return (
      `No matching results found.\n\n` +
      `📌 Parsed query: "${appearance}"\n` +
      `⏱ Latency: ${ms}ms\n\n` +
      `Tip: Try describing clothing colors more specifically, or widen the time range.`
    );
  }
  const top = data.matches[0];
  return (
    `✅ Found ${count} result(s).\n\n` +
    `📌 Parsed query: "${appearance}"\n` +
    `⏱ Latency: ${ms}ms\n\n` +
    `🏆 Top match: Score ${(top.score * 100).toFixed(1)}% — ` +
    `Camera ${top.first_seen_camera || 'N/A'} — ` +
    `${top.matched_tracklet_count} tracklet(s)`
  );
}

const QUICK_SEARCHES = [
  'Person wearing gray shirt',
  'Person in red jacket',
  'Man in black jacket',
  'Woman in white dress',
  'Child with backpack',
];

// ─────────────────────────────────────────────────────────────────────────────
// PersonCard
// ─────────────────────────────────────────────────────────────────────────────
function PersonCard({ person, rank, selected, onClick }) {
  const score = person.score || 0;
  const scoreColor = score > 0.7 ? 'text-green-400' : score > 0.4 ? 'text-yellow-400' : 'text-orange-400';
  const scoreBg   = score > 0.7 ? 'bg-green-400'  : score > 0.4 ? 'bg-yellow-400'  : 'bg-orange-400';
  const snapshotUrl = resolveSnapshotUrl(person.representative_snapshot);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl border transition-all duration-200 overflow-hidden select-none
        ${selected
          ? 'border-cyan-400 ring-1 ring-cyan-400/50 bg-[#0d1f2e]'
          : 'border-gray-700/40 bg-[#0d1117] hover:border-cyan-700/60 hover:bg-[#0d1a24]'}`}
    >
      {/* Photo */}
      <div className="relative aspect-[3/4] bg-[#1a1f2e] flex items-center justify-center overflow-hidden">
        {snapshotUrl && !imgError ? (
          <img
            src={snapshotUrl}
            alt={`Person ${rank}`}
            className="w-full h-full object-cover object-top"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1">
            <User size={36} className="text-gray-600" />
            <span className="text-gray-600 text-[10px]">No image</span>
          </div>
        )}

        {/* Rank badge */}
        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/75 backdrop-blur-sm
                        flex items-center justify-center text-xs font-bold text-white border border-white/20">
          {rank}
        </div>

        {/* Score badge */}
        <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm
                         text-xs font-mono font-bold ${scoreColor}`}>
          {(score * 100).toFixed(0)}%
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5 space-y-1.5">
        {/* Score bar */}
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full ${scoreBg} rounded-full`} style={{ width: `${score * 100}%` }} />
        </div>

        {/* Camera */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Camera size={11} className="text-cyan-600 flex-shrink-0" />
          <span className="truncate font-medium">{person.first_seen_camera || 'Unknown'}</span>
        </div>

        {/* Location from timeline */}
        {person.timeline?.[0]?.location_name && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <Target size={10} className="text-gray-600 flex-shrink-0" />
            <span className="truncate">{person.timeline[0].location_name}</span>
          </div>
        )}

        {/* Time */}
        {person.timeline?.[0]?.start_ts && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <Clock size={10} className="text-cyan-700 flex-shrink-0" />
            <span>{new Date(person.timeline[0].start_ts).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
          </div>
        )}

        {/* Tracklet count */}
        <div className="flex items-center gap-1 text-[10px] text-gray-600">
          <span>{person.matched_tracklet_count || 0} tracklet</span>
          {person.timeline?.length > 1 && (
            <span className="text-cyan-600">· {person.timeline.length} locations</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PersonDetailPanel
// ─────────────────────────────────────────────────────────────────────────────
function PersonDetailPanel({ person, onClose }) {
  const snapshotUrl = resolveSnapshotUrl(person.representative_snapshot);
  const [imgError, setImgError] = useState(false);
  const score = person.score || 0;

  return (
    <div className="w-[300px] min-w-[260px] border-l border-cyan-900/30 bg-[#0d1117] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-cyan-900/30 flex items-center justify-between">
        <span className="text-sm font-semibold text-cyan-400">Details</span>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
          <X size={14} className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Photo */}
        <div className="aspect-[3/4] bg-[#1a1f2e] rounded-xl overflow-hidden flex items-center justify-center">
          {snapshotUrl && !imgError ? (
            <img
              src={snapshotUrl}
              alt="Person"
              className="w-full h-full object-cover object-top"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <User size={52} className="text-gray-600" />
              <span className="text-gray-600 text-xs">No photo</span>
            </div>
          )}
        </div>

        {/* Score bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Match Score</span>
            <span className="font-bold text-white">{(score * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${score > 0.7 ? 'bg-green-500' : score > 0.4 ? 'bg-yellow-500' : 'bg-orange-500'}`}
              style={{ width: `${score * 100}%` }}
            />
          </div>
        </div>

        {/* Stats table */}
        <div className="space-y-2 text-xs">
          {[
            ['IRRA Similarity', `${((person.irra_similarity || 0) * 100).toFixed(1)}%`, 'text-cyan-400'],
            ['Attr Score',      `${((person.attr_score || 0) * 100).toFixed(1)}%`,       'text-gray-300'],
            ['Tracklets',       person.matched_tracklet_count || 0,                        'text-gray-300'],
            ['First Camera',    person.first_seen_camera || 'N/A',                         'text-gray-300'],
          ].map(([label, value, cls]) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-gray-500">{label}</span>
              <span className={`font-mono ${cls}`}>{value}</span>
            </div>
          ))}
          {person.global_person_id && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Person ID</span>
              <span className="text-gray-500 font-mono text-[10px] truncate ml-2 max-w-[140px]">
                {person.global_person_id}
              </span>
            </div>
          )}
        </div>

        {/* Timeline */}
        {person.timeline?.length > 0 ? (
          <div>
            <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
              <Clock size={11} /> Timeline ({person.timeline.length} segments)
            </div>
            <div className="space-y-2">
              {person.timeline.map((seg, i) => (
                <div key={i} className="bg-[#1a1f2e] rounded-lg p-2.5 border border-gray-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Camera size={11} className="text-cyan-600" />
                    <span className="text-xs text-cyan-400">{seg.camera_name || seg.camera_id}</span>
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {new Date(seg.start_ts).toLocaleString('en-US')}
                    {seg.end_ts && (
                      <span> → {new Date(seg.end_ts).toLocaleString('en-US')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-600 text-center py-3 border border-dashed border-gray-800 rounded-lg">
            Timeline not available<br />
            <span className="text-[10px]">(requires PostgreSQL running)</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
function PersonSearch() {
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      content:
        'Hello! I am the AI Search Agent.\n\n' +
        'Describe the person you are looking for in natural language.\n\n' +
        'Examples:\n' +
        '• "Person wearing gray shirt near the gate"\n' +
        '• "Man in red jacket near entrance"\n' +
        '• "White top, black pants, morning"\n\n' +
        'I will use AI (IRRA + CLIP ReID) to search across all cameras.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [results, setResults]           = useState(null);
  const [selectedIdx, setSelectedIdx]   = useState(null);
  const [showFilters, setShowFilters]   = useState(false);
  const [filters, setFilters]           = useState({
    timeFrom: '', timeTo: '', cameras: '', topK: 10,
  });

  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendQuery = useCallback(
    async (queryText) => {
      if (!queryText.trim() || loading) return;
      setMessages(prev => [...prev, { role: 'user', content: queryText, timestamp: new Date() }]);
      setLoading(true);
      setResults(null);
      setSelectedIdx(null);

      const payload = { query_text: queryText, top_k: filters.topK || 10 };
      if (filters.timeFrom) payload.time_from = new Date(filters.timeFrom).toISOString();
      if (filters.timeTo)   payload.time_to   = new Date(filters.timeTo).toISOString();
      if (filters.cameras)  payload.camera_ids = filters.cameras.split(',').map(s => s.trim()).filter(Boolean);

      try {
        const res = await fetch(PERSON_SEARCH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        const data = await res.json();
        setResults(data);
        setMessages(prev => [
          ...prev,
          { role: 'agent', content: formatAgentResponse(queryText, data), timestamp: new Date(), data },
        ]);
      } catch (err) {
        setMessages(prev => [
          ...prev,
          {
            role: 'agent',
            content: `❌ Could not connect to Person Search API.\n\nDetails: ${err.message}\n\nCheck that the Person Search API is running on port 8100.`,
            timestamp: new Date(),
            isError: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [filters, loading],
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendQuery(text);
  };

  const clearChat = () => {
    setMessages([{
      role: 'agent',
      content: 'Chat cleared. Enter a new query to search.',
      timestamp: new Date(),
    }]);
    setResults(null);
    setSelectedIdx(null);
  };

  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#080c17] text-white overflow-hidden">

      {/* ── LEFT: AI Agent Chat ── */}
      <div className="w-[360px] min-w-[300px] flex flex-col border-r border-cyan-900/30 bg-[#0b0f1c]">

        {/* Header */}
        <div className="px-4 py-3 border-b border-cyan-900/30 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
            <Bot size={16} className="text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-cyan-400">AI Search Agent</div>
            <div className="text-[10px] text-gray-500">IRRA · CLIP · ReID · NLP</div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400">Online</span>
          </div>
          <button
            onClick={clearChat}
            title="Clear chat history"
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-1 flex-shrink-0"
          >
            <RefreshCw size={12} className="text-gray-500 hover:text-gray-300" />
          </button>
        </div>

        {/* Advanced filters */}
        <div className="px-4 py-2 border-b border-cyan-900/20">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-cyan-400 transition-colors w-full"
          >
            <Filter size={11} />
            <span>Advanced Filters</span>
            <ChevronDown size={11} className={`ml-auto transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="mt-3 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">From</label>
                  <input
                    type="datetime-local"
                    value={filters.timeFrom}
                    onChange={e => setFilters(f => ({ ...f, timeFrom: e.target.value }))}
                    className="w-full text-[11px] bg-[#1a1f2e] border border-gray-700 rounded-lg px-2 py-1 text-gray-300 focus:outline-none focus:border-cyan-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">To</label>
                  <input
                    type="datetime-local"
                    value={filters.timeTo}
                    onChange={e => setFilters(f => ({ ...f, timeTo: e.target.value }))}
                    className="w-full text-[11px] bg-[#1a1f2e] border border-gray-700 rounded-lg px-2 py-1 text-gray-300 focus:outline-none focus:border-cyan-700"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-0.5">Camera IDs (cam_001, cam_002...)</label>
                <input
                  type="text"
                  value={filters.cameras}
                  placeholder="Leave empty = all cameras"
                  onChange={e => setFilters(f => ({ ...f, cameras: e.target.value }))}
                  className="w-full text-[11px] bg-[#1a1f2e] border border-gray-700 rounded-lg px-2 py-1 text-gray-300 focus:outline-none focus:border-cyan-700"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-0.5">
                  Max results: <span className="text-cyan-400">{filters.topK}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={filters.topK}
                  onChange={e => setFilters(f => ({ ...f, topK: parseInt(e.target.value) }))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div
                className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5
                  ${msg.role === 'agent'
                    ? 'bg-cyan-500/15 border border-cyan-500/40'
                    : 'bg-blue-500/15 border border-blue-500/40'}`}
              >
                {msg.role === 'agent'
                  ? <Bot size={12} className="text-cyan-400" />
                  : <User size={12} className="text-blue-400" />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[82%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words
                  ${msg.role === 'agent'
                    ? msg.isError
                      ? 'bg-red-900/25 border border-red-800/50 text-red-300'
                      : 'bg-[#151b2e] border border-cyan-900/30 text-gray-300'
                    : 'bg-blue-600/15 border border-blue-500/30 text-blue-100'}`}
              >
                {msg.content}
                <div className="text-gray-600 text-[9px] mt-1">
                  {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center bg-cyan-500/15 border border-cyan-500/40">
                <Bot size={12} className="text-cyan-400" />
              </div>
              <div className="bg-[#151b2e] border border-cyan-900/30 rounded-xl px-3 py-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick searches */}
        {!loading && results === null && (
          <div className="px-3 pb-2">
            <div className="text-[10px] text-gray-600 mb-1.5">Quick search:</div>
            <div className="flex flex-wrap gap-1">
              {QUICK_SEARCHES.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-900/25 border border-cyan-800/40
                             text-cyan-400 hover:bg-cyan-800/30 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-cyan-900/30">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Describe the person to search..."
              disabled={loading}
              className="flex-1 bg-[#151b2e] border border-cyan-900/40 rounded-xl px-3 py-2 text-sm text-white
                         placeholder-gray-600 focus:outline-none focus:border-cyan-500/70 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-600
                         rounded-xl transition-colors flex items-center justify-center flex-shrink-0"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </form>
      </div>

      {/* ── RIGHT: Results ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Results header bar */}
        <div className="px-6 py-3 border-b border-cyan-900/30 flex items-center gap-3 bg-[#0b0f1c] flex-shrink-0">
          <Target size={17} className="text-cyan-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-cyan-400">Target Tracking Results</span>
          {results && (
            <div className="flex items-center gap-2 text-xs text-gray-500 min-w-0">
              <span className="flex items-center gap-1 flex-shrink-0">
                <Zap size={10} className="text-cyan-600" />
                {results.latency_ms}ms
              </span>
              <span className="flex-shrink-0">·</span>
              <span className="flex-shrink-0">{results.total_matches} results</span>
              <span className="flex-shrink-0">·</span>
              <span className="truncate italic">"{results.query?.appearance_text}"</span>
            </div>
          )}
        </div>

        {/* Results body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Empty state */}
          {!results && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center select-none">
              <div className="w-24 h-24 rounded-full bg-cyan-900/15 border border-cyan-800/25
                              flex items-center justify-center mb-5">
                <Search size={40} className="text-cyan-900" />
              </div>
              <p className="text-gray-500 text-sm">Enter a description in the chat panel to start searching</p>
              <p className="text-gray-600 text-xs mt-1">English language supported</p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 size={44} className="text-cyan-400 animate-spin mb-4" />
              <p className="text-gray-400 text-sm">Searching the database...</p>
              <p className="text-gray-600 text-xs mt-1">IRRA + ReID vector similarity search</p>
            </div>
          )}

          {/* No results */}
          {results && results.total_matches === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-3">
                <X size={28} className="text-gray-600" />
              </div>
              <p className="text-gray-400 text-sm">No matching results found</p>
              <p className="text-gray-600 text-xs mt-1">
                Try a different description, or widen the time range in filters
              </p>
            </div>
          )}

          {/* Results grid */}
          {results && results.matches?.length > 0 && (
            <div className="grid gap-4"
                 style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
              {results.matches.map((person, idx) => (
                <PersonCard
                  key={person.global_person_id || `result-${idx}`}
                  person={person}
                  rank={idx + 1}
                  selected={selectedIdx === idx}
                  onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDE PANEL: Detail ── */}
      {selectedIdx !== null && results?.matches?.[selectedIdx] && (
        <PersonDetailPanel
          person={results.matches[selectedIdx]}
          onClose={() => setSelectedIdx(null)}
        />
      )}
    </div>
  );
}

export default PersonSearch;
