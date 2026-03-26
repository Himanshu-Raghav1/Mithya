import { useState } from 'react';
import { motion } from 'framer-motion';
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
  { id: 'quicklinks', label: 'Quick Links', emoji: '🔗' },
  { id: 'events', label: 'Concerts & Events', emoji: '🎵' },
  { id: 'contacts', label: 'Contacts', emoji: '📞' },
  { id: 'lostfound', label: 'Lost & Found', emoji: '🔍' },
  { id: 'pyqs', label: 'PYQs & Notes', emoji: '📚' },
  { id: 'admin', label: 'Admin Portal', emoji: '🔒' }
];

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth]     = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  return (
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

      {/* Tab scroll bar */}
      <div className="flex overflow-x-auto tab-scroll px-2 pb-2 gap-1">
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
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-active"
                className="absolute inset-0 rounded-xl"
                style={{ zIndex: -1 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </nav>
  );
}
