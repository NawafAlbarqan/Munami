import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useCountUp } from '../lib/useCountUp'
import { formatSAR } from '../lib/i18n'
import {
  getDebits,
  applyCategoryMap,
  groupByCategory,
  getLatestMonth,
  monthKey,
  categoryColorVar,
} from '../lib/finance'

function themeColor(varName) {
  if (typeof window === 'undefined') return '#888'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

// ─── XP / Level ring ─────────────────────────────────────────────────────────

const XP_CURRENT = 2340
const XP_MAX = 3000
const LEVEL = 7
const R = 70
const STROKE = 12
const CANVAS = 200
const C = CANVAS / 2
const CIRCUMFERENCE = 2 * Math.PI * R

function XPRing() {
  const filled = (XP_CURRENT / XP_MAX) * CIRCUMFERENCE
  const animatedXP = useCountUp(XP_CURRENT, 0.8)

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={CANVAS} height={CANVAS} viewBox={`0 0 ${CANVAS} ${CANVAS}`}>
          {/* Track */}
          <circle
            cx={C} cy={C} r={R}
            fill="none"
            stroke="#2A2A2A"
            strokeWidth={STROKE}
          />
          {/* Progress arc — animates from empty to filled */}
          <motion.circle
            cx={C} cy={C} r={R}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            transform={`rotate(-90 ${C} ${C})`}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: CIRCUMFERENCE - filled }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-muted text-[10px] font-medium uppercase tracking-widest">Level</p>
          <p className="text-text text-4xl font-bold leading-none">{LEVEL}</p>
        </div>
      </div>
      <p className="text-xs mt-1 tabular-nums text-muted">
        <span className="text-primary font-semibold">{animatedXP.toLocaleString()}</span>
        {' / '}{XP_MAX.toLocaleString()} XP
      </p>
      <p className="text-muted text-[11px] mt-0.5">{(XP_MAX - XP_CURRENT).toLocaleString()} XP to Level {LEVEL + 1}</p>
    </div>
  )
}

// ─── Static demo data ─────────────────────────────────────────────────────────

const STREAK_DAYS = 7
const STREAK_LONGEST = 14
const DAYS_TO_BADGE = 3

// Pre-populated budgets — user can add more via the "+" sheet
const DEFAULT_BUDGETS = [
  { category: 'Shopping', limit: 2000 },
  { category: 'Food & Groceries', limit: 1500 },
  { category: 'Entertainment', limit: 800 },
]

const ALL_CATEGORIES = [
  'Shopping',
  'Food & Groceries',
  'Bills & Transport',
  'Entertainment',
  'Other',
]

const CHALLENGES = [
  {
    id: 'c1',
    icon: '🍽️',
    title: 'Dining Under Budget',
    desc: 'Spend under SAR 300 on Food & Groceries this week',
    xp: 200,
    progress: 190,
    target: 300,
    unit: 'SAR',
  },
  {
    id: 'c2',
    icon: '🎬',
    title: 'Entertainment Discipline',
    desc: 'Keep Entertainment under SAR 200 for 3 days',
    xp: 150,
    progress: 2,
    target: 3,
    unit: 'days',
  },
]

const BADGES = [
  { id: 'b1', icon: '⭐', name: 'First Saver', earned: true },
  { id: 'b2', icon: '🎯', name: 'Budget Starter', earned: true },
  { id: 'b3', icon: '🔥', name: 'Streak Starter', earned: true },
  { id: 'b4', icon: '🏆', name: 'Budget Master', earned: false },
  { id: 'b5', icon: '🌟', name: 'Streak Legend', earned: false },
  { id: 'b6', icon: '💎', name: 'No-Spend Champ', earned: false },
]

