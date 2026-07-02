import { useLocale } from '../lib/LocaleContext'

export default function LanguageToggle() {
  const { locale, setLocale } = useLocale()
  return (
    // dir="ltr" keeps EN|AR order fixed regardless of app direction
    <div
      dir="ltr"
      className="absolute z-20 flex rounded-full overflow-hidden border-[0.5px] border-card-border bg-card"
      style={{ top: 10, right: 12, boxShadow: '0 1px 6px rgba(45,106,74,0.10)' }}
    >
      {['en', 'ar'].map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className="px-2.5 py-1 text-[11px] font-bold transition-colors duration-150"
          style={{
            backgroundColor: locale === l ? 'var(--color-primary)' : 'transparent',
            color: locale === l ? '#FFFDF8' : 'var(--color-muted)',
          }}
        >
          {l === 'en' ? 'EN' : 'AR'}
        </button>
      ))}
    </div>
  )
}
