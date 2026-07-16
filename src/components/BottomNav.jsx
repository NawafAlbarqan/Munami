import { ArrowLeftRight, Home, PieChart, Target } from 'lucide-react'
import MunamiMascot from './MunamiMascot'
import { useLocale } from '../lib/LocaleContext'
import { t } from '../lib/i18n'

const TABS = [
  { key: 'home', labelKey: 'navHome', Icon: Home },
  { key: 'budget', labelKey: 'navBudget', Icon: PieChart },
  { key: 'copilot', hero: true },
  { key: 'goals', labelKey: 'navGoals', Icon: Target },
  { key: 'transactions', labelKey: 'navTransactions', Icon: ArrowLeftRight },
]

export default function BottomNav({ active = 'home', onTabChange }) {
  const { locale } = useLocale()

  return (
    <nav className="bottom-nav" aria-label={locale === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}>
      {TABS.map((tab) => {
        const isActive = tab.key === active
        if (tab.hero) {
          return (
            <button
              key={tab.key}
              type="button"
              className={`nav-item nav-assistant ${isActive ? 'is-active' : ''}`}
              onClick={() => onTabChange?.(tab.key)}
              aria-label={locale === 'ar' ? 'مساعد منمّي' : 'Munami Assistant'}
            >
              <span className="nav-mascot"><MunamiMascot expression="happy" size={34} /></span>
            </button>
          )
        }

        const Icon = tab.Icon
        return (
          <button
            key={tab.key}
            type="button"
            className={`nav-item ${isActive ? 'is-active' : ''}`}
            onClick={() => onTabChange?.(tab.key)}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span>{t(locale, tab.labelKey)}</span>
          </button>
        )
      })}
    </nav>
  )
}
