# IronLog — Claude Code Context

## What This App Is
IronLog is a personal gym tracking PWA optimised for iPhone home-screen installation. Users log workout sessions set-by-set against pre-built routines, see history, and track exercise progress over time via charts.

## Tech Stack
- **Frontend**: React 19 + Vite 8, JSX only (no TypeScript)
- **Styling**: Tailwind CSS v4 + CSS custom properties (theme variables in `src/styles/index.css`)
- **Routing**: React Router v7
- **Backend**: Supabase (PostgreSQL + email OTP auth)
- **Deploy**: Vercel (SPA rewrite in `vercel.json`)
- **PWA**: Service worker (`public/sw.js`) + manifest (`public/manifest.json`)

## Key Commands
```bash
npm run dev      # Vite dev server → localhost:5173
npm run build    # Production build → dist/
npm run lint     # ESLint
```

## Environment Variables
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Directory Map
```
src/
  pages/            # 8 full-page route components
  components/       # 8 reusable UI components
  context/          # AuthContext.jsx, ThemeContext.jsx
  hooks/            # useRoutines.js, useWorkout.js, useHistory.js
  lib/supabase.js   # Supabase client
  styles/index.css  # Tailwind + CSS vars
  App.jsx           # Router + providers
  main.jsx          # Entry + SW registration
public/
  manifest.json, sw.js, icons/
```

## Database Schema (Supabase, all tables have RLS — users see only their own rows)

| Table | Key Columns |
|-------|-------------|
| `exercises` | id, user_id, name, type (`weighted\|dumbbell\|bodyweight\|cardio`), is_global |
| `routines` | id, user_id, name, emoji, display_order |
| `routine_exercises` | id, routine_id, exercise_id, display_order, default_sets, default_reps, default_weight |
| `workout_sessions` | id, user_id, routine_id, routine_name, started_at, completed_at, notes |
| `logged_sets` | id, session_id, exercise_id, exercise_name, exercise_type, set_number, reps, weight, duration_seconds, distance_metres, completed_at |

## Pages & Their Purpose

| File | Route | Purpose |
|------|-------|---------|
| `Auth.jsx` | `/auth` | Email → 6-digit OTP → Supabase session |
| `Home.jsx` | `/` | 2-col routine grid; long-press (600ms) to delete; FAB to create |
| `EditRoutine.jsx` | `/routine/new`, `/routine/:id` | Create/edit routine name, emoji, exercises with defaults |
| `ActiveWorkout.jsx` | `/workout/:routineId` | Step-through set logging with rest timer, prefills last session's data |
| `History.jsx` | `/history` | Completed sessions list (newest first) |
| `SessionDetail.jsx` | `/session/:id` | Set-by-set breakdown; columns vary by exercise type |
| `ExerciseHistory.jsx` | `/exercises` | All exercises with aggregate stats |
| `ExerciseDetail.jsx` | `/exercise/:id` | SVG line chart (max weight per session), per-session tables |

## Key Components

| File | Purpose |
|------|---------|
| `BottomSheet.jsx` | Animated slide-up modal drawer |
| `BottomNav.jsx` | 5-tab navigation bar |
| `ExerciseSearchModal.jsx` | Search existing exercises or create new |
| `LineChart.jsx` | Custom SVG chart (no library) |
| `RestTimer.jsx` | 90-second countdown between sets |
| `SetLogger.jsx` | Form: reps + weight (or duration + distance for cardio) |
| `RoutineTile.jsx` | Emoji + routine name + exercise count card |
| `ThemeToggle.jsx` | Dark/light switch |

## State Management
- **AuthContext** — user session, OTP flow, seed-exercise creation on first login
- **ThemeContext** — dark/light preference persisted to `localStorage`
- **useRoutines** — routine CRUD + module-level cache (`let _cache = null`)
- **useWorkout** — active session state + set logging; persists progress to `localStorage` so reload survives
- **useHistory** — fetches sessions, exercise aggregate stats, module-level cache

## Important Patterns
- **Module-level caching** in hooks (`let _cache = null`) avoids redundant Supabase queries — invalidate by setting `_cache = null` after mutations.
- **Last-performance prefill** — `ActiveWorkout` queries the user's last logged sets for the current exercise to pre-populate weight/reps.
- **Exercise seeding** — `AuthContext` inserts 28 global exercises for new users on first sign-in.
- **Workout resume** — `localStorage` stores `activeWorkout` JSON (session id + exercise index); cleared on `completeWorkout`.
- **Exercise type branching** — UI columns and labels differ: `weighted`/`dumbbell` show weight+reps; `bodyweight` shows reps; `cardio` shows duration+distance.

## Theming
CSS custom properties in `src/styles/index.css`:
- **Dark** (default): `#000` background, gold accent `#C9A84C`
- **Light**: `#F4F9F4` background, forest green accent `#2D6A4F`
- Headings: "Bebas Neue" · Body: "DM Sans"

## Mobile / PWA Specifics
- Viewports use `100dvh` (dynamic viewport height for mobile browsers)
- Safe-area insets applied for notch/home-indicator
- Touch targets 44px min-height
- `-webkit-overflow-scrolling: touch` on scrollable containers
- Long-press on `RoutineTile` (600ms) opens delete/edit sheet
