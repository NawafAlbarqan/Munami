// The ONLY place that turns finished facts (computed in finance.js) into short
// coach sentences. Takes `locale` so phrases render in the right language.
// Swap the body for a real LLM call later without touching any caller.

import { categoryName, formatSAR } from './i18n'

export function phraseCategoryChange(locale, { category, pctChange, direction }) {
  const pct = Math.abs(pctChange)
  const cat = categoryName(locale, category)
  if (locale === 'ar') {
    return direction === 'down'
      ? `إنفاقك على ${cat} انخفض ${pct}٪ عن المعتاد — عمل رائع!`
      : `إنفاقك على ${cat} ارتفع ${pct}٪ عن المعتاد — يستحق المتابعة.`
  }
  return direction === 'down'
    ? `${cat} spending is down ${pct}% from your usual — nice work!`
    : `${cat} spending is up ${pct}% from your usual — worth keeping an eye on.`
}

export function phrasePace(locale, { daysElapsed, spentSoFar, projectedSpend }) {
  const spent = formatSAR(spentSoFar)
  const projected = formatSAR(projectedSpend)
  if (locale === 'ar') {
    const dayWord = daysElapsed === 1 ? 'يوم' : 'أيام'
    return `مضى ${daysElapsed} ${dayWord} — أنفقت ${spent} حتى الآن. باستمرار هذا المعدل، تتجه نحو إنفاق ${projected} هذا الشهر.`
  }
  const dayWord = daysElapsed === 1 ? 'day' : 'days'
  return `${daysElapsed} ${dayWord} in — you've spent ${spent} so far. At this pace you're heading toward an estimated ${projected} this month.`
}

export function phrasePriorMonthSummary(locale, { priorMonthLabel, priorSpent, pctChange, direction }) {
  const amount = formatSAR(priorSpent)
  if (locale === 'ar') {
    if (pctChange === 0) {
      return `الشهر الماضي (${priorMonthLabel}) أنفقت ${amount} — مطابق للمعتاد تماماً.`
    }
    const pct = Math.abs(pctChange)
    const trend = direction === 'down' ? `أقل بـ ${pct}٪ عن` : `أعلى بـ ${pct}٪ عن`
    return `الشهر الماضي (${priorMonthLabel}) أنفقت ${amount} — ${trend} المعتاد.`
  }
  if (pctChange === 0) {
    return `Last month (${priorMonthLabel}) you spent ${amount} — right in line with your usual.`
  }
  const pct = Math.abs(pctChange)
  const trend = direction === 'down' ? `${pct}% down from` : `${pct}% up from`
  return `Last month (${priorMonthLabel}) you spent ${amount} — that's ${trend} your usual.`
}
