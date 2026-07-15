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
        // Retro: flat card-toned bar with a thick black top rule.
        // Tokenized so it adapts between dark charcoal / light cream.
        background: 'var(--color-card)',
        borderTop: '3px solid #000000',
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
              className="flex-1 flex items-center justify-center"
              style={{ overflow: 'visible' }}
              aria-label="منمّي"
            >
              {/* Icon-only hero tab — no text label under it (unlike the other
                  4 tabs). Raised circle floats up above the nav line; the
                  -20 raise (was -26) sits a touch lower for better balance
                  now that there's no label competing for space below it. */}
              <div
                className="w-[58px] h-[58px] rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: 'var(--color-primary)',
                  border: '3px solid #000000',
                  opacity: isActive ? 1 : 0.9,
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isActive ? '4px 4px 0 #000000' : '3px 3px 0 #000000',
                  marginTop: -20,
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
            {/* Soft mint pill fills behind the active icon — the "tubelight"
                treatment — instead of a bare color swap. */}
            <span
              className="flex items-center justify-center transition-all duration-200"
              style={{
                width: 46,
                height: 28,
                borderRadius: 10,
                background: isActive ? 'var(--color-primary)' : 'transparent',
                border: isActive ? '2.5px solid #000000' : '2.5px solid transparent',
                boxShadow: isActive ? '2.5px 2.5px 0 #000000' : 'none',
              }}
            >
              <Icon
                className="transition-transform duration-200"
                style={{
                  color: isActive ? 'var(--color-on-accent)' : 'var(--color-muted)',
                  transform: isActive ? 'scale(1.06)' : 'scale(1)',
                }}
              />
            </span>
            <span
              className="text-[10px] leading-none transition-all duration-200"
              style={{
                color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
                fontWeight: isActive ? 800 : 600,
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
