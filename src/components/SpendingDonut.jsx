import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { formatSAR, t, categoryName } from '../lib/i18n'
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
const SEGMENT_GAP = 5 // px of circumference between segments — clean flat separation
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

export default function SpendingDonut({ data, total, cardBg, locale = 'en' }) {
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
      // Segments are flat solid colors now, so the callout anchors at the
      // true midpoint of the sweep — the ring under the pill is always the
      // pill's own color.
      labelAngle: (startAngle + endAngle) / 2,
      color: ringColors[i],
    })
    return acc
  }, [])

  // Callouts for every segment so no category goes unlabelled on the ring.
  // Each pill uses the pure category color (matches the legend dot exactly, not
  // the gradient blend on the arc). Multi-pass collision push keeps them apart.
  const callouts = []
  const placed = []
  for (const seg of segments) {
    if (seg.fraction < 0.02) continue // skip truly negligible slivers
    const anchor = polarToCartesian(seg.labelAngle, RING_RADIUS + STROKE_WIDTH / 2)
    let labelRadius = LABEL_RADIUS
    let center = polarToCartesian(seg.labelAngle, labelRadius)
    for (let attempt = 0; attempt < 8; attempt++) {
      if (!placed.some((p) => Math.hypot(center.x - p.x, center.y - p.y) < 54)) break
      labelRadius += 16
      center = polarToCartesian(seg.labelAngle, labelRadius)
    }
    center = { x: clamp(center.x, 32, CANVAS - 32), y: clamp(center.y, 16, CANVAS - 16) }
    placed.push(center)
    const catColor = themeColor(categoryColorVar(seg.category))
    callouts.push({ ...seg, anchor, center, catColor })
  }

  const animatedTotal = useCountUp(total)

  // Draw-in animation: a plain CSS transition (not Motion's per-frame JS
  // animation of the raw stroke-dashoffset attribute) — the browser
  // guarantees a CSS transition reaches and HOLDS its final value. The
  // Motion version could get stuck mid-transition in some environments,
  // leaving the ring's actual arc boundaries out of sync with the callouts
  // (which are computed straight from the data, not from animation state) —
  // so a callout could end up pointing at a slice that hadn't finished
  // drawing into its real position yet.
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <svg width={RENDER_SIZE} height={RENDER_SIZE} viewBox={`0 0 ${CANVAS} ${CANVAS}`}>
          {/* Ring segments — flat solid category colors with a small clean gap
              between each (matches the identity boards' chart style; the old
              gradient-merged ring was part of the retired retro identity). */}
          {segments.map((seg, i) => {
            const arcLength = seg.fraction * CIRCUMFERENCE
            const drawnArc = Math.max(arcLength - SEGMENT_GAP, 2)
            const cumulativeLength = seg.cumulativeBefore * CIRCUMFERENCE + SEGMENT_GAP / 2
            return (
              <circle
                key={seg.category}
                cx={CENTER}
                cy={CENTER}
                r={RING_RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="butt"
                strokeDasharray={`${drawnArc} ${CIRCUMFERENCE - drawnArc}`}
                strokeDashoffset={drawn ? -cumulativeLength : drawnArc - cumulativeLength}
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
                style={{
                  transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  transitionDelay: `${i * 0.08}s`,
                }}
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
                stroke={c.catColor}
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
                stroke={c.catColor}
                strokeWidth={1.5}
              />
              <text
                x={c.center.x}
                y={c.center.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={14}
                fontWeight={600}
                fill={c.catColor}
              >
                {Math.round(c.fraction * 100)}%
              </text>
            </g>
          ))}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span className="text-muted text-[10px] font-medium uppercase tracking-wide mb-1">
            {t(locale, 'spent')}
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
              <span className="text-text truncate">{categoryName(locale, entry.category)}</span>
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
