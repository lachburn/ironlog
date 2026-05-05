import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/',                 label: 'Home',     icon: HomeIcon },
  { path: '/exercise-history', label: 'Exercises', icon: ChartIcon },
  { path: '/history',          label: 'Workouts',  icon: ClipboardIcon },
]

function HomeIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ChartIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 20h16M4 20V14m0-4V4m4 16V10m4 10V6m4 14v-6"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {active && <circle cx="4" cy="10" r="2" fill="currentColor" opacity="0.3" />}
    </svg>
  )
}

function ClipboardIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="4" width="14" height="17" rx="2"
        stroke="currentColor" strokeWidth="1.8"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.1 : 0} />
      <path d="M9 4a1 1 0 011-1h4a1 1 0 011 1v1H9V4z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  // Only show on main tabs
  const isMain = TABS.some(t => t.path === location.pathname)
  if (!isMain) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
    }}>
      {TABS.map(({ path, label, icon: Icon }) => {
        const active = location.pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '10px 0 8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? 'var(--accent)' : 'var(--text-secondary)',
              transition: 'color 200ms ease',
              minHeight: 56,
            }}
          >
            <Icon active={active} />
            <span style={{
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              fontFamily: 'DM Sans',
              letterSpacing: 0.3,
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
