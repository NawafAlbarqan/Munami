import { useMemo, useState } from 'react'
import { Check, Lightbulb, Pencil, Plus, ReceiptText, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useLocale } from '../lib/LocaleContext'
import { categoryName, formatSAR, t } from '../lib/i18n'
import { applyCategoryMap, getDebits, getLatestMonth, groupByCategory, monthKey } from '../lib/finance'
import { DEFAULT_BILLS, DEFAULT_BUDGET_LIMITS, futureDate } from '../lib/budgetData'
import MonthSwitcher from './MonthSwitcher'
import SpendingDonut from './SpendingDonut'
import InsightCard from './InsightCard'

export default function BudgetTab({
  activeMonth,
  months = [],
  monthIndex = -1,
  onMonthChange,
  income = 0,
  spent: overviewSpent = 0,
  net = 0,
  savings = 0,
  savingsRate = 0,
  spendDelta = 0,
  chartData = [],
  onOpenBudget,
  baseCards = [],
  aiCards = [],
  cards = [],
  insightsLoading = false,
}) {
  const { locale } = useLocale()

  return (
    <div className="monami-page budget-page scroll-thin">
      <header className="page-header">
        <p>{t(locale, 'monthlyOverviewEyebrow')}</p>
        <h1>{t(locale, 'monthlyOverview')}</h1>
      </header>

      <section className="monthly-tab-overview">
        {months.length > 0 && (
          <div className="monthly-tab-switcher">
            <MonthSwitcher
              label={new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date(`${activeMonth}-01T00:00:00`))}
              canPrev={monthIndex > 0}
              canNext={monthIndex >= 0 && monthIndex < months.length - 1}
              onPrev={() => monthIndex > 0 && onMonthChange?.(months[monthIndex - 1])}
              onNext={() => monthIndex < months.length - 1 && onMonthChange?.(months[monthIndex + 1])}
              locale={locale}
            />
          </div>
        )}
        <div className="metric-grid">
          <article><span>{t(locale, 'income')}</span><strong>{formatSAR(income)}</strong><small className={savingsRate > 0 ? 'metric-positive' : 'metric-neutral'} dir="ltr">{savingsRate > 0 ? '+' : ''}{savingsRate}%</small></article>
          <article><span>{t(locale, 'spent')}</span><strong>{formatSAR(overviewSpent)}</strong><small className={spendDelta === 0 ? 'metric-neutral' : 'metric-alert'} dir="ltr">{spendDelta > 0 ? '+' : ''}{spendDelta}%</small></article>
          <article><span>{t(locale, 'savings')}</span><strong>{formatSAR(savings)}</strong></article>
          <article><span>{t(locale, 'leftOver')}</span><strong>{formatSAR(net)}</strong></article>
        </div>
        <div className="spending-panel monthly-spending-panel">
          {chartData.length > 0 ? (
            <SpendingDonut data={chartData} total={Math.round(overviewSpent)} cardBg="var(--color-card)" locale={locale} />
          ) : (
            <p className="text-muted text-center py-10">{t(locale, 'loading')}</p>
          )}
        </div>
        <button type="button" className="open-budget-action" onClick={onOpenBudget}>
          <span><ReceiptText size={21} /></span>
          <span><strong>{t(locale, 'openBudget')}</strong><small>{t(locale, 'openBudgetDesc')}</small></span>
        </button>
      </section>

      <section className="monthly-suggestions">
        <h2>{locale === 'ar' ? 'اقتراحات منمّي' : 'Munami suggestions'}</h2>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${activeMonth}-${locale}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="insight-list"
          >
            {insightsLoading && !aiCards.length && baseCards.map((card, index) => (
              <InsightCard key={index} index={index} {...card} loading />
            ))}
            {(!insightsLoading || aiCards.length > 0) && cards.map((card, index) => (
              <InsightCard key={index} index={index} {...card} />
            ))}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  )
}

