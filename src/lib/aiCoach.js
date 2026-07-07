// AI coaching layer. Two modes:
//   • VITE_USE_AI=true  → calls the Express backend → Gemini
//   • VITE_USE_AI=false → falls back to the template strings below instantly
//
// Callers never need to know which mode is active.

import { categoryName, formatSAR } from './i18n'

const USE_AI = import.meta.env.VITE_USE_AI === 'true'

// ── Template fallbacks (always fast, always safe) ─────────────────────────────

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
    if (pctChange === 0) return `الشهر الماضي (${priorMonthLabel}) أنفقت ${amount} — مطابق للمعتاد تماماً.`
    const pct = Math.abs(pctChange)
    const trend = direction === 'down' ? `أقل بـ ${pct}٪ عن` : `أعلى بـ ${pct}٪ عن`
    return `الشهر الماضي (${priorMonthLabel}) أنفقت ${amount} — ${trend} المعتاد.`
  }
  if (pctChange === 0) return `Last month (${priorMonthLabel}) you spent ${amount} — right in line with your usual.`
  const pct = Math.abs(pctChange)
  const trend = direction === 'down' ? `${pct}% down from` : `${pct}% up from`
  return `Last month (${priorMonthLabel}) you spent ${amount} — that's ${trend} your usual.`
}

// ── AI-powered phrasing (async, falls back to templates on error) ─────────────

// Fetches AI-phrased sentences for the top-N category changes.
// Returns an array of strings in the same order as `changes`.
// Falls back to template strings if AI is off or the call fails.
export async function fetchInsightPhrases(locale, changes) {
  if (!USE_AI || !changes.length) {
    return changes.map((c) => phraseCategoryChange(locale, c))
  }
  try {
    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changes, locale }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const { phrases } = await res.json()
    // Pad with template fallbacks if the AI returned fewer phrases than expected
    return changes.map((c, i) => phrases[i] || phraseCategoryChange(locale, c))
  } catch (err) {
    console.warn('[aiCoach] insight fetch failed, using templates:', err.message)
    return changes.map((c) => phraseCategoryChange(locale, c))
  }
}
