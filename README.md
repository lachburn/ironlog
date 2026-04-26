# IronLog

A personal gym tracking PWA built with React + Vite, Supabase, and Tailwind CSS. Optimised for iPhone Safari home screen installation.

---

## Tech Stack

- **React + Vite** — frontend framework
- **Tailwind CSS v4** — styling
- **Supabase** — auth + PostgreSQL database
- **Vercel** — deployment
- **PWA** — service worker + manifest for Safari "Add to Home Screen"

---

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema below
3. Enable **Row Level Security** on all tables and apply the policies

<details>
<summary>Database Schema (click to expand)</summary>

```sql
-- Exercise library
create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  name text not null,
  type text check (type in ('weighted', 'bodyweight', 'cardio', 'dumbbell')),
  is_global boolean default false,
  created_at timestamptz default now()
);

-- Workout routines
create table routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  emoji text,
  display_order int default 0,
  created_at timestamptz default now()
);

-- Exercises within a routine
create table routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references routines on delete cascade,
  exercise_id uuid references exercises on delete cascade,
  display_order int default 0,
  default_sets int default 3,
  default_reps int default 10,
  default_weight numeric default 0
);

-- Completed workout sessions
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  routine_id uuid references routines,
  routine_name text,
  started_at timestamptz default now(),
  completed_at timestamptz,
  notes text
);

-- Sets logged during a session
create table logged_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references workout_sessions on delete cascade,
  exercise_id uuid references exercises,
  exercise_name text,
  exercise_type text,
  set_number int not null,
  reps int,
  weight numeric,
  duration_seconds int,
  distance_metres numeric,
  completed_at timestamptz default now()
);

-- Row Level Security
alter table exercises enable row level security;
alter table routines enable row level security;
alter table routine_exercises enable row level security;
alter table workout_sessions enable row level security;
alter table logged_sets enable row level security;

create policy "Users manage own exercises" on exercises for all using (auth.uid() = user_id);
create policy "Users manage own routines" on routines for all using (auth.uid() = user_id);
create policy "Users manage own routine_exercises" on routine_exercises for all
  using (routine_id in (select id from routines where user_id = auth.uid()));
create policy "Users manage own sessions" on workout_sessions for all using (auth.uid() = user_id);
create policy "Users manage own sets" on logged_sets for all
  using (session_id in (select id from workout_sessions where user_id = auth.uid()));
```

</details>

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy — the `vercel.json` SPA rewrite handles all routes

---

## Install on iPhone (PWA)

1. Open the deployed URL in **Safari on iPhone**
2. Tap the **Share** button (box with arrow)
3. Tap **"Add to Home Screen"**
4. Tap **"Add"**

The app will appear on your home screen and launch full-screen without the Safari UI.

---

## Features

- **Routine tiles** — 2-column grid of your workout routines with emoji
- **Active workout** — step-through one exercise at a time with set logging
- **Last performance** — auto-populates weight/reps from your last session
- **Rest timer** — 90-second countdown after each set
- **Offline support** — service worker caches the app shell
- **Dark/light theme** — gold accents in dark mode, forest green in light
- **History** — full log of all completed workouts with set-by-set breakdown
- **Exercise library** — seeded with 28 common exercises on first sign-up
