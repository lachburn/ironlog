import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function buildJourneyItems(startDate, targetDate, days, types, routineLinks, activityLinks) {
  const items = []
  const start = new Date(startDate)
  start.setHours(6, 30, 0, 0)
  const end = new Date(targetDate)
  end.setHours(23, 59, 59, 999)
  const current = new Date(start)
  while (current <= end) {
    const dow = current.getDay()
    if (days[dow]) {
      items.push({
        date: new Date(current).toISOString(),
        type: types[dow] || 'Workout',
        routine_id: routineLinks?.[dow] || null,
        activity_id: activityLinks?.[dow] || null,
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
  const { user } = useAuth()
  const [journeys, setJourneys] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchJourneys = useCallback(async () => {
    if (!user) { setJourneys([]); setLoading(false); return }
    const { data } = await supabase
      .from('journeys')
      .select('*, journey_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) {
      setJourneys(data.map(j => ({
        ...j,
        items: (j.journey_items || []).sort((a, b) => new Date(a.date) - new Date(b.date)),
      })))
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchJourneys() }, [fetchJourneys])

  const createJourney = useCallback(async ({ title, goal, target_date, days, types, routineLinks, activityLinks }) => {
    if (!user) return null
    const { data: journey, error } = await supabase
      .from('journeys')
      .insert({ user_id: user.id, title, goal, target_date, start_date: new Date().toISOString() })
      .select()
      .single()
    if (error || !journey) return null

    const rawItems = buildJourneyItems(journey.start_date, target_date, days, types, routineLinks, activityLinks)
    const itemRows = rawItems.map(item => ({ journey_id: journey.id, ...item }))
    const { data: items } = await supabase.from('journey_items').insert(itemRows).select()

    const fullJourney = { ...journey, items: items || [] }
    setJourneys(prev => [fullJourney, ...prev])
    return fullJourney
  }, [user])

  const toggleItem = useCallback(async (journeyId, itemId) => {
    const journey = journeys.find(j => j.id === journeyId)
    const item = journey?.items.find(i => i.id === itemId)
    if (!item) return
    const { error } = await supabase
      .from('journey_items')
      .update({ completed: !item.completed })
      .eq('id', itemId)
    if (!error) {
      setJourneys(prev => prev.map(j => j.id !== journeyId ? j : {
        ...j,
        items: j.items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i),
      }))
    }
  }, [journeys])

  const linkItem = useCallback(async (journeyId, itemId, sessionId) => {
    const { error } = await supabase
      .from('journey_items')
      .update({ completed: true, linked_session_id: sessionId })
      .eq('id', itemId)
    if (!error) {
      setJourneys(prev => prev.map(j => j.id !== journeyId ? j : {
        ...j,
        items: j.items.map(i => i.id === itemId ? { ...i, completed: true, linked_session_id: sessionId } : i),
      }))
    }
  }, [])

  const updateJourney = useCallback(async (journeyId, { title, goal, target_date, itemUpdates }) => {
    await supabase
      .from('journeys')
      .update({ title, goal, target_date })
      .eq('id', journeyId)

    for (const { id, type, routine_id, activity_id } of (itemUpdates || [])) {
      await supabase
        .from('journey_items')
        .update({ type, routine_id, activity_id })
        .eq('id', id)
    }

    setJourneys(prev => prev.map(j => {
      if (j.id !== journeyId) return j
      const updatedItems = j.items.map(item => {
        const upd = itemUpdates?.find(u => u.id === item.id)
        return upd ? { ...item, type: upd.type, routine_id: upd.routine_id, activity_id: upd.activity_id } : item
      })
      return { ...j, title, goal, target_date, items: updatedItems }
    }))
  }, [])

  const unlinkSession = useCallback(async (sessionId) => {
    await supabase
      .from('journey_items')
      .update({ completed: false, linked_session_id: null })
      .eq('linked_session_id', sessionId)
    setJourneys(prev => prev.map(j => ({
      ...j,
      items: j.items.map(item =>
        item.linked_session_id === sessionId
          ? { ...item, completed: false, linked_session_id: null }
          : item
      ),
    })))
  }, [])

  const deleteJourney = useCallback(async (journeyId) => {
    await supabase.from('journeys').delete().eq('id', journeyId)
    setJourneys(prev => prev.filter(j => j.id !== journeyId))
  }, [])

  return { journeys, loading, createJourney, updateJourney, toggleItem, linkItem, unlinkSession, deleteJourney }
}
