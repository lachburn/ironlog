import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useHistory() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('started_at', { ascending: false })
    if (data) setSessions(data)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchSessions() }, [fetchSessions])

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

  return { sessions, loading, fetchSessions, fetchSession }
}
