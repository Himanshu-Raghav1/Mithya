import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, WifiOff, Clock, Users, RefreshCw, Wifi, ExternalLink } from 'lucide-react';
import { searchSportsSlots } from '../services/api';
import type { SlotResult } from '../types';

/** Converts "17:00:00" → "5:00 PM" */
function formatTime(t: string): string {
  try {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  } catch {
    return t;
  }
}

/** Groups slots by display_name, sorted by start_time */
function groupAndSort(slots: SlotResult[]): Record<string, SlotResult[]> {
  const sorted = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time));
  const groups: Record<string, SlotResult[]> = {};
  for (const slot of sorted) {
    const key = slot.display_name;
    if (!groups[key]) groups[key] = [];
    groups[key].push(slot);
  }
  return groups;
}

const SkeletonSlotGroup = () => (
  <div className="glass-card overflow-hidden animate-pulse mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
    <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'rgba(0,168,232,0.1)' }}>
      <div className="w-6 h-6 rounded bg-white/10" />
      <div className="w-32 h-4 rounded bg-white/10" />
    </div>
    <div className="divide-y divide-white/5">
      {[1, 2].map(i => (
        <div key={i} className="px-4 py-4 flex items-center justify-between">
          <div className="w-24 h-4 rounded bg-white/10" />
          <div className="w-20 h-5 rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  </div>
);

export default function LiveSportsSlots() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SlotResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setResults([]);
    setMessage(null);
    setLastUpdated(null);

    const res = await searchSportsSlots(query);
    setLoading(false);

    if (res.success && res.data && res.data.length > 0) {
      setResults(res.data);
      // Show last_updated from first result if available
      if (res.data[0].last_updated) {
        setLastUpdated(res.data[0].last_updated);
      }
    } else {
      setMessage(res.message ?? `No open slots found for "${query}" right now.`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const grouped = groupAndSort(results);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="glass-card p-4" style={{ background: 'rgba(0,168,232,0.15)' }}>
        <div className="flex items-center gap-3">
          <span className="text-4xl">🏆</span>
          <div>
            <h2 className="text-xl font-black text-white">Live Sports Slots</h2>
            <p className="text-blue-200 text-sm">
              Real-time slots from MIT Sports Portal · Only future slots shown
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4 flex gap-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Chess, Pool, Badminton, Table Tennis..."
            className="w-full pl-10 pr-4 py-3 rounded-xl font-semibold text-white placeholder-white/40 outline-none"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1.5px solid rgba(255,255,255,0.2)',
            }}
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-5 py-3 rounded-xl font-black text-white flex items-center gap-2 cursor-pointer disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #00A8E8, #0077B6)' }}
        >
          {loading
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <Search className="w-5 h-5" />}
          <span className="hidden sm:inline">{loading ? 'Searching...' : 'Search'}</span>
        </motion.button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-4 space-y-4">
          <SkeletonSlotGroup />
          <SkeletonSlotGroup />
        </div>
      )}

      {/* Error / No results */}
      {!loading && searched && message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 text-center shadow-lg"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <WifiOff className="w-12 h-12 text-white/50 mx-auto mb-3" />
          <p className="text-white font-bold text-lg">{message}</p>
          <p className="text-white/60 text-sm mt-2 mb-5">
            You might still find slots directly on the official portal.
          </p>
          
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://sports.mitwpu.edu.in/login"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-white shadow-lg shadow-white/5"
            style={{ background: 'linear-gradient(135deg, #FF6B6B, #E53935)' }}
          >
            <span>Check Official Website</span>
            <ExternalLink className="w-5 h-5" />
          </motion.a>
        </motion.div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(76,175,80,0.2)' }}>
                <Wifi className="w-4 h-4 text-green-400" />
                <p className="text-green-300 font-bold text-sm">
                  {results.length} slot(s) · {Object.keys(grouped).length} table(s)
                </p>
              </div>
              {lastUpdated && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 text-xs" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <RefreshCw className="w-3 h-3" />
                  <span>Updated: {lastUpdated}</span>
                </div>
              )}
            </div>
            
            <motion.a 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://sports.mitwpu.edu.in/login" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF6B6B, #E53935)' }}
            >
              <span>Book Slot Now</span>
              <ExternalLink className="w-4 h-4" />
            </motion.a>
          </div>

          {/* Grouped by table name */}
          {Object.entries(grouped).map(([tableName, slots], gi) => (
            <motion.div
              key={tableName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.06 }}
              className="glass-card overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              {/* Table header */}
              <div
                className="px-4 py-3 flex items-center gap-2"
                style={{ background: 'rgba(0,168,232,0.15)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
              >
                <span className="text-lg">🎮</span>
                <h3 className="text-white font-black text-base">{tableName}</h3>
              </div>

              {/* Slots list */}
              <div className="divide-y divide-white/5">
                {slots.map((slot, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: gi * 0.06 + i * 0.05 }}
                    className="px-4 py-3 flex items-center justify-between gap-3"
                  >
                    {/* Time */}
                    <div className="flex items-center gap-2 text-white/80">
                      <Clock className="w-4 h-4 text-blue-300 flex-shrink-0" />
                      <span className="font-bold text-sm">
                        {formatTime(slot.start_time)}
                        <span className="text-white/40 mx-1">→</span>
                        {formatTime(slot.end_time)}
                      </span>
                    </div>

                    {/* Seats badge */}
                    <span
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-black flex-shrink-0"
                      style={{
                        background: slot.seats_open > 0
                          ? 'rgba(76,175,80,0.25)' : 'rgba(229,57,53,0.25)',
                        color: slot.seats_open > 0 ? '#81C784' : '#EF9A9A',
                        border: `1px solid ${slot.seats_open > 0
                          ? 'rgba(76,175,80,0.4)' : 'rgba(229,57,53,0.4)'}`,
                      }}
                    >
                      <Users className="w-3 h-3" />
                      {slot.seats_open > 0
                        ? `${slot.seats_open} seat${slot.seats_open > 1 ? 's' : ''} open`
                        : 'Full'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!searched && (
        <div className="text-center py-12 text-white/40">
          <span className="text-5xl">🎮</span>
          <p className="mt-3 font-semibold">Search for a sport to see live open slots</p>
          <p className="text-xs mt-1">Data is fetched live from the MIT Sports Portal via MongoDB</p>
        </div>
      )}
    </div>
  );
}
