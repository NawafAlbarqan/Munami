export default function MonthSwitcher({ label, onPrev, onNext, canPrev, canNext }) {
  return (
    <div className="flex items-center justify-between bg-tint rounded-[20px] px-2 py-2 mb-4">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="Previous month"
        className="w-8 h-8 flex items-center justify-center text-text disabled:text-muted/40 disabled:cursor-not-allowed"
      >
        ‹
      </button>
      <span className="text-text font-semibold text-sm">{label}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label="Next month"
        className="w-8 h-8 flex items-center justify-center text-text disabled:text-muted/40 disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  )
}
