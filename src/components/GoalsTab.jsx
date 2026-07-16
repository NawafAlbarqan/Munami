import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useCountUp } from '../lib/useCountUp'
import { formatSAR, t, categoryName } from '../lib/i18n'
import { useLocale } from '../lib/LocaleContext'
import DealsWall from './DealsWall'
import MunamiMascot from './MunamiMascot'
import {
  getDebits,
  applyCategoryMap,
  groupByCategory,
  getLatestMonth,
  monthKey,
  categoryColorVar,
} from '../lib/finance'
import {
  computeCandidateChallenges,
  getLastChallengeCategory,
  saveLastChallengeCategory,
  templateChallenge,
} from '../lib/challengeGen'

const USE_AI = import.meta.env.VITE_USE_AI === 'true'

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

function XPRing({ locale }) {
  const filled = (XP_CURRENT / XP_MAX) * CIRCUMFERENCE
  const animatedXP = useCountUp(XP_CURRENT, 0.8)

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={CANVAS} height={CANVAS} viewBox={`0 0 ${CANVAS} ${CANVAS}`}>
          <circle cx={C} cy={C} r={R} fill="none" stroke="var(--color-card-border)" strokeWidth={STROKE} />
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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-muted text-[10px] font-medium uppercase tracking-widest">
            {t(locale, 'level')}
          </p>
          <p className="text-text leading-none munami-hero">{LEVEL}</p>
        </div>
      </div>
      <p className="text-xs mt-1 tabular-nums text-muted">
        <span className="text-primary font-semibold">{animatedXP.toLocaleString()}</span>
        {' / '}{XP_MAX.toLocaleString()} XP
      </p>
      <p className="text-muted text-[11px] mt-0.5">
        {(XP_MAX - XP_CURRENT).toLocaleString()} {t(locale, 'xpToLevel', LEVEL + 1)}
      </p>
    </div>
  )
}

// ─── Static demo data ─────────────────────────────────────────────────────────

const STREAK_DAYS = 7
const STREAK_LONGEST = 14
const DAYS_TO_BADGE = 3

const DEFAULT_BUDGETS = [
  { category: 'Shopping', limit: 2000 },
  { category: 'Food & Groceries', limit: 1500 },
  { category: 'Entertainment', limit: 800 },
]

const ALL_CATEGORIES = ['Shopping', 'Food & Groceries', 'Bills & Transport', 'Entertainment', 'Other']

const CATEGORY_EMOJI = {
  'Shopping': '🛍️',
  'Food & Groceries': '🍽️',
  'Bills & Transport': '🚗',
  'Entertainment': '🎬',
  'Other': '📦',
}

// Concerned = mild/early warning (70-90% used); Unhappy = serious/clear
// negative (100%+, actually over). Shared by the budget bar color and the
// budget mood badge so both change at the same point.
const CONCERNED_PCT = 0.70

function budgetBarColor(pct, categoryColor) {
  if (pct >= 1.0) return '#E8756A'
  if (pct >= CONCERNED_PCT) return '#E8CF8E'
  return categoryColor
}

function budgetMood(pct) {
  if (pct >= 1.0) return 'unhappy'
  if (pct >= CONCERNED_PCT) return 'concerned'
  return 'happy'
}

