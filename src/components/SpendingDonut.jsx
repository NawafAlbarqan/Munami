import { motion } from 'motion/react'
import { formatSAR, t } from '../lib/i18n'
import { useCountUp } from '../lib/useCountUp'
import { categoryColorVar, CATEGORY_RING_ORDER } from '../lib/finance'

// Reads the theme's chart colors from CSS variables (defined once in
// src/index.css) so the chart always matches the rest of the app.
function themeColor(varName) {
  if (typeof window === 'undefined') return '#000000'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

const CANVAS = 320
const CENTER = CANVAS / 2
const RING_RADIUS = 92
const STROKE_WIDTH = 28
const LABEL_RADIUS = RING_RADIUS + STROKE_WIDTH / 2 + 28
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const RENDER_SIZE = 240 // on-screen px — scales the viewBox down, keeps margins proportional

// Angle 0 = 3 o'clock; combined with the circle's own -90° rotation (see
// `transform` below) this lines up with "top, going clockwise" — the
// standard donut-chart convention.
function polarToCartesian(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export default function SpendingDonut({ data, total, cardBg }) {
  // The ring always lays out categories in the same fixed order (see
  // CATEGORY_RING_ORDER) so adjacent colors blend the same way every time;
  // the legend below keeps showing the amount-sorted order from `data`.
  const byCategory = Object.fromEntries(data.map((d) => [d.category, d]))
  const ringEntries = CATEGORY_RING_ORDER.map((c) => byCategory[c]).filter(Boolean)
  const ringColors = ringEntries.map((entry) => themeColor(categoryColorVar(entry.category)))
  const resolvedCardBg = cardBg || themeColor('--color-card')

  const segments = ringEntries.reduce((acc, entry, i) => {
    const fraction = total > 0 ? entry.amount / total : 0
    const cumulativeBefore = acc.length > 0 ? acc[acc.length - 1].cumulativeBefore + acc[acc.length - 1].fraction : 0
    const startAngle = -90 + cumulativeBefore * 360
    const endAngle = -90 + (cumulativeBefore + fraction) * 360
    acc.push({
      ...entry,
      fraction,
      cumulativeBefore,
      midAngle: (startAngle + endAngle) / 2,
      color: ringColors[i],
    })
    return acc
  }, [])

  // Callouts for the largest slices only — the smallest are skipped so the
  // ring doesn't get cluttered (the legend already covers every category).
  const calloutCount = segments.length <= 3 ? segments.length : Math.min(4, segments.length - 1)
  const calloutCategories = new Set(
    [...segments]
      .sort((a, b) => b.fraction - a.fraction)
      .slice(0, calloutCount)
      .map((s) => s.category),
  )

  const callouts = []
  let prevCenter = null
  for (const seg of segments) {
    if (!calloutCategories.has(seg.category)) continue
    const anchor = polarToCartesian(seg.midAngle, RING_RADIUS + STROKE_WIDTH / 2)
    let labelRadius = LABEL_RADIUS
    let center = polarToCartesian(seg.midAngle, labelRadius)
    // Cheap separation pass: if this pill would land on top of the previous
    // one, push it further out along its own angle instead.
    if (prevCenter && Math.hypot(center.x - prevCenter.x, center.y - prevCenter.y) < 46) {
      labelRadius += 22
      center = polarToCartesian(seg.midAngle, labelRadius)
    }
    center = { x: clamp(center.x, 34, CANVAS - 34), y: clamp(center.y, 18, CANVAS - 18) }
    prevCenter = center
    callouts.push({ ...seg, anchor, center })
  }

  const animatedTotal = useCountUp(total)

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <svg width={RENDER_SIZE} height={RENDER_SIZE} viewBox={`0 0 ${CANVAS} ${CANVAS}`}>
          <defs>
            {segments.map((seg, i) => {
              const nextColor = ringColors[(i + 1) % ringColors.length]
              const start = polarToCartesian(-90 + seg.cumulativeBefore * 360, RING_RADIUS)
              const end = polarToCartesian(-90 + (seg.cumulativeBefore + seg.fraction) * 360, RING_RADIUS)
              return (
                <linearGradient
                  key={seg.category}
                  id={`donut-gradient-${i}`}
                  gradientUnits="userSpaceOnUse"
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                >
                  <stop offset="0%" stopColor={seg.color} />
                  <stop offset="100%" stopColor={nextColor} />
                </linearGradient>
              )
            })}
          </defs>

          {/* Ring segments — contiguous (no gaps) with rounded caps so each
              one melts into the next instead of showing a hard cut. */}
          {segments.map((seg, i) => {
            const arcLength = seg.fraction * CIRCUMFERENCE
            const cumulativeLength = seg.cumulativeBefore * CIRCUMFERENCE
            return (
              <motion.circle
                key={seg.category}
                cx={CENTER}
                cy={CENTER}
                r={RING_RADIUS}
                fill="none"
                stroke={`url(#donut-gradient-${i})`}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeDasharray={`${arcLength} ${CIRCUMFERENCE - arcLength}`}
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
                initial={{ strokeDashoffset: arcLength - cumulativeLength }}
                animate={{ strokeDashoffset: -cumulativeLength }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.08 }}
              />
            )
          })}

          {/* Percentage callouts for the largest slices */}
          {callouts.map((c) => (
            <g key={`callout-${c.category}`}>
              <line
                x1={c.anchor.x}
                y1={c.anchor.y}
                x2={c.center.x}
                y2={c.center.y}
                stroke={c.color}
                strokeOpacity={0.5}
                strokeWidth={1.5}
              />
              <rect
                x={c.center.x - 28}
                y={c.center.y - 13}
                width={56}
                height={26}
                rx={13}
                fill={resolvedCardBg}
                stroke={c.color}
                strokeWidth={1.5}
              />
              <text
                x={c.center.x}
                y={c.center.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={14}
                fontWeight={600}
                fill={c.color}
              >
                {Math.round(c.fraction * 100)}%
              </text>
            </g>
          ))}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span className="text-muted text-[10px] font-medium uppercase tracking-wide mb-1">
            {t('spent')}
          </span>
          <span className="text-text text-xl font-bold tracking-tight">
            {formatSAR(animatedTotal)}
          </span>
        </div>
      </motion.div>

      <ul className="w-full mt-5 flex flex-col gap-2.5">
        {data.map((entry) => {
          const pct = total > 0 ? Math.round((entry.amount / total) * 100) : 0
          const color = themeColor(categoryColorVar(entry.category))
          return (
            <li key={entry.category} className="flex items-center text-sm">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 me-2"
                style={{ backgroundColor: color }}
              />
              <span className="text-text truncate">{entry.category}</span>
              <span className="text-muted ms-auto tabular-nums shrink-0">
                {formatSAR(entry.amount)} · <span style={{ color }}>{pct}%</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
