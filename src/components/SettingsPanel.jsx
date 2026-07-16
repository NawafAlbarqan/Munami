import { motion } from 'motion/react'
import { useLocale } from '../lib/LocaleContext'
import { useTheme } from '../lib/ThemeContext'
import { t } from '../lib/i18n'
import MunamiMascot from './MunamiMascot'

// Segmented language picker — always LTR so EN/AR labels stay in fixed order
function LanguageSwitch({ locale, onChange }) {
  return (
    <div dir="ltr" className="flex bg-tint rounded-full p-0.5" style={{ border: '1px solid var(--color-card-border)' }}>
      {[{ l: 'en', label: 'EN' }, { l: 'ar', label: 'AR' }].map(({ l, label }) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
          style={{
            backgroundColor: locale === l ? 'var(--color-primary)' : 'transparent',
            color: locale === l ? 'var(--color-on-accent)' : 'var(--color-muted)',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// Dark/light sliding toggle — a proper switch (distinct from the segmented
// language picker) since this is a genuine binary on/off, not a multi-option pick.
function ThemeSwitch({ theme, onChange }) {
  const isLight = theme === 'light'
  return (
    <button
      type="button"
      onClick={() => onChange(isLight ? 'dark' : 'light')}
      aria-label="Toggle light/dark theme"
      className="flex items-center shrink-0"
      style={{
        width: 54, height: 30, borderRadius: 999,
        background: isLight ? 'var(--color-tint)' : '#14243C',
        border: '1px solid var(--color-card-border)',
        padding: '0 3px',
        justifyContent: isLight ? 'flex-end' : 'flex-start',
      }}
    >
      <motion.div
        layout
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="rounded-full flex items-center justify-center text-[11px] leading-none"
        style={{ width: 22, height: 22, background: 'var(--color-primary)', boxShadow: 'var(--shadow-sm)' }}
      >
        {isLight ? '☀️' : '🌙'}
      </motion.div>
    </button>
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
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" style={{ opacity: 0.4 }}>
          <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

export default function SettingsPanel({ onClose }) {
  const { locale, setLocale } = useLocale()
  const { theme, setTheme } = useTheme()
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
          className="bg-card flex items-center justify-center shrink-0"
          style={{ width: 34, height: 34, borderRadius: 12, border: '1px solid var(--color-card-border)', boxShadow: 'var(--shadow-sm)' }}
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
        <div className="bg-card rounded-[24px] px-5 py-5 flex items-center gap-4">
          {/* Avatar circle */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--gradient-coral)', boxShadow: 'var(--shadow-sm)' }}
          >
            <span className="text-2xl font-bold" style={{ color: 'var(--color-on-accent)' }}>
              A
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-text text-base font-bold leading-tight">Ahmed</p>
            <p className="text-muted text-xs mt-1">{t(locale, 'memberSince')}</p>
          </div>
        </div>
      </div>

      {/* ── Preferences ── */}
      <div className="px-4 mb-5">
        <p className="text-muted text-[10px] font-medium uppercase tracking-widest mb-2 px-1">
          {t(locale, 'preferences')}
        </p>
        <div className="bg-card rounded-[20px]">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="text-lg leading-none">🌐</span>
              <span className="text-text text-sm font-medium">{t(locale, 'language')}</span>
            </div>
            <LanguageSwitch locale={locale} onChange={setLocale} />
          </div>
          <div className="border-t" style={{ borderColor: 'var(--color-card-border)' }} />
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="text-lg leading-none">{theme === 'light' ? '☀️' : '🌙'}</span>
              <span className="text-text text-sm font-medium">{t(locale, 'appearance')}</span>
            </div>
            <ThemeSwitch theme={theme} onChange={setTheme} />
          </div>
        </div>
      </div>

      {/* ── Account (placeholders) ── */}
      <div className="px-4 mb-5">
        <p className="text-muted text-[10px] font-medium uppercase tracking-widest mb-2 px-1">
          {t(locale, 'settingsAccount')}
        </p>
        <div className="bg-card rounded-[20px] overflow-hidden">
          <SettingsRow icon="🔔" label={t(locale, 'notifications')} value={t(locale, 'comingSoon')} />
          <div className="border-t" style={{ borderColor: 'var(--color-card-border)' }} />
          <SettingsRow icon="🏦" label={t(locale, 'linkedAccounts')} value={t(locale, 'comingSoon')} />
        </div>
      </div>

      {/* ── App (placeholder) ── */}
      <div className="px-4">
        <p className="text-muted text-[10px] font-medium uppercase tracking-widest mb-2 px-1">
          {t(locale, 'settingsApp')}
        </p>
        <div className="bg-card rounded-[20px] overflow-hidden">
          <SettingsRow icon={<MunamiMascot expression="greeting" size={20} />} label={t(locale, 'aboutMunami')} value={t(locale, 'comingSoon')} />
        </div>
      </div>
    </motion.div>
  )
}
