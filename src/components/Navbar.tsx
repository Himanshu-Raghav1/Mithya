import { motion } from 'framer-motion';
import type { TabId } from '../types';

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
];

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
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
          <span className="text-2xl">🌀</span>
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
        <div className="text-white/60 text-xs font-semibold hidden sm:block">
          MIT's Unofficial Hub ✦
        </div>
      </div>

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
