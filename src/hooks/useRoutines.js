import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useRoutines() {
  const { user } = useAuth()
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRoutines = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('routines')
      .select(`
        *,
        routine_exercises (
          *,
          exercises ( id, name, type )
        )
      `)
      .eq('user_id', user.id)
      .order('display_order')

    if (data) {
      const sorted = data.map(r => ({
        ...r,
        routine_exercises: [...(r.routine_exercises || [])].sort(
          (a, b) => a.display_order - b.display_order
        )
      }))
      setRoutines(sorted)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchRoutines() }, [fetchRoutines])

  const createRoutine = async ({ name, emoji }) => {
    const { data, error } = await supabase
      .from('routines')
      .insert({ user_id: user.id, name, emoji, display_order: routines.length })
      .select()
      .single()
    if (!error) await fetchRoutines()
    return { data, error }
  }

  const updateRoutine = async (id, updates) => {
    const { error } = await supabase.from('routines').update(updates).eq('id', id)
    if (!error) await fetchRoutines()
    return { error }
  }

  const deleteRoutine = async (id) => {
    const { error } = await supabase.from('routines').delete().eq('id', id)
    if (!error) await fetchRoutines()
    return { error }
  }

  const saveRoutineExercises = async (routineId, exercises) => {
    await supabase.from('routine_exercises').delete().eq('routine_id', routineId)
    if (exercises.length === 0) {
      await fetchRoutines()
      return
    }
    const rows = exercises.map((e, i) => ({
      routine_id: routineId,
      exercise_id: e.exercise_id || e.id,
      display_order: i,
      default_sets: e.default_sets || 3,
      default_reps: e.default_reps || 10,
      default_weight: e.default_weight || 0,
    }))
    await supabase.from('routine_exercises').insert(rows)
    await fetchRoutines()
  }

  return { routines, loading, fetchRoutines, createRoutine, updateRoutine, deleteRoutine, saveRoutineExercises }
}
