// منمّي mascot — a friendly sprout creature that reacts to the user's finances.
// Expressions: 'happy' (default) | 'concerned' (overspending) | 'celebrating' (on track)
export default function MunamiMascot({ expression = 'happy', size = 52, className = '' }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.1)}
      viewBox="0 0 52 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Leaf stalk — thick dark linework */}
      <path d="M26 8V15" stroke="#0E1F14" strokeWidth="3" strokeLinecap="round" />
      {/* Left leaf — vivid green with dark outline */}
      <path d="M26 13C26 13 21 11 19 7C22 6 26 9 26 13Z" fill="#2FBF71" stroke="#0E1F14" strokeWidth="1.4" strokeLinejoin="round" />
      {/* Right leaf — slightly higher, deeper green */}
      <path d="M26 11C26 11 31 8 33 4C30 3 27 6 26 11Z" fill="#178A4C" stroke="#0E1F14" strokeWidth="1.4" strokeLinejoin="round" />

      {/* Face circle — bold black outline (retro sticker) */}
      <circle cx="26" cy="35" r="21" fill="#FFFDF8" stroke="#000000" strokeWidth="3" />

      {/* Celebrating sparkles — appear before eyes so they don't overlap */}
      {expression === 'celebrating' && (
        <>
          <line x1="5"  y1="20" x2="9"  y2="24" stroke="#C87E1A" strokeWidth="2" strokeLinecap="round" />
          <line x1="3"  y1="28" x2="8"  y2="28" stroke="#4BAF73" strokeWidth="2" strokeLinecap="round" />
          <line x1="47" y1="20" x2="43" y2="24" stroke="#C87E1A" strokeWidth="2" strokeLinecap="round" />
          <line x1="49" y1="28" x2="44" y2="28" stroke="#4BAF73" strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {/* Eyes */}
      {expression === 'concerned' ? (
        <>
          {/* Slightly worried eyes with inner brow */}
          <circle cx="20" cy="32" r="2.5" fill="#1A2B1F" />
          <circle cx="32" cy="32" r="2.5" fill="#1A2B1F" />
          <circle cx="21" cy="31" r="1"   fill="white" />
          <circle cx="33" cy="31" r="1"   fill="white" />
          {/* Worry brow — angles inward */}
          <path d="M17 27.5Q20 29.5 23 27.5" stroke="#1A2B1F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M29 27.5Q32 29.5 35 27.5" stroke="#1A2B1F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </>
      ) : expression === 'celebrating' ? (
        <>
          {/* Squinting-with-joy eyes — arc shape */}
          <path d="M17.5 32Q20 29 22.5 32" stroke="#1A2B1F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M29.5 32Q32 29 34.5 32" stroke="#1A2B1F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          {/* Cheek blush */}
          <ellipse cx="15.5" cy="37" rx="4"   ry="2.5" fill="#FFB3A7" opacity="0.55" />
          <ellipse cx="36.5" cy="37" rx="4"   ry="2.5" fill="#FFB3A7" opacity="0.55" />
        </>
      ) : (
        <>
          {/* Normal happy eyes */}
          <circle cx="20" cy="32" r="2.5" fill="#1A2B1F" />
          <circle cx="32" cy="32" r="2.5" fill="#1A2B1F" />
          <circle cx="21" cy="31" r="1"   fill="white" />
          <circle cx="33" cy="31" r="1"   fill="white" />
        </>
      )}

      {/* Mouth */}
      {expression === 'concerned' ? (
        /* Slight frown */
        <path d="M20 40Q26 37.5 32 40" stroke="#1A2B1F" strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : expression === 'celebrating' ? (
        /* Big open grin */
        <path d="M19 39Q26 46 33 39" stroke="#1A2B1F" strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : (
        /* Gentle smile */
        <path d="M20 39Q26 44 32 39" stroke="#1A2B1F" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}
    </svg>
  )
}
