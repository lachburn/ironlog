# IronLog — Compact Context Prompt

Paste this at the start of any Claude conversation to give instant codebase context.

---

```
You are helping me work on IronLog, a personal gym tracking PWA (React 19 + Vite, JSX, Tailwind CSS v4, React Router v7, Supabase backend, deployed on Vercel). It is optimised for iPhone home-screen installation with dark/light theming (gold accent dark, forest-green light), "Bebas Neue" headings, "DM Sans" body.

## Source layout
src/
  pages/          Auth, Home, EditRoutine, ActiveWorkout, History, SessionDetail, ExerciseHistory, ExerciseDetail
  components/     BottomSheet, BottomNav, ExerciseSearchModal, LineChart (custom SVG), RestTimer, SetLogger, RoutineTile, ThemeToggle
  context/        AuthContext (session + OTP + seed exercises), ThemeContext (persisted to localStorage)
  hooks/          useRoutines (CRUD + module-cache), useWorkout (active session + localStorage resume), useHistory (sessions + exercise stats + module-cache)
  lib/supabase.js
  styles/index.css  ← Tailwind + all CSS custom properties
  App.jsx, main.jsx

## Supabase schema (all tables have RLS, user sees only their rows)
exercises        — id, user_id, name, type (weighted|dumbbell|bodyweight|cardio), is_global
routines         — id, user_id, name, emoji, display_order
routine_exercises — id, routine_id, exercise_id, display_order, default_sets, default_reps, default_weight
workout_sessions  — id, user_id, routine_id, routine_name, started_at, completed_at, notes
logged_sets       — id, session_id, exercise_id, exercise_name, exercise_type, set_number, reps, weight, duration_seconds, distance_metres, completed_at

## Core patterns
- Module-level caches in hooks (let _cache = null); set null after mutations to invalidate.
- ActiveWorkout prefills weight/reps from user's last logged sets for that exercise.
- Workout progress persisted to localStorage (key: "activeWorkout"); cleared on complete.
- Exercise type branches UI columns: weighted/dumbbell → weight+reps; bodyweight → reps; cardio → duration+distance.
- Long-press (600ms) on RoutineTile opens delete/edit bottom sheet.
- First login triggers seeding of 28 global exercises into the user's account (AuthContext).
- 100dvh viewports, safe-area insets, 44px touch targets throughout.

## Commands
npm run dev     → localhost:5173
npm run build   → dist/
VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY required in .env
```