export function BudgetDetails({
  rows,
  activeMonth,
  limits = DEFAULT_BUDGET_LIMITS,
  onLimitsChange = () => {},
  bills = DEFAULT_BILLS,
  onBillsChange = () => {},
}) {
  const { locale } = useLocale()
  const [editor, setEditor] = useState(null)
  const [editingBudgets, setEditingBudgets] = useState(false)
  const [editingBills, setEditingBills] = useState(false)
  const budgets = useMemo(() => {
    const debits = applyCategoryMap(getDebits(rows || []))
    const month = activeMonth || getLatestMonth(rows || [])
    const grouped = groupByCategory(debits.filter((row) => monthKey(row.date) === month))
    return limits.map((item) => ({ ...item, spent: Math.round(grouped[item.category] || 0) }))
  }, [activeMonth, limits, rows])

  const spent = budgets.reduce((sum, item) => sum + item.spent, 0)
  const limit = budgets.reduce((sum, item) => sum + item.limit, 0)
  const used = limit ? Math.round((spent / limit) * 100) : 0
  const ring = Math.min(used, 100) * 3.6

  function openBudgetEditor(item) {
    setEditor({ type: 'budget', category: item.category, value: String(item.limit) })
  }

  function openBillEditor(bill = null) {
    setEditor({
      type: 'bill',
      id: bill?.id || null,
      name: bill?.name || '',
      amount: bill ? String(bill.amount) : '',
      dueDate: bill?.dueDate || futureDate(7),
    })
  }

  function saveEditor() {
    if (editor?.type === 'budget') {
      const value = Number(editor.value)
      if (!Number.isFinite(value) || value <= 0) return
      onLimitsChange((current) => current.map((item) => item.category === editor.category ? { ...item, limit: value } : item))
      setEditor(null)
      return
    }

    if (editor?.type === 'bill') {
      const amount = Number(editor.amount)
      const name = editor.name.trim()
      if (!name || !Number.isFinite(amount) || amount <= 0 || !editor.dueDate) return
      onBillsChange((current) => editor.id
        ? current.map((bill) => bill.id === editor.id ? { ...bill, name, amount, dueDate: editor.dueDate } : bill)
        : [...current, { id: `bill-${Date.now()}`, name, amount, dueDate: editor.dueDate }])
      setEditor(null)
    }
  }

  function deleteBill() {
    if (editor?.type !== 'bill' || !editor.id) return
    onBillsChange((current) => current.filter((bill) => bill.id !== editor.id))
    setEditor(null)
  }

  function formatDueDate(value) {
    if (!value) return ''
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    }).format(new Date(`${value}T00:00:00`))
  }

  return (
    <div className="monami-page budget-page budget-detail-page scroll-thin">
      <header className="page-header">
        <p>{t(locale, 'budgetEyebrow')}</p>
        <h1>{t(locale, 'navBudget')}</h1>
      </header>

      <section className="budget-summary">
        <div className="budget-ring" style={{ '--ring': `${ring}deg` }}>
          <div><strong>{used}%</strong><span>{t(locale, 'budgetUsed')}</span></div>
        </div>
        <div className="budget-summary-copy">
          <span>{t(locale, 'budgetSpent')}</span>
          <strong>{formatSAR(spent)}</strong>
          <small>{t(locale, 'budgetOf')} {formatSAR(limit)}</small>
        </div>
      </section>

      <section className="content-section">
        <div className="section-title">
          <h2>{t(locale, 'budgetCategories')}</h2>
          <div className="section-title-actions">
            <span>{budgets.length}</span>
            <button
              type="button"
              className={`section-edit-action ${editingBudgets ? 'is-active' : ''}`}
              onClick={() => setEditingBudgets((current) => !current)}
              aria-label={editingBudgets ? t(locale, 'done') : t(locale, 'editBudget')}
            >
              {editingBudgets ? t(locale, 'done') : <Pencil size={14} />}
            </button>
          </div>
        </div>
        <div className="budget-list">
          {budgets.map((item, index) => {
            const pct = item.limit ? Math.round((item.spent / item.limit) * 100) : 0
            const exceeded = pct > 100
            return (
              <motion.div className={`budget-row ${exceeded ? 'is-alert' : ''}`} key={item.category} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <div className={`budget-row-head ${editingBudgets ? 'is-editing' : ''}`}>
                  <span className="category-mark" style={{ background: item.color }} />
                  <strong>{categoryName(locale, item.category)}</strong>
                  {pct < 70 ? <Check size={16} /> : <span className="budget-status-spacer" />}
                  <span className="budget-amount">{formatSAR(item.spent)} / {formatSAR(item.limit)}</span>
                  {editingBudgets && <button type="button" className="row-edit-action" onClick={() => openBudgetEditor(item)} aria-label={`${t(locale, 'editBudget')} ${categoryName(locale, item.category)}`}><Pencil size={14} /></button>}
                </div>
                <div className="progress-track"><i style={{ width: `${Math.min(pct, 100)}%`, background: exceeded ? 'var(--alert)' : item.color }} /></div>
                <small>{exceeded ? t(locale, 'overBudget') : `${pct}%`}</small>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="content-section">
        <div className="section-title">
          <h2>{t(locale, 'upcomingBills')}</h2>
          <div className="section-title-actions">
            <span>{bills.length}</span>
            <button
              type="button"
              className={`section-edit-action ${editingBills ? 'is-active' : ''}`}
              onClick={() => setEditingBills((current) => !current)}
              aria-label={editingBills ? t(locale, 'done') : t(locale, 'editBills')}
            >
              {editingBills ? t(locale, 'done') : <Pencil size={14} />}
            </button>
            {editingBills && <button type="button" className="section-add-action" onClick={() => openBillEditor()} aria-label={t(locale, 'addBill')}><Plus size={17} /></button>}
          </div>
        </div>
        <div className="bill-list">
          {bills.map((bill) => (
            <div key={bill.id}>
              <ReceiptText size={18} />
              <span><strong>{bill.name}</strong><small>{formatDueDate(bill.dueDate)}</small></span>
              <b>{formatSAR(bill.amount)}</b>
              {editingBills && <button type="button" className="row-edit-action" onClick={() => openBillEditor(bill)} aria-label={`${t(locale, 'editBill')} ${bill.name}`}><Pencil size={14} /></button>}
            </div>
          ))}
        </div>
      </section>

      <section className="smart-note"><Lightbulb size={21} /><div><strong>{t(locale, 'smartRecommendation')}</strong><p>{t(locale, 'budgetRecommendation')}</p></div></section>

      <AnimatePresence>
        {editor && (
          <>
            <motion.button type="button" className="budget-editor-backdrop" aria-label={t(locale, 'close')} onClick={() => setEditor(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div className="budget-editor-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 360, damping: 34 }}>
              <div className="sheet-handle" />
              <h2>{editor.type === 'budget' ? t(locale, 'editBudget') : editor.id ? t(locale, 'editBill') : t(locale, 'addBill')}</h2>
              {editor.type === 'budget' ? (
                <>
                  <p className="editor-context">{categoryName(locale, editor.category)}</p>
                  <label htmlFor="budget-limit-input">{t(locale, 'monthlyLimit')}</label>
                  <input id="budget-limit-input" type="number" inputMode="decimal" min="1" value={editor.value} onChange={(event) => setEditor({ ...editor, value: event.target.value })} />
                </>
              ) : (
                <>
                  <label htmlFor="bill-name-input">{t(locale, 'billName')}</label>
                  <input id="bill-name-input" type="text" value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} placeholder={t(locale, 'billNamePlaceholder')} />
                  <label htmlFor="bill-amount-input">{t(locale, 'billAmount')}</label>
                  <input id="bill-amount-input" type="number" inputMode="decimal" min="1" value={editor.amount} onChange={(event) => setEditor({ ...editor, amount: event.target.value })} />
                  <label htmlFor="bill-date-input">{t(locale, 'billDueDate')}</label>
                  <input id="bill-date-input" type="date" value={editor.dueDate} onChange={(event) => setEditor({ ...editor, dueDate: event.target.value })} />
                </>
              )}
              <button type="button" className="budget-editor-save" onClick={saveEditor}>{t(locale, 'saveChanges')}</button>
              {editor.type === 'bill' && editor.id && <button type="button" className="budget-editor-delete" onClick={deleteBill}><Trash2 size={16} />{t(locale, 'deleteBill')}</button>}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
