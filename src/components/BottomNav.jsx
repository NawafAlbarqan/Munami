import MunamiMascot from './MunamiMascot'
import { useLocale } from '../lib/LocaleContext'
import { t } from '../lib/i18n'

// Simple SVG icons for each non-hero tab
function ListIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
      <circle cx="3.5" cy="5" r="1.5" fill="currentColor" />
      <rect x="7" y="4" width="9" height="2" rx="1" fill="currentColor" />
      <circle cx="3.5" cy="9.5" r="1.5" fill="currentColor" />
      <rect x="7" y="8.5" width="9" height="2" rx="1" fill="currentColor" />
      <circle cx="3.5" cy="14" r="1.5" fill="currentColor" />
      <rect x="7" y="13" width="9" height="2" rx="1" fill="currentColor" />
    </svg>
  )
}

function TargetIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="9" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="9" r="1.8" fill="currentColor" />
    </svg>
  )
}

function DonutIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
      <circle cx="9" cy="9" r="5.65" stroke="currentColor" strokeWidth="3.7" opacity="0.45" />
      {/* Quarter wedge drawn as a true annular sector — no background-colored
          masking circle, so the icon sits cleanly on any fill behind it. */}
      <path d="M 9 1.5 A 7.5 7.5 0 0 1 16.5 9 L 12.8 9 A 3.8 3.8 0 0 0 9 5.2 Z" fill="currentColor" />
    </svg>
  )
}

function WalletIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
      <rect x="1.5" y="6" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 6V4.5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2V6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13" cy="11.5" r="1.5" fill="currentColor" />
    </svg>
  )
}

const TABS = [
  { key: 'transactions', labelKey: 'navTransactions', Icon: ListIcon },
  { key: 'goals', labelKey: 'navGoals', Icon: TargetIcon },
  { key: 'copilot', hero: true },
  { key: 'overview', labelKey: 'navOverview', Icon: DonutIcon },
  { key: 'accounts', labelKey: 'navAccounts', Icon: WalletIcon },
]

export default function BottomNav({ active = 'overview', onTabChange }) {
  const { locale } = useLocale()
  return (
    <nav
      className="absolute bottom-0 left-0 right-0 z-10 flex items-end"
      style={{
        height: 74,
        overflow: 'visible',
        // Calm ivory/navy surface with a fine 1px top border (see DESIGN.md).
        background: 'var(--color-card)',
        borderTop: '1px solid var(--color-card-border)',
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active

        if (tab.hero) {
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange?.(tab.key)}
              className="flex-1 h-full relative"
              style={{ overflow: 'visible' }}
              aria-label="منمّي"
            >
              {/* Icon-only hero tab — a 54px navy rounded-square/circle hybrid,
                  raised 10px above center (per DESIGN.md's floating Monami
                  action). Centered via translate so it stays put regardless
                  of nav height/border tweaks. */}
              <div
                className="w-[54px] h-[54px] flex items-center justify-center transition-all duration-200"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  borderRadius: 20,
                  background: 'var(--gradient-hero)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  opacity: 1,
                  transform: isActive
                    ? 'translate(-50%, calc(-50% - 10px)) scale(1.04)'
                    : 'translate(-50%, calc(-50% - 10px))',
                  boxShadow: 'var(--shadow-float)',
                }}
              >
                <MunamiMascot expression="happy" size={32} />
              </div>
            </button>
          )
        }

        const { Icon } = tab
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange?.(tab.key)}
            className="flex-1 flex flex-col items-center justify-center gap-1"
            style={{ paddingBottom: 9 }}
          >
            {/* Active = coral icon on a soft coral-tinted pill; inactive =
                muted navy. Labels always visible (see DESIGN.md nav rules). */}
            <span
              className="flex items-center justify-center transition-all duration-200"
              style={{
                width: 46,
                height: 28,
                borderRadius: 999,
                background: isActive
                  ? 'color-mix(in srgb, var(--color-primary) 14%, transparent)'
                  : 'transparent',
              }}
            >
              <Icon
                className="transition-transform duration-200"
                style={{
                  color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
                  transform: isActive ? 'scale(1.06)' : 'scale(1)',
                }}
              />
            </span>
            <span
              className="text-[10px] leading-none transition-all duration-200"
              style={{
                color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
                fontWeight: isActive ? 700 : 500,
              }}
            >
              {t(locale, tab.labelKey)}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
