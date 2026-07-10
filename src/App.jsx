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
import GrowthMark from './components/GrowthMark'
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
        icon: isGood(summary.direction) ? '✅' : '⚠️',
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
      icon: isGood(change.direction) ? '✅' : '⚠️',
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
  const financialContext = useMemo(() => {
    if (!rows.length) return null

    // Precompute monthly totals for all months — AI reads these, never the raw CSV
    const allDebits = applyCategoryMap(getDebits(rows))
    const allCredits = getCredits(rows)
    const allMonths = listMonths(rows)

    const monthlyHistory = allMonths.map((m) => {
      const mDebits = allDebits.filter((r) => monthKey(r.date) === m)
      const mCredits = allCredits.filter((r) => monthKey(r.date) === m)
      return {
        month: m,
        spend: Math.round(sumAmount(mDebits)),
        income: Math.round(sumAmount(mCredits)),
      }
    })

    // Full (non-partial) months only for averages and extremes
    const fullMonthHistory = monthlyHistory.filter((mh) => !isEarlyMonth(rows, mh.month))
    const avgMonthlySpend = fullMonthHistory.length
      ? Math.round(fullMonthHistory.reduce((s, m) => s + m.spend, 0) / fullMonthHistory.length)
      : 0
    const sortedBySpend = [...fullMonthHistory].sort((a, b) => b.spend - a.spend)

    return {
      totalBalance: accountsData.total_balance_sar,
      unallocated: accountsData.unallocated_sar,
      allocated: accountsData.allocated_sar,
      accounts: accountsData.accounts.map((a) => ({ bank: a.bank, balance: a.balance_sar })),
      funds: accountsData.funds.map((f) => ({ name: f.name, balance: f.balance_sar, target: f.target_sar })),
      month: monthYearLabel(locale, activeMonth) || 'current month',
      spent: Math.round(spent),
      income,
      daysElapsed,
      isEarlyMonth: earlyMonth,
      topCategories: chartData.slice(0, 4).map((d) => ({
        category: d.category,
        amount: d.amount,
        pct: spent > 0 ? Math.round((d.amount / spent) * 100) : 0,
      })),
      budgets: [
        { category: 'Shopping', limit: 2000, spent: Math.round(spendByCategory['Shopping'] || 0) },
        { category: 'Food & Groceries', limit: 1500, spent: Math.round(spendByCategory['Food & Groceries'] || 0) },
        { category: 'Entertainment', limit: 800, spent: Math.round(spendByCategory['Entertainment'] || 0) },
      ],
      goals: {
        emergencyFund: { current: 6000, target: 15000 },
        level: 7,
        xpCurrent: 2340,
        xpMax: 3000,
        streak: 7,
      },
      // Full spending history across all months in the dataset
      monthlyHistory,
      avgMonthlySpend,
      highestMonth: sortedBySpend[0] || null,
      lowestMonth: sortedBySpend[sortedBySpend.length - 1] || null,
    }
  }, [rows, spent, income, daysElapsed, earlyMonth, activeMonth, chartData, spendByCategory, locale])

  // ── Mascot expression ─────────────────────────────────────────────────────
  const spendRatio = income > 0 ? spent / income : 0
  const goodCount = cards.filter((c) => c.accent === 'positive').length
  const badCount = cards.filter((c) => c.accent === 'caution').length
  let mascotExpression = 'happy'
  if (rows.length > 0 && !earlyMonth) {
    if (spendRatio > 0.85 || badCount >= 2) mascotExpression = 'concerned'
    else if (goodCount >= 2) mascotExpression = 'celebrating'
  }
  const mascotVerdict = earlyMonth
    ? t(locale, 'mascotEarly', daysElapsed)
    : mascotExpression === 'celebrating'
      ? t(locale, 'mascotCelebrating')
      : mascotExpression === 'concerned'
        ? t(locale, 'mascotConcerned')
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
        <div className="flex items-center gap-3 mb-4" style={{ paddingTop: 28 }}>
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
            className="bg-card border border-card-border rounded-[28px] px-5 pt-5 pb-5 mb-4"
            style={{ boxShadow: '0 2px 16px rgba(45,106,74,0.08)' }}
          >
            <p className="text-muted text-[10px] font-medium uppercase tracking-widest mb-2">
              {t(locale, 'youveSpent')}
            </p>
            <p className="munami-hero text-text tabular-nums">{formatSAR(spent)}</p>

            <div
              className="inline-flex items-center gap-1.5 mt-3 mb-5 rounded-full px-3 py-1.5"
              style={{ backgroundColor: 'rgba(45,106,74,0.1)' }}
            >
              <GrowthMark size={11} color="var(--color-primary)" />
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
                  cardBg="#FFFFFF"
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

      {/* Hamburger — floats above all tab content, covered by SettingsPanel when open */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="absolute z-30 rounded-full bg-card border-[0.5px] border-card-border flex items-center justify-center"
        style={{ top: 12, right: 14, width: 32, height: 32, boxShadow: '0 1px 6px rgba(45,106,74,0.10)' }}
        aria-label="Open settings"
      >
        <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
          <path d="M1 1h13M1 6h13M1 11h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence>
        {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}

export default App
