import { createContext, useContext, useState, useEffect } from 'react'

const WeightUnitContext = createContext(null)

export function WeightUnitProvider({ children }) {
  const [unit, setUnit] = useState(() => localStorage.getItem('ironlog-weight-unit') || 'kg')

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ironlog-weight-unit') setUnit(e.newValue || 'kg')
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const setAndPersist = (u) => {
    setUnit(u)
    localStorage.setItem('ironlog-weight-unit', u)
  }

  const toDisplay = (kg) => {
    if (kg == null) return null
    if (unit === 'lbs') return Math.round(kg * 2.20462 * 4) / 4
    return kg
  }

  const toKg = (val) => {
    if (val == null) return null
    if (unit === 'lbs') return Math.round((val / 2.20462) * 100) / 100
    return val
  }

  return (
    <WeightUnitContext.Provider value={{ unit, setUnit: setAndPersist, toDisplay, toKg }}>
      {children}
    </WeightUnitContext.Provider>
  )
}

export function useWeightUnit() {
  return useContext(WeightUnitContext)
}
