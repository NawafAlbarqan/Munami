import { PieChart, Pie, Cell } from 'recharts'
import { motion } from 'motion/react'
import { formatSAR, t } from '../lib/i18n'
import { useCountUp } from '../lib/useCountUp'
import { categoryColorVar } from '../lib/finance'

// Reads the theme's chart colors from CSS variables (defined once in
// src/index.css) so the chart always matches the rest of the app.
function themeColor(varName) {
  if (typeof window === 'undefined') return '#000000'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

// Lightens (positive) or darkens (negative) a hex color by mixing it toward
// white/black — used to build each slice's light→dark gradient from the
// single base color in src/index.css, so the gradient always stays in sync
// with the theme.
function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const mix = (channel) =>
    percent >= 0 ? channel + (255 - channel) * percent : channel * (1 + percent)
  const toHex = (channel) => Math.round(Math.max(0, Math.min(255, channel))).toString(16).padStart(2, '0')
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`
}

export default function SpendingDonut({ data, total }) {
  // Each category always gets the same color (see CATEGORY_COLOR_VAR in
  // finance.js), so the donut, legend dots, and legend percentages all match.
  const colors = data.map((entry) => themeColor(categoryColorVar(entry.category)))
  const animatedTotal = useCountUp(total)

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <PieChart width={220} height={220}>
          <defs>
            {colors.map((color, i) => (
              <linearGradient key={data[i].category} id={`donut-gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={shade(color, 0.35)} />
                <stop offset="100%" stopColor={shade(color, -0.25)} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            innerRadius={70}
            outerRadius={100}
            cornerRadius={10}
            paddingAngle={4}
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={entry.category} fill={`url(#donut-gradient-${i})`} />
            ))}
          </Pie>
        </PieChart>
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
        {data.map((entry, i) => {
          const pct = total > 0 ? Math.round((entry.amount / total) * 100) : 0
          return (
            <li key={entry.category} className="flex items-center text-sm">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 me-2"
                style={{ backgroundColor: colors[i] }}
              />
              <span className="text-text truncate">{entry.category}</span>
              <span className="text-muted ms-auto tabular-nums shrink-0">
                {formatSAR(entry.amount)} ·{' '}
                <span style={{ color: colors[i] }}>{pct}%</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
