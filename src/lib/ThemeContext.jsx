import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext({ theme: 'light', setTheme: () => {} })
export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('munami_theme') || 'light')

  // Category/donut colors are read via getComputedStyle(document.documentElement)
  // (see the themeColor() helpers in GoalsTab/TransactionsTab) — mirror the
  // active theme class onto <html> too, not just the phone screen div, so
  // those reads always resolve against the currently active theme.
  useEffect(() => {
    localStorage.setItem('munami_theme', theme)
    document.documentElement.classList.remove('theme-dark', 'theme-light')
    document.documentElement.classList.add(`theme-${theme}`)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
