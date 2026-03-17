import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeFlowProps {
  onComplete: () => void;
}

// Doraemon SVG Avatar
function DoraemonAvatar() {
  return (
    <svg viewBox="0 0 120 130" className="w-32 h-32 mx-auto drop-shadow-2xl">
      {/* Body */}
      <ellipse cx="60" cy="95" rx="42" ry="30" fill="#00A8E8" />
      {/* Head */}
      <circle cx="60" cy="52" r="45" fill="#00A8E8" />
      {/* Face white area */}
      <ellipse cx="60" cy="60" rx="32" ry="26" fill="white" />
      {/* Eyes */}
      <circle cx="48" cy="46" r="9" fill="white" />
      <circle cx="72" cy="46" r="9" fill="white" />
      <circle cx="50" cy="48" r="5" fill="#1a1a2e" />
      <circle cx="74" cy="48" r="5" fill="#1a1a2e" />
      {/* Eye shine */}
      <circle cx="52" cy="46" r="2" fill="white" />
      <circle cx="76" cy="46" r="2" fill="white" />
      {/* Nose */}
      <circle cx="60" cy="58" r="6" fill="#E53935" />
      {/* Mouth */}
      <path d="M 42 68 Q 60 80 78 68" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Whiskers */}
      <line x1="28" y1="60" x2="48" y2="63" stroke="#1a1a2e" strokeWidth="1.5" />
      <line x1="28" y1="67" x2="48" y2="67" stroke="#1a1a2e" strokeWidth="1.5" />
      <line x1="28" y1="74" x2="48" y2="71" stroke="#1a1a2e" strokeWidth="1.5" />
      <line x1="72" y1="63" x2="92" y2="60" stroke="#1a1a2e" strokeWidth="1.5" />
      <line x1="72" y1="67" x2="92" y2="67" stroke="#1a1a2e" strokeWidth="1.5" />
      <line x1="72" y1="71" x2="92" y2="74" stroke="#1a1a2e" strokeWidth="1.5" />
      {/* Collar */}
      <rect x="30" y="93" width="60" height="8" rx="4" fill="#E53935" />
      <circle cx="60" cy="97" r="5" fill="#FFD740" />
      {/* Pocket */}
      <ellipse cx="60" cy="105" rx="20" ry="12" fill="white" stroke="#00A8E8" strokeWidth="2" />
      {/* Ears */}
      <circle cx="22" cy="28" r="12" fill="#00A8E8" />
      <circle cx="98" cy="28" r="12" fill="#00A8E8" />
    </svg>
  );
}

// Nobita SVG Avatar
function NobitaAvatar() {
  return (
    <svg viewBox="0 0 120 140" className="w-32 h-32 mx-auto drop-shadow-2xl">
      {/* Hair */}
      <ellipse cx="60" cy="30" rx="36" ry="20" fill="#2d1b05" />
      {/* Head */}
      <circle cx="60" cy="50" r="34" fill="#F5CBA7" />
      {/* Glasses frame */}
      <rect x="32" y="44" width="20" height="14" rx="4" fill="none" stroke="#2d1b05" strokeWidth="2.5" />
      <rect x="68" y="44" width="20" height="14" rx="4" fill="none" stroke="#2d1b05" strokeWidth="2.5" />
      <line x1="52" y1="51" x2="68" y2="51" stroke="#2d1b05" strokeWidth="2" />
      {/* Eyes */}
      <circle cx="42" cy="51" r="5" fill="#1a1a2e" />
      <circle cx="78" cy="51" r="5" fill="#1a1a2e" />
      <circle cx="44" cy="49" r="2" fill="white" />
      <circle cx="80" cy="49" r="2" fill="white" />
      {/* Nose */}
      <ellipse cx="60" cy="60" rx="4" ry="3" fill="#d4956a" />
      {/* Smile */}
      <path d="M 45 68 Q 60 78 75 68" stroke="#c0392b" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Ears */}
      <ellipse cx="26" cy="50" rx="8" ry="10" fill="#F5CBA7" />
      <ellipse cx="94" cy="50" rx="8" ry="10" fill="#F5CBA7" />
      {/* Body - shirt */}
      <rect x="28" y="82" width="64" height="50" rx="12" fill="#2c82c9" />
      {/* Collar */}
      <path d="M 42 82 L 60 100 L 78 82" fill="white" />
      {/* Shorts */}
      <rect x="32" y="118" width="24" height="22" rx="6" fill="#1a1a2e" />
      <rect x="64" y="118" width="24" height="22" rx="6" fill="#1a1a2e" />
    </svg>
  );
}

