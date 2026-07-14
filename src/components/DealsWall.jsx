import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { formatSAR, t } from '../lib/i18n'

// ─── Tier system (Lane 1 pitch) — Seed → Sprout → Branch → Tree ─────────────
// Derived from the same Level used by the XP ring, so it's not a second
// disconnected number — Level 7 (this demo persona) lands on Tree, the top tier.
function getTiers(locale) {
  return [
    { key: 'seed', icon: '🌰', name: locale === 'ar' ? 'البذرة' : 'Seed' },
    { key: 'sprout', icon: '🌱', name: locale === 'ar' ? 'البرعم' : 'Sprout' },
    { key: 'branch', icon: '🌿', name: locale === 'ar' ? 'الغصن' : 'Branch' },
    { key: 'tree', icon: '🌳', name: locale === 'ar' ? 'الشجرة' : 'Tree' },
  ]
}

export function tierIndexForLevel(level) {
  if (level >= 7) return 3 // Tree
  if (level >= 5) return 2 // Branch
  if (level >= 3) return 1 // Sprout
  return 0 // Seed
}

// ─── Demo persona: "the deal redeemer" ──────────────────────────────────────
// One deal (Car) is realistically unlocked — top tier + a completed linked
// goal. The rest are locked on a real, specific, almost-there requirement so
// the wall tells a story: here's what you've earned, here's what's next.
const DEMO = {
  streakDays: 7,          // mirrors the Streak card above
  carGoalComplete: true,  // "Car Down Payment" savings goal — done
  travelGoalComplete: false,
  noOverspendDays: 12,
}

function getDeals(locale, tierIndex) {
  return [
    {
      id: 'car',
      icon: '🚗',
      category: locale === 'ar' ? 'سيارة' : 'Car',
      partner: locale === 'ar' ? 'أوتوورلد الرياض' : 'AutoWorld Riyadh',
      valueLabel: '−SAR 10,000',
      tierName: getTiers(locale)[3].name,
      reqText: locale === 'ar'
        ? 'مستوى الشجرة + إتمام هدف «دفعة السيارة»'
        : 'Tree tier + finish the "Car Down Payment" goal',
      met: tierIndex >= 3 && DEMO.carGoalComplete,
      worked: true,
      priceOriginal: 65000,
      priceDiscount: 10000,
    },
    {
      id: 'electronics',
      icon: '📱',
      category: locale === 'ar' ? 'إلكترونيات' : 'Electronics',
      partner: locale === 'ar' ? 'تِك مارت' : 'TechMart',
      valueLabel: '−15%',
      tierName: getTiers(locale)[2].name,
      reqText: locale === 'ar'
        ? 'مستوى الغصن + متتالية 30 يوم'
        : 'Branch tier + 30-day streak',
      met: tierIndex >= 2 && DEMO.streakDays >= 30,
    },
    {
      id: 'travel',
      icon: '✈️',
      category: locale === 'ar' ? 'سفر' : 'Travel',
      partner: locale === 'ar' ? 'سكاي تريل للسفر' : 'SkyTrail Travel',
      valueLabel: '−20%',
      tierName: getTiers(locale)[3].name,
      reqText: locale === 'ar'
        ? 'مستوى الشجرة + إتمام هدف «صندوق السفر»'
        : 'Tree tier + finish the "Travel Fund" goal',
      met: tierIndex >= 3 && DEMO.travelGoalComplete,
    },
    {
      id: 'groceries',
      icon: '🛒',
      category: locale === 'ar' ? 'بقالة' : 'Groceries',
      partner: locale === 'ar' ? 'فريش مارت' : 'FreshMart',
      valueLabel: '−10%',
      tierName: getTiers(locale)[1].name,
      reqText: locale === 'ar'
        ? 'مستوى البرعم + 30 يوم بدون تجاوز الميزانية'
        : 'Sprout tier + 30 days with no budget overspend',
      met: tierIndex >= 1 && DEMO.noOverspendDays >= 30,
    },
  ]
}

