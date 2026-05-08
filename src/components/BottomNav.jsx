import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from './Icon'

const TABS = [
  {
    label: 'Train',
    icon: 'home',
    path: '/',
    matches: ['/', '/routines/new'],
  },
  {
    label: 'Workouts',
    icon: 'list',
    path: '/history',
    matches: ['/history'],
    matchPrefix: '/history/',
  },
  {
    label: 'Exercises',
    icon: 'chart',
    path: '/exercise-history',
    matches: ['/exercise-history'],
    matchPrefix: '/exercise-history/',
  },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const isVisible = TABS.some(t =>
    t.matches.includes(location.pathname) ||
    (t.matchPrefix && location.pathname.startsWith(t.matchPrefix))
  )
  if (!isVisible) return null

  return (
    <div style={{
      flexShrink: 0,
      borderTop: '1px solid var(--border)',
      background: 'var(--bg)',
      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)',
      display: 'flex',
    }}>
      {TABS.map(t => {
        const active =
          t.matches.includes(location.pathname) ||
          (t.matchPrefix && location.pathname.startsWith(t.matchPrefix))
        return (
          <button
            key={t.path}
            onClick={() => navigate(t.path)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '10px 0 8px',
              color: active ? 'var(--ink)' : 'var(--muted)',
              transition: 'color .15s ease',
            }}
          >
            <Icon name={t.icon} size={22} stroke={active ? 1.9 : 1.5} />
            <span style={{
              fontSize: 11,
              fontWeight: active ? 600 : 500,
              letterSpacing: '0.01em',
            }}>
              {t.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
