import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const SEED_EXERCISES = [
  { name: 'Leg Press', type: 'weighted' },
  { name: 'Leg Curl', type: 'weighted' },
  { name: 'Leg Extension', type: 'weighted' },
  { name: 'Chest Press Machine', type: 'weighted' },
  { name: 'Lat Pulldown', type: 'weighted' },
  { name: 'Seated Row', type: 'weighted' },
  { name: 'Shoulder Press Machine', type: 'weighted' },
  { name: 'Hack Squat', type: 'weighted' },
  { name: 'Squat', type: 'weighted' },
  { name: 'Deadlift', type: 'weighted' },
  { name: 'Bench Press', type: 'weighted' },
  { name: 'Barbell Row', type: 'weighted' },
  { name: 'Overhead Press', type: 'weighted' },
  { name: 'Romanian Deadlift', type: 'weighted' },
  { name: 'Dumbbell Curl', type: 'dumbbell' },
  { name: 'Tricep Extension', type: 'dumbbell' },
  { name: 'Dumbbell Lateral Raise', type: 'dumbbell' },
  { name: 'Push-ups', type: 'bodyweight' },
  { name: 'Pull-ups', type: 'bodyweight' },
  { name: 'Dips', type: 'bodyweight' },
  { name: 'Lunges', type: 'bodyweight' },
  { name: 'Plank', type: 'bodyweight' },
  { name: 'Sit-ups', type: 'bodyweight' },
  { name: 'Box Jumps', type: 'bodyweight' },
  { name: 'Treadmill', type: 'cardio' },
  { name: 'Rowing Machine', type: 'cardio' },
  { name: 'Bike (Stationary)', type: 'cardio' },
  { name: 'Stair Climber', type: 'cardio' },
]

async function seedExercises(userId) {
  const { data: existing } = await supabase
    .from('exercises')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (existing && existing.length > 0) return

  const rows = SEED_EXERCISES.map(e => ({
    user_id: userId,
    name: e.name,
    type: e.type,
    is_global: true,
  }))

  await supabase.from('exercises').insert(rows)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) seedExercises(u.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Step 1: send OTP to email
  const sendOtp = (email) =>
    supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })

  // Step 2: verify the 6-digit OTP
  const verifyOtp = (email, token) =>
    supabase.auth.verifyOtp({ email, token, type: 'email' })

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, loading, sendOtp, verifyOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
