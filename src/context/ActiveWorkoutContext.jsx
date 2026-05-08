import { createContext, useContext, useState } from 'react'

const STORAGE_KEY = 'ironlog-live-workout'

const ActiveWorkoutContext = createContext(null)

export function ActiveWorkoutProvider({ children }) {
  const [activeWorkout, setActiveWorkoutState] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  })

  const setActiveWorkout = (data) => {
    // data: { routineId, routineName, startedAt }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setActiveWorkoutState(data)
  }

  const clearActiveWorkout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setActiveWorkoutState(null)
  }

  return (
    <ActiveWorkoutContext.Provider value={{ activeWorkout, setActiveWorkout, clearActiveWorkout }}>
      {children}
    </ActiveWorkoutContext.Provider>
  )
}

export const useActiveWorkout = () => useContext(ActiveWorkoutContext)
