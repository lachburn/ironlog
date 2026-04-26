import { useNavigate } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatDuration(start, end) {
  if (!end) return '—'
  const secs = Math.floor((new Date(end) - new Date(start)) / 1000)
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function History() {
  const navigate = useNavigate()
  const { sessions, loading } = useHistory()

  return (
    <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '56px 16px 16px',
        paddingTop: 'max(56px, calc(env(safe-area-inset-top) + 16px))',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--accent)', padding: '4px 8px', minHeight: 44 }}
        >
          ←
        </button>
        <div className="font-display" style={{ fontSize: 26, color: 'var(--text-primary)', letterSpacing: 1 }}>
          HISTORY
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '12px 16px 40px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)', fontSize: 14 }}>Loading…</div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div className="font-display" style={{ fontSize: 24, color: 'var(--text-primary)', marginBottom: 8 }}>NO WORKOUTS YET</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Complete a workout to see it here</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {sessions.map(session => (
              <button
                key={session.id}
                onClick={() => navigate(`/history/${session.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 0',
                  borderBottom: '1px solid var(--border)',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  minHeight: 64,
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}>
                  💪
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15 }}>
                    {session.routine_name || 'Workout'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>
                    {formatDate(session.started_at)} · {formatDuration(session.started_at, session.completed_at)}
                  </div>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 20 }}>›</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
