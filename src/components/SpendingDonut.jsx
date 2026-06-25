import { PieChart, Pie, Cell } from 'recharts'
import { motion } from 'motion/react'
import { formatSAR, t } from '../lib/i18n'
import { useCountUp } from '../lib/useCountUp'

// Reads the theme's chart colors from CSS variables (defined once in
// src/index.css) so the chart always matches the rest of the app.
function themeColor(varName) {
  if (typeof window === 'undefined') return '#000000'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

const CHART_PALETTE = [
  '--color-primary',
  '--color-info',
  '--color-rewards',
  '--color-caution',
  '--color-violet',
]

export default function SpendingDonut({ data, total }) {
  const colors = CHART_PALETTE.map(themeColor)
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
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={entry.category} fill={colors[i % colors.length]} />
            ))}
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-muted text-xs">{t('spent')}</span>
          <span className="text-text text-xl font-bold">{formatSAR(animatedTotal)}</span>
        </div>
      </motion.div>

      <ul className="w-full mt-4 flex flex-col gap-2">
        {data.map((entry, i) => {
          const pct = total > 0 ? Math.round((entry.amount / total) * 100) : 0
          return (
            <li key={entry.category} className="flex items-center text-sm">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 me-2"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span className="text-text truncate">{entry.category}</span>
              <span className="text-muted ms-auto tabular-nums shrink-0">
                {formatSAR(entry.amount)} · {pct}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
