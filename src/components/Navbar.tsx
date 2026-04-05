import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { TabId } from '../types';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; emoji: string }[] = [
  { id: 'sports', label: 'Live Sports', emoji: '🏆' },
  { id: 'voice', label: 'MITVoice', emoji: '🎙️' },
  { id: 'pyqs', label: 'PYQs & Notes', emoji: '📚' },
  { id: 'lostfound', label: 'Lost & Found', emoji: '🔍' },
  { id: 'personalized', label: 'Private Space', emoji: '🔐' },
  { id: 'events', label: 'Concerts & Events', emoji: '🎵' },
  { id: 'pinboard', label: 'Pin Board', emoji: '📌' },
  { id: 'contacts', label: 'Contacts', emoji: '📞' },
  { id: 'quicklinks', label: 'Quick Links', emoji: '🔗' },
  { id: 'admin', label: 'Admin Portal', emoji: '🔒' }
];

// Bottom bar shows only the 5 most-used tabs on mobile
const bottomTabs: { id: TabId; label: string; emoji: string }[] = [
  { id: 'sports',      label: 'Sports',  emoji: '🏆' },
  { id: 'voice',       label: 'Voice',   emoji: '🎙️' },
  { id: 'pyqs',        label: 'PYQs',    emoji: '📚' },
  { id: 'lostfound',   label: 'Lost',    emoji: '🔍' },
  { id: 'personalized',label: 'Private', emoji: '🔐' },
];

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth]     = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

  // Tabs that go into the More drawer
  const moreTabs = tabs.filter(t => !bottomTabs.find(b => b.id === t.id));

  return (
    <>
      {/* ── TOP NAV BAR (visible on all screens) ─────────────── */}
      <nav
        className="sticky top-0 z-40 w-full"
        style={{
          background: 'rgba(0, 60, 120, 0.45)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Mithya Logo"
              className="w-9 h-9 rounded-full object-cover"
              onError={(e) => { e.currentTarget.style.display='none'; }}
            />
            <h1
              className="text-2xl font-black tracking-widest"
              style={{
                background: 'linear-gradient(135deg, #FFD740 0%, #ffffff 50%, #4FC3F7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
              }}
            >
              MITHYA
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!user ? (
              <button
                onClick={() => setShowAuth(true)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-black text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/20 transition-colors"
              >
                Login
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowLogout(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-white text-[11px] font-black"
                >
                  <span className="text-yellow-300">@</span>{user.anon_name}
                </button>
                {showLogout && (
                  <div className="absolute right-0 top-10 bg-[#0d1333] border border-white/15 rounded-xl p-2 z-50 w-40 shadow-xl">
                    <p className="text-white/30 text-[10px] px-2 pb-1 truncate">{user.email}</p>
                    <button
                      onClick={() => { logout(); setShowLogout(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

        {/* Tab scroll bar — hidden on mobile (bottom bar takes over) */}
        <div className="hidden sm:flex overflow-x-auto tab-scroll px-2 pb-2 gap-1">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer"
              style={{
                color: activeTab === tab.id ? '#1a1a2e' : 'rgba(255,255,255,0.75)',
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, #FFD740, #FF9800)'
                  : 'rgba(255,255,255,0.08)',
                border: activeTab === tab.id
                  ? '1px solid rgba(255,215,64,0.5)'
                  : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span>{tab.emoji}</span>
              <span className="whitespace-nowrap">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Mobile: show only active tab name as breadcrumb */}
        <div className="sm:hidden flex items-center px-4 pb-2">
          <span className="text-white/50 text-xs font-bold">
            {tabs.find(t => t.id === activeTab)?.emoji}{' '}
            {tabs.find(t => t.id === activeTab)?.label}
          </span>
        </div>
      </nav>

      {/* ── BOTTOM TAB BAR — mobile only ─────────────────────── */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(5, 15, 50, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center justify-around px-2 py-1">
          {bottomTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileTap={{ scale: 0.88 }}
                className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-2xl flex-1 transition-all"
                style={{
                  background: isActive ? 'rgba(255,215,64,0.15)' : 'transparent',
                  minHeight: '56px',
                }}
              >
                <span style={{ fontSize: '22px', lineHeight: 1 }}>{tab.emoji}</span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    letterSpacing: '0.03em',
                    color: isActive ? '#FFD740' : 'rgba(255,255,255,0.45)',
                  }}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="bottom-tab-indicator"
                    style={{
                      width: '20px', height: '3px', borderRadius: '2px',
                      background: 'linear-gradient(90deg, #FFD740, #FF9800)',
                      marginTop: '2px',
                    }}
                  />
                )}
              </motion.button>
            );
          })}

          {/* "More" button for the remaining tabs */}
          <div className="relative flex-1">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setShowMoreDrawer(true)}
              className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-2xl w-full"
              style={{
                background: !bottomTabs.find(b => b.id === activeTab) ? 'rgba(255,215,64,0.15)' : 'transparent',
                minHeight: '56px',
              }}
            >
              <span style={{ fontSize: '22px', lineHeight: 1 }}>
                {!bottomTabs.find(b => b.id === activeTab)
                  ? tabs.find(t => t.id === activeTab)?.emoji || '⋯'
                  : '⋯'}
              </span>
              <span style={{
                fontSize: '9px', fontWeight: 800, letterSpacing: '0.03em',
                color: !bottomTabs.find(b => b.id === activeTab) ? '#FFD740' : 'rgba(255,255,255,0.45)',
              }}>
                {!bottomTabs.find(b => b.id === activeTab)
                  ? tabs.find(t => t.id === activeTab)?.label?.slice(0, 6) || 'More'
                  : 'More'}
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile "More" Drawer bottom sheet */}
      <AnimatePresence>
        {showMoreDrawer && (
          <div className="sm:hidden fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
               onClick={() => setShowMoreDrawer(false)}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full bg-[#0d1333] border-t border-white/20 rounded-t-3xl overflow-hidden pb-[env(safe-area-inset-bottom)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
                <h3 className="text-white font-black text-lg">More Options</h3>
                <button
                  onClick={() => setShowMoreDrawer(false)}
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3 pb-8">
                {moreTabs.map(tab => (
                  <motion.button
                    key={tab.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onTabChange(tab.id);
                      setShowMoreDrawer(false);
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-500/20 border-blue-400 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-3xl">{tab.emoji}</span>
                    <span className="font-bold text-sm">{tab.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom padding so content is not hidden behind bottom bar on mobile */}
      <style>{`
        @media (max-width: 640px) {
          #root > div { padding-bottom: 72px; }
        }
      `}</style>
    </>
  );
}
