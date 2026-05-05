import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STORAGE_KEY = 'ironlog-active-workout'

export function useWorkout() {
  const { user } = useAuth()

  const saveProgress = useCallback((sessionId, exerciseIndex) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, exerciseIndex }))
  }, [])

  const clearProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const getProgress = useCallback(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  }, [])

  const startSession = async (routineId, routineName) => {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({ user_id: user.id, routine_id: routineId, routine_name: routineName })
      .select()
      .single()
    return { session: data, error }
  }

  const finishSession = async (sessionId, routineName) => {
    const updates = { completed_at: new Date().toISOString() }
    if (routineName) updates.routine_name = routineName
    await supabase.from('workout_sessions').update(updates).eq('id', sessionId)
    clearProgress()
  }

  const cancelSession = async (sessionId) => {
    if (!sessionId) return
    await supabase.from('logged_sets').delete().eq('session_id', sessionId)
    await supabase.from('workout_sessions').delete().eq('id', sessionId)
    clearProgress()
  }

  const logSet = async (set) => {
    const { data, error } = await supabase
      .from('logged_sets')
      .insert(set)
      .select()
      .single()
    return { data, error }
  }

  const getLastSets = async (exerciseId) => {
    if (!user) return []
    const { data: lastSession } = await supabase
      .from('logged_sets')
      .select('session_id, completed_at')
      .eq('exercise_id', exerciseId)
      .order('completed_at', { ascending: false })
      .limit(1)

    if (!lastSession || lastSession.length === 0) return []

    const { data: sets } = await supabase
      .from('logged_sets')
      .select('*')
      .eq('session_id', lastSession[0].session_id)
      .eq('exercise_id', exerciseId)
      .order('set_number')

    return sets || []
  }

  return { startSession, finishSession, cancelSession, logSet, getLastSets, saveProgress, clearProgress, getProgress }
}
