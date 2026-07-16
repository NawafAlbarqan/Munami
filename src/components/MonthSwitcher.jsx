export default function MonthSwitcher({ label, onPrev, onNext, canPrev, canNext, locale = 'en' }) {
  const isArabic = locale === 'ar'
  const leftAction = isArabic ? onNext : onPrev
  const rightAction = isArabic ? onPrev : onNext
  const canGoLeft = isArabic ? canNext : canPrev
  const canGoRight = isArabic ? canPrev : canNext
  return (
    <div dir="ltr" className="month-switcher flex items-center justify-between rounded-[20px] px-2 py-2 mb-4">
      <button
        type="button"
        onClick={leftAction}
        disabled={!canGoLeft}
        aria-label={isArabic ? 'الشهر التالي' : 'Previous month'}
        className="w-8 h-8 flex items-center justify-center disabled:cursor-not-allowed"
      >
        ‹
      </button>
      <span dir={isArabic ? 'rtl' : 'ltr'} className="font-semibold text-sm">{label}</span>
      <button
        type="button"
        onClick={rightAction}
        disabled={!canGoRight}
        aria-label={isArabic ? 'الشهر السابق' : 'Next month'}
        className="w-8 h-8 flex items-center justify-center disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  )
}
