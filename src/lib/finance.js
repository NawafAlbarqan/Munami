// All spending/income math lives here in plain JS. No AI, no formatting strings —
// just numbers and groupings the UI and the AI-phrasing layer can use.

export function monthKey(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : ''
}

// direction is stored lowercase in the data, but match case-insensitively
// in case a feed ever sends "Credit"/"Debit".
export function isDirection(row, direction) {
  return (row.direction || '').toLowerCase() === direction
}

export function getDebits(rows) {
  return rows.filter((r) => isDirection(r, 'debit'))
}

export function getCredits(rows) {
  return rows.filter((r) => isDirection(r, 'credit'))
}

// Merges raw data categories into the cleaner set the UI shows.
// Change the mapping here only — donut + insights both read from it.
const CATEGORY_MAP = {
  'Food & Dining': 'Food & Groceries',
  Groceries: 'Food & Groceries',
  Transport: 'Bills & Transport',
  Utilities: 'Bills & Transport',
  Health: 'Other',
}

// Categories that pass through unchanged. Anything not explicitly mapped
// and not in this list (a category we've never seen) also falls into
// "Other" — so nothing gets silently dropped and totals still add up.
const PASSTHROUGH_CATEGORIES = new Set(['Shopping', 'Entertainment'])

export function mapCategory(rawCategory) {
  if (CATEGORY_MAP[rawCategory]) return CATEGORY_MAP[rawCategory]
  if (PASSTHROUGH_CATEGORIES.has(rawCategory)) return rawCategory
  return 'Other'
}

export function applyCategoryMap(rows) {
  return rows.map((r) => ({ ...r, category: mapCategory(r.category) }))
}

// Each merged category gets its own fixed theme color (a CSS variable name
// from src/index.css), so a category is always the same color everywhere —
// the donut, the legend dots, and the legend percentages. Change colors in
// src/index.css; change which category gets which color here.
const CATEGORY_COLOR_VAR = {
  'Food & Groceries': '--color-teal',
  'Bills & Transport': '--color-caution',
  Shopping: '--color-primary',
  Entertainment: '--color-rewards',
  Other: '--color-lavender',
}

export function categoryColorVar(category) {
  return CATEGORY_COLOR_VAR[category] || '--color-muted'
}

// Fixed display order for the donut ring so adjacent categories always
// blend in the same sequence (mint → teal → blush → butter → lavender →
// back to mint). The legend can still show categories sorted by amount —
// this order only governs the ring.
export const CATEGORY_RING_ORDER = [
  'Shopping',
  'Food & Groceries',
  'Bills & Transport',
  'Entertainment',
  'Other',
]

export function getLatestMonth(rows) {
  const latestDate = rows.reduce((max, r) => (r.date > max ? r.date : max), '')
  return monthKey(latestDate)
}

export function sumAmount(rows) {
  return rows.reduce((sum, r) => sum + (r.amount_sar || 0), 0)
}

export function groupByCategory(rows) {
  const totals = {}
  for (const r of rows) {
    totals[r.category] = (totals[r.category] || 0) + r.amount_sar
  }
  return totals
}

// Distinct months present in the data, oldest first.
export function listMonths(rows) {
  return [...new Set(rows.map((r) => monthKey(r.date)))].filter(Boolean).sort()
}

// How many distinct calendar days have transactions in a given month —
// used as the "how much data exists for this month" signal.
export function daysWithDataInMonth(rows, month) {
  const days = new Set(
    rows.filter((r) => monthKey(r.date) === month).map((r) => r.date),
  )
  return days.size
}

const EARLY_MONTH_DAY_THRESHOLD = 10

export function isEarlyMonth(rows, month) {
  return daysWithDataInMonth(rows, month) < EARLY_MONTH_DAY_THRESHOLD
}

// Number of calendar days in a "YYYY-MM" month — pure calendar math, no
// system clock involved.
export function daysInMonth(month) {
  const [year, monthNum] = month.split('-').map(Number)
  return new Date(year, monthNum, 0).getDate()
}

const MIN_CATEGORY_AMOUNT = 100 // SAR — guardrail against tiny-amount % swings