// ─── "How it works" — 3-step visual sequence, icons + short labels only ─────
function HowItWorksSteps({ locale, compact = false }) {
  const STEPS = [
    { icon: '🎯', title: t(locale, 'step1Title'), desc: t(locale, 'step1Desc') },
    { icon: '🏅', title: t(locale, 'step2Title'), desc: t(locale, 'step2Desc') },
    { icon: '🛍️', title: t(locale, 'step3Title'), desc: t(locale, 'step3Desc') },
  ]
  return (
    <div className="flex items-start gap-1">
      {STEPS.map((s, i) => (
        <div key={i} className="flex items-start flex-1 min-w-0">
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <span
              className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl shrink-0"
              style={{ background: 'var(--color-tint)' }}
            >
              {s.icon}
            </span>
            <p className="text-text text-[11px] font-bold text-center leading-tight">{s.title}</p>
            {!compact && (
              <p className="text-muted text-[10px] text-center leading-tight">{s.desc}</p>
            )}
          </div>
          {i < STEPS.length - 1 && (
            <span className="text-muted text-lg shrink-0" style={{ marginTop: 14 }}>→</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Tier ladder — shows Seed→Sprout→Branch→Tree with current tier lit up ───
function TierTrack({ locale, tierIndex }) {
  const TIERS = getTiers(locale)
  return (
    <div className="flex items-center mb-4">
      {TIERS.map((tier, i) => {
        const reached = i <= tierIndex
        const isCurrent = i === tierIndex
        return (
          <div key={tier.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className="w-9 h-9 rounded-[11px] flex items-center justify-center text-base"
                style={{
                  background: isCurrent ? 'var(--color-primary)' : reached ? 'var(--color-tint)' : 'var(--color-tint)',
                  opacity: reached ? 1 : 0.4,
                }}
              >
                {tier.icon}
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-wide"
                style={{ color: isCurrent ? 'var(--color-primary)' : 'var(--color-muted)', opacity: reached ? 1 : 0.5 }}
              >
                {tier.name}
              </span>
            </div>
            {i < TIERS.length - 1 && (
              <div
                className="h-[3px] flex-1 mx-1 rounded-full"
                style={{ background: i < tierIndex ? 'var(--color-primary)' : 'var(--color-card-border)', marginBottom: 14 }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── One deal card ───────────────────────────────────────────────────────────
function DealCard({ deal, index, locale, redeemed, onTap }) {
  const unlocked = deal.met
  return (
    <motion.button
      type="button"
      onClick={() => onTap(deal)}
      className="w-full text-left bg-card border-[0.5px] border-card-border rounded-[20px] p-4 flex flex-col gap-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: unlocked ? 1 : 0.55, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: 'easeOut' }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <span
          className="w-11 h-11 rounded-[14px] flex items-center justify-center text-2xl shrink-0"
          style={{ background: unlocked ? 'var(--color-rewards)' : 'var(--color-tint)' }}
        >
          {deal.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-text text-sm font-bold truncate">{deal.partner}</p>
          <p className="text-muted text-[11px] truncate">{deal.category}</p>
        </div>
        <span
          className="shrink-0 rounded-[10px] px-2.5 py-1.5 text-sm font-extrabold tabular-nums"
          style={{
            background: unlocked ? 'var(--color-primary)' : 'var(--color-tint)',
            color: unlocked ? '#0E1F14' : 'var(--color-muted)',
          }}
        >
          {deal.valueLabel}
        </span>
      </div>

      {unlocked ? (
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
            {t(locale, 'unlockedLabel')}
          </span>
          <span
            className="rounded-[10px] px-4 py-1.5 text-xs font-bold"
            style={{ background: 'var(--color-primary)', color: '#0E1F14' }}
          >
            {redeemed ? t(locale, 'redeemed') : t(locale, 'redeem')}
          </span>
        </div>
      ) : (
        <p className="text-muted text-[11px] leading-snug">🔒 {deal.reqText}</p>
      )}
    </motion.button>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function DealsWall({ locale, level }) {
  const tierIndex = tierIndexForLevel(level)
  const DEALS = getDeals(locale, tierIndex)

  const [activeDeal, setActiveDeal] = useState(null)
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)
  const [redeemedIds, setRedeemedIds] = useState([])

  function closeSheets() {
    setActiveDeal(null)
    setHowItWorksOpen(false)
  }

  function handleRedeem(dealId) {
    setRedeemedIds((prev) => (prev.includes(dealId) ? prev : [...prev, dealId]))
  }

  return (
    <div className="mb-4">
      {/* ── Section header + "?" info icon ── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-text font-semibold">{t(locale, 'dealsWallHeader')}</h2>
        <button
          type="button"
          onClick={() => setHowItWorksOpen(true)}
          aria-label={t(locale, 'howItWorks')}
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold"
          style={{ background: 'var(--color-tint)', color: 'var(--color-text)' }}
        >
          ?
        </button>
      </div>

      {/* ── Tier ladder ── */}
      <p className="text-muted text-[10px] font-medium uppercase tracking-widest mb-2">
        {t(locale, 'yourTier')}
      </p>
      <TierTrack locale={locale} tierIndex={tierIndex} />

      {/* ── Deal cards ── */}
      <div className="flex flex-col gap-3">
        {DEALS.map((deal, i) => (
          <DealCard
            key={deal.id}
            deal={deal}
            index={i}
            locale={locale}
            redeemed={redeemedIds.includes(deal.id)}
            onTap={setActiveDeal}
          />
        ))}
      </div>

      {/* ── Deal detail sheet ── */}
      <AnimatePresence>
        {activeDeal && (
          <>
            <motion.div
              className="absolute inset-0 z-20"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeSheets}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-30 bg-card rounded-t-[24px] px-5 pt-4 pb-10 max-h-[85%] overflow-y-auto scroll-thin"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <div className="w-10 h-1 bg-card-border rounded-full mx-auto mb-5" />

              <div className="flex items-center gap-3 mb-4">
                <span
                  className="w-14 h-14 rounded-[16px] flex items-center justify-center text-3xl shrink-0"
                  style={{ background: activeDeal.met ? 'var(--color-rewards)' : 'var(--color-tint)' }}
                >
                  {activeDeal.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-text text-base font-bold truncate">{activeDeal.partner}</p>
                  <p className="text-muted text-xs truncate">{activeDeal.category}</p>
                </div>
                <span
                  className="shrink-0 rounded-[10px] px-3 py-1.5 text-base font-extrabold tabular-nums"
                  style={{
                    background: activeDeal.met ? 'var(--color-primary)' : 'var(--color-tint)',
                    color: activeDeal.met ? '#0E1F14' : 'var(--color-muted)',
                  }}
                >
                  {activeDeal.valueLabel}
                </span>
              </div>

              {activeDeal.met ? (
                <div className="flex flex-col gap-4 mb-5">
                  {/* Worked example — car deal only, per the pitch's price breakdown */}
                  {activeDeal.worked && (
                    <div className="bg-tint rounded-[16px] p-4">
                      <p className="text-muted text-[10px] font-medium uppercase tracking-widest mb-3">
                        {t(locale, 'illustrativePricing')}
                      </p>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted">{t(locale, 'originalPrice')}</span>
                        <span className="text-text font-semibold tabular-nums">
                          {formatSAR(activeDeal.priceOriginal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mb-2.5">
                        <span className="text-muted">{t(locale, 'munamiDeal')}</span>
                        <span className="font-semibold tabular-nums" style={{ color: 'var(--color-caution)' }}>
                          −{formatSAR(activeDeal.priceDiscount)}
                        </span>
                      </div>
                      <div className="h-[2px] bg-card-border mb-2.5" />
                      <div className="flex justify-between items-baseline">
                        <span className="text-text text-sm font-bold">{t(locale, 'youPay')}</span>
                        <span className="munami-hero text-text tabular-nums" style={{ fontSize: 28 }}>
                          {formatSAR(activeDeal.priceOriginal - activeDeal.priceDiscount)}
                        </span>
                      </div>
                      <p className="text-[11px] mt-2" style={{ color: 'var(--color-primary)' }}>
                        {t(locale, 'youSave', formatSAR(activeDeal.priceDiscount))}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRedeem(activeDeal.id)}
                    className="w-full py-3.5 rounded-full font-semibold text-sm"
                    style={{ background: 'var(--color-primary)', color: '#0E1F14' }}
                  >
                    {redeemedIds.includes(activeDeal.id) ? t(locale, 'redeemed') : t(locale, 'redeem')}
                  </button>
                </div>
              ) : (
                <div className="bg-tint rounded-[16px] p-4 mb-5 flex items-start gap-2.5">
                  <span className="text-lg leading-none shrink-0">🔒</span>
                  <p className="text-text text-sm leading-snug">{activeDeal.reqText}</p>
                </div>
              )}

              {/* Compact "how it works" reminder — icons + titles only */}
              <p className="text-muted text-[10px] font-medium uppercase tracking-widest mb-2.5">
                {t(locale, 'howItWorks')}
              </p>
              <HowItWorksSteps locale={locale} compact />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Standalone "how it works" sheet (from the "?" icon) ── */}
      <AnimatePresence>
        {howItWorksOpen && (
          <>
            <motion.div
              className="absolute inset-0 z-20"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeSheets}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-30 bg-card rounded-t-[24px] px-5 pt-4 pb-10"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <div className="w-10 h-1 bg-card-border rounded-full mx-auto mb-5" />
              <p className="text-text font-bold text-base mb-5">{t(locale, 'howItWorks')}</p>

              <HowItWorksSteps locale={locale} />

              <p className="text-muted text-[11px] leading-snug mt-5 text-center">
                {t(locale, 'partnerPrivacyNote')}
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
