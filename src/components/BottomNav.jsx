// Left-to-right order. `hero: true` marks منمّي as the center/emphasized tab.
const TABS = [
  { key: 'transactions', label: 'Transactions' },
  { key: 'goals', label: 'Goals' },
  { key: 'copilot', label: 'منمّي', hero: true },
  { key: 'overview', label: 'Overview' },
  { key: 'accounts', label: 'Accounts' },
]

export default function BottomNav({ active = 'overview', onTabChange }) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-10 flex items-center h-16 bg-card border-t-[0.5px] border-card-border">
      {TABS.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange?.(tab.key)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 h-full ${
              tab.hero
                ? `text-sm font-semibold ${isActive ? 'text-primary' : 'text-primary/50'}`
                : `text-xs ${isActive ? 'text-primary' : 'text-muted'}`
            }`}
          >
            {tab.hero ? (
              // منمّي gets a pill indicator that's always mint-tinted so it reads
              // as the center/hero even when inactive
              <span
                className={`w-8 h-1 rounded-full transition-opacity ${
                  isActive ? 'bg-primary' : 'bg-primary/30'
                }`}
              />
            ) : (
              <span
                className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-primary' : 'bg-transparent'
                }`}
              />
            )}
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
