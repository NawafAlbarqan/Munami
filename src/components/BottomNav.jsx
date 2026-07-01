// Left-to-right order. `hero: true` marks منمّي as the center/emphasized tab.
const TABS = [
  { key: 'transactions', label: 'Transactions' },
  { key: 'overview', label: 'Overview' },
  { key: 'copilot', label: 'منمّي', hero: true },
  { key: 'goals', label: 'Goals' },
  { key: 'accounts', label: 'Accounts' },
]

export default function BottomNav({ active = 'overview' }) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-10 flex justify-around items-center h-16 bg-card border-t-[0.5px] border-card-border">
      {TABS.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            type="button"
            className={`flex flex-col items-center gap-1 ${
              tab.hero ? 'text-sm font-semibold' : 'text-xs'
            } ${isActive ? 'text-primary' : 'text-muted'}`}
          >
            {/* Hero tab gets a larger indicator pill; others get a small dot */}
            {tab.hero ? (
              <span
                className={`w-8 h-1 rounded-full ${
                  isActive ? 'bg-primary' : 'bg-transparent'
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
