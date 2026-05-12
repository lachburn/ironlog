import { createContext, useContext, useState } from 'react'

const WeekStartContext = createContext(null)
const KEY = 'ironlog-week-start'

export function WeekStartProvider({ children }) {
  const [weekStart, setWeekStart] = useState(() => {
    const saved = localStorage.getItem(KEY)
    return saved !== null ? parseInt(saved, 10) : 1
  })

  const setAndSave = (day) => {
    setWeekStart(day)
    localStorage.setItem(KEY, String(day))
  }

  return (
    <WeekStartContext.Provider value={{ weekStart, setWeekStart: setAndSave }}>
      {children}
    </WeekStartContext.Provider>
  )
}

export function useWeekStart() {
  return useContext(WeekStartContext)
}
