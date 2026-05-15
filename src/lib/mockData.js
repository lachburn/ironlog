// In-memory store for dev bypass mode. Mutated directly by mockSupabase.js.
const D = 'dev-bypass-user'

function daysAgo(n) {
  const d = new Date('2026-05-12T10:00:00.000Z')
  d.setDate(d.getDate() - n)
  return d.toISOString()
}
function daysAgoAt(n, h = 10) {
  const d = new Date(`2026-05-12T${String(h).padStart(2,'0')}:00:00.000Z`)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const DEV_STORE = {
  exercises: [
    { id: 'ex-1',  user_id: D, name: 'Bench Press',         type: 'weighted',   is_global: true },
    { id: 'ex-2',  user_id: D, name: 'Squat',               type: 'weighted',   is_global: true },
    { id: 'ex-3',  user_id: D, name: 'Deadlift',            type: 'weighted',   is_global: true },
    { id: 'ex-4',  user_id: D, name: 'Overhead Press',      type: 'weighted',   is_global: true },
    { id: 'ex-5',  user_id: D, name: 'Pull-up',             type: 'bodyweight', is_global: true },
    { id: 'ex-6',  user_id: D, name: 'Barbell Row',         type: 'weighted',   is_global: true },
    { id: 'ex-7',  user_id: D, name: 'Dumbbell Curl',       type: 'dumbbell',   is_global: true },
    { id: 'ex-8',  user_id: D, name: 'Cable Tricep Pushdown', type: 'weighted', is_global: true },
    { id: 'ex-9',  user_id: D, name: 'Leg Press',           type: 'weighted',   is_global: true },
    { id: 'ex-10', user_id: D, name: 'Lat Pulldown',        type: 'weighted',   is_global: true },
    { id: 'ex-11', user_id: D, name: 'Incline Bench Press', type: 'weighted',   is_global: true },
    { id: 'ex-12', user_id: D, name: 'Romanian Deadlift',   type: 'weighted',   is_global: true },
    { id: 'ex-13', user_id: D, name: 'Dumbbell Shoulder Press', type: 'dumbbell', is_global: true },
    { id: 'ex-14', user_id: D, name: 'Leg Curl',            type: 'weighted',   is_global: true },
    { id: 'ex-15', user_id: D, name: 'Dumbbell Lateral Raise', type: 'dumbbell', is_global: true },
    { id: 'ex-16', user_id: D, name: 'Treadmill',           type: 'cardio',     is_global: true },
    { id: 'ex-17', user_id: D, name: 'Dips',                type: 'bodyweight', is_global: true },
    { id: 'ex-18', user_id: D, name: 'Cable Face Pull',     type: 'weighted',   is_global: true },
  ],

  routines: [
    { id: 'r-1', user_id: D, name: 'Push Day',  emoji: '🔥', display_order: 0, created_at: daysAgo(30) },
    { id: 'r-2', user_id: D, name: 'Pull Day',  emoji: '💪', display_order: 1, created_at: daysAgo(30) },
    { id: 'r-3', user_id: D, name: 'Leg Day',   emoji: '🦵', display_order: 2, created_at: daysAgo(30) },
  ],

  routine_exercises: [
    // Push Day
    { id: 're-1',  routine_id: 'r-1', exercise_id: 'ex-1',  display_order: 0, default_sets: 4, default_reps: 8,  default_weight: 80  },
    { id: 're-2',  routine_id: 'r-1', exercise_id: 'ex-11', display_order: 1, default_sets: 3, default_reps: 10, default_weight: 60  },
    { id: 're-3',  routine_id: 'r-1', exercise_id: 'ex-4',  display_order: 2, default_sets: 3, default_reps: 8,  default_weight: 50  },
    { id: 're-4',  routine_id: 'r-1', exercise_id: 'ex-8',  display_order: 3, default_sets: 3, default_reps: 12, default_weight: 40  },
    { id: 're-5',  routine_id: 'r-1', exercise_id: 'ex-15', display_order: 4, default_sets: 3, default_reps: 15, default_weight: 12  },
    // Pull Day
    { id: 're-6',  routine_id: 'r-2', exercise_id: 'ex-3',  display_order: 0, default_sets: 3, default_reps: 5,  default_weight: 120 },
    { id: 're-7',  routine_id: 'r-2', exercise_id: 'ex-5',  display_order: 1, default_sets: 3, default_reps: 8,  default_weight: 0   },
    { id: 're-8',  routine_id: 'r-2', exercise_id: 'ex-6',  display_order: 2, default_sets: 4, default_reps: 8,  default_weight: 70  },
    { id: 're-9',  routine_id: 'r-2', exercise_id: 'ex-10', display_order: 3, default_sets: 3, default_reps: 12, default_weight: 60  },
    { id: 're-10', routine_id: 'r-2', exercise_id: 'ex-7',  display_order: 4, default_sets: 3, default_reps: 12, default_weight: 16  },
    { id: 're-11', routine_id: 'r-2', exercise_id: 'ex-18', display_order: 5, default_sets: 3, default_reps: 15, default_weight: 20  },
    // Leg Day
    { id: 're-12', routine_id: 'r-3', exercise_id: 'ex-2',  display_order: 0, default_sets: 4, default_reps: 6,  default_weight: 100 },
    { id: 're-13', routine_id: 'r-3', exercise_id: 'ex-9',  display_order: 1, default_sets: 3, default_reps: 12, default_weight: 150 },
    { id: 're-14', routine_id: 'r-3', exercise_id: 'ex-12', display_order: 2, default_sets: 3, default_reps: 10, default_weight: 80  },
    { id: 're-15', routine_id: 'r-3', exercise_id: 'ex-14', display_order: 3, default_sets: 3, default_reps: 12, default_weight: 50  },
  ],

  activities: [
    { id: 'act-1',  user_id: D, name: 'Run',        type: 'run',   is_global: true },
    { id: 'act-2',  user_id: D, name: 'Tennis',      type: 'sport', is_global: true },
    { id: 'act-3',  user_id: D, name: 'Swimming',    type: 'sport', is_global: true },
    { id: 'act-4',  user_id: D, name: 'Cycling',     type: 'sport', is_global: true },
    { id: 'act-5',  user_id: D, name: 'Football',    type: 'sport', is_global: true },
    { id: 'act-6',  user_id: D, name: 'Basketball',  type: 'sport', is_global: true },
    { id: 'act-7',  user_id: D, name: 'Yoga',        type: 'sport', is_global: true },
    { id: 'act-8',  user_id: D, name: 'Hiking',      type: 'sport', is_global: true },
    { id: 'act-9',  user_id: D, name: 'Pilates',     type: 'sport', is_global: true },
    { id: 'act-10', user_id: D, name: 'Boxing',      type: 'sport', is_global: true },
  ],

  workout_sessions: [
    { id: 's-1',  user_id: D, routine_id: 'r-1', routine_name: 'Push Day', session_type: 'workout', started_at: daysAgoAt(1, 9),  completed_at: daysAgoAt(1, 10) },
    { id: 's-2',  user_id: D, routine_id: 'r-2', routine_name: 'Pull Day', session_type: 'workout', started_at: daysAgoAt(3, 9),  completed_at: daysAgoAt(3, 10) },
    { id: 's-8',  user_id: D, routine_id: null,   routine_name: 'Tennis',   session_type: 'activity', started_at: daysAgoAt(4, 16), completed_at: daysAgoAt(4, 17) },
    { id: 's-3',  user_id: D, routine_id: 'r-3', routine_name: 'Leg Day',  session_type: 'workout', started_at: daysAgoAt(6, 9),  completed_at: daysAgoAt(6, 10) },
    { id: 's-9',  user_id: D, routine_id: null,   routine_name: 'Run',      session_type: 'activity', started_at: daysAgoAt(7, 7),  completed_at: daysAgoAt(7, 8) },
    { id: 's-4',  user_id: D, routine_id: 'r-1', routine_name: 'Push Day', session_type: 'workout', started_at: daysAgoAt(9, 9),  completed_at: daysAgoAt(9, 10) },
    { id: 's-5',  user_id: D, routine_id: 'r-2', routine_name: 'Pull Day', session_type: 'workout', started_at: daysAgoAt(12, 9), completed_at: daysAgoAt(12, 10) },
    { id: 's-10', user_id: D, routine_id: null,   routine_name: 'Swimming', session_type: 'activity', started_at: daysAgoAt(13, 8), completed_at: daysAgoAt(13, 9) },
    { id: 's-6',  user_id: D, routine_id: 'r-3', routine_name: 'Leg Day',  session_type: 'workout', started_at: daysAgoAt(15, 9), completed_at: daysAgoAt(15, 10) },
    { id: 's-7',  user_id: D, routine_id: 'r-1', routine_name: 'Push Day', session_type: 'workout', started_at: daysAgoAt(18, 9), completed_at: daysAgoAt(18, 10) },
  ],

  journeys: [
    {
      id: 'j-1', user_id: D, title: 'Half Marathon Prep', goal: 'Sub 1:45',
      start_date: daysAgo(14), target_date: '2026-08-14T00:00:00.000Z',
      created_at: daysAgo(14),
    },
  ],

  journey_items: [
    // Week 1 (Mon/Wed/Sat pattern)
    { id: 'ji-1',  journey_id: 'j-1', date: daysAgoAt(13, 6), type: 'Tempo Run',  routine_id: null, activity_id: 'act-1', details: '', completed: true,  linked_session_id: 's-9' },
    { id: 'ji-2',  journey_id: 'j-1', date: daysAgoAt(11, 6), type: 'Intervals',  routine_id: null, activity_id: 'act-1', details: '', completed: true,  linked_session_id: null  },
    { id: 'ji-3',  journey_id: 'j-1', date: daysAgoAt(8,  6), type: 'Long Run',   routine_id: null, activity_id: 'act-1', details: '', completed: true,  linked_session_id: null  },
    // Week 2
    { id: 'ji-4',  journey_id: 'j-1', date: daysAgoAt(6,  6), type: 'Tempo Run',  routine_id: 'r-1', activity_id: null,   details: '', completed: true,  linked_session_id: 's-3' },
    { id: 'ji-5',  journey_id: 'j-1', date: daysAgoAt(4,  6), type: 'Recovery',   routine_id: null, activity_id: 'act-1', details: '', completed: false, linked_session_id: null  },
    { id: 'ji-6',  journey_id: 'j-1', date: daysAgoAt(1,  6), type: 'Long Run',   routine_id: null, activity_id: 'act-1', details: '', completed: false, linked_session_id: null  },
    // Week 3 (upcoming)
    { id: 'ji-7',  journey_id: 'j-1', date: daysAgoAt(-1, 6), type: 'Tempo Run',  routine_id: null, activity_id: 'act-1', details: '', completed: false, linked_session_id: null  },
    { id: 'ji-8',  journey_id: 'j-1', date: daysAgoAt(-3, 6), type: 'Strength',   routine_id: 'r-2', activity_id: null,   details: '', completed: false, linked_session_id: null  },
    { id: 'ji-9',  journey_id: 'j-1', date: daysAgoAt(-6, 6), type: 'Long Run',   routine_id: null, activity_id: 'act-1', details: '', completed: false, linked_session_id: null  },
  ],

  activity_logs: [
    { id: 'al-1', session_id: 's-8',  activity_id: 'act-2', activity_name: 'Tennis',   activity_type: 'sport', duration_seconds: 3600, avg_heart_rate: 145, calories: 520,  distance_metres: null },
    { id: 'al-2', session_id: 's-9',  activity_id: 'act-1', activity_name: 'Run',      activity_type: 'run',   duration_seconds: 2700, avg_heart_rate: 158, calories: null, distance_metres: 6500 },
    { id: 'al-3', session_id: 's-10', activity_id: 'act-3', activity_name: 'Swimming', activity_type: 'sport', duration_seconds: 2400, avg_heart_rate: 135, calories: 380,  distance_metres: null },
  ],

  logged_sets: [
    // s-1 Push Day (yesterday)
    { id: 'ls-1',  session_id: 's-1', exercise_id: 'ex-1',  exercise_name: 'Bench Press',        exercise_type: 'weighted',   set_number: 1, reps: 8,  weight: 82.5, completed_at: daysAgoAt(1, 9),  is_failure: false },
    { id: 'ls-2',  session_id: 's-1', exercise_id: 'ex-1',  exercise_name: 'Bench Press',        exercise_type: 'weighted',   set_number: 2, reps: 8,  weight: 82.5, completed_at: daysAgoAt(1, 9),  is_failure: false },
    { id: 'ls-3',  session_id: 's-1', exercise_id: 'ex-1',  exercise_name: 'Bench Press',        exercise_type: 'weighted',   set_number: 3, reps: 7,  weight: 82.5, completed_at: daysAgoAt(1, 9),  is_failure: false },
    { id: 'ls-4',  session_id: 's-1', exercise_id: 'ex-1',  exercise_name: 'Bench Press',        exercise_type: 'weighted',   set_number: 4, reps: 6,  weight: 82.5, completed_at: daysAgoAt(1, 9),  is_failure: true  },
    { id: 'ls-5',  session_id: 's-1', exercise_id: 'ex-11', exercise_name: 'Incline Bench Press', exercise_type: 'weighted',  set_number: 1, reps: 10, weight: 62.5, completed_at: daysAgoAt(1, 9),  is_failure: false },
    { id: 'ls-6',  session_id: 's-1', exercise_id: 'ex-11', exercise_name: 'Incline Bench Press', exercise_type: 'weighted',  set_number: 2, reps: 10, weight: 62.5, completed_at: daysAgoAt(1, 9),  is_failure: false },
    { id: 'ls-7',  session_id: 's-1', exercise_id: 'ex-11', exercise_name: 'Incline Bench Press', exercise_type: 'weighted',  set_number: 3, reps: 9,  weight: 62.5, completed_at: daysAgoAt(1, 9),  is_failure: false },
    { id: 'ls-8',  session_id: 's-1', exercise_id: 'ex-4',  exercise_name: 'Overhead Press',     exercise_type: 'weighted',   set_number: 1, reps: 8,  weight: 52.5, completed_at: daysAgoAt(1, 9),  is_failure: false },
    { id: 'ls-9',  session_id: 's-1', exercise_id: 'ex-4',  exercise_name: 'Overhead Press',     exercise_type: 'weighted',   set_number: 2, reps: 8,  weight: 52.5, completed_at: daysAgoAt(1, 9),  is_failure: false },
    { id: 'ls-10', session_id: 's-1', exercise_id: 'ex-4',  exercise_name: 'Overhead Press',     exercise_type: 'weighted',   set_number: 3, reps: 7,  weight: 52.5, completed_at: daysAgoAt(1, 9),  is_failure: false },
    // s-2 Pull Day (3 days ago)
    { id: 'ls-11', session_id: 's-2', exercise_id: 'ex-3',  exercise_name: 'Deadlift',           exercise_type: 'weighted',   set_number: 1, reps: 5,  weight: 125,  completed_at: daysAgoAt(3, 9),  is_failure: false },
    { id: 'ls-12', session_id: 's-2', exercise_id: 'ex-3',  exercise_name: 'Deadlift',           exercise_type: 'weighted',   set_number: 2, reps: 5,  weight: 125,  completed_at: daysAgoAt(3, 9),  is_failure: false },
    { id: 'ls-13', session_id: 's-2', exercise_id: 'ex-3',  exercise_name: 'Deadlift',           exercise_type: 'weighted',   set_number: 3, reps: 4,  weight: 125,  completed_at: daysAgoAt(3, 9),  is_failure: false },
    { id: 'ls-14', session_id: 's-2', exercise_id: 'ex-5',  exercise_name: 'Pull-up',            exercise_type: 'bodyweight', set_number: 1, reps: 10, weight: 0,    completed_at: daysAgoAt(3, 9),  is_failure: false },
    { id: 'ls-15', session_id: 's-2', exercise_id: 'ex-5',  exercise_name: 'Pull-up',            exercise_type: 'bodyweight', set_number: 2, reps: 9,  weight: 0,    completed_at: daysAgoAt(3, 9),  is_failure: false },
    { id: 'ls-16', session_id: 's-2', exercise_id: 'ex-5',  exercise_name: 'Pull-up',            exercise_type: 'bodyweight', set_number: 3, reps: 8,  weight: 0,    completed_at: daysAgoAt(3, 9),  is_failure: false },
    { id: 'ls-17', session_id: 's-2', exercise_id: 'ex-6',  exercise_name: 'Barbell Row',        exercise_type: 'weighted',   set_number: 1, reps: 8,  weight: 72.5, completed_at: daysAgoAt(3, 9),  is_failure: false },
    { id: 'ls-18', session_id: 's-2', exercise_id: 'ex-6',  exercise_name: 'Barbell Row',        exercise_type: 'weighted',   set_number: 2, reps: 8,  weight: 72.5, completed_at: daysAgoAt(3, 9),  is_failure: false },
    { id: 'ls-19', session_id: 's-2', exercise_id: 'ex-6',  exercise_name: 'Barbell Row',        exercise_type: 'weighted',   set_number: 3, reps: 8,  weight: 72.5, completed_at: daysAgoAt(3, 9),  is_failure: false },
    { id: 'ls-20', session_id: 's-2', exercise_id: 'ex-6',  exercise_name: 'Barbell Row',        exercise_type: 'weighted',   set_number: 4, reps: 7,  weight: 72.5, completed_at: daysAgoAt(3, 9),  is_failure: false },
    // s-3 Leg Day (6 days ago)
    { id: 'ls-21', session_id: 's-3', exercise_id: 'ex-2',  exercise_name: 'Squat',              exercise_type: 'weighted',   set_number: 1, reps: 6,  weight: 102.5, completed_at: daysAgoAt(6, 9), is_failure: false },
    { id: 'ls-22', session_id: 's-3', exercise_id: 'ex-2',  exercise_name: 'Squat',              exercise_type: 'weighted',   set_number: 2, reps: 6,  weight: 102.5, completed_at: daysAgoAt(6, 9), is_failure: false },
    { id: 'ls-23', session_id: 's-3', exercise_id: 'ex-2',  exercise_name: 'Squat',              exercise_type: 'weighted',   set_number: 3, reps: 5,  weight: 102.5, completed_at: daysAgoAt(6, 9), is_failure: false },
    { id: 'ls-24', session_id: 's-3', exercise_id: 'ex-2',  exercise_name: 'Squat',              exercise_type: 'weighted',   set_number: 4, reps: 5,  weight: 102.5, completed_at: daysAgoAt(6, 9), is_failure: false },
    { id: 'ls-25', session_id: 's-3', exercise_id: 'ex-9',  exercise_name: 'Leg Press',          exercise_type: 'weighted',   set_number: 1, reps: 12, weight: 155,   completed_at: daysAgoAt(6, 9), is_failure: false },
    { id: 'ls-26', session_id: 's-3', exercise_id: 'ex-9',  exercise_name: 'Leg Press',          exercise_type: 'weighted',   set_number: 2, reps: 12, weight: 155,   completed_at: daysAgoAt(6, 9), is_failure: false },
    { id: 'ls-27', session_id: 's-3', exercise_id: 'ex-9',  exercise_name: 'Leg Press',          exercise_type: 'weighted',   set_number: 3, reps: 10, weight: 155,   completed_at: daysAgoAt(6, 9), is_failure: false },
    { id: 'ls-28', session_id: 's-3', exercise_id: 'ex-12', exercise_name: 'Romanian Deadlift',  exercise_type: 'weighted',   set_number: 1, reps: 10, weight: 82.5,  completed_at: daysAgoAt(6, 9), is_failure: false },
    { id: 'ls-29', session_id: 's-3', exercise_id: 'ex-12', exercise_name: 'Romanian Deadlift',  exercise_type: 'weighted',   set_number: 2, reps: 10, weight: 82.5,  completed_at: daysAgoAt(6, 9), is_failure: false },
    { id: 'ls-30', session_id: 's-3', exercise_id: 'ex-12', exercise_name: 'Romanian Deadlift',  exercise_type: 'weighted',   set_number: 3, reps: 9,  weight: 82.5,  completed_at: daysAgoAt(6, 9), is_failure: false },
    // s-4 Push Day (9 days ago) — lighter, earlier progress
    { id: 'ls-31', session_id: 's-4', exercise_id: 'ex-1',  exercise_name: 'Bench Press',        exercise_type: 'weighted',   set_number: 1, reps: 8,  weight: 80,   completed_at: daysAgoAt(9, 9),  is_failure: false },
    { id: 'ls-32', session_id: 's-4', exercise_id: 'ex-1',  exercise_name: 'Bench Press',        exercise_type: 'weighted',   set_number: 2, reps: 8,  weight: 80,   completed_at: daysAgoAt(9, 9),  is_failure: false },
    { id: 'ls-33', session_id: 's-4', exercise_id: 'ex-1',  exercise_name: 'Bench Press',        exercise_type: 'weighted',   set_number: 3, reps: 8,  weight: 80,   completed_at: daysAgoAt(9, 9),  is_failure: false },
    { id: 'ls-34', session_id: 's-4', exercise_id: 'ex-1',  exercise_name: 'Bench Press',        exercise_type: 'weighted',   set_number: 4, reps: 7,  weight: 80,   completed_at: daysAgoAt(9, 9),  is_failure: false },
    { id: 'ls-35', session_id: 's-4', exercise_id: 'ex-4',  exercise_name: 'Overhead Press',     exercise_type: 'weighted',   set_number: 1, reps: 8,  weight: 50,   completed_at: daysAgoAt(9, 9),  is_failure: false },
    { id: 'ls-36', session_id: 's-4', exercise_id: 'ex-4',  exercise_name: 'Overhead Press',     exercise_type: 'weighted',   set_number: 2, reps: 8,  weight: 50,   completed_at: daysAgoAt(9, 9),  is_failure: false },
    { id: 'ls-37', session_id: 's-4', exercise_id: 'ex-4',  exercise_name: 'Overhead Press',     exercise_type: 'weighted',   set_number: 3, reps: 7,  weight: 50,   completed_at: daysAgoAt(9, 9),  is_failure: false },
    // s-5 Pull Day (12 days ago)
    { id: 'ls-38', session_id: 's-5', exercise_id: 'ex-3',  exercise_name: 'Deadlift',           exercise_type: 'weighted',   set_number: 1, reps: 5,  weight: 120,  completed_at: daysAgoAt(12, 9), is_failure: false },
    { id: 'ls-39', session_id: 's-5', exercise_id: 'ex-3',  exercise_name: 'Deadlift',           exercise_type: 'weighted',   set_number: 2, reps: 5,  weight: 120,  completed_at: daysAgoAt(12, 9), is_failure: false },
    { id: 'ls-40', session_id: 's-5', exercise_id: 'ex-3',  exercise_name: 'Deadlift',           exercise_type: 'weighted',   set_number: 3, reps: 5,  weight: 120,  completed_at: daysAgoAt(12, 9), is_failure: false },
    { id: 'ls-41', session_id: 's-5', exercise_id: 'ex-6',  exercise_name: 'Barbell Row',        exercise_type: 'weighted',   set_number: 1, reps: 8,  weight: 70,   completed_at: daysAgoAt(12, 9), is_failure: false },
    { id: 'ls-42', session_id: 's-5', exercise_id: 'ex-6',  exercise_name: 'Barbell Row',        exercise_type: 'weighted',   set_number: 2, reps: 8,  weight: 70,   completed_at: daysAgoAt(12, 9), is_failure: false },
    { id: 'ls-43', session_id: 's-5', exercise_id: 'ex-6',  exercise_name: 'Barbell Row',        exercise_type: 'weighted',   set_number: 3, reps: 8,  weight: 70,   completed_at: daysAgoAt(12, 9), is_failure: false },
    // s-6 Leg Day (15 days ago)
    { id: 'ls-44', session_id: 's-6', exercise_id: 'ex-2',  exercise_name: 'Squat',              exercise_type: 'weighted',   set_number: 1, reps: 6,  weight: 100,  completed_at: daysAgoAt(15, 9), is_failure: false },
    { id: 'ls-45', session_id: 's-6', exercise_id: 'ex-2',  exercise_name: 'Squat',              exercise_type: 'weighted',   set_number: 2, reps: 6,  weight: 100,  completed_at: daysAgoAt(15, 9), is_failure: false },
    { id: 'ls-46', session_id: 's-6', exercise_id: 'ex-2',  exercise_name: 'Squat',              exercise_type: 'weighted',   set_number: 3, reps: 6,  weight: 100,  completed_at: daysAgoAt(15, 9), is_failure: false },
    { id: 'ls-47', session_id: 's-6', exercise_id: 'ex-2',  exercise_name: 'Squat',              exercise_type: 'weighted',   set_number: 4, reps: 5,  weight: 100,  completed_at: daysAgoAt(15, 9), is_failure: false },
    // s-7 Push Day (18 days ago)
    { id: 'ls-48', session_id: 's-7', exercise_id: 'ex-1',  exercise_name: 'Bench Press',        exercise_type: 'weighted',   set_number: 1, reps: 8,  weight: 77.5, completed_at: daysAgoAt(18, 9), is_failure: false },
    { id: 'ls-49', session_id: 's-7', exercise_id: 'ex-1',  exercise_name: 'Bench Press',        exercise_type: 'weighted',   set_number: 2, reps: 8,  weight: 77.5, completed_at: daysAgoAt(18, 9), is_failure: false },
    { id: 'ls-50', session_id: 's-7', exercise_id: 'ex-1',  exercise_name: 'Bench Press',        exercise_type: 'weighted',   set_number: 3, reps: 7,  weight: 77.5, completed_at: daysAgoAt(18, 9), is_failure: false },
    { id: 'ls-51', session_id: 's-7', exercise_id: 'ex-4',  exercise_name: 'Overhead Press',     exercise_type: 'weighted',   set_number: 1, reps: 8,  weight: 47.5, completed_at: daysAgoAt(18, 9), is_failure: false },
    { id: 'ls-52', session_id: 's-7', exercise_id: 'ex-4',  exercise_name: 'Overhead Press',     exercise_type: 'weighted',   set_number: 2, reps: 8,  weight: 47.5, completed_at: daysAgoAt(18, 9), is_failure: false },
    { id: 'ls-53', session_id: 's-7', exercise_id: 'ex-4',  exercise_name: 'Overhead Press',     exercise_type: 'weighted',   set_number: 3, reps: 7,  weight: 47.5, completed_at: daysAgoAt(18, 9), is_failure: false },
  ],
}
