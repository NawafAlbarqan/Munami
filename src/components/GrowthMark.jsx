// منمّي's signature growth motif — a minimal sprout with two leaves.
// Appears in the Copilot header as a brand mark; sized via the `size` prop.
export default function GrowthMark({ size = 18, color = 'currentColor', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Stem */}
      <path
        d="M9 16V10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Left leaf */}
      <path
        d="M9 13C9 13 5.5 12 4 8.5C7 8 9 10.5 9 13Z"
        fill={color}
        opacity="0.85"
      />
      {/* Right leaf — slightly higher, lighter */}
      <path
        d="M9 10.5C9 10.5 12.5 9 14 5.5C11 5 9 7.5 9 10.5Z"
        fill={color}
        opacity="0.65"
      />
    </svg>
  )
}
