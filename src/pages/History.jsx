import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { useHistory } from '../hooks/useHistory'
import BottomNav from '../components/BottomNav'
import IronLogLogo from '../components/IronLogLogo'

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
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px 12px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        background: 'var(--bg)',
      }}>
        <IronLogLogo height={30} />
        <div className="font-display" style={{ flex: 1, textAlign: 'center', fontSize: 22, color: 'var(--text-primary)', letterSpacing: 1, lineHeight: 1 }}>
          WORKOUTS
        </div>
        <button
          onClick={() => navigate('/settings')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, color: 'var(--accent)' }}
        >
          <SlidersHorizontal size={20} />
        </button>
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
            <div
              key={session.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 0',
                borderBottom: '1px solid var(--border)',
                minHeight: 68,
              }}
            >
              {/* Tappable row area */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/history/${session.id}`)}
                onKeyDown={e => e.key === 'Enter' && navigate(`/history/${session.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, cursor: 'pointer', minWidth: 0 }}
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15 }}>
                    {session.routine_name || 'Workout'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>
                    {formatDate(session.started_at)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: 'var(--accent)', letterSpacing: 1 }}>
                      {formatDuration(session.started_at, session.completed_at)}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>duration</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)', flexShrink: 0, opacity: 0.5 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}
