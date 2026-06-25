import { motion } from 'motion/react'

const ACCENTS = {
  positive: 'text-positive',
  caution: 'text-caution',
  rewards: 'text-rewards',
}

// Two shapes share this card:
// - category change cards: category name + ▲/▼ + % + AI sentence
// - fallback cards (early-month mode): icon + AI sentence only
// `index` staggers the entrance animation when several cards mount together.
export default function InsightCard({ icon, category, arrow, pct, text, accent = 'rewards', index = 0 }) {
  return (
    <motion.div
      className="bg-card border-[0.5px] border-card-border rounded-[18px] p-4 flex items-start gap-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: 'easeOut' }}
    >
      <span className="text-2xl shrink-0">{icon}</span>
      <div className="flex flex-col gap-1">
        {category && (
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="text-text">{category}</span>
            <span className={ACCENTS[accent]}>
              {arrow} {pct}%
            </span>
          </div>
        )}
        <p className={`text-sm leading-snug ${category ? 'text-muted' : ACCENTS[accent]}`}>
          {text}
        </p>
      </div>
    </motion.div>
  )
}
