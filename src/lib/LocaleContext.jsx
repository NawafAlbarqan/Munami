import { createContext, useContext, useState } from 'react'

const LocaleContext = createContext({ locale: 'en', setLocale: () => {} })
export const useLocale = () => useContext(LocaleContext)

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState('en')
  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}
