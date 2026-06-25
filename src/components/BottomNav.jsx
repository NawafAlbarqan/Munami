const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'copilot', label: 'Copilot' },
  { key: 'goals', label: 'Goals' },
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
            className={`flex flex-col items-center gap-1 text-xs ${
              isActive ? 'text-primary' : 'text-muted'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isActive ? 'bg-primary' : 'bg-transparent'
              }`}
            />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
