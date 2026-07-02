import { useEffect, useState } from 'react'
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

function PlaceholderTab({ label }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-page gap-2">
      <p className="text-text text-xl font-bold">{label}</p>
      <p className="text-muted text-sm">Coming soon</p>
    </div>
  )
}
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
import { phraseCategoryChange, phrasePace, phrasePriorMonthSummary } from './lib/aiCoach'
import { t, monthLabel, monthYearLabel, formatSAR, DIR } from './lib/i18n'

function App() {
  const [rows, setRows] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

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
  // "Today" is always derived from the data's own latest transaction date,
  // never the system clock — keeps the demo deterministic.
  const latestMonth = getLatestMonth(rows)
  const activeMonth = selectedMonth || latestMonth
  const monthIndex = months.indexOf(activeMonth)
  const canGoPrev = monthIndex > 0
  const canGoNext = monthIndex >= 0 && monthIndex < months.length - 1

  const monthDebits = debits.filter((r) => monthKey(r.date) === activeMonth)

  const { income, isCarriedOver, incomeMonth } = resolveMonthIncome(credits, activeMonth)
  const spent = sumAmount(monthDebits)
  const net = income - spent

  // Donut: spending only, grouped by the merged categories. Income never appears here.
  const chartData = Object.entries(groupByCategory(monthDebits))
    .map(([category, amount]) => ({ category, amount: Math.round(amount) }))
    .sort((a, b) => b.amount - a.amount)

  const earlyMonth = rows.length > 0 && isEarlyMonth(rows, activeMonth)
  const daysElapsed = daysWithDataInMonth(debits, activeMonth)

  let cards
  if (rows.length === 0) {
    cards = []
  } else if (earlyMonth) {
    // Not enough days in the selected month for a fair comparison — show
    // a pace projection plus a carryover summary of the last full month.
    cards = []

    const projectedSpend = Math.round((spent / (daysElapsed || 1)) * daysInMonth(activeMonth))
    cards.push({
      icon: '📈',
      accent: 'rewards',
      text: phrasePace({ daysElapsed, spentSoFar: Math.round(spent), projectedSpend }),
    })

    const summary = summarizePriorMonth(debits, activeMonth)
    if (summary) {
      cards.push({
        icon: isGood(summary.direction) ? '✅' : '⚠️',
        accent: isGood(summary.direction) ? 'positive' : 'caution',
        text: phrasePriorMonthSummary({
          priorMonthLabel: monthLabel(summary.priorMonth),
          priorSpent: summary.priorSpent,
          pctChange: summary.pctChange,
          direction: summary.direction,
        }),
      })
    }
  } else {
    const changes = computeCategoryChanges(debits, activeMonth)
    cards = topChanges(changes, 3).map((change) => ({
      icon: isGood(change.direction) ? '✅' : '⚠️',
      category: change.category,
      arrow: change.direction === 'down' ? '▼' : '▲',
      pct: Math.abs(change.pctChange),
      accent: isGood(change.direction) ? 'positive' : 'caution',
      text: phraseCategoryChange(change),
    }))
  }

  // Mascot expression — derived from current month's spend health
  const spendRatio = income > 0 ? spent / income : 0
  const goodCount = cards.filter((c) => c.accent === 'positive').length
  const badCount = cards.filter((c) => c.accent === 'caution').length
  let mascotExpression = 'happy'
  if (rows.length > 0 && !earlyMonth) {
    if (spendRatio > 0.85 || badCount >= 2) mascotExpression = 'concerned'
    else if (goodCount >= 2) mascotExpression = 'celebrating'
  }
  const mascotVerdict = earlyMonth
    ? `${daysElapsed} day${daysElapsed !== 1 ? 's' : ''} in — keep it up!`
    : mascotExpression === 'celebrating'
      ? 'Crushing it this month 🌿'
      : mascotExpression === 'concerned'
        ? "Let's reel it in a bit"
        : 'On track, keep going!'

  return (
    <>
      {activeTab === 'transactions' && <TransactionsTab rows={rows} />}
      {activeTab === 'goals' && <GoalsTab rows={rows} />}
      {activeTab === 'copilot' && <CopilotTab />}
      {activeTab === 'accounts' && <AccountsTab />}

      <div
        dir={DIR}
        className="theme-warm absolute inset-0 overflow-y-auto scroll-thin bg-page px-4 pt-5 pb-24"
        style={{ display: activeTab === 'overview' ? undefined : 'none' }}
      >
        {/* ── Mascot greeting ── */}
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <MunamiMascot expression={mascotExpression} size={54} />
          </motion.div>
          <div>
            <p className="text-muted text-xs">{monthYearLabel(activeMonth) || '...'}</p>
            <p className="text-text text-lg font-bold leading-tight">{t('greeting', 'Ahmed')}</p>
          </div>
        </div>

        {/* ── Title + month switcher ── */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-text text-base font-semibold tracking-tight">
            {earlyMonth
              ? t('summaryTitlePartial', monthLabel(activeMonth) || '...')
              : t('summaryTitle', monthLabel(activeMonth) || '...')}
          </h1>
          {months.length > 0 && (
            <MonthSwitcher
              label={monthYearLabel(activeMonth)}
              canPrev={canGoPrev}
              canNext={canGoNext}
              onPrev={() => canGoPrev && setSelectedMonth(months[monthIndex - 1])}
              onNext={() => canGoNext && setSelectedMonth(months[monthIndex + 1])}
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
              You've spent
            </p>
            <p className="munami-hero text-text tabular-nums">{formatSAR(spent)}</p>

            {/* منمّي's verdict pill */}
            <div
              className="inline-flex items-center gap-1.5 mt-3 mb-5 rounded-full px-3 py-1.5"
              style={{ backgroundColor: 'rgba(45,106,74,0.1)' }}
            >
              <GrowthMark size={11} color="var(--color-primary)" />
              <span className="text-primary text-xs font-semibold">{mascotVerdict}</span>
            </div>

            {/* Income + Left over */}
            <div className="flex pt-4 border-t border-card-border">
              <div className="text-center flex-1">
                <p className="text-muted text-[10px] font-medium uppercase tracking-wide mb-1">
                  {isCarriedOver ? t('incomeCarriedOver', monthLabel(incomeMonth)) : t('income')}
                </p>
                <p className="text-positive text-sm font-bold tabular-nums">{formatSAR(income)}</p>
              </div>
              <div className="w-px bg-card-border self-stretch" />
              <div className="text-center flex-1">
                <p className="text-muted text-[10px] font-medium uppercase tracking-wide mb-1">
                  Left over
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
                <SpendingDonut data={chartData} total={Math.round(spent)} cardBg="#FFFFFF" />
              </motion.div>
            ) : (
              <p className="text-muted text-center py-10">{t('loading')}</p>
            )}
          </AnimatePresence>
        </div>

        {/* ── Insight cards ── */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeMonth}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex flex-col gap-3"
          >
            {cards.map((card, i) => (
              <InsightCard key={i} index={i} {...card} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav active={activeTab} onTabChange={setActiveTab} />
    </>
  )
}

export default App
