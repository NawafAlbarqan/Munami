import { useEffect, useRef, useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Papa from 'papaparse'
import SpendingDonut from './components/SpendingDonut'
import InsightCard from './components/InsightCard'
import MonthSwitcher from './components/MonthSwitcher'
import BottomNav from './components/BottomNav'
import TransactionsTab from './components/TransactionsTab'
import AccountsTab from './components/AccountsTab'
import GoalsTab from './components/GoalsTab'
import CopilotTab from './components/CopilotTab'
import MunamiMascot from './components/MunamiMascot'
import SettingsPanel from './components/SettingsPanel'
import { useLocale } from './lib/LocaleContext'
import {
  monthKey,
  getLatestMonth,
  getDebits,
  getCredits,
  applyCategoryMap,
  sumAmount,
  groupByCategory,
  listMonths,
  isEarlyMonth,
  daysWithDataInMonth,
  daysInMonth,
  computeCategoryChanges,
  topChanges,
  isGood,
  resolveMonthIncome,
  summarizePriorMonth,
} from './lib/finance'
import {
  phraseCategoryChange,
  phrasePace,
  phrasePriorMonthSummary,
  fetchInsightPhrases,
} from './lib/aiCoach'
import { t, monthLabel, monthYearLabel, categoryName, formatSAR, dir } from './lib/i18n'
import accountsData from '../data/munami_accounts.json'

// Severity split for a "bad" spending trend: a genuinely large swing (>=50%)
// reads as clearly-flagged overspending (unhappy); anything smaller is just
// an early/mild warning (concerned). Shared by the insight cards and the
// Overview greeting mascot so both use the same definition of "significant."
const SIGNIFICANT_PCT = 50
function badMood(pctChange) {
  return Math.abs(pctChange) >= SIGNIFICANT_PCT ? 'unhappy' : 'concerned'
}

function App() {
  const { locale } = useLocale()
  const [rows, setRows] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // AI-phrased insight cards — cached by "month+locale" so we don't re-fetch on every render
  const [aiCards, setAiCards] = useState([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const phraseCache = useRef({})  // { "2026-06+en": [text, text, text] }

  useEffect(() => {
    Papa.parse('/data/munami_transactions.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (result) => setRows(result.data.filter((r) => r.transaction_id)),
    })
  }, [])

  const debits = applyCategoryMap(getDebits(rows))
  const credits = getCredits(rows)

  const months = listMonths(rows)
  const latestMonth = getLatestMonth(rows)
  const activeMonth = selectedMonth || latestMonth
  const monthIndex = months.indexOf(activeMonth)
  const canGoPrev = monthIndex > 0
  const canGoNext = monthIndex >= 0 && monthIndex < months.length - 1

  const monthDebits = debits.filter((r) => monthKey(r.date) === activeMonth)
  const spendByCategory = useMemo(() => groupByCategory(monthDebits), [monthDebits])

  const { income, isCarriedOver, incomeMonth } = resolveMonthIncome(credits, activeMonth)
  const spent = sumAmount(monthDebits)
  const net = income - spent

  const chartData = Object.entries(groupByCategory(monthDebits))
    .map(([category, amount]) => ({ category, amount: Math.round(amount) }))
    .sort((a, b) => b.amount - a.amount)

  const earlyMonth = rows.length > 0 && isEarlyMonth(rows, activeMonth)
  const daysElapsed = daysWithDataInMonth(debits, activeMonth)

  // ── Build base cards (template fallback text) ─────────────────────────────
  let baseChanges = []   // raw changes, used to fetch AI phrases
  let baseCards = []

  if (rows.length === 0) {
    baseCards = []
  } else if (earlyMonth) {
    const projectedSpend = Math.round((spent / (daysElapsed || 1)) * daysInMonth(activeMonth))
    baseCards = [
      {
        icon: '📈',
        accent: 'rewards',
        text: phrasePace(locale, { daysElapsed, spentSoFar: Math.round(spent), projectedSpend }),
      },
    ]
    const summary = summarizePriorMonth(debits, activeMonth)
    if (summary) {
      baseCards.push({
        mascotMood: isGood(summary.direction) ? 'happy' : badMood(summary.pctChange),
        accent: isGood(summary.direction) ? 'positive' : 'caution',
        text: phrasePriorMonthSummary(locale, {
          priorMonthLabel: monthLabel(locale, summary.priorMonth),
          priorSpent: summary.priorSpent,
          pctChange: summary.pctChange,
          direction: summary.direction,
        }),
      })
    }
  } else {
    const changes = computeCategoryChanges(debits, activeMonth)
    baseChanges = topChanges(changes, 3)
    baseCards = baseChanges.map((change) => ({
      mascotMood: isGood(change.direction) ? 'happy' : badMood(change.pctChange),
      category: categoryName(locale, change.category),
      arrow: change.direction === 'down' ? '▼' : '▲',
      pct: Math.abs(change.pctChange),
      accent: isGood(change.direction) ? 'positive' : 'caution',
      text: phraseCategoryChange(locale, change),
    }))
  }

  // ── Fetch AI-phrased insight text (only for normal category cards) ─────────
  useEffect(() => {
    if (!baseChanges.length || earlyMonth) {
      setAiCards([])
      return
    }
    const cacheKey = `${activeMonth}+${locale}`
    if (phraseCache.current[cacheKey]) {
      setAiCards(phraseCache.current[cacheKey])
      return
    }
    setInsightsLoading(true)
    fetchInsightPhrases(locale, baseChanges).then((phrases) => {
      const updated = baseCards.map((card, i) => ({ ...card, text: phrases[i] ?? card.text }))
      phraseCache.current[cacheKey] = updated
      setAiCards(updated)
      setInsightsLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMonth, locale, rows.length])

  // Use AI cards when available, fall back to template cards
  const cards = aiCards.length ? aiCards : baseCards

  // ── Financial context for the Copilot chat ────────────────────────────────
  // Deliberately independent of `activeMonth` (the Overview tab's month
  // switcher) — Copilot must always reason from the TRUE current month
  // (the data's own latest month, `latestMonth`) and have every month's
  // category breakdown on hand, regardless of whatever month the user
  // happens to have selected in Overview. Only depends on `rows`/`locale`.
  const financialContext = useMemo(() => {
    if (!rows.length) return null

    // Precompute monthly totals for all months — AI reads these, never the raw CSV
    const allDebits = applyCategoryMap(getDebits(rows))
    const allCredits = getCredits(rows)
    const allMonths = listMonths(rows)
    const currentMonth = getLatestMonth(rows)

    const monthlyHistory = allMonths.map((m) => {
      const mDebits = allDebits.filter((r) => monthKey(r.date) === m)
      const mCredits = allCredits.filter((r) => monthKey(r.date) === m)
      return {
        month: m,
        spend: Math.round(sumAmount(mDebits)),
        income: Math.round(sumAmount(mCredits)),
      }
    })

    // Category breakdown for EVERY month, not just whatever is selected in
    // Overview — lets منمّي answer "what's my biggest category in April"
    // no matter what's currently showing on the Overview tab.
    const categoriesByMonth = allMonths.map((m) => {
      const mDebits = allDebits.filter((r) => monthKey(r.date) === m)
      const mSpend = sumAmount(mDebits)
      const byCategory = groupByCategory(mDebits)
      return {
        month: m,
        categories: Object.entries(byCategory)
          .map(([category, amount]) => ({
            category,
            amount: Math.round(amount),
            pct: mSpend > 0 ? Math.round((amount / mSpend) * 100) : 0,
          }))
          .sort((a, b) => b.amount - a.amount),
      }
    })

    // Full (non-partial) months only for averages and extremes
    const fullMonthHistory = monthlyHistory.filter((mh) => !isEarlyMonth(rows, mh.month))
    const avgMonthlySpend = fullMonthHistory.length
      ? Math.round(fullMonthHistory.reduce((s, m) => s + m.spend, 0) / fullMonthHistory.length)
      : 0
    const sortedBySpend = [...fullMonthHistory].sort((a, b) => b.spend - a.spend)

    // "This month" for the chat is always the TRUE current month — never
    // the Overview tab's selected month.
    const currentMonthDebits = allDebits.filter((r) => monthKey(r.date) === currentMonth)
    const currentMonthSpend = sumAmount(currentMonthDebits)
    const { income: currentMonthIncome } = resolveMonthIncome(allCredits, currentMonth)
    const currentMonthEntry = categoriesByMonth.find((c) => c.month === currentMonth)

    return {
      totalBalance: accountsData.total_balance_sar,
      unallocated: accountsData.unallocated_sar,
      allocated: accountsData.allocated_sar,
      accounts: accountsData.accounts.map((a) => ({ bank: a.bank, balance: a.balance_sar })),
      funds: accountsData.funds.map((f) => ({ name: f.name, balance: f.balance_sar, target: f.target_sar })),
      month: monthYearLabel(locale, currentMonth) || 'current month',
      spent: Math.round(currentMonthSpend),
      income: currentMonthIncome,
      daysElapsed: daysWithDataInMonth(allDebits, currentMonth),
      isEarlyMonth: isEarlyMonth(rows, currentMonth),
      topCategories: (currentMonthEntry?.categories || []).slice(0, 4),
      budgets: [
        { category: 'Shopping', limit: 2000, spent: Math.round(groupByCategory(currentMonthDebits)['Shopping'] || 0) },
        { category: 'Food & Groceries', limit: 1500, spent: Math.round(groupByCategory(currentMonthDebits)['Food & Groceries'] || 0) },
        { category: 'Entertainment', limit: 800, spent: Math.round(groupByCategory(currentMonthDebits)['Entertainment'] || 0) },
      ],
      goals: {
        emergencyFund: { current: 6000, target: 15000 },
        level: 7,
        xpCurrent: 2340,
        xpMax: 3000,
        streak: 7,
      },
      // Full spending history across all months in the dataset, independent
      // of Overview's month switcher.
      monthlyHistory,
      categoriesByMonth,
      avgMonthlySpend,
      highestMonth: sortedBySpend[0] || null,
      lowestMonth: sortedBySpend[sortedBySpend.length - 1] || null,
    }
  }, [rows, locale])

  // ── Mascot expression ─────────────────────────────────────────────────────
  // Three real moods now (no separate "celebrating" art) — happy covers both
  // plain on-track and a strong-improvement month.
  //   concerned = mild/early warning: approaching the limit (85-99% of
  //     income spent), or 2+ categories trending up but none severely
  //   unhappy = serious/clear negative: spent >= all income (genuinely over
  //     budget), OR any single category surged >=50% (badMood's threshold,
  //     "significantly and clearly above usual")
  const spendRatio = income > 0 ? spent / income : 0
  const goodCount = cards.filter((c) => c.accent === 'positive').length
  const badCards = cards.filter((c) => c.accent === 'caution')
  const badCount = badCards.length
  const hasSevereCategory = badCards.some((c) => c.mascotMood === 'unhappy')
  const isCelebrating = goodCount >= 2 && !(spendRatio >= 1.0 || hasSevereCategory || spendRatio > 0.85 || badCount >= 2)
  let mascotExpression = 'happy'
  if (rows.length > 0 && !earlyMonth) {
    if (spendRatio >= 1.0 || hasSevereCategory) mascotExpression = 'unhappy'
    else if (spendRatio > 0.85 || badCount >= 2) mascotExpression = 'concerned'
  }
  const mascotVerdict = earlyMonth
    ? t(locale, 'mascotEarly', daysElapsed)
    : mascotExpression === 'unhappy'
      ? t(locale, 'mascotOverBudget')
      : mascotExpression === 'concerned'
        ? t(locale, 'mascotConcerned')
        : isCelebrating
          ? t(locale, 'mascotCelebrating')
          : t(locale, 'mascotOnTrack')

  const appDir = dir(locale)

  return (
    <div dir={appDir} className="absolute inset-0">
      {activeTab === 'transactions' && <TransactionsTab rows={rows} />}
      {activeTab === 'goals' && <GoalsTab rows={rows} />}
      {activeTab === 'copilot' && <CopilotTab financialContext={financialContext} />}
      {activeTab === 'accounts' && <AccountsTab />}

      {/* Overview tab */}
      <div
        className="absolute inset-0 overflow-y-auto scroll-thin bg-page px-4 pt-5 pb-24"
        style={{ display: activeTab === 'overview' ? undefined : 'none' }}
      >
        {/* ── Mascot greeting ── */}
        <div className="flex items-center gap-3 mb-4" style={{ paddingTop: 40 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <MunamiMascot expression={mascotExpression} size={54} />
          </motion.div>
          <div>
            <p className="text-muted text-xs">{monthYearLabel(locale, activeMonth) || '...'}</p>
            <p className="text-text text-lg font-bold leading-tight">{t(locale, 'greeting', 'Ahmed')}</p>
          </div>
        </div>

        {/* ── Title + month switcher ── */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-text text-base font-semibold tracking-tight">
            {earlyMonth
              ? t(locale, 'summaryTitlePartial', monthLabel(locale, activeMonth) || '...')
              : t(locale, 'summaryTitle', monthLabel(locale, activeMonth) || '...')}
          </h1>
          {months.length > 0 && (
            <MonthSwitcher
              label={monthYearLabel(locale, activeMonth)}
              canPrev={canGoPrev}
              canNext={canGoNext}
              onPrev={() => canGoPrev && setSelectedMonth(months[monthIndex - 1])}
              onNext={() => canGoNext && setSelectedMonth(months[monthIndex + 1])}
              locale={locale}
            />
          )}
        </div>

        {/* ── Spent hero card ── */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeMonth}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="retro-hero border border-card-border rounded-[28px] px-5 pt-5 pb-5 mb-4"
            style={{ background: 'var(--grad-hero-card)', boxShadow: '0 2px 16px rgba(45,106,74,0.10)' }}
          >
            <p className="text-muted text-[10px] font-medium uppercase tracking-widest mb-2">
              {t(locale, 'youveSpent')}
            </p>
            <p className="munami-hero text-text tabular-nums">{formatSAR(spent)}</p>

            <div
              className="retro-verdict inline-flex items-center gap-1.5 mt-3 mb-5 rounded-full px-3 py-1.5"
              style={{ backgroundColor: 'rgba(45,106,74,0.1)' }}
            >
              <span className="text-primary text-xs font-semibold">{mascotVerdict}</span>
            </div>

            <div className="flex pt-4 border-t border-card-border">
              <div className="text-center flex-1">
                <p className="text-muted text-[10px] font-medium uppercase tracking-wide mb-1">
                  {isCarriedOver
                    ? t(locale, 'incomeCarriedOver', monthLabel(locale, incomeMonth))
                    : t(locale, 'income')}
                </p>
                <p className="text-positive text-sm font-bold tabular-nums">{formatSAR(income)}</p>
              </div>
              <div className="w-px bg-card-border self-stretch" />
              <div className="text-center flex-1">
                <p className="text-muted text-[10px] font-medium uppercase tracking-wide mb-1">
                  {t(locale, 'leftOver')}
                </p>
                <p className="text-text text-sm font-bold tabular-nums">{formatSAR(net)}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Donut chart ── */}
        <div
          className="bg-card border border-card-border rounded-[28px] p-5 mb-4"
          style={{ boxShadow: '0 2px 16px rgba(45,106,74,0.06)' }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {chartData.length > 0 ? (
              <motion.div
                key={activeMonth}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <SpendingDonut
                  data={chartData}
                  total={Math.round(spent)}
                  cardBg="var(--color-card)"
                  locale={locale}
                />
              </motion.div>
            ) : (
              <p className="text-muted text-center py-10">{t(locale, 'loading')}</p>
            )}
          </AnimatePresence>
        </div>

        {/* ── Insight cards ── */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeMonth + locale}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex flex-col gap-3"
          >
            {insightsLoading && !aiCards.length && baseCards.map((card, i) => (
              <InsightCard key={i} index={i} {...card} loading />
            ))}
            {(!insightsLoading || aiCards.length > 0) && cards.map((card, i) => (
              <InsightCard key={i} index={i} {...card} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav active={activeTab} onTabChange={setActiveTab} />

      {/* Hamburger — lives in the reserved "system strip" (top 0–56px) that
          every tab keeps clear of content; covered by SettingsPanel when open.
          position:fixed (not absolute) so it never moves with any tab's own
          scroll container, on every tab. PhoneFrame's own transform:scale()
          wrapper becomes the containing block for fixed descendants, so this
          stays pinned to the phone screen, not the real browser viewport. */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="z-30 flex items-center justify-center"
        style={{
          // +14 on each offset compensates for PhoneFrame's bezel padding: a
          // fixed element's containing block becomes the nearest ancestor
          // with a transform (PhoneFrame's scaled bezel div, 14px bigger on
          // every side than the screen itself), not the screen div, so a
          // bare top:18/right:16 would land 14px closer to the bezel's edge
          // than intended.
          position: 'fixed', top: 32, right: 30, width: 36, height: 36,
          background: '#FFFFFF', borderRadius: 11,
          border: '2.5px solid #000000', boxShadow: '3px 3px 0 #000000',
          color: '#000000',
        }}
        aria-label="Open settings"
      >
        <svg width="16" height="13" viewBox="0 0 15 12" fill="none">
          <path d="M1 1h13M1 6h13M1 11h13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence>
        {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}

export default App
