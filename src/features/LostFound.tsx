import { motion } from 'framer-motion';

export default function LostFound() {
  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-64 space-y-6">
      <div className="glass-card p-8 max-w-sm w-full text-center space-y-4" style={{ background: 'rgba(0,168,232,0.1)' }}>
        {/* Searching Doraemon */}
        <div className="float-anim">
          <svg viewBox="0 0 140 140" className="w-36 h-36 mx-auto">
            {/* Body */}
            <ellipse cx="70" cy="105" rx="48" ry="28" fill="#00A8E8" />
            {/* Head */}
            <circle cx="70" cy="58" r="46" fill="#00A8E8" />
            {/* Face */}
            <ellipse cx="70" cy="66" rx="34" ry="28" fill="white" />
            {/* Eyes */}
            <circle cx="57" cy="52" r="9" fill="white" />
            <circle cx="83" cy="52" r="9" fill="white" />
            <circle cx="59" cy="54" r="5" fill="#1a1a2e" />
            <circle cx="85" cy="54" r="5" fill="#1a1a2e" />
            <circle cx="61" cy="52" r="2" fill="white" />
            <circle cx="87" cy="52" r="2" fill="white" />
            {/* Nose */}
            <circle cx="70" cy="64" r="6" fill="#E53935" />
            {/* Searching expression - one eye looking sideways */}
            <path d="M 52 74 Q 70 86 88 74" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Whiskers */}
            <line x1="32" y1="66" x2="54" y2="70" stroke="#1a1a2e" strokeWidth="1.5" />
            <line x1="32" y1="74" x2="54" y2="74" stroke="#1a1a2e" strokeWidth="1.5" />
            <line x1="86" y1="70" x2="108" y2="66" stroke="#1a1a2e" strokeWidth="1.5" />
            <line x1="86" y1="74" x2="108" y2="74" stroke="#1a1a2e" strokeWidth="1.5" />
            {/* Collar */}
            <rect x="36" y="100" width="68" height="8" rx="4" fill="#E53935" />
            <circle cx="70" cy="104" r="5" fill="#FFD740" />
            {/* Pocket */}
            <ellipse cx="70" cy="115" rx="22" ry="14" fill="white" stroke="#00A8E8" strokeWidth="2.5" />
            {/* Magnifying glass (gadget!) */}
            <circle cx="104" cy="90" r="14" fill="none" stroke="#FFD740" strokeWidth="3" />
            <circle cx="104" cy="90" r="9" fill="rgba(255,215,64,0.15)" />
            <line x1="114" y1="100" x2="124" y2="110" stroke="#FFD740" strokeWidth="3" strokeLinecap="round" />
            {/* Arm holding magnifyng glass */}
            <path d="M 90 105 Q 96 92 104 78" stroke="#00A8E8" strokeWidth="6" fill="none" strokeLinecap="round" />
            {/* Ears */}
            <circle cx="30" cy="34" r="12" fill="#00A8E8" />
            <circle cx="110" cy="34" r="12" fill="#00A8E8" />
            {/* Question marks around */}
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">Lost & Found</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-yellow-300 text-lg font-black">🔍 Coming Soon</span>
          </div>
          <p className="text-white/60 text-sm mt-3 leading-relaxed">
            Doraemon is deploying his <span className="text-yellow-300 font-bold">Small Light Gadget</span> to locate your lost items!<br />
            This feature is being built and will be available very soon.
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{ background: '#00A8E8' }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
      </div>

      <p className="text-white/30 text-xs">Feature under active development 🚧</p>
    </div>
  );
}
