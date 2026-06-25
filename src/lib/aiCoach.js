// The ONLY place that turns finished facts (computed in src/lib/finance.js)
// into short coach sentences. No math happens here — just phrasing.
// Placeholder templates for now, in English (the app's current default
// locale, see src/lib/i18n.js); swap the body of these functions for a real
// LLM call later without touching any caller.

export function phraseCategoryChange({ category, pctChange, direction }) {
  const pct = Math.abs(pctChange)
  if (direction === 'down') {
    return `${category} spending is down ${pct}% from your usual — nice work!`
  }
  return `${category} spending is up ${pct}% from your usual — worth keeping an eye on.`
}

// Early-month mode's pace card: projects the full month from spend-so-far.
export function phrasePace({ daysElapsed, spentSoFar, projectedSpend }) {
  const dayWord = daysElapsed === 1 ? 'day' : 'days'
  return `${daysElapsed} ${dayWord} in — you've spent SAR ${spentSoFar.toLocaleString('en-US')} so far. At this pace you're heading toward an estimated SAR ${projectedSpend.toLocaleString('en-US')} this month.`
}

// Early-month mode's carryover card: summarizes the last full month instead of
// comparing the current (too-short) month.
export function phrasePriorMonthSummary({ priorMonthLabel, priorSpent, pctChange, direction }) {
  const amount = `SAR ${priorSpent.toLocaleString('en-US')}`
  if (pctChange === 0) {
    return `Last month (${priorMonthLabel}) you spent ${amount} — right in line with your usual.`
  }
  const pct = Math.abs(pctChange)
  const trend = direction === 'down' ? `${pct}% down from` : `${pct}% up from`
  return `Last month (${priorMonthLabel}) you spent ${amount} — that's ${trend} your usual.`
}
