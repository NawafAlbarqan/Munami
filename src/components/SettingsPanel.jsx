import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLocale } from '../lib/LocaleContext'
import { useTheme } from '../lib/ThemeContext'
import { formatSAR, t } from '../lib/i18n'
import accountsData from '../../data/munami_accounts.json'
import MunamiMascot from './MunamiMascot'

const CONNECTABLE_BANKS = ['Alinma Bank', 'Al Rajhi Bank', 'Saudi National Bank']

function LanguageSwitch({ locale, onChange }) {
  return (
    <div dir="ltr" className="flex bg-tint rounded-full p-1">
      {[{ l: 'en', label: 'EN' }, { l: 'ar', label: 'عربي' }].map(({ l, label }) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className="px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
          style={{
            backgroundColor: locale === l ? 'var(--color-navy)' : 'transparent',
            color: locale === l ? '#fff' : 'var(--color-muted)',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 rounded-full transition-colors"
      style={{ width: 50, height: 30, background: checked ? 'var(--color-navy)' : 'var(--color-card-border)' }}
    >
      <motion.span
        className="absolute top-1 w-[22px] h-[22px] rounded-full bg-white"
        animate={{ left: checked ? 24 : 4 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{ boxShadow: '0 2px 6px rgba(16,38,63,.18)' }}
      />
    </button>
  )
}

function Chevron({ isAr }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ transform: isAr ? 'scaleX(-1)' : undefined }}>
      <path d="M5.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SettingsRow({ icon, label, value, onClick, isAr }) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center justify-between px-4 py-4 text-start">
      <span className="flex items-center gap-3 min-w-0">
        <span className="w-9 h-9 rounded-[12px] bg-tint flex items-center justify-center text-lg shrink-0">{icon}</span>
        <span className="text-text text-sm font-semibold truncate">{label}</span>
      </span>
      <span className="flex items-center gap-2 text-muted shrink-0">
        {value && <span className="text-xs">{value}</span>}
        <Chevron isAr={isAr} />
      </span>
    </button>
  )
}

function Header({ title, onBack, onClose, isAr }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 px-4 pb-4 bg-page" style={{ paddingTop: 'calc(14px + var(--safe-top))' }}>
      <button
        type="button"
        onClick={onBack || onClose}
        className="w-9 h-9 bg-card rounded-[12px] flex items-center justify-center shrink-0"
        aria-label={t(isAr ? 'ar' : 'en', 'close')}
      >
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" style={{ transform: isAr ? 'scaleX(-1)' : undefined }}>
          <path d="M11 3.5l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <h2 className="text-text text-lg font-bold">{title}</h2>
    </div>
  )
}

function SectionTitle({ children }) {
  return <p className="text-muted text-[11px] font-bold mb-2 px-1">{children}</p>
}

export default function SettingsPanel({ onClose, demo = false, onResetDemo, onReplayOnboarding }) {
  const { locale, setLocale } = useLocale()
  const { theme, setTheme } = useTheme()
  const isAr = locale === 'ar'
  const [view, setView] = useState('main')
  const [spendingAlerts, setSpendingAlerts] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(true)
  const [connectStep, setConnectStep] = useState(0)
  const [selectedBank, setSelectedBank] = useState(CONNECTABLE_BANKS[0])

  function openConnect() {
    setConnectStep(0)
    setView('connect')
  }

  const backTarget = view === 'connect' ? 'accounts' : 'main'

  return (
    <motion.div
      className="absolute inset-0 z-40 bg-page overflow-y-auto scroll-thin"
      dir={isAr ? 'rtl' : 'ltr'}
      initial={{ x: isAr ? '-100%' : '100%' }}
      animate={{ x: 0 }}
      exit={{ x: isAr ? '-100%' : '100%' }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <Header
        title={view === 'main' ? t(locale, 'settings') : view === 'notifications' ? t(locale, 'notifications') : view === 'accounts' ? t(locale, 'linkedAccounts') : view === 'about' ? t(locale, 'aboutMunami') : t(locale, 'connectBankTitle')}
        onClose={onClose}
        onBack={view === 'main' ? null : () => setView(backTarget)}
        isAr={isAr}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={`${view}-${connectStep}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="px-4 pb-12">
          {view === 'main' && (
            <>
              <div className="bg-card rounded-[24px] px-5 py-5 flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-rewards">
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-navy)' }}>أ</span>
                </div>
                <div>
                  <p className="text-text text-base font-bold">{isAr ? 'أحمد' : 'Ahmed'}</p>
                  <p className="text-muted text-xs mt-1">{t(locale, 'memberSince')}</p>
                </div>
              </div>

              <SectionTitle>{t(locale, 'preferences')}</SectionTitle>
              <div className="bg-card rounded-[20px] mb-5 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-text text-sm font-semibold">{t(locale, 'language')}</span>
                  <LanguageSwitch locale={locale} onChange={setLocale} />
                </div>
                <div className="h-px bg-card-border" />
                <div className="flex items-center justify-between gap-4 px-4 py-4">
                  <span className="text-text text-sm font-semibold">{t(locale, 'appearance')}</span>
                  <Toggle checked={theme === 'dark'} onChange={(dark) => setTheme(dark ? 'dark' : 'light')} label={t(locale, 'appearance')} />
                </div>
              </div>

              <SectionTitle>{t(locale, 'settingsAccount')}</SectionTitle>
              <div className="bg-card rounded-[20px] mb-5 overflow-hidden">
                <SettingsRow icon="🔔" label={t(locale, 'notifications')} value={spendingAlerts ? t(locale, 'enabled') : t(locale, 'disabled')} onClick={() => setView('notifications')} isAr={isAr} />
                <div className="h-px bg-card-border" />
                <SettingsRow icon="🏦" label={t(locale, 'linkedAccounts')} value={accountsData.accounts.length} onClick={() => setView('accounts')} isAr={isAr} />
              </div>

              <SectionTitle>{t(locale, 'settingsApp')}</SectionTitle>
              <div className="bg-card rounded-[20px] overflow-hidden">
                <SettingsRow icon={<MunamiMascot expression="greeting" size={22} />} label={t(locale, 'aboutMunami')} onClick={() => setView('about')} isAr={isAr} />
                {demo && <div className="h-px bg-card-border" />}
                {demo && <SettingsRow icon="▶" label={isAr ? 'إعادة شاشة الترحيب' : 'Replay onboarding'} onClick={onReplayOnboarding} isAr={isAr} />}
                {demo && <div className="h-px bg-card-border" />}
                {demo && <SettingsRow icon="↻" label={isAr ? 'إعادة ضبط العرض' : 'Reset demo'} onClick={onResetDemo} isAr={isAr} />}
              </div>
            </>
          )}

          {view === 'notifications' && (
            <>
              <p className="text-muted text-sm mb-5">{t(locale, 'notificationsDesc')}</p>
              <div className="bg-card rounded-[20px] overflow-hidden">
                <div className="flex items-center justify-between gap-4 px-4 py-4">
                  <div><p className="text-text text-sm font-semibold">{t(locale, 'spendingAlerts')}</p><p className="text-muted text-xs mt-1">{t(locale, 'spendingAlertsDesc')}</p></div>
                  <Toggle checked={spendingAlerts} onChange={setSpendingAlerts} label={t(locale, 'spendingAlerts')} />
                </div>
                <div className="h-px bg-card-border" />
                <div className="flex items-center justify-between gap-4 px-4 py-4">
                  <div><p className="text-text text-sm font-semibold">{t(locale, 'weeklySummary')}</p><p className="text-muted text-xs mt-1">{t(locale, 'weeklySummaryDesc')}</p></div>
                  <Toggle checked={weeklySummary} onChange={setWeeklySummary} label={t(locale, 'weeklySummary')} />
                </div>
              </div>
            </>
          )}

          {view === 'accounts' && (
            <>
              <p className="text-muted text-sm mb-5">{t(locale, 'linkedAccountsDesc')}</p>
              <div className="flex flex-col gap-3 mb-5">
                {accountsData.accounts.map((account) => (
                  <div key={account.account_id} className="bg-card rounded-[20px] p-4 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-[13px] flex items-center justify-center text-white font-bold shrink-0" style={{ background: account.color }}>{account.bank.slice(0, 1)}</span>
                    <div className="flex-1 min-w-0"><p className="text-text text-sm font-semibold truncate">{account.bank}</p><p className="text-muted text-xs">•••• {account.iban_tail} · {formatSAR(account.balance_sar)}</p></div>
                    <span className="text-positive text-[11px] font-bold">{t(locale, 'connectedLabel')}</span>
                  </div>
                ))}
              </div>
              <button onClick={openConnect} className="navy-action w-full rounded-full py-3.5 text-sm font-bold">{t(locale, 'connectBank')}</button>
            </>
          )}

          {view === 'connect' && connectStep === 0 && (
            <>
              <div className="flex justify-center mb-4"><MunamiMascot expression="greeting" size={66} /></div>
              <p className="text-text font-bold text-lg mb-2">{t(locale, 'selectBank')}</p>
              <p className="text-muted text-sm mb-5">{t(locale, 'consentIntro')}</p>
              <div className="flex flex-col gap-3 mb-6">
                {CONNECTABLE_BANKS.map((bank) => (
                  <button key={bank} onClick={() => setSelectedBank(bank)} className="bg-card rounded-[18px] px-4 py-4 flex items-center justify-between text-start">
                    <span className="text-text text-sm font-semibold">{bank}</span>
                    <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selectedBank === bank ? 'var(--color-coral)' : 'var(--color-card-border)' }}>{selectedBank === bank && <span className="w-2.5 h-2.5 rounded-full bg-rewards" />}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setConnectStep(1)} className="navy-action w-full rounded-full py-3.5 text-sm font-bold">{t(locale, 'continueLabel')}</button>
            </>
          )}

          {view === 'connect' && connectStep === 1 && (
            <>
              <p className="text-text font-bold text-lg mb-1">{t(locale, 'consentTitle')}</p>
              <p className="text-muted text-sm mb-5">{selectedBank}</p>
              <div className="bg-card rounded-[20px] p-4 mb-5 flex flex-col gap-4">
                {[t(locale, 'permissionBalances'), t(locale, 'permissionTransactions'), t(locale, 'permissionIdentity')].map((permission) => (
                  <div key={permission} className="flex items-center gap-3"><span className="w-7 h-7 rounded-full bg-tint text-positive flex items-center justify-center font-bold">✓</span><span className="text-text text-sm font-semibold">{permission}</span></div>
                ))}
              </div>
              <p className="text-muted text-xs leading-relaxed mb-6">{t(locale, 'consentPrivacy')}</p>
              <button onClick={() => setConnectStep(2)} className="navy-action w-full rounded-full py-3.5 text-sm font-bold">{t(locale, 'connectSecurely')}</button>
            </>
          )}

          {view === 'connect' && connectStep === 2 && (
            <div className="text-center pt-10">
              <div className="flex justify-center mb-5"><MunamiMascot expression="happy" size={82} /></div>
              <h3 className="text-text text-xl font-bold mb-2">{t(locale, 'bankConnected')}</h3>
              <p className="text-muted text-sm mb-8">{t(locale, 'bankConnectedDesc')}</p>
              <button onClick={() => setView('accounts')} className="navy-action w-full rounded-full py-3.5 text-sm font-bold">{t(locale, 'done')}</button>
            </div>
          )}

          {view === 'about' && (
            <div className="text-center pt-4">
              <div className="flex justify-center mb-4"><MunamiMascot expression="happy" size={86} /></div>
              <h3 className="text-text text-2xl font-bold mb-2">منمّي</h3>
              <p className="text-muted text-sm leading-relaxed mb-6">{t(locale, 'aboutCopy')}</p>
              <div className="bg-card rounded-[20px] text-start overflow-hidden">
                <div className="px-4 py-4 flex justify-between"><span className="text-muted text-sm">{t(locale, 'version')}</span><span className="text-text text-sm font-semibold">1.0.0</span></div>
                <div className="h-px bg-card-border" />
                <div className="px-4 py-4"><p className="text-text text-sm font-semibold">{t(locale, 'privacyFirst')}</p><p className="text-muted text-xs mt-1 leading-relaxed">{t(locale, 'privacyCopy')}</p></div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
