import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const ACTIVITY_KEY = 'ironlog-last-activity'
const IDLE_MS = 24 * 60 * 60 * 1000 // 24 hours

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

// Stamp the current time so the idle check has a reference point.
// Throttled to one write per minute to avoid thrashing localStorage on mobile.
let _activityThrottle = null
function stampActivity() {
  if (_activityThrottle) return
  localStorage.setItem(ACTIVITY_KEY, Date.now().toString())
  _activityThrottle = setTimeout(() => { _activityThrottle = null }, 60_000)
}

function isIdle() {
  const raw = localStorage.getItem(ACTIVITY_KEY)
  if (!raw) return false // no stamp yet → treat as active
  return Date.now() - parseInt(raw, 10) > IDLE_MS
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ── Activity listeners (touchstart covers all tap interactions on iOS) ──
    const EVENTS = ['touchstart', 'mousedown', 'keydown']
    EVENTS.forEach(ev => window.addEventListener(ev, stampActivity, { passive: true }))

    // ── Re-check idle whenever the app comes back to foreground ──
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (isIdle()) {
        supabase.auth.signOut()
        localStorage.removeItem(ACTIVITY_KEY)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // ── Bootstrap: get existing session and apply idle check ──
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        if (isIdle()) {
          // Session exists but user has been idle for >24h — sign them out.
          supabase.auth.signOut().then(() => {
            localStorage.removeItem(ACTIVITY_KEY)
            setUser(null)
            setLoading(false)
          })
          return
        }
        // Active session with no prior stamp (e.g. existing users before this
        // feature shipped) — stamp now so the clock starts from today.
        if (!localStorage.getItem(ACTIVITY_KEY)) stampActivity()
      }
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // ── React to Supabase auth events ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        seedExercises(u.id)
        if (event === 'SIGNED_IN') stampActivity() // fresh login resets the clock
      }
      if (event === 'SIGNED_OUT') localStorage.removeItem(ACTIVITY_KEY)
    })

    return () => {
      EVENTS.forEach(ev => window.removeEventListener(ev, stampActivity))
      document.removeEventListener('visibilitychange', handleVisibility)
      subscription.unsubscribe()
    }
  }, [])

  const sendOtp = (email) =>
    supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })

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
