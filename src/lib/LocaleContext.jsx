import { createContext, useContext, useEffect, useState } from 'react'

const LocaleContext = createContext({ locale: 'ar', setLocale: () => {} })
export const useLocale = () => useContext(LocaleContext)

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => localStorage.getItem('munami_locale') || 'ar')

  useEffect(() => {
    localStorage.setItem('munami_locale', locale)
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  }, [locale])

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}
