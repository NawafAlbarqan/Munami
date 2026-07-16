import { useEffect, useRef, useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Papa from 'papaparse'
import BottomNav from './components/BottomNav'
import TransactionsTab from './components/TransactionsTab'
import AccountsTab from './components/AccountsTab'
import BudgetTab, { BudgetDetails } from './components/BudgetTab'
import GoalsTab from './components/GoalsTab'
import CopilotTab from './components/CopilotTab'
import SettingsPanel from './components/SettingsPanel'
import { HomeWalletCards } from './components/BankCardStack'
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
import { DEFAULT_BILLS, DEFAULT_BUDGET_LIMITS } from './lib/budgetData'
import accountsData from '../data/munami_accounts.json'
import {
  ArrowLeft,
  Banknote,
  Eye,
  EyeOff,
  PieChart,
  Settings,
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
  const [bankRows, setBankRows] = useState([])
  const [manualTransactions, setManualTransactions] = useState(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = JSON.parse(window.localStorage.getItem('munami-cash-transactions') || '[]')
      return Array.isArray(stored) ? stored : []
    } catch {
      return []
    }
  })
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [activeTab, setActiveTab] = useState('home')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [accountsOpen, setAccountsOpen] = useState(false)
  const [accountsInitialAction, setAccountsInitialAction] = useState(null)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [walletExpanded, setWalletExpanded] = useState(false)
  const [funds, setFunds] = useState(accountsData.funds)
  const [unallocated, setUnallocated] = useState(accountsData.unallocated_sar)
  const [balanceHidden, setBalanceHidden] = useState(false)
  const [cashBalance, setCashBalance] = useState(() => {
    if (typeof window === 'undefined') return 0
    const stored = Number(window.localStorage.getItem('munami-primary-cash'))
    return Number.isFinite(stored) && stored >= 0 ? stored : 0
  })
  const [budgetLimits, setBudgetLimits] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_BUDGET_LIMITS
    try {
      const stored = JSON.parse(window.localStorage.getItem('munami-budget-limits') || 'null')
      return Array.isArray(stored) ? stored : DEFAULT_BUDGET_LIMITS
    } catch {
      return DEFAULT_BUDGET_LIMITS
    }
  })
  const [bills, setBills] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_BILLS
    try {
      const stored = JSON.parse(window.localStorage.getItem('munami-upcoming-bills') || 'null')
      return Array.isArray(stored) ? stored : DEFAULT_BILLS
    } catch {
      return DEFAULT_BILLS
    }
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
      complete: (result) => setBankRows(result.data.filter((r) => r.transaction_id)),
    })
  }, [])

  const rows = useMemo(() => [...bankRows, ...manualTransactions], [bankRows, manualTransactions])

  useEffect(() => {
    window.localStorage.setItem('munami-primary-cash', String(cashBalance))
  }, [cashBalance])

  useEffect(() => {
    window.localStorage.setItem('munami-cash-transactions', JSON.stringify(manualTransactions))
  }, [manualTransactions])

  useEffect(() => {
    window.localStorage.setItem('munami-budget-limits', JSON.stringify(budgetLimits))
  }, [budgetLimits])

  useEffect(() => {
    window.localStorage.setItem('munami-upcoming-bills', JSON.stringify(bills))
  }, [bills])

  async function handleCashTransaction({ action, amount, description }) {
    const direction = action === 'withdraw' ? 'debit' : 'credit'
    let category = 'Other'

    if (description.trim()) {
      try {
        const response = await fetch('/api/categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchant: description.trim() }),
        })
        if (response.ok) category = (await response.json()).category || category
      } catch {
        // The entry still saves when AI categorization is unavailable.
      }
    }

    const now = new Date()
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
    const merchant = description.trim() || (locale === 'ar'
      ? (direction === 'credit' ? 'إضافة نقدية' : 'سحب نقدي')
      : (direction === 'credit' ? 'Cash deposit' : 'Cash withdrawal'))

    setCashBalance((current) => direction === 'credit' ? current + amount : current - amount)
    setManualTransactions((current) => [...current, {
      transaction_id: `CASH-${Date.now()}`,
      account_id: 'PRIMARY-CASH',
      bank: locale === 'ar' ? 'النقد الأساسي' : 'Primary Cash',
      account_type: 'Cash',
      timestamp: now.toISOString(),
      date,
      merchant_raw: merchant,
      merchant,
      category,
      amount_sar: amount,
      direction,
      currency: 'SAR',
      manual: true,
    }])
  }

  useEffect(() => {
    if (activeTab !== 'home') setWalletExpanded(false)
  }, [activeTab])

  const debits = applyCategoryMap(getDebits(rows))
  const credits = getCredits(rows)

  const months = listMonths(rows)
  const latestMonth = getLatestMonth(rows)
  const activeMonth = selectedMonth || latestMonth
  const monthIndex = months.indexOf(activeMonth)

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
  const walletAccounts = useMemo(() => [
    {
      account_id: 'PRIMARY-CASH',
      bank: locale === 'ar' ? 'النقد الأساسي' : 'Primary Cash',
      type: locale === 'ar' ? 'رصيد يدوي' : 'Manual balance',
      balance_sar: cashBalance,
      color: '#F46F5B',
      manual: true,
    },
    ...accountsData.accounts,
  ], [cashBalance, locale])
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
      budgets: budgetLimits.map((budget) => ({
        category: budget.category,
        limit: budget.limit,
        spent: Math.round(groupByCategory(currentMonthDebits)[budget.category] || 0),
      })),
      upcomingBills: bills.map((bill) => ({ name: bill.name, amount: bill.amount, dueDate: bill.dueDate })),
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
  }, [rows, locale, budgetLimits, bills])

  const appDir = dir(locale)

  return (
    <div dir={appDir} className="absolute inset-0">
      {activeTab === 'transactions' && <TransactionsTab rows={rows} />}
      {activeTab === 'goals' && <GoalsTab rows={rows} />}
      {activeTab === 'copilot' && <CopilotTab financialContext={financialContext} />}
      {activeTab === 'budget' && (
        <BudgetTab
          activeMonth={activeMonth}
          months={months}
          monthIndex={monthIndex}
          onMonthChange={setSelectedMonth}
          income={income}
          spent={spent}
          net={net}
          savings={savings}
          savingsRate={savingsRate}
          spendDelta={spendDelta}
          chartData={chartData}
          onOpenBudget={() => setBudgetOpen(true)}
          baseCards={baseCards}
          aiCards={aiCards}
          cards={cards}
          insightsLoading={insightsLoading}
        />
      )}

      {/* Overview tab */}
      <div
        className="monami-page home-page scroll-thin"
        style={{ display: activeTab === 'home' ? undefined : 'none' }}
      >
        <header className={`reference-home-head ${appDir === 'rtl' ? 'is-rtl' : 'is-ltr'}`}>
          <button type="button" className="header-action menu-action" onClick={() => setSettingsOpen(true)} aria-label={t(locale, 'settings')}>
            <Settings size={24} />
          </button>
          <div className="greeting-copy">
            <p>{todayLabel}</p>
            <h1>{locale === 'ar' ? 'مرحباً، أحمد' : 'Welcome, Ahmed'}</h1>
          </div>
        </header>

        {/* ── Spent hero card ── */}
        <AnimatePresence>
          {walletExpanded && (
            <motion.button
              type="button"
              className="wallet-inline-backdrop"
              aria-label={locale === 'ar' ? 'إغلاق الحسابات' : 'Close accounts'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={() => setWalletExpanded(false)}
            />
          )}
        </AnimatePresence>
        <motion.section
          className={`wallet-stack ${walletExpanded ? 'wallet-stack-expanded' : ''}`}
          role="button"
          tabIndex={0}
          aria-expanded={walletExpanded}
          aria-label={locale === 'ar' ? 'عرض الحسابات' : 'Show accounts'}
          onClick={() => setWalletExpanded((value) => !value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setWalletExpanded((value) => !value)
            }
          }}
        >
          {!walletExpanded && <>
            <div className="wallet-account-peek peek-snb"><span>SNB</span></div>
            <div className="wallet-account-peek peek-rajhi"><span>Al Rajhi</span></div>
            <div className="wallet-account-peek peek-cash"><span>{locale === 'ar' ? 'النقد الأساسي' : 'Primary Cash'}</span></div>
          </>}
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
              <button type="button" onClick={(event) => { event.stopPropagation(); setWalletExpanded((value) => !value) }}>{t(locale, 'acrossAccounts', accountCount)}</button>
            </div>
          </motion.div>
        </AnimatePresence>
          <HomeWalletCards accounts={walletAccounts} locale={locale} expanded={walletExpanded} onCollapse={() => setWalletExpanded(false)} />
        </motion.section>

        <section className="quick-section">
          <h2>{locale === 'ar' ? 'إجراءات سريعة' : 'Quick actions'}</h2>
          <div className="quick-actions">
            <button type="button" onClick={() => { setAccountsInitialAction('cash'); setAccountsOpen(true) }}>
              <span><Banknote /></span><span className="quick-action-copy"><strong>{t(locale, 'editCash')}</strong><small>{t(locale, 'editCashDesc')}</small></span>
            </button>
            <button type="button" onClick={() => setBudgetOpen(true)}>
              <span><PieChart /></span><span className="quick-action-copy"><strong>{t(locale, 'openBudget')}</strong><small>{t(locale, 'openBudgetDesc')}</small></span>
            </button>
          </div>
        </section>

        <section className="home-funds-section">
          <div className="home-funds-head">
            <h2>{t(locale, 'yourFunds')}</h2>
            <button type="button" onClick={() => setAccountsOpen(true)}>{locale === 'ar' ? 'عرض الكل' : 'View all'}</button>
          </div>
          <button type="button" className="home-unallocated" onClick={() => setAccountsOpen(true)}>
            <span>{t(locale, 'unallocated')}</span>
            <strong>{formatSAR(unallocated)}</strong>
            <small>{t(locale, 'freeToAssign')}</small>
          </button>
          <div className="home-fund-list">
            {funds.map((fund) => {
              const progress = fund.target_sar > 0 ? Math.min(100, Math.round((fund.balance_sar / fund.target_sar) * 100)) : 0
              return (
                <button type="button" key={fund.id} className="home-fund-card" onClick={() => setAccountsOpen(true)}>
                  <span className="home-fund-color" style={{ background: fund.color }} />
                  <span className="home-fund-copy"><strong>{fund.name}</strong><small>{formatSAR(fund.balance_sar)} / {formatSAR(fund.target_sar)}</small></span>
                  <b>{progress}%</b>
                  <i><span style={{ width: `${progress}%`, background: fund.color }} /></i>
                </button>
              )
            })}
          </div>
        </section>

      </div>

      {!accountsOpen && !budgetOpen && <BottomNav active={activeTab} onTabChange={setActiveTab} />}

      <AnimatePresence>
        {budgetOpen && (
          <motion.div className="accounts-flow" initial={{ x: appDir === 'rtl' ? '-100%' : '100%', opacity: 0.88 }} animate={{ x: 0, opacity: 1 }} exit={{ x: appDir === 'rtl' ? '-100%' : '100%', opacity: 0.88 }} transition={{ type: 'spring', stiffness: 330, damping: 34, mass: 0.82 }}>
            <button className="flow-back" type="button" onClick={() => setBudgetOpen(false)} aria-label={t(locale, 'close')}><ArrowLeft size={21} /></button>
            <BudgetDetails
              rows={rows}
              activeMonth={activeMonth}
              limits={budgetLimits}
              onLimitsChange={setBudgetLimits}
              bills={bills}
              onBillsChange={setBills}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {accountsOpen && (
          <motion.div className="accounts-flow" initial={{ x: appDir === 'rtl' ? '-100%' : '100%', opacity: 0.88 }} animate={{ x: 0, opacity: 1 }} exit={{ x: appDir === 'rtl' ? '-100%' : '100%', opacity: 0.88 }} transition={{ type: 'spring', stiffness: 330, damping: 34, mass: 0.82 }}>
            <button className="flow-back" type="button" onClick={() => { setAccountsOpen(false); setAccountsInitialAction(null) }} aria-label={t(locale, 'close')}><ArrowLeft size={21} /></button>
            <AccountsTab
              cashBalance={cashBalance}
              onCashTransaction={handleCashTransaction}
              funds={funds}
              onFundsChange={setFunds}
              unallocated={unallocated}
              onUnallocatedChange={setUnallocated}
              initialAction={accountsInitialAction}
            />
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
