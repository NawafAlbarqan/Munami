// Weekly challenge generation — code computes every number, the AI only
// picks which candidate matters most this week and phrases it (see
// server.js POST /api/weekly-challenge). Nothing here calls Gemini.
import { getDebits, applyCategoryMap } from './finance'

const MIN_WEEKLY_AVG = 30 // SAR — guardrail so a tiny/rare category can't become a challenge
const OVERAGE_THRESHOLD_PCT = 10 // must be trending at least this much above its own average
const REDUCTION_MIN_PCT = 10
const REDUCTION_MAX_PCT = 15
const BASE_XP = 100
const XP_PER_SAR_CUT = 2

// The "current week" is always the 7 days ending at the data's own latest
// date (same determinism rule as getLatestMonth) — never the system clock.
function getCurrentWeekWindow(rows) {
  const latestDate = rows.reduce((max, r) => (r.date > max ? r.date : max), '')
  const latest = new Date(latestDate)
  const weekStart = new Date(latest)
  weekStart.setDate(weekStart.getDate() - 6)
  return { weekStart, latest }
}

function groupByCategory(rows) {
  const totals = {}
  for (const r of rows) totals[r.category] = (totals[r.category] || 0) + r.amount_sar
  return totals
}

/**
 * Analyzes real spending history to find categories currently trending
 * above their own historical weekly average, with a realistic target
 * (10-15% below that average, scaled by how far over trend they are) and
 * an XP reward scaled by how demanding that target is.
 *
 * Formula:
 *   reductionPct = clamp(10 + overagePct / 10, 10, 15)
 *   target       = round(weeklyAvg * (1 - reductionPct / 100))
 *   amountToCut  = weeklyAvg - target
 *   xp           = round(100 + amountToCut * 2)
 *
 * Returns candidates sorted by overagePct descending (most over-trend first).
 */
export function computeCandidateChallenges(rows) {
  if (!rows?.length) return []
  const debits = applyCategoryMap(getDebits(rows))
  const { weekStart, latest } = getCurrentWeekWindow(rows)

  const currentWeekRows = debits.filter((r) => {
    const d = new Date(r.date)
    return d >= weekStart && d <= latest
  })
  const priorRows = debits.filter((r) => new Date(r.date) < weekStart)

  const earliestDate = debits.reduce((min, r) => (min === '' || r.date < min ? r.date : min), '')
  const priorWeeks = Math.max(1, (weekStart - new Date(earliestDate)) / (1000 * 60 * 60 * 24 * 7))

  const currentByCategory = groupByCategory(currentWeekRows)
  const priorByCategory = groupByCategory(priorRows)
  const categories = new Set([...Object.keys(currentByCategory), ...Object.keys(priorByCategory)])

  const candidates = []
  for (const category of categories) {
    const weeklyAvg = Math.round((priorByCategory[category] || 0) / priorWeeks)
    const currentSpend = Math.round(currentByCategory[category] || 0)
    if (weeklyAvg < MIN_WEEKLY_AVG) continue

    const overagePct = Math.round(((currentSpend - weeklyAvg) / weeklyAvg) * 100)
    if (overagePct <= OVERAGE_THRESHOLD_PCT) continue

    const reductionPct = Math.min(REDUCTION_MAX_PCT, Math.max(REDUCTION_MIN_PCT, 10 + overagePct / 10))
    const target = Math.round(weeklyAvg * (1 - reductionPct / 100))
    const amountToCut = weeklyAvg - target
    const xp = Math.round(BASE_XP + amountToCut * XP_PER_SAR_CUT)

    candidates.push({
      category,
      weeklyAvg,
      currentSpend,
      overagePct,
      reductionPct: Math.round(reductionPct * 10) / 10,
      target,
      amountToCut,
      xp,
    })
  }

  return candidates.sort((a, b) => b.overagePct - a.overagePct)
}

export { MIN_WEEKLY_AVG, OVERAGE_THRESHOLD_PCT, REDUCTION_MIN_PCT, REDUCTION_MAX_PCT, BASE_XP, XP_PER_SAR_CUT }

// Remembers which category last week's challenge picked, purely so the AI
// selection step can avoid repeating it — plain localStorage, matching the
// rest of the demo's "no real backend" persistence.
const LAST_CATEGORY_KEY = 'munami_last_challenge_category'

export function getLastChallengeCategory() {
  try {
    return localStorage.getItem(LAST_CATEGORY_KEY)
  } catch {
    return null
  }
}

export function saveLastChallengeCategory(category) {
  try {
    localStorage.setItem(LAST_CATEGORY_KEY, category)
  } catch {
    // localStorage unavailable — fine, just won't remember next time
  }
}

// Template fallback when VITE_USE_AI=false or the API call fails — picks the
// top candidate in code (already sorted by overage) and fills in a plain
// sentence, still using only real computed numbers, never invented ones.
export function templateChallenge(candidate, locale) {
  return locale === 'ar'
    ? {
        title: `تحدي ${candidate.category}`,
        desc: `إنفاقك على ${candidate.category} فوق المعتاد هالأسبوع. حاول تخليه تحت ${candidate.target} ريال واكسب ${candidate.xp} XP.`,
      }
    : {
        title: `${candidate.category} Challenge`,
        desc: `Your ${candidate.category} spending is running above usual this week. Keep it under SAR ${candidate.target} and earn ${candidate.xp} XP.`,
      }
}
