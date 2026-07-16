// Weekly challenge generation — code computes every number, the AI only
// picks which candidate matters most and phrases it (see
// server.js POST /api/weekly-challenge). Nothing here calls Gemini.
import { getDebits, applyCategoryMap } from './finance'

const MIN_WEEKLY_AVG = 30 // SAR — guardrail so a tiny/rare category can't become a challenge
const OVERAGE_THRESHOLD_PCT = 10 // must be trending at least this much above its own average
const REDUCTION_MIN_PCT = 10
const REDUCTION_MAX_PCT = 15
const BASE_XP = 100
const XP_PER_SAR_CUT = 2
const DAY_MS = 1000 * 60 * 60 * 24

function groupByCategory(rows) {
  const totals = {}
  for (const r of rows) totals[r.category] = (totals[r.category] || 0) + r.amount_sar
  return totals
}

// Weeks are fixed 7-day blocks counted from the account's registration date
// (the earliest date present in the data) — NOT a rolling "last 7 days from
// today." Week 0 = regDate..regDate+6, week 1 = regDate+7..regDate+13, etc.
export function getRegistrationDate(rows) {
  return rows.reduce((min, r) => (min === '' || r.date < min ? r.date : min), '')
}

function getLatestDate(rows) {
  return rows.reduce((max, r) => (r.date > max ? r.date : max), '')
}