/**
 * For each category, compares the selected month's spend against the
 * trailing average of all prior FULL months in the data (the selected
 * month itself is always excluded from its own average, so a partial
 * month never drags its own comparison down).
 */
export function computeCategoryChanges(debitRows, selectedMonth) {
  const months = listMonths(debitRows)
  const priorMonths = months.filter((m) => m < selectedMonth)

  const currentRows = debitRows.filter((r) => monthKey(r.date) === selectedMonth)
  const currentByCategory = groupByCategory(currentRows)

  const categories = new Set(Object.keys(currentByCategory))
  const priorTotalsByCategory = {} // category -> total across all prior months

  for (const r of debitRows) {
    const m = monthKey(r.date)
    if (!priorMonths.includes(m)) continue
    categories.add(r.category)
    priorTotalsByCategory[r.category] = (priorTotalsByCategory[r.category] || 0) + r.amount_sar
  }

  const priorMonthCount = priorMonths.length || 1

  const changes = []
  for (const category of categories) {
    const current = Math.round(currentByCategory[category] || 0)
    const average = Math.round((priorTotalsByCategory[category] || 0) / priorMonthCount)

    if (current < MIN_CATEGORY_AMOUNT || average < MIN_CATEGORY_AMOUNT) continue

    const pctChange = average === 0 ? 0 : Math.round(((current - average) / average) * 100)
    const direction = current >= average ? 'up' : 'down'

    changes.push({ category, current, average, pctChange, direction })
  }

  return changes
}

// Ranks by the size of the change (biggest swings first) and takes the top n.
export function topChanges(changes, n = 3) {
  return [...changes].sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange)).slice(0, n)
}

/**
 * Income (salary) often posts late in the month, so the selected month can
 * have zero credit rows even though the user clearly has income. If the
 * selected month has no credits yet, fall back to the most recent prior
 * month's income so the header doesn't show a misleading "Income: 0".
 */
export function resolveMonthIncome(creditRows, selectedMonth) {
  const selectedMonthCredits = creditRows.filter((r) => monthKey(r.date) === selectedMonth)
  if (selectedMonthCredits.length > 0) {
    return { income: sumAmount(selectedMonthCredits), isCarriedOver: false, incomeMonth: selectedMonth }
  }

  const priorMonths = listMonths(creditRows).filter((m) => m < selectedMonth)
  const lastIncomeMonth = priorMonths.pop()
  if (!lastIncomeMonth) return { income: 0, isCarriedOver: false, incomeMonth: null }

  const lastMonthCredits = creditRows.filter((r) => monthKey(r.date) === lastIncomeMonth)
  return { income: sumAmount(lastMonthCredits), isCarriedOver: true, incomeMonth: lastIncomeMonth }
}

/**
 * Used in early-month mode: summarizes the most recent FULL month (the one
 * right before the selected partial month) against the trailing average of
 * the full months before THAT — so the partial month never enters either
 * side of the comparison.
 */
export function summarizePriorMonth(debitRows, selectedMonth) {
  const months = listMonths(debitRows)
  const priorMonths = months.filter((m) => m < selectedMonth)
  const priorMonth = priorMonths.pop()
  if (!priorMonth) return null

  const monthsBeforePrior = priorMonths // already excludes selectedMonth and priorMonth
  const priorSpent = Math.round(
    sumAmount(debitRows.filter((r) => monthKey(r.date) === priorMonth)),
  )

  if (monthsBeforePrior.length === 0) {
    return { priorMonth, priorSpent, average: null, pctChange: 0, direction: 'up' }
  }

  const averageSpent =
    monthsBeforePrior.reduce(
      (sum, m) => sum + sumAmount(debitRows.filter((r) => monthKey(r.date) === m)),
      0,
    ) / monthsBeforePrior.length
  const average = Math.round(averageSpent)

  const pctChange = average === 0 ? 0 : Math.round(((priorSpent - average) / average) * 100)
  const direction = priorSpent >= average ? 'up' : 'down'

  return { priorMonth, priorSpent, average, pctChange, direction }
}

// Single place that decides "is this direction good news for the user".
// Spending down = good. Flip this if a category is treated as savings/income later.
export function isGood(direction) {
  return direction === 'down'
}
