import GrowthMark from './GrowthMark'

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
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="9" r="3.8" fill="var(--color-page)" />
      <path d="M9 1.5A7.5 7.5 0 0 1 16.5 9H9V1.5Z" fill="currentColor" />
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
  { key: 'transactions', label: 'Transactions', Icon: ListIcon },
  { key: 'goals', label: 'Goals', Icon: TargetIcon },
  { key: 'copilot', label: 'منمّي', hero: true },
  { key: 'overview', label: 'Overview', Icon: DonutIcon },
  { key: 'accounts', label: 'Accounts', Icon: WalletIcon },
]

export default function BottomNav({ active = 'overview', onTabChange }) {
  return (
    <nav
      className="absolute bottom-0 left-0 right-0 z-10 flex items-end bg-card border-t-[0.5px] border-card-border"
      style={{ height: 72, overflow: 'visible' }}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active

        if (tab.hero) {
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange?.(tab.key)}
              className="flex-1 flex flex-col items-center pb-2 gap-0.5"
              style={{ overflow: 'visible', marginBottom: 0 }}
            >
              {/* Raised circle — floats up above the nav line */}
              <div
                className="w-[56px] h-[56px] rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  backgroundColor: isActive ? 'var(--color-primary)' : 'rgba(45,106,74,0.72)',
                  boxShadow: isActive
                    ? '0 -2px 20px rgba(45,106,74,0.35), 0 4px 16px rgba(45,106,74,0.25)'
                    : '0 -2px 12px rgba(45,106,74,0.18), 0 4px 10px rgba(45,106,74,0.15)',
                  marginTop: -24,
                }}
              >
                <GrowthMark size={22} color="#FFFDF8" />
              </div>
              <span
                className="text-[9px] font-bold leading-none"
                style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-muted)' }}
              >
                منمّي
              </span>
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
            style={{ paddingBottom: 8 }}
          >
            {/* Active pill indicator above the icon */}
            <span
              className="rounded-full transition-all duration-200"
              style={{
                width: isActive ? 20 : 4,
                height: 3,
                backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                marginBottom: 2,
              }}
            />
            <Icon
              style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-muted)' }}
            />
            <span
              className="text-[10px] leading-none transition-all duration-200"
              style={{
                color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
                fontWeight: isActive ? 700 : 400,
              }}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