// Challenge mood depends on its mode:
// - 'limit' challenges (a cap to stay under): approaching it (70-99%) is a
//   mild warning (concerned); reaching/exceeding it (100%+) means it was
//   missed/failed (unhappy); comfortably under is happy.
// - 'goal' challenges (a target to reach): only completed (100%+) shows a
//   mood (happy) — with no real deadline in the demo data, "in progress"
//   isn't treated as "at risk" for these.
function challengeMood(ch) {
  const pct = ch.target > 0 ? ch.progress / ch.target : 0
  if (ch.mode === 'limit') {
    if (pct >= 1.0) return 'unhappy'
    if (pct >= CONCERNED_PCT) return 'concerned'
    return 'happy'
  }
  return pct >= 1.0 ? 'happy' : null
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GoalsTab({ rows }) {
  const { locale } = useLocale()
  const [budgets, setBudgets] = useState(DEFAULT_BUDGETS)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newLimit, setNewLimit] = useState('')

  const spendByCategory = useMemo(() => {
    if (!rows?.length) return {}
    const debits = applyCategoryMap(getDebits(rows))
    const latest = getLatestMonth(rows)
    const thisMonth = debits.filter((r) => monthKey(r.date) === latest)
    return groupByCategory(thisMonth)
  }, [rows])

  const availableCategories = ALL_CATEGORIES.filter((c) => !budgets.some((b) => b.category === c))

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

  // ── Weekly challenge — code finds candidates + computes every number
  // (challengeGen.js); the AI only picks the most meaningful one and
  // phrases it (server.js POST /api/weekly-challenge). Cached per
  // locale+candidate-set so switching tabs/locale doesn't re-fire the call.
  const [challenge, setChallenge] = useState(null)
  const [challengeLoading, setChallengeLoading] = useState(false)
  const challengeCache = useRef({})

  const candidates = useMemo(() => computeCandidateChallenges(rows), [rows])

  useEffect(() => {
    if (!candidates.length) {
      setChallenge(null)
      return
    }

    const cacheKey = `${locale}+${candidates.map((c) => c.category).join(',')}`
    if (challengeCache.current[cacheKey]) {
      setChallenge(challengeCache.current[cacheKey])
      return
    }

    const lastCategory = getLastChallengeCategory()

    function finalize(picked, title, desc) {
      const result = {
        category: picked.category,
        icon: CATEGORY_EMOJI[picked.category] || '📦',
        mode: 'limit',
        title,
        desc,
        xp: picked.xp,
        progress: picked.currentSpend,
        target: picked.target,
        unit: 'SAR',
      }
      challengeCache.current[cacheKey] = result
      setChallenge(result)
      saveLastChallengeCategory(picked.category)
    }

    if (!USE_AI) {
      // Demo-mode fallback: code already sorted candidates by overage —
      // just avoid repeating last week's category, same rule the AI follows.
      const picked = candidates.find((c) => c.category !== lastCategory) || candidates[0]
      const { title, desc } = templateChallenge(picked, locale)
      finalize(picked, title, desc)
      return
    }

    setChallengeLoading(true)
    fetch('/api/weekly-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidates, lastCategory, locale }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(({ index, title, desc }) => {
        const picked = candidates[index]
        if (!picked) throw new Error('invalid index')
        finalize(picked, title, desc)
      })
      .catch(() => {
        // Graceful fallback — still real data, just template-phrased.
        const picked = candidates.find((c) => c.category !== lastCategory) || candidates[0]
        const { title, desc } = templateChallenge(picked, locale)
        finalize(picked, title, desc)
      })
      .finally(() => setChallengeLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, locale])

  return (
    <div className="absolute inset-0 overflow-y-auto scroll-thin bg-page px-4 pb-24" style={{ paddingTop: 60 }}>

      {/* ── Page header ── */}
      <div className="mb-5">
        <p className="text-muted text-xs font-medium uppercase tracking-widest mb-0.5">
          {t(locale, 'goalsSubtitle')}
        </p>
        <h1 className="text-text font-bold leading-tight" style={{ fontFamily: "'Space Grotesk', 'Noto Sans Arabic', sans-serif", fontSize: 26 }}>
          {t(locale, 'goalsHeader')}
        </h1>
      </div>

      {/* ── XP / Level ── */}
      <div className="border-[0.5px] border-card-border rounded-[20px] p-5 mb-4" style={{ background: 'var(--grad-hero-card)' }}>
        <XPRing locale={locale} />
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
          <p className="text-text font-semibold">{t(locale, 'streakLabel', STREAK_DAYS)}</p>
          <p className="text-muted text-xs mt-0.5">{t(locale, 'streakToBadge', DAYS_TO_BADGE)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-muted text-[10px] uppercase tracking-wide">{t(locale, 'streakBest')}</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-rewards)' }}>
            {t(locale, 'streakBestDays', STREAK_LONGEST)}
          </p>
        </div>
      </motion.div>

      {/* ── Monthly budgets ── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-text font-semibold">{t(locale, 'monthlyBudgets')}</h2>
          {availableCategories.length > 0 && (
            <button
              onClick={openSheet}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-accent text-xl font-bold leading-none"
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
                    <MunamiMascot expression={budgetMood(pct)} size={22} />
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: catColor }} />
                    <span className="text-text text-sm font-medium">
                      {categoryName(locale, budget.category)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: barColor }}>
                    {pct >= 1 ? t(locale, 'overBudget') : `${Math.round(Math.min(pct, 1) * 100)}%`}
                  </span>
                </div>

                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-card-border)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: barColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 1) * 100}%` }}
                    transition={{ duration: 0.65, delay: i * 0.08, ease: 'easeOut' }}
                  />
                </div>

                <div className="flex justify-between mt-1.5">
                  <span className="text-muted text-[11px] tabular-nums">
                    {formatSAR(spent)} {t(locale, 'budgetSpent')}
                  </span>
                  <span className="text-muted text-[11px] tabular-nums">
                    {t(locale, 'budgetOf')} {formatSAR(budget.limit)}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Weekly challenge — code finds the candidate + computes every
          number (challengeGen.js); the AI only picked this one and phrased
          it (server.js POST /api/weekly-challenge). ── */}
      <div className="mb-4">
        <h2 className="text-text font-semibold mb-3">{t(locale, 'weeklyChallenges')}</h2>
        {challengeLoading && !challenge && (
          <div className="bg-card border-[0.5px] border-card-border rounded-[20px] px-4 py-6 text-center">
            <p className="text-muted text-xs">{t(locale, 'loading')}</p>
          </div>
        )}
        {challenge && (() => {
          const barPct = challenge.target > 0 ? Math.min(challenge.progress / challenge.target, 1) : 0
          const mood = challengeMood(challenge)
          return (
            <motion.div
              className="bg-card border-[0.5px] border-card-border rounded-[20px] px-4 py-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-xl leading-none mt-0.5">{challenge.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-text text-sm font-semibold">{challenge.title}</p>
                  <p className="text-muted text-[11px] mt-0.5">{challenge.desc}</p>
                </div>
                {mood && <MunamiMascot expression={mood} size={22} className="shrink-0" />}
                <span className="text-xs font-bold shrink-0 tabular-nums" style={{ color: 'var(--color-rewards)' }}>
                  +{challenge.xp} XP
                </span>
              </div>

              <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ backgroundColor: 'var(--color-card-border)' }}>
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${barPct * 100}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              </div>

              <div className="flex justify-between">
                <span className="text-muted text-[11px] tabular-nums">
                  {formatSAR(challenge.progress)} {' / '} {formatSAR(challenge.target)}
                </span>
                <span className="text-muted text-[11px]">{Math.round(barPct * 100)}%</span>
              </div>
            </motion.div>
          )
        })()}
        {!challengeLoading && !challenge && (
          <div className="bg-card border-[0.5px] border-card-border rounded-[20px] px-4 py-6 text-center">
            <p className="text-muted text-xs">{t(locale, 'noChallengeThisWeek')}</p>
          </div>
        )}
      </div>

      {/* ── Deals Wall (Lane 1: badges → real partner deals with SAR value) ── */}
      <DealsWall locale={locale} level={LEVEL} />

      {/* ── Add budget bottom sheet ── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              className="absolute inset-0 z-20"
              style={{ background: 'rgba(0,0,0,0.35)' }}
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
              <p className="text-text font-semibold text-base mb-5">{t(locale, 'addBudget')}</p>

              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-muted text-[10px] font-medium uppercase tracking-wide mb-2">
                    {t(locale, 'categoryLabel')}
                  </p>
                  <div className="flex flex-col gap-2">
                    {availableCategories.map((cat) => {
                      const catColor = themeColor(categoryColorVar(cat))
                      return (
                        <button
                          key={cat}
                          onClick={() => setNewCategory(cat)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-[14px] border-[0.5px] text-left transition-colors ${
                            newCategory === cat ? 'border-primary bg-primary/10' : 'border-card-border bg-tint'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catColor }} />
                          <span className="text-text text-sm">{categoryName(locale, cat)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-muted text-[10px] font-medium uppercase tracking-wide mb-2">
                    {t(locale, 'monthlyLimit')}
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
                  className="w-full py-3.5 rounded-full bg-primary text-on-accent text-sm font-semibold"
                >
                  {t(locale, 'addBudgetBtn')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
