import { useNavigate } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'
import BottomNav from '../components/BottomNav'

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatDuration(start, end) {
  if (!end) return '—'
  const totalSecs = Math.floor((new Date(end) - new Date(start)) / 1000)
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function History() {
  const navigate = useNavigate()
  const { sessions, loading } = useHistory()

  return (
    <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '56px 16px 16px',
        paddingTop: 'max(56px, calc(env(safe-area-inset-top) + 16px))',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div className="font-display" style={{ fontSize: 32, color: 'var(--text-primary)', letterSpacing: 1 }}>
          WORKOUTS
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '8px 16px 100px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)', fontSize: 14 }}>Loading…</div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div className="font-display" style={{ fontSize: 24, color: 'var(--text-primary)', marginBottom: 8 }}>NO WORKOUTS YET</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Complete a workout to see it here</div>
          </div>
        ) : (
          sessions.map(session => (
            <button
              key={session.id}
              onClick={() => navigate(`/history/${session.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 0',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                minHeight: 68,
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{ fontSize: 18 }}>{session.routines?.emoji || '💪'}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15 }}>
                  {session.routine_name || 'Workout'}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>
                  {formatDate(session.started_at)}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: 'var(--accent)', letterSpacing: 1 }}>
                  {formatDuration(session.started_at, session.completed_at)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>duration</div>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 20 }}>›</div>
            </button>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}