// Budget bar color shifts from category color → butter (warning) → coral (over)
function budgetBarColor(pct, categoryColor) {
  if (pct >= 1.0) return '#E8756A'
  if (pct >= 0.75) return '#E8CF8E'
  return categoryColor
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GoalsTab({ rows }) {
  const [budgets, setBudgets] = useState(DEFAULT_BUDGETS)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newLimit, setNewLimit] = useState('')

  // Real spend: always use the data's latest month, independent of Overview's
  // month-switcher — Goals is about "this month", not a historical view.
  const spendByCategory = useMemo(() => {
    if (!rows?.length) return {}
    const debits = applyCategoryMap(getDebits(rows))
    const latest = getLatestMonth(rows)
    const thisMonth = debits.filter((r) => monthKey(r.date) === latest)
    return groupByCategory(thisMonth)
  }, [rows])

  const availableCategories = ALL_CATEGORIES.filter(
    (c) => !budgets.some((b) => b.category === c),
  )

  function openSheet() {
    setNewCategory(availableCategories[0] ?? '')
    setNewLimit('')
    setSheetOpen(true)
  }

  function handleAddBudget() {
    const limit = parseFloat(newLimit)
    if (!newCategory || !limit || limit <= 0) return
    setBudgets((prev) => [...prev, { category: newCategory, limit }])
    setSheetOpen(false)
  }

  return (
    <div className="absolute inset-0 overflow-y-auto scroll-thin bg-page px-4 pt-6 pb-24">

      {/* ── XP / Level ── */}
      <div className="bg-card border-[0.5px] border-card-border rounded-[20px] p-5 mb-4">
        <XPRing />
      </div>

      {/* ── Streak ── */}
      <motion.div
        className="bg-card border-[0.5px] border-card-border rounded-[20px] p-5 mb-4 flex items-center gap-4"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <span className="text-3xl">🔥</span>
        <div className="flex-1 min-w-0">
          <p className="text-text font-semibold">{STREAK_DAYS}-day streak</p>
          <p className="text-muted text-xs mt-0.5">{DAYS_TO_BADGE} days to your next badge!</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-muted text-[10px] uppercase tracking-wide">Best</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-rewards)' }}>
            {STREAK_LONGEST} days
          </p>
        </div>
      </motion.div>

      {/* ── Monthly budgets ── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-text font-semibold">Monthly Budgets</h2>
          {availableCategories.length > 0 && (
            <button
              onClick={openSheet}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-page text-xl font-bold leading-none"
            >
              +
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {budgets.map((budget, i) => {
            const spent = Math.round(spendByCategory[budget.category] || 0)
            const pct = budget.limit > 0 ? spent / budget.limit : 0
            const catColor = themeColor(categoryColorVar(budget.category))
            const barColor = budgetBarColor(pct, catColor)
            return (
              <motion.div
                key={budget.category}
                className="bg-card border-[0.5px] border-card-border rounded-[20px] px-4 py-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.06, ease: 'easeOut' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: catColor }} />
                    <span className="text-text text-sm font-medium">{budget.category}</span>
                  </div>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: barColor }}>
                    {pct >= 1 ? 'Over budget!' : `${Math.round(Math.min(pct, 1) * 100)}%`}
                  </span>
                </div>

                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#2A2A2A' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: barColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 1) * 100}%` }}
                    transition={{ duration: 0.65, delay: i * 0.08, ease: 'easeOut' }}
                  />
                </div>

                <div className="flex justify-between mt-1.5">
                  <span className="text-muted text-[11px] tabular-nums">{formatSAR(spent)} spent</span>
                  <span className="text-muted text-[11px] tabular-nums">of {formatSAR(budget.limit)}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Weekly challenges ── */}
      <div className="mb-4">
        <h2 className="text-text font-semibold mb-3">Weekly Challenges</h2>
        <div className="flex flex-col gap-3">
          {CHALLENGES.map((ch, i) => {
            const barPct = Math.min(ch.progress / ch.target, 1)
            return (
              <motion.div
                key={ch.id}
                className="bg-card border-[0.5px] border-card-border rounded-[20px] px-4 py-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.08, ease: 'easeOut' }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-xl leading-none mt-0.5">{ch.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text text-sm font-semibold">{ch.title}</p>
                    <p className="text-muted text-[11px] mt-0.5">{ch.desc}</p>
                  </div>
                  <span
                    className="text-xs font-bold shrink-0 tabular-nums"
                    style={{ color: 'var(--color-rewards)' }}
                  >
                    +{ch.xp} XP
                  </span>
                </div>

                <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ backgroundColor: '#2A2A2A' }}>
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${barPct * 100}%` }}
                    transition={{ duration: 0.7, delay: i * 0.1, ease: 'easeOut' }}
                  />
                </div>

                <div className="flex justify-between">
                  <span className="text-muted text-[11px] tabular-nums">
                    {ch.unit === 'SAR' ? `SAR ${ch.progress}` : `${ch.progress} ${ch.unit}`}
                    {' / '}
                    {ch.unit === 'SAR' ? `SAR ${ch.target}` : `${ch.target} ${ch.unit}`}
                  </span>
                  <span className="text-muted text-[11px]">{Math.round(barPct * 100)}%</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Badges ── */}
      <div className="mb-4">
        <h2 className="text-text font-semibold mb-3">Badges</h2>
        <div className="grid grid-cols-3 gap-3">
          {BADGES.map((badge, i) => (
            <motion.div
              key={badge.id}
              className="bg-card border-[0.5px] border-card-border rounded-[20px] py-4 px-2 flex flex-col items-center gap-1.5"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: badge.earned ? 1 : 0.4, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.05, ease: 'easeOut' }}
            >
              <span className="text-2xl">{badge.earned ? badge.icon : '🔒'}</span>
              <p className="text-text text-[11px] font-medium text-center leading-tight">
                {badge.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Add budget bottom sheet ── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              className="absolute inset-0 z-20"
              style={{ background: 'rgba(0,0,0,0.55)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-30 bg-card rounded-t-[24px] px-5 pt-4 pb-10"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <div className="w-10 h-1 bg-card-border rounded-full mx-auto mb-5" />
              <p className="text-text font-semibold text-base mb-5">Add Budget</p>

              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-muted text-[10px] font-medium uppercase tracking-wide mb-2">
                    Category
                  </p>
                  <div className="flex flex-col gap-2">
                    {availableCategories.map((cat) => {
                      const catColor = themeColor(categoryColorVar(cat))
                      return (
                        <button
                          key={cat}
                          onClick={() => setNewCategory(cat)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-[14px] border-[0.5px] text-left transition-colors ${
                            newCategory === cat
                              ? 'border-primary bg-primary/10'
                              : 'border-card-border bg-tint'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: catColor }}
                          />
                          <span className="text-text text-sm">{cat}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-muted text-[10px] font-medium uppercase tracking-wide mb-2">
                    Monthly Limit (SAR)
                  </p>
                  <input
                    type="number"
                    placeholder="0"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    className="w-full bg-tint border-[0.5px] border-card-border rounded-[14px] px-4 py-3 text-text text-sm outline-none"
                  />
                </div>

                <button
                  onClick={handleAddBudget}
                  className="w-full py-3.5 rounded-full bg-primary text-page text-sm font-semibold"
                >
                  Add Budget
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
