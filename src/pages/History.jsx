import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'
import BottomSheet from '../components/BottomSheet'
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

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

export default function History() {
  const navigate = useNavigate()
  const { sessions, loading, deleteWorkout } = useHistory()
  const [deletingSession, setDeletingSession] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deletingSession) return
    setDeleting(true)
    await deleteWorkout(deletingSession.id)
    setDeletingSession(null)
    setDeleting(false)
  }

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
                    {session.hasFailure && (
                      <span style={{ color: '#4CAF50', fontSize: 13, lineHeight: 1 }}>⚡</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>duration</div>
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={e => { e.stopPropagation(); setDeletingSession(session) }}
                aria-label="Delete workout"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: 8,
                  minWidth: 36,
                  minHeight: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  opacity: 0.6,
                  borderRadius: 8,
                }}
              >
                <TrashIcon />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation sheet */}
      <BottomSheet open={!!deletingSession} onClose={() => !deleting && setDeletingSession(null)}>
        {deletingSession && (
          <div style={{ padding: '8px 20px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Delete this workout?
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong>{deletingSession.routine_name}</strong> on {formatDate(deletingSession.started_at)}.
                {' '}This cannot be undone.
              </div>
            </div>
            <button
              className="btn-destructive"
              onClick={handleDelete}
              disabled={deleting}
              style={{ marginBottom: 10, opacity: deleting ? 0.5 : 1 }}
            >
              {deleting ? 'Deleting…' : 'Delete Workout'}
            </button>
            <button
              className="btn-ghost"
              onClick={() => setDeletingSession(null)}
              disabled={deleting}
            >
              Cancel
            </button>
          </div>
        )}
      </BottomSheet>

      <BottomNav />
    </div>
  )
}