const springBounce = {
  initial: { scale: 0, opacity: 0, y: 60 },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 20 }
  },
  exit: { scale: 0, opacity: 0, y: -40, transition: { duration: 0.3 } }
};

export default function WelcomeFlow({ onComplete }: WelcomeFlowProps) {
  const [stage, setStage] = useState<1 | 2>(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <AnimatePresence mode="wait">
        {stage === 1 && (
          <motion.div
            key="stage1"
            variants={springBounce}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative glass-card p-8 max-w-sm w-full text-center shadow-2xl"
            style={{ background: 'rgba(0, 168, 232, 0.18)', border: '1.5px solid rgba(255,255,255,0.35)' }}
          >
            {/* Stars decoration */}
            <div className="absolute -top-4 -right-4 text-3xl wobble-anim">⭐</div>
            <div className="absolute -top-2 -left-6 text-2xl float-anim" style={{ animationDelay: '1s' }}>✨</div>

            {/* Mithya Logo */}
            <div className="flex justify-center mb-2">
              <img
                src="/logo.png"
                alt="Mithya"
                className="w-16 h-16 rounded-full object-cover shadow-lg ring-2 ring-white/30"
              />
            </div>

            <div className="float-anim">
              <DoraemonAvatar />
            </div>

            <h2 className="text-2xl font-black text-white mt-4 drop-shadow-md leading-snug">
              Welcome to the <span className="text-yellow-300">unofficial</span><br />group of MIT! 🎉
            </h2>
            <p className="text-blue-100 text-sm mt-2 font-medium">
              Your one-stop campus companion — built by students, for students.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStage(2)}
              className="mt-6 w-full py-3 rounded-2xl font-black text-white text-lg shadow-lg cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #FFD740, #FF9800)' }}
            >
              Next →
            </motion.button>
          </motion.div>
        )}

        {stage === 2 && (
          <motion.div
            key="stage2"
            variants={springBounce}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative glass-card p-8 max-w-sm w-full text-center shadow-2xl"
            style={{ background: 'rgba(255, 215, 64, 0.15)', border: '1.5px solid rgba(255,255,255,0.35)' }}
          >
            <div className="absolute -top-4 -left-4 text-3xl float-anim">🌟</div>
            <div className="absolute top-2 -right-4 text-2xl wobble-anim" style={{ animationDelay: '0.5s' }}>💫</div>

            <div className="float-anim">
              <NobitaAvatar />
            </div>

            {/* Mithya branding */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <img src="/logo.png" alt="Mithya" className="w-8 h-8 rounded-full object-cover" />
              <span className="text-white font-black text-lg tracking-widest" style={{ letterSpacing: '0.15em' }}>MITHYA</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-3 drop-shadow-md leading-snug">
              Hey there! 👋
            </h2>
            <p className="text-yellow-100 text-base mt-3 font-semibold leading-relaxed">
              "This app is for the <span className="text-yellow-300">student</span>, from the <span className="text-yellow-300">student</span>, and to the <span className="text-yellow-300">student</span>. Explore it!"
            </p>
            <p className="text-white/60 text-xs mt-2">— Nobita, probably</p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onComplete}
              className="mt-6 w-full py-3 rounded-2xl font-black text-white text-lg shadow-lg cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #00A8E8, #0077B6)' }}
            >
              Enter Mithya 🚀
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
