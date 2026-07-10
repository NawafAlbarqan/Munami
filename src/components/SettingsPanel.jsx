import { motion } from 'motion/react'
import { useLocale } from '../lib/LocaleContext'
import { t } from '../lib/i18n'
import GrowthMark from './GrowthMark'

// Segmented language picker — always LTR so EN/AR labels stay in fixed order
function LanguageSwitch({ locale, onChange }) {
  return (
    <div dir="ltr" className="flex bg-tint rounded-full p-0.5">
      {[{ l: 'en', label: 'EN' }, { l: 'ar', label: 'AR' }].map(({ l, label }) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
          style={{
            backgroundColor: locale === l ? 'var(--color-primary)' : 'transparent',
            color: locale === l ? '#FFFDF8' : 'var(--color-muted)',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// A single settings row — dimmed rows are placeholders for future features
function SettingsRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 opacity-45">
      <div className="flex items-center gap-3">
        <span className="text-lg leading-none">{icon}</span>
        <span className="text-text text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-muted text-xs">{value}</span>}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" style={{ opacity: 0.3 }}>
          <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

export default function SettingsPanel({ onClose }) {
  const { locale, setLocale } = useLocale()
  const isAr = locale === 'ar'

  return (
    <motion.div
      className="absolute inset-0 z-40 bg-page overflow-y-auto scroll-thin pb-10"
      dir={isAr ? 'rtl' : 'ltr'}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {/* ── Header bar ── */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-card border-[0.5px] border-card-border flex items-center justify-center shrink-0"
          style={{ boxShadow: '0 1px 6px rgba(45,106,74,0.08)' }}
        >
          {/* Arrow flips in RTL via scaleX */}
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            style={{ transform: isAr ? 'scaleX(-1)' : 'none' }}
          >
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-text text-lg font-bold">{t(locale, 'settings')}</h2>
      </div>

      {/* ── Profile card ── */}
      <div className="px-4 mb-6">
        <div
          className="bg-card border border-card-border rounded-[24px] px-5 py-5 flex items-center gap-4"
          style={{ boxShadow: '0 2px 16px rgba(45,106,74,0.08)' }}
        >
          {/* Avatar circle */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <span className="text-2xl font-black" style={{ color: '#FFFDF8', fontFamily: 'Nunito, sans-serif' }}>
              A
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-text text-base font-bold leading-tight">Ahmed</p>
            <div className="flex items-center gap-1.5 mt-1">
              <GrowthMark size={11} color="var(--color-primary)" />
              <p className="text-muted text-xs">{t(locale, 'memberSince')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Preferences ── */}
      <div className="px-4 mb-5">
        <p className="text-muted text-[10px] font-medium uppercase tracking-widest mb-2 px-1">
          {t(locale, 'preferences')}
        </p>
        <div className="bg-card border-[0.5px] border-card-border rounded-[20px]">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="text-lg leading-none">🌐</span>
              <span className="text-text text-sm font-medium">{t(locale, 'language')}</span>
            </div>
            <LanguageSwitch locale={locale} onChange={setLocale} />
          </div>
        </div>
      </div>

      {/* ── Account (placeholders) ── */}
      <div className="px-4 mb-5">
        <p className="text-muted text-[10px] font-medium uppercase tracking-widest mb-2 px-1">
          {t(locale, 'settingsAccount')}
        </p>
        <div className="bg-card border-[0.5px] border-card-border rounded-[20px] overflow-hidden">
          <SettingsRow icon="🔔" label={t(locale, 'notifications')} value={t(locale, 'comingSoon')} />
          <div className="border-t border-card-border" />
          <SettingsRow icon="🏦" label={t(locale, 'linkedAccounts')} value={t(locale, 'comingSoon')} />
        </div>
      </div>

      {/* ── App (placeholder) ── */}
      <div className="px-4">
        <p className="text-muted text-[10px] font-medium uppercase tracking-widest mb-2 px-1">
          {t(locale, 'settingsApp')}
        </p>
        <div className="bg-card border-[0.5px] border-card-border rounded-[20px] overflow-hidden">
          <SettingsRow icon="🌱" label={t(locale, 'aboutMunami')} value={t(locale, 'comingSoon')} />
        </div>
      </div>
    </motion.div>
  )
}
