import { useState, useCallback } from 'react'

const KEY = 'ironlog-journeys'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// Build weekly journey items from days selection + types map
function buildJourneyItems(startDate, targetDate, days, types) {
  const items = []
  const start = new Date(startDate)
  start.setHours(6, 30, 0, 0)
  const end = new Date(targetDate)
  end.setHours(23, 59, 59, 999)
  const current = new Date(start)
  while (current <= end) {
    const dow = current.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
    if (days[dow]) {
      items.push({
        id: uid(),
        date: new Date(current).toISOString(),
        type: types[dow] || 'Workout',
        details: '',
        completed: false,
        linked_session_id: null,
      })
    }
    current.setDate(current.getDate() + 1)
  }
  return items
}

export function useJourneys() {
  const [journeys, setJourneys] = useState(load)

  const createJourney = useCallback(({ title, goal, target_date, days, types }) => {
    const today = new Date().toISOString()
    const journey = {
      id: uid(),
      title,
      goal,
      target_date,
      start_date: today,
      created_at: today,
      items: buildJourneyItems(today, target_date, days, types),
    }
    const next = [journey, ...load()]
    save(next)
    setJourneys(next)
    return journey
  }, [])

  const toggleItem = useCallback((journeyId, itemId) => {
    const next = load().map(j => {
      if (j.id !== journeyId) return j
      return {
        ...j,
        items: j.items.map(i =>
          i.id === itemId ? { ...i, completed: !i.completed } : i
        ),
      }
    })
    save(next)
    setJourneys(next)
  }, [])

  const linkItem = useCallback((journeyId, itemId, sessionId) => {
    const next = load().map(j => {
      if (j.id !== journeyId) return j
      return {
        ...j,
        items: j.items.map(i =>
          i.id === itemId ? { ...i, linked_session_id: sessionId, completed: true } : i
        ),
      }
    })
    save(next)
    setJourneys(next)
  }, [])

  const deleteJourney = useCallback((journeyId) => {
    const next = load().filter(j => j.id !== journeyId)
    save(next)
    setJourneys(next)
  }, [])

  return { journeys, createJourney, toggleItem, linkItem, deleteJourney }
}
