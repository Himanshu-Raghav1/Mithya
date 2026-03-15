/**
 * CartoonBackground — Doraemon-palette SVG background
 * Pure CSS + SVG, no external images. Playful & non-generic.
 */
export default function CartoonBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: 'linear-gradient(160deg, #001a3d 0%, #003366 40%, #005580 70%, #0077B6 100%)' }}>
      {/* Large blurred orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-72 h-72 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #00A8E8, transparent 70%)' }} />
      <div className="absolute top-[30%] right-[-8%] w-80 h-80 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #4FC3F7, transparent 70%)' }} />
      <div className="absolute bottom-[-5%] left-[20%] w-96 h-60 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #FFD740, transparent 70%)' }} />

      {/* SVG scene */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stars */}
        {[
          [30, 40], [80, 120], [150, 30], [260, 80], [340, 50],
          [60, 300], [310, 200], [180, 180], [350, 350], [20, 500],
          [370, 600], [120, 700], [280, 740], [50, 780], [330, 800],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 3 : 1.5} fill="white" opacity={0.4 + (i % 4) * 0.1} />
        ))}

        {/* Bigger sparkle stars */}
        {[[200, 60], [120, 250], [320, 420], [70, 620]].map(([cx, cy], i) => (
          <g key={`sparkle-${i}`} transform={`translate(${cx}, ${cy})`} opacity="0.6">
            <line x1="0" y1="-7" x2="0" y2="7" stroke="#FFD740" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="-7" y1="0" x2="7" y2="0" stroke="#FFD740" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        ))}

        {/* Clouds */}
        <g opacity="0.15" className="cloud-anim">
          <ellipse cx="180" cy="90" rx="60" ry="22" fill="white" />
          <ellipse cx="155" cy="80" rx="35" ry="22" fill="white" />
          <ellipse cx="210" cy="78" rx="30" ry="20" fill="white" />
        </g>
        <g opacity="0.10" style={{ animation: 'cloud-drift 9s ease-in-out infinite reverse' }}>
          <ellipse cx="320" cy="200" rx="50" ry="18" fill="white" />
          <ellipse cx="300" cy="192" rx="28" ry="18" fill="white" />
          <ellipse cx="345" cy="190" rx="25" ry="16" fill="white" />
        </g>
        <g opacity="0.08" className="cloud-anim" style={{ animationDelay: '3s' }}>
          <ellipse cx="70" cy="400" rx="45" ry="16" fill="white" />
          <ellipse cx="52" cy="393" rx="25" ry="16" fill="white" />
          <ellipse cx="92" cy="391" rx="22" ry="14" fill="white" />
        </g>

        {/* Doraemon pocket outline watermark bottom-right */}
        <g transform="translate(280, 680)" opacity="0.06">
          <circle cx="0" cy="0" r="60" fill="none" stroke="#00A8E8" strokeWidth="3" />
          <ellipse cx="0" cy="30" rx="40" ry="25" fill="none" stroke="#00A8E8" strokeWidth="2" />
        </g>

        {/* Floating stars bottom-left */}
        <g transform="translate(40, 720)" opacity="0.12">
          <polygon points="0,-15 4,-5 14,-5 6,2 10,12 0,6 -10,12 -6,2 -14,-5 -4,-5" fill="#FFD740" />
        </g>
        <g transform="translate(360, 130)" opacity="0.12">
          <polygon points="0,-12 3,-4 12,-4 5,1 8,10 0,5 -8,10 -5,1 -12,-4 -3,-4" fill="#FFD740" />
        </g>

        {/* Bottom ground blob */}
        <ellipse cx="195" cy="870" rx="250" ry="80" fill="rgba(0,168,232,0.08)" />

        {/* Tiny dot pattern */}
        {Array.from({ length: 12 }).map((_, i) =>
          Array.from({ length: 6 }).map((_, j) => (
            <circle
              key={`dot-${i}-${j}`}
              cx={20 + i * 32}
              cy={180 + j * 60}
              r="1"
              fill="white"
              opacity="0.06"
            />
          ))
        )}
      </svg>
    </div>
  );
}
