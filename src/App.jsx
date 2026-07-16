import { useEffect, useRef, useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Papa from 'papaparse'
import SpendingDonut from './components/SpendingDonut'
import InsightCard from './components/InsightCard'
import MonthSwitcher from './components/MonthSwitcher'
import BottomNav from './components/BottomNav'
import TransactionsTab from './components/TransactionsTab'
import AccountsTab from './components/AccountsTab'
import BudgetTab from './components/BudgetTab'
import GoalsTab from './components/GoalsTab'
import CopilotTab from './components/CopilotTab'
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
import {
  ArrowLeft,
  ArrowLeftRight,
  Bell,
  Bot,
  Eye,
  EyeOff,
  Menu,
  Plus,
  ReceiptText,
} from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState('home')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [accountsOpen, setAccountsOpen] = useState(false)
  const [balanceHidden, setBalanceHidden] = useState(false)
  const [cashBalance, setCashBalance] = useState(() => {
    if (typeof window === 'undefined') return 0
    const stored = Number(window.localStorage.getItem('munami-primary-cash'))
    return Number.isFinite(stored) && stored >= 0 ? stored : 0
  })

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

  useEffect(() => {
    window.localStorage.setItem('munami-primary-cash', String(cashBalance))
  }, [cashBalance])

  const debits = applyCategoryMap(getDebits(rows))
  const credits = getCredits(rows)

  const months = listMonths(rows)
  const latestMonth = getLatestMonth(rows)
  const activeMonth = selectedMonth || latestMonth
  const monthIndex = months.indexOf(activeMonth)
  const canGoPrev = monthIndex > 0
  const canGoNext = monthIndex >= 0 && monthIndex < months.length - 1

  const monthDebits = debits.filter((r) => monthKey(r.date) === activeMonth)
  const { income } = resolveMonthIncome(credits, activeMonth)
  const spent = sumAmount(monthDebits)
  const net = income - spent
  const previousMonth = monthIndex > 0 ? months[monthIndex - 1] : null
  const previousSpent = previousMonth
    ? sumAmount(debits.filter((row) => monthKey(row.date) === previousMonth))
    : 0
  const spendDelta = previousSpent > 0 ? Math.round(((spent - previousSpent) / previousSpent) * 100) : 0
  const savings = Math.max(net, 0)
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0
  const totalBalance = accountsData.total_balance_sar + cashBalance
  const accountCount = accountsData.accounts.length + 1
  const todayLabel = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())

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

  const appDir = dir(locale)

  return (
    <div dir={appDir} className="absolute inset-0">
      {activeTab === 'transactions' && <TransactionsTab rows={rows} />}
      {activeTab === 'goals' && <GoalsTab rows={rows} />}
      {activeTab === 'copilot' && <CopilotTab financialContext={financialContext} />}
      {activeTab === 'budget' && <BudgetTab rows={rows} />}

      {/* Overview tab */}
      <div
        className="monami-page home-page scroll-thin"
        style={{ display: activeTab === 'home' ? undefined : 'none' }}
      >
        <header className="reference-home-head">
          <button type="button" className="header-action menu-action" onClick={() => setSettingsOpen(true)} aria-label={t(locale, 'settings')}>
            <Menu size={26} />
          </button>
          <div className="greeting-copy">
            <p>{todayLabel}</p>
            <h1>{locale === 'ar' ? 'مرحباً، طاهر' : 'Welcome, Taher'}</h1>
          </div>
          <button type="button" className="header-action notification-action" onClick={() => setSettingsOpen(true)} aria-label={t(locale, 'notifications')}>
            <Bell size={23} />
            <i />
          </button>
        </header>

        {/* ── Spent hero card ── */}
        <section
          className="wallet-stack"
          role="button"
          tabIndex={0}
          aria-label={locale === 'ar' ? 'فتح جميع الحسابات' : 'Open all accounts'}
          onClick={() => setAccountsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') setAccountsOpen(true)
          }}
        >
          <div className="wallet-account-peek peek-snb"><span>SNB</span></div>
          <div className="wallet-account-peek peek-rajhi"><span>Al Rajhi</span></div>
          <div className="wallet-account-peek peek-cash"><span>{locale === 'ar' ? 'النقد الأساسي' : 'Primary Cash'}</span></div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeMonth}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="balance-card"
          >
            <div className="balance-label">
              <span>{t(locale, 'yourTotalBalance')}</span>
              <button type="button" onClick={(event) => { event.stopPropagation(); setBalanceHidden((value) => !value) }} aria-label={balanceHidden ? 'Show balance' : 'Hide balance'}>
                {balanceHidden ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="balance-value">{balanceHidden ? '••••••' : formatSAR(totalBalance)}</p>
            <div className="balance-foot">
              <span className="balance-change">{spendDelta <= 0 ? '+' : '-'}{Math.abs(spendDelta)}% {locale === 'ar' ? 'عن الشهر الماضي' : 'from last month'}</span>
              <button type="button" onClick={(event) => { event.stopPropagation(); setAccountsOpen(true) }}>{t(locale, 'acrossAccounts', accountCount)}</button>
            </div>
          </motion.div>
        </AnimatePresence>
        </section>

        <section className="quick-section">
          <h2>{locale === 'ar' ? 'إجراءات سريعة' : 'Quick actions'}</h2>
          <div className="quick-actions">
            <button type="button" onClick={() => setAccountsOpen(true)}><span><ArrowLeftRight /></span><strong>{locale === 'ar' ? 'تحويل سريع' : 'Quick transfer'}</strong></button>
            <button type="button" onClick={() => setActiveTab('transactions')}><span><ReceiptText /></span><strong>{locale === 'ar' ? 'دفع فاتورة' : 'Pay a bill'}</strong></button>
            <button type="button" onClick={() => setActiveTab('transactions')}><span><Plus /></span><strong>{locale === 'ar' ? 'إضافة مصروف' : 'Add expense'}</strong></button>
            <button type="button" onClick={() => setActiveTab('copilot')}><span><Bot /></span><strong>{locale === 'ar' ? 'طلب مساعدة' : 'Ask for help'}</strong></button>
          </div>
        </section>

        <section className="month-overview">
          <div className="month-overview-head">
            <h2>{locale === 'ar' ? 'نظرة هذا الشهر' : 'This month'}</h2>
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
          <div className="metric-grid">
            <article><span>{t(locale, 'income')}</span><strong>{formatSAR(income)}</strong><small className="metric-positive">{savingsRate}%+</small></article>
            <article><span>{t(locale, 'spent')}</span><strong>{formatSAR(spent)}</strong><small className={spendDelta > 0 ? 'metric-alert' : 'metric-positive'}>{Math.abs(spendDelta)}%{spendDelta > 0 ? '+' : '-'}</small></article>
            <article><span>{locale === 'ar' ? 'الادخار' : 'Savings'}</span><strong>{formatSAR(savings)}</strong></article>
            <article><span>{t(locale, 'leftOver')}</span><strong>{formatSAR(net)}</strong></article>
          </div>
        </section>

        {/* ── Donut chart ── */}
        <div
          className="spending-panel"
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
            className="insight-list"
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

      {!accountsOpen && <BottomNav active={activeTab} onTabChange={setActiveTab} />}

      {/* Hamburger — lives in the reserved "system strip" (top 0–56px) that
          every tab keeps clear of content; covered by SettingsPanel when open.
          position:fixed (not absolute) so it never moves with any tab's own
          scroll container, on every tab. PhoneFrame's own transform:scale()
          wrapper becomes the containing block for fixed descendants, so this
          stays pinned to the phone screen, not the real browser viewport. */}
      {!accountsOpen && activeTab !== 'home' && <button
        onClick={() => setSettingsOpen(true)}
        className={`settings-trigger ${appDir === 'rtl' ? 'settings-trigger-rtl' : ''}`}
        style={{
          // +14 on each offset compensates for PhoneFrame's bezel padding: a
          // fixed element's containing block becomes the nearest ancestor
          // with a transform (PhoneFrame's scaled bezel div, 14px bigger on
          // every side than the screen itself), not the screen div, so a
          // bare top:18/right:16 would land 14px closer to the bezel's edge
          // than intended.
          position: 'fixed', width: 38, height: 38,
          background: 'var(--color-card)', borderRadius: 13,
          border: '1px solid var(--color-card-border)',
          boxShadow: '0 8px 24px rgba(17, 35, 58, 0.10)',
          color: 'var(--color-navy)',
        }}
        aria-label="Open settings"
      >
        <Menu size={19} />
      </button>}

      <AnimatePresence>
        {accountsOpen && (
          <motion.div className="accounts-flow" initial={{ x: appDir === 'rtl' ? '-100%' : '100%', opacity: 0.88 }} animate={{ x: 0, opacity: 1 }} exit={{ x: appDir === 'rtl' ? '-100%' : '100%', opacity: 0.88 }} transition={{ type: 'spring', stiffness: 330, damping: 34, mass: 0.82 }}>
            <button className="flow-back" type="button" onClick={() => setAccountsOpen(false)} aria-label={t(locale, 'close')}><ArrowLeft size={21} /></button>
            <AccountsTab cashBalance={cashBalance} onCashBalanceChange={setCashBalance} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}

export default App
