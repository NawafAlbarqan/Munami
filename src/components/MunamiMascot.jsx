// منمّي's mascot, drawn as an inline SVG matching the Monami identity boards:
// soft cream rounded-square head, deep-navy face screen, mint facial features,
// coral antenna ball, small side ears, and a subtle coral scarf hint on the
// shoulders. Same component API as before — `expression` maps to the same four
// moods, `size` is a MAX bounding box (the art is drawn in a square viewBox).
//
// Expressions: 'greeting' (waving hello — chat-open moments) | 'happy'
// (on track / positive / completed) | 'concerned' (mild/early warning) |
// 'unhappy' (clearly over budget / missed).

const CREAM = '#F6F0E7'
const OUTLINE = 'rgba(13, 27, 42, 0.30)'
const SCREEN = '#0D1B2A'
const MINT = '#A9E8CB'
const CORAL = '#EE7623' // Alinma orange
const SCARF = '#F5A662'

// Face features per mood, drawn inside the screen (x 15–49, y 16–42).
function Face({ expression }) {
  const stroke = { stroke: MINT, strokeWidth: 2.4, strokeLinecap: 'round', fill: 'none' }
  switch (expression) {
    case 'concerned':
      return (
        <g>
          <path d="M22 24 L28 26.5" {...stroke} strokeWidth={2} />
          <path d="M42 24 L36 26.5" {...stroke} strokeWidth={2} />
          <circle cx="25" cy="30" r="1.9" fill={MINT} />
          <circle cx="39" cy="30" r="1.9" fill={MINT} />
          <path d="M28.5 35.5 Q32 34 35.5 35.5" {...stroke} />
        </g>
      )
    case 'unhappy':
      return (
        <g>
          <path d="M21.5 23.5 L28 26.8" {...stroke} strokeWidth={2} />
          <path d="M42.5 23.5 L36 26.8" {...stroke} strokeWidth={2} />
          <circle cx="25" cy="30.5" r="1.9" fill={MINT} />
          <circle cx="39" cy="30.5" r="1.9" fill={MINT} />
          <path d="M27.5 36.5 Q32 32.5 36.5 36.5" {...stroke} />
        </g>
      )
    // greeting + happy share the same warm face (greeting adds a waving hand
    // outside the screen, added in the main component below).
    default:
      return (
        <g>
          <path d="M21.5 27.5 Q25 23.5 28.5 27.5" {...stroke} />
          <path d="M35.5 27.5 Q39 23.5 42.5 27.5" {...stroke} />
          <path d="M26.5 32.5 Q32 38 37.5 32.5" {...stroke} />
        </g>
      )
  }
}

export default function MunamiMascot({ expression = 'happy', size = 52, className = '' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      style={{ width: size, height: size, display: 'block' }}
    >
      {/* antenna */}
      <rect x="31" y="5" width="2" height="6" rx="1" fill={OUTLINE} />
      <circle cx="32" cy="5" r="3.4" fill={CORAL} />

      {/* side ears */}
      <rect x="5.5" y="25" width="5" height="13" rx="2.5" fill={CREAM} stroke={OUTLINE} strokeWidth="1.4" />
      <rect x="53.5" y="25" width="5" height="13" rx="2.5" fill={CREAM} stroke={OUTLINE} strokeWidth="1.4" />

      {/* head */}
      <rect x="9.5" y="10" width="45" height="42" rx="14" fill={CREAM} stroke={OUTLINE} strokeWidth="1.6" />

      {/* face screen */}
      <rect x="15" y="16" width="34" height="26" rx="9" fill={SCREEN} />
      <Face expression={expression} />

      {/* shoulders + scarf hint */}
      <path d="M18 63 L18 58 Q18 53 24 53 L40 53 Q46 53 46 58 L46 63 Z" fill={CREAM} stroke={OUTLINE} strokeWidth="1.4" />
      <path d="M19.5 54.5 L32 60 L44.5 54.5" fill="none" stroke={SCARF} strokeWidth="2.6" strokeLinecap="round" />

      {/* waving hand — greeting only */}
      {expression === 'greeting' && (
        <g transform="rotate(18 58 21)">
          <rect x="55" y="15" width="7" height="11" rx="3.5" fill={CREAM} stroke={OUTLINE} strokeWidth="1.4" />
        </g>
      )}
    </svg>
  )
}
