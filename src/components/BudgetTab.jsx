import { useMemo } from 'react'
import { CalendarClock, Check, Lightbulb, ReceiptText } from 'lucide-react'
import { motion } from 'motion/react'
import { useLocale } from '../lib/LocaleContext'
import { categoryName, formatSAR, t } from '../lib/i18n'
import { applyCategoryMap, getDebits, getLatestMonth, groupByCategory, monthKey } from '../lib/finance'

const LIMITS = [
  { category: 'Shopping', limit: 2000, color: '#f46f5b' },
  { category: 'Food & Groceries', limit: 1500, color: '#31b878' },
  { category: 'Entertainment', limit: 800, color: '#526f8d' },
  { category: 'Bills & Transport', limit: 2000, color: '#e4b44f' },
]

export default function BudgetTab({ rows }) {
  const { locale } = useLocale()
  const budgets = useMemo(() => {
    const debits = applyCategoryMap(getDebits(rows || []))
    const latest = getLatestMonth(rows || [])
    const grouped = groupByCategory(debits.filter((row) => monthKey(row.date) === latest))
    return LIMITS.map((item) => ({ ...item, spent: Math.round(grouped[item.category] || 0) }))
  }, [rows])

  const spent = budgets.reduce((sum, item) => sum + item.spent, 0)
  const limit = budgets.reduce((sum, item) => sum + item.limit, 0)
  const used = limit ? Math.round((spent / limit) * 100) : 0
  const ring = Math.min(used, 100) * 3.6

  return (
    <div className="monami-page budget-page scroll-thin">
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
        <div className="section-title"><h2>{t(locale, 'budgetCategories')}</h2><span>{budgets.length}</span></div>
        <div className="budget-list">
          {budgets.map((item, index) => {
            const pct = item.limit ? Math.round((item.spent / item.limit) * 100) : 0
            const exceeded = pct > 100
            return (
              <motion.div className={`budget-row ${exceeded ? 'is-alert' : ''}`} key={item.category} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <div className="budget-row-head">
                  <span className="category-mark" style={{ background: item.color }} />
                  <strong>{categoryName(locale, item.category)}</strong>
                  {pct < 70 && <Check size={16} />}
                  <span>{formatSAR(item.spent)} / {formatSAR(item.limit)}</span>
                </div>
                <div className="progress-track"><i style={{ width: `${Math.min(pct, 100)}%`, background: exceeded ? 'var(--alert)' : item.color }} /></div>
                <small>{exceeded ? t(locale, 'overBudget') : `${pct}%`}</small>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="content-section">
        <div className="section-title"><h2>{t(locale, 'upcomingBills')}</h2><CalendarClock size={18} /></div>
        <div className="bill-list">
          <div><ReceiptText size={18} /><span><strong>STC</strong><small>{t(locale, 'inThreeDays')}</small></span><b>{formatSAR(240)}</b></div>
          <div><ReceiptText size={18} /><span><strong>Netflix</strong><small>{t(locale, 'nextWeek')}</small></span><b>{formatSAR(55)}</b></div>
        </div>
      </section>

      <section className="smart-note"><Lightbulb size={21} /><div><strong>{t(locale, 'smartRecommendation')}</strong><p>{t(locale, 'budgetRecommendation')}</p></div></section>
    </div>
  )
}