function weekBounds(regDate, weekIndex) {
  const start = new Date(regDate)
  start.setDate(start.getDate() + weekIndex * 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return { start, end }
}

function weekSpendByCategory(debits, regDate, weekIndex) {
  const { start, end } = weekBounds(regDate, weekIndex)
  const rows = debits.filter((r) => {
    const d = new Date(r.date)
    return d >= start && d <= end
  })
  return groupByCategory(rows)
}

export function getCurrentWeekIndex(rows) {
  const regDate = getRegistrationDate(rows)
  const latest = getLatestDate(rows)
  const diffDays = Math.floor((new Date(latest) - new Date(regDate)) / DAY_MS)
  return Math.floor(diffDays / 7)
}

/**
 * Candidates for challenging week `w`. Causally correct: whether a category
 * gets challenged for week `w` is decided from week `w-1` ("the detection
 * week") trending above ITS OWN prior average — never from week `w`'s own
 * spend, which may not have happened yet. Week `w`'s actual spend is then
 * the thing being evaluated against the target.
 *
 * Formula:
 *   avgBeforeDetection = mean(weeks 0..detectionWeek-1) for the category
 *   overagePct         = (detectionWeekSpend - avgBeforeDetection) / avgBeforeDetection * 100
 *   reductionPct       = clamp(10 + overagePct / 10, 10, 15)
 *   target             = round(avgBeforeDetection * (1 - reductionPct / 100))
 *   xp                 = round(100 + (avgBeforeDetection - target) * 2)
 *   met                = week w's actual spend <= target
 *
 * Returns candidates sorted by overagePct descending. Needs w >= 2 (a
 * detection week and at least one week before that to average).
 */
export function computeCandidatesForWeek(debits, regDate, w) {
  if (w < 2) return []
  const detectionWeek = w - 1

  const priorTotals = {} // category -> total across weeks 0..detectionWeek-1
  for (let i = 0; i < detectionWeek; i++) {
    const spend = weekSpendByCategory(debits, regDate, i)
    for (const [cat, amt] of Object.entries(spend)) priorTotals[cat] = (priorTotals[cat] || 0) + amt
  }

  const detectionSpend = weekSpendByCategory(debits, regDate, detectionWeek)
  const evaluationSpend = weekSpendByCategory(debits, regDate, w)
  const categories = new Set([...Object.keys(priorTotals), ...Object.keys(detectionSpend), ...Object.keys(evaluationSpend)])

  const candidates = []
  for (const category of categories) {
    const avgBeforeDetection = Math.round((priorTotals[category] || 0) / detectionWeek)
    if (avgBeforeDetection < MIN_WEEKLY_AVG) continue

    const detectionAmt = Math.round(detectionSpend[category] || 0)
    const overagePct = Math.round(((detectionAmt - avgBeforeDetection) / avgBeforeDetection) * 100)
    if (overagePct <= OVERAGE_THRESHOLD_PCT) continue

    const reductionPct = Math.min(REDUCTION_MAX_PCT, Math.max(REDUCTION_MIN_PCT, 10 + overagePct / 10))
    const target = Math.round(avgBeforeDetection * (1 - reductionPct / 100))
    const amountToCut = avgBeforeDetection - target
    const xp = Math.round(BASE_XP + amountToCut * XP_PER_SAR_CUT)
    const currentSpend = Math.round(evaluationSpend[category] || 0)

    const { start, end } = weekBounds(regDate, w)
    candidates.push({
      category,
      weeklyAvg: avgBeforeDetection,
      currentSpend,
      overagePct,
      reductionPct: Math.round(reductionPct * 10) / 10,
      target,
      amountToCut,
      xp,
      met: currentSpend <= target,
      weekIndex: w,
      weekStart: start.toISOString().slice(0, 10),
      weekEnd: end.toISOString().slice(0, 10),
    })
  }

  return candidates.sort((a, b) => b.overagePct - a.overagePct)
}

/**
 * Returns { activeCandidates, onTrack }, both from the CURRENT week only:
 *  - activeCandidates: the full sorted candidate list for the current week
 *    (forward-looking, whatever their state so far) — the AI selects among
 *    these for the "failed/over" card (respecting the "don't repeat last
 *    week's category" rule), same as before. The top entry is expected to
 *    be the one that's over/failed.
 *  - onTrack: a second, DIFFERENT current-week candidate, with its target
 *    adjusted (never its real spend) so it reads as genuinely on-track:
 *    `adjustedTarget = max(naturalTarget, currentSpend)` — if the natural
 *    formula target already comfortably covers real spend, nothing changes;
 *    it only loosens when real spend would otherwise have failed it. XP is
 *    recomputed from the adjusted target so the reward stays consistent
 *    with how demanding the (possibly loosened) target actually is.
 */
export function computeCurrentWeekChallenges(rows) {
  if (!rows?.length) return { activeCandidates: [], onTrack: null }
  const debits = applyCategoryMap(getDebits(rows))
  const regDate = getRegistrationDate(rows)
  const currentWeekIndex = getCurrentWeekIndex(rows)

  const activeCandidates = computeCandidatesForWeek(debits, regDate, currentWeekIndex)
  const failedCategory = activeCandidates[0]?.category
  const raw = activeCandidates.find((c) => c.category !== failedCategory)

  let onTrack = null
  if (raw) {
    const adjustedTarget = Math.max(raw.target, raw.currentSpend)
    const targetWasAdjusted = adjustedTarget !== raw.target
    const amountToCut = Math.max(0, raw.weeklyAvg - adjustedTarget)
    onTrack = {
      ...raw,
      target: adjustedTarget,
      amountToCut,
      xp: Math.round(BASE_XP + amountToCut * XP_PER_SAR_CUT),
      met: raw.currentSpend <= adjustedTarget,
      targetAdjusted: targetWasAdjusted,
    }
  }

  return { activeCandidates, onTrack }
}

export {
  MIN_WEEKLY_AVG,
  OVERAGE_THRESHOLD_PCT,
  REDUCTION_MIN_PCT,
  REDUCTION_MAX_PCT,
  BASE_XP,
  XP_PER_SAR_CUT,
}

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

// Template fallback when VITE_USE_AI=false or the API call fails — still
// uses only real computed numbers, never invented ones.
export function templateChallenge(candidate, locale, status = 'active') {
  if (status === 'on_track') {
    return locale === 'ar'
      ? {
          title: `${candidate.category} تحت السيطرة`,
          desc: `إلى الآن أنفقت ${candidate.currentSpend} ريال بس على ${candidate.category}، وهذا تحت هدف ${candidate.target} ريال. استمر واكسب ${candidate.xp} XP.`,
        }
      : {
          title: `${candidate.category} — On Track`,
          desc: `So far you've spent SAR ${candidate.currentSpend} on ${candidate.category}, well under the SAR ${candidate.target} target. Keep it up and earn ${candidate.xp} XP.`,
        }
  }
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
