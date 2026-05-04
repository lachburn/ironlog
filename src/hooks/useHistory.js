import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

let _sessionsCache = null
let _exHistCache = null

export function useHistory() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState(_sessionsCache || [])
  const [loading, setLoading] = useState(_sessionsCache === null)

  const fetchSessions = useCallback(async () => {
    if (!user) return
    if (_sessionsCache === null) setLoading(true)
    const { data } = await supabase
      .from('workout_sessions')
      .select('*, routines ( emoji )')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('started_at', { ascending: false })
    if (data) {
      // Detect which sessions have failure sets (graceful — no-op if column missing)
      let failIds = new Set()
      if (data.length > 0) {
        const { data: failSets, error: failErr } = await supabase
          .from('logged_sets')
          .select('session_id')
          .eq('is_failure', true)
          .in('session_id', data.map(s => s.id))
        if (!failErr && failSets) failIds = new Set(failSets.map(f => f.session_id))
      }
      const enriched = data.map(s => ({ ...s, hasFailure: failIds.has(s.id) }))
      setSessions(enriched)
      _sessionsCache = enriched
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  // Fetch a single session + its sets
  const fetchSession = async (id) => {
    const { data: session } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', id)
      .single()

    const { data: sets } = await supabase
      .from('logged_sets')
      .select('*')
      .eq('session_id', id)
      .order('completed_at')

    return { session, sets: sets || [] }
  }

  // Fetch all exercises the user has ever logged, with aggregate stats
  const fetchExerciseHistory = useCallback(async () => {
    if (!user) return []
    if (_exHistCache) return _exHistCache

    // Get all completed session IDs for this user
    const { data: sessionRows } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)

    if (!sessionRows || sessionRows.length === 0) return []
    const sessionIds = sessionRows.map(s => s.id)

    const { data: sets } = await supabase
      .from('logged_sets')
      .select('*')
      .in('session_id', sessionIds)
      .not('exercise_id', 'is', null)

    if (!sets || sets.length === 0) return []

    // Aggregate by exercise
    const map = new Map()
    for (const s of sets) {
      const key = s.exercise_id
      if (!map.has(key)) {
        map.set(key, {
          exercise_id: s.exercise_id,
          exercise_name: s.exercise_name || 'Unknown',
          exercise_type: s.exercise_type,
          total_sets: 0,
          total_reps: 0,
          heaviest_weight: 0,
          last_done: s.completed_at,
        })
      }
      const ex = map.get(key)
      ex.total_sets++
      if (s.reps) ex.total_reps += s.reps
      if (s.weight && s.weight > ex.heaviest_weight) ex.heaviest_weight = s.weight
      if (s.completed_at > ex.last_done) ex.last_done = s.completed_at
    }

    const result = Array.from(map.values())
    _exHistCache = result
    return result
  }, [user])

  // Fetch all sets for one exercise, grouped by session for charting
  const fetchExerciseDetail = useCallback(async (exerciseId) => {
    if (!user) return { sessions: [], sets: [] }

    const { data: sessionRows } = await supabase
      .from('workout_sessions')
      .select('id, started_at, routine_name')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)

    if (!sessionRows || sessionRows.length === 0) return { sessions: [], sets: [] }
    const sessionIds = sessionRows.map(s => s.id)
    const sessionMap = Object.fromEntries(sessionRows.map(s => [s.id, s]))

    const { data: sets } = await supabase
      .from('logged_sets')
      .select('*')
      .in('session_id', sessionIds)
      .eq('exercise_id', exerciseId)
      .order('completed_at')

    if (!sets || sets.length === 0) return { sessions: [], sets: [] }

    // Group sets by session to build chart data points
    const sessionGroups = new Map()
    for (const s of sets) {
      const sid = s.session_id
      if (!sessionGroups.has(sid)) {
        sessionGroups.set(sid, {
          session_id: sid,
          date: sessionMap[sid]?.started_at || s.completed_at,
          routine_name: sessionMap[sid]?.routine_name || '',
          sets: [],
          max_weight: 0,
          total_reps: 0,
          set_count: 0,
        })
      }
      const g = sessionGroups.get(sid)
      g.sets.push(s)
      if (s.weight && s.weight > g.max_weight) g.max_weight = s.weight
      if (s.reps) { g.total_reps += s.reps; g.set_count++ }
    }

    const sessionData = Array.from(sessionGroups.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    return { sessions: sessionData, sets }
  }, [user])

  const deleteWorkout = async (sessionId) => {
    await supabase.from('logged_sets').delete().eq('session_id', sessionId)
    const { error } = await supabase.from('workout_sessions').delete().eq('id', sessionId)
    if (!error) {
      _sessionsCache = null
      _exHistCache = null
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    }
    return { error }
  }

  return {
    sessions, loading, fetchSessions, fetchSession,
    fetchExerciseHistory, fetchExerciseDetail,
    deleteWorkout,
    exHistCacheExists: _exHistCache !== null,
  }
}
