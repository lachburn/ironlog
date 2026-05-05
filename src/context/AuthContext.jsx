import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const ACTIVITY_KEY = 'ironlog-last-activity'
const IDLE_MS = 24 * 60 * 60 * 1000 // 24 hours

const SEED_EXERCISES = [
  // ── Barbell (weighted) ──────────────────────────────────────────────
  { name: 'Squat',                        type: 'weighted' },
  { name: 'Front Squat',                  type: 'weighted' },
  { name: 'Low Bar Squat',                type: 'weighted' },
  { name: 'Deadlift',                     type: 'weighted' },
  { name: 'Sumo Deadlift',                type: 'weighted' },
  { name: 'Romanian Deadlift',            type: 'weighted' },
  { name: 'Stiff-Leg Deadlift',           type: 'weighted' },
  { name: 'Bench Press',                  type: 'weighted' },
  { name: 'Incline Bench Press',          type: 'weighted' },
  { name: 'Decline Bench Press',          type: 'weighted' },
  { name: 'Close-Grip Bench Press',       type: 'weighted' },
  { name: 'Overhead Press',               type: 'weighted' },
  { name: 'Push Press',                   type: 'weighted' },
  { name: 'Barbell Row',                  type: 'weighted' },
  { name: 'Pendlay Row',                  type: 'weighted' },
  { name: 'Barbell Curl',                 type: 'weighted' },
  { name: 'Barbell Shrug',                type: 'weighted' },
  { name: 'Hip Thrust',                   type: 'weighted' },
  { name: 'Good Morning',                 type: 'weighted' },
  { name: 'Zercher Squat',                type: 'weighted' },
  { name: 'Power Clean',                  type: 'weighted' },
  { name: 'Hang Clean',                   type: 'weighted' },
  { name: 'Snatch',                       type: 'weighted' },
  { name: 'Landmine Press',               type: 'weighted' },
  { name: 'Landmine Row',                 type: 'weighted' },
  { name: 'EZ-Bar Curl',                  type: 'weighted' },
  { name: 'EZ-Bar Skullcrusher',          type: 'weighted' },

  // ── Machine (weighted) ──────────────────────────────────────────────
  { name: 'Hack Squat',                   type: 'weighted' },
  { name: 'Leg Press',                    type: 'weighted' },
  { name: 'Leg Curl',                     type: 'weighted' },
  { name: 'Leg Extension',                type: 'weighted' },
  { name: 'Standing Calf Raise',          type: 'weighted' },
  { name: 'Seated Calf Raise',            type: 'weighted' },
  { name: 'Chest Press Machine',          type: 'weighted' },
  { name: 'Incline Chest Press Machine',  type: 'weighted' },
  { name: 'Pec Deck',                     type: 'weighted' },
  { name: 'Cable Crossover',              type: 'weighted' },
  { name: 'Lat Pulldown',                 type: 'weighted' },
  { name: 'Seated Row',                   type: 'weighted' },
  { name: 'Cable Row (Wide Grip)',         type: 'weighted' },
  { name: 'Straight-Arm Pulldown',        type: 'weighted' },
  { name: 'Shoulder Press Machine',       type: 'weighted' },
  { name: 'Lateral Raise Machine',        type: 'weighted' },
  { name: 'Rear Delt Fly Machine',        type: 'weighted' },
  { name: 'Smith Machine Squat',          type: 'weighted' },
  { name: 'Smith Machine Bench Press',    type: 'weighted' },
  { name: 'Smith Machine Row',            type: 'weighted' },
  { name: 'Assisted Pull-up Machine',     type: 'weighted' },
  { name: 'Hip Abductor Machine',         type: 'weighted' },
  { name: 'Hip Adductor Machine',         type: 'weighted' },
  { name: 'Cable Bicep Curl',             type: 'weighted' },
  { name: 'Cable Tricep Pushdown',        type: 'weighted' },
  { name: 'Cable Face Pull',              type: 'weighted' },
  { name: 'Cable Lateral Raise',          type: 'weighted' },
  { name: 'Glute Kickback Machine',       type: 'weighted' },
  { name: 'T-Bar Row',                    type: 'weighted' },

  // ── Dumbbell ────────────────────────────────────────────────────────
  { name: 'Dumbbell Curl',                type: 'dumbbell' },
  { name: 'Hammer Curl',                  type: 'dumbbell' },
  { name: 'Incline Dumbbell Curl',        type: 'dumbbell' },
  { name: 'Concentration Curl',           type: 'dumbbell' },
  { name: 'Dumbbell Tricep Extension',    type: 'dumbbell' },
  { name: 'Dumbbell Skullcrusher',        type: 'dumbbell' },
  { name: 'Dumbbell Lateral Raise',       type: 'dumbbell' },
  { name: 'Dumbbell Front Raise',         type: 'dumbbell' },
  { name: 'Dumbbell Rear Delt Fly',       type: 'dumbbell' },
  { name: 'Dumbbell Shoulder Press',      type: 'dumbbell' },
  { name: 'Arnold Press',                 type: 'dumbbell' },
  { name: 'Dumbbell Bench Press',         type: 'dumbbell' },
  { name: 'Incline Dumbbell Press',       type: 'dumbbell' },
  { name: 'Decline Dumbbell Press',       type: 'dumbbell' },
  { name: 'Dumbbell Fly',                 type: 'dumbbell' },
  { name: 'Incline Dumbbell Fly',         type: 'dumbbell' },
  { name: 'Dumbbell Row',                 type: 'dumbbell' },
  { name: 'Dumbbell Romanian Deadlift',   type: 'dumbbell' },
  { name: 'Dumbbell Hip Thrust',          type: 'dumbbell' },
  { name: 'Dumbbell Goblet Squat',        type: 'dumbbell' },
  { name: 'Dumbbell Lunge',               type: 'dumbbell' },
  { name: 'Dumbbell Step-up',             type: 'dumbbell' },
  { name: 'Dumbbell Shrug',               type: 'dumbbell' },
  { name: 'Dumbbell Pullover',            type: 'dumbbell' },
  { name: 'Farmers Carry',                type: 'dumbbell' },
  { name: 'Dumbbell Wrist Curl',          type: 'dumbbell' },
  { name: 'Dumbbell Calf Raise',          type: 'dumbbell' },

  // ── Bodyweight ──────────────────────────────────────────────────────
  { name: 'Push-up',                      type: 'bodyweight' },
  { name: 'Wide-Grip Push-up',            type: 'bodyweight' },
  { name: 'Diamond Push-up',              type: 'bodyweight' },
  { name: 'Decline Push-up',              type: 'bodyweight' },
  { name: 'Pike Push-up',                 type: 'bodyweight' },
  { name: 'Pull-up',                      type: 'bodyweight' },
  { name: 'Chin-up',                      type: 'bodyweight' },
  { name: 'Neutral-Grip Pull-up',         type: 'bodyweight' },
  { name: 'Dips',                         type: 'bodyweight' },
  { name: 'Tricep Bench Dip',             type: 'bodyweight' },
  { name: 'Inverted Row',                 type: 'bodyweight' },
  { name: 'Bodyweight Squat',             type: 'bodyweight' },
  { name: 'Bulgarian Split Squat',        type: 'bodyweight' },
  { name: 'Lunge',                        type: 'bodyweight' },
  { name: 'Reverse Lunge',                type: 'bodyweight' },
  { name: 'Lateral Lunge',                type: 'bodyweight' },
  { name: 'Step-up',                      type: 'bodyweight' },
  { name: 'Glute Bridge',                 type: 'bodyweight' },
  { name: 'Single-Leg Glute Bridge',      type: 'bodyweight' },
  { name: 'Nordic Hamstring Curl',        type: 'bodyweight' },
  { name: 'Box Jump',                     type: 'bodyweight' },
  { name: 'Jump Squat',                   type: 'bodyweight' },
  { name: 'Broad Jump',                   type: 'bodyweight' },
  { name: 'Plank',                        type: 'bodyweight' },
  { name: 'Side Plank',                   type: 'bodyweight' },
  { name: 'Hollow Body Hold',             type: 'bodyweight' },
  { name: 'Dead Bug',                     type: 'bodyweight' },
  { name: 'Sit-up',                       type: 'bodyweight' },
  { name: 'Crunch',                       type: 'bodyweight' },
  { name: 'Bicycle Crunch',               type: 'bodyweight' },
  { name: 'Leg Raise',                    type: 'bodyweight' },
  { name: 'Hanging Knee Raise',           type: 'bodyweight' },
  { name: 'Hanging Leg Raise',            type: 'bodyweight' },
  { name: 'Toes to Bar',                  type: 'bodyweight' },
  { name: 'Russian Twist',                type: 'bodyweight' },
  { name: 'Mountain Climber',             type: 'bodyweight' },
  { name: 'Burpee',                       type: 'bodyweight' },
  { name: 'Jumping Jack',                 type: 'bodyweight' },
  { name: 'Handstand Hold',               type: 'bodyweight' },
  { name: 'L-Sit',                        type: 'bodyweight' },
  { name: 'Muscle-up',                    type: 'bodyweight' },

  // ── Cardio ──────────────────────────────────────────────────────────
  { name: 'Treadmill',                    type: 'cardio' },
  { name: 'Outdoor Run',                  type: 'cardio' },
  { name: 'Rowing Machine',               type: 'cardio' },
  { name: 'Bike (Stationary)',            type: 'cardio' },
  { name: 'Assault Bike',                 type: 'cardio' },
  { name: 'Stair Climber',                type: 'cardio' },
  { name: 'Elliptical',                   type: 'cardio' },
  { name: 'Ski Erg',                      type: 'cardio' },
  { name: 'Jump Rope',                    type: 'cardio' },
  { name: 'Battle Ropes',                 type: 'cardio' },
  { name: 'Sled Push',                    type: 'cardio' },
  { name: 'Sled Pull',                    type: 'cardio' },
  { name: 'Swimming',                     type: 'cardio' },
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
