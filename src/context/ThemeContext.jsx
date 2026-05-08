import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('ironlog-theme') || 'dark')

  useEffect(() => {
    localStorage.setItem('ironlog-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Set on mount too (in case SSR / initial render)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, []) // eslint-disable-line

  const setTheme = (t) => {
    if (['light', 'dark', 'tilly'].includes(t)) setThemeState(t)
  }

  // Keep toggleTheme for backward compat
  const toggleTheme = () => setThemeState(t => t === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
