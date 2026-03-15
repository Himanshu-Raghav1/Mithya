import { motion } from 'framer-motion';

export default function PYQsNotes() {
  const floatingBooks = ['📖', '📝', '✏️', '🎯', '💡', '⭐'];

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-64 space-y-6">
      <div className="glass-card p-8 max-w-sm w-full text-center space-y-4 relative overflow-hidden" style={{ background: 'rgba(255,215,64,0.08)' }}>
        {/* Floating emoji decorations */}
        {floatingBooks.map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-xl pointer-events-none select-none opacity-30"
            style={{
              top: `${15 + (i * 12) % 70}%`,
              left: i % 2 === 0 ? `${5 + i * 3}%` : `${75 - i * 3}%`,
            }}
            animate={{ y: [-8, 8, -8], rotate: [-5, 5, -5] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {emoji}
          </motion.div>
        ))}

        {/* Doraemon reading SVG */}
        <div className="float-anim">
          <svg viewBox="0 0 150 160" className="w-40 h-40 mx-auto">
            {/* Open book */}
            <rect x="20" y="115" width="110" height="35" rx="6" fill="#FFD740" />
            <line x1="75" y1="115" x2="75" y2="150" stroke="#E65100" strokeWidth="2.5" />
            <line x1="32" y1="123" x2="68" y2="123" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
            <line x1="32" y1="130" x2="68" y2="130" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
            <line x1="32" y1="137" x2="68" y2="137" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
            <line x1="82" y1="123" x2="118" y2="123" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
            <line x1="82" y1="130" x2="118" y2="130" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
            <line x1="82" y1="137" x2="118" y2="137" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
            {/* Body */}
            <ellipse cx="75" cy="105" rx="44" ry="22" fill="#00A8E8" />
            {/* Head */}
            <circle cx="75" cy="60" r="44" fill="#00A8E8" />
            {/* Face */}
            <ellipse cx="75" cy="68" rx="32" ry="26" fill="white" />
            {/* Eyes — looking down at book */}
            <ellipse cx="62" cy="59" rx="8" ry="7" fill="white" />
            <ellipse cx="88" cy="59" rx="8" ry="7" fill="white" />
            <ellipse cx="62" cy="62" rx="5" ry="4" fill="#1a1a2e" />
            <ellipse cx="88" cy="62" rx="5" ry="4" fill="#1a1a2e" />
            <circle cx="64" cy="60" r="1.8" fill="white" />
            <circle cx="90" cy="60" r="1.8" fill="white" />
            {/* Nose */}
            <circle cx="75" cy="70" r="6" fill="#E53935" />
            {/* Smile */}
            <path d="M 58 80 Q 75 92 92 80" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Whiskers */}
            <line x1="34" y1="72" x2="58" y2="75" stroke="#1a1a2e" strokeWidth="1.5" />
            <line x1="34" y1="80" x2="58" y2="80" stroke="#1a1a2e" strokeWidth="1.5" />
            <line x1="92" y1="75" x2="116" y2="72" stroke="#1a1a2e" strokeWidth="1.5" />
            <line x1="92" y1="80" x2="116" y2="80" stroke="#1a1a2e" strokeWidth="1.5" />
            {/* Collar */}
            <rect x="44" y="101" width="62" height="7" rx="3.5" fill="#E53935" />
            <circle cx="75" cy="104.5" r="4.5" fill="#FFD740" />
            {/* Pocket */}
            <ellipse cx="75" cy="115" rx="20" ry="12" fill="white" stroke="#00A8E8" strokeWidth="2" />
            {/* Ears */}
            <circle cx="36" cy="33" r="12" fill="#00A8E8" />
            <circle cx="114" cy="33" r="12" fill="#00A8E8" />
            {/* Arms holding book */}
            <path d="M 32 100 Q 26 115 30 130" stroke="#00A8E8" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M 118 100 Q 124 115 120 130" stroke="#00A8E8" strokeWidth="8" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">PYQs & Notes</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-yellow-300 text-lg font-black">📚 Coming Soon</span>
          </div>
          <p className="text-white/60 text-sm mt-3 leading-relaxed">
            Doraemon is filling up his <span className="text-yellow-300 font-bold">Fourth Dimensional Pocket</span> with past year questions and subject notes!<br />
            Hang tight — your study materials are on the way.
          </p>
        </div>

        {/* Progress bar teaser */}
        <div>
          <div className="flex justify-between text-xs text-white/40 mb-1">
            <span>Loading Doraemon's pocket...</span>
            <span>42%</span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <motion.div
              className="h-2 rounded-full"
              style={{ background: 'linear-gradient(90deg, #FFD740, #00A8E8)' }}
              initial={{ width: '0%' }}
              animate={{ width: '42%' }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </div>
      </div>

      <p className="text-white/30 text-xs">Feature under active development 🚧</p>
    </div>
  );
}
