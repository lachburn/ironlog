import { useNavigate } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'
import BottomNav from '../components/BottomNav'
import IronLogLogo from '../components/IronLogLogo'
import { Icon } from '../components/Icon'

function fmtDur(start, end) {
  if (!end) return '—'
  const s = Math.floor((new Date(end) - new Date(start)) / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function Empty() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 20px',
      textAlign: 'center',
      color: 'var(--muted)',
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 18,
        background: 'var(--surface-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
      }}>
        <Icon name="list" size={24} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)', marginBottom: 4 }}>No workouts yet</div>
      <div style={{ fontSize: 13, maxWidth: 240 }}>Finish your first workout to see history here.</div>
    </div>
  )
}

export default function History() {
  const navigate = useNavigate()
  const { sessions, loading } = useHistory()

  // Group sessions by month
  const groups = {}
  sessions.forEach(s => {
    const k = new Date(s.completed_at).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
    ;(groups[k] = groups[k] || []).push(s)
  })

  return (
    <div style={{
      background: 'var(--bg)',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* App Header */}
      <div style={{ flexShrink: 0, padding: '10px 18px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 32 }}>
          <IronLogLogo height={28} />
          <div style={{ flex: 1 }} />
          <button
            onClick={() => navigate('/settings')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ink)',
              padding: 0,
            }}
          >
            <Icon name="cog" size={18} />
          </button>
        </div>
        <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.05, marginTop: 6 }}>
          Workouts
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '10px 18px 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
        ) : sessions.length === 0 ? (
          <Empty />
        ) : (
          Object.entries(groups).map(([month, list]) => (
            <div key={month} style={{ marginBottom: 18 }}>
              <div className="eyebrow" style={{ padding: '14px 4px 8px' }}>{month}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {list.map(s => {
                  const sets = (s.logged_sets || []).length
                  return (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/history/${s.id}`)}
                      className="card row-tap"
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        padding: '14px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {/* Date tile */}
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        flexShrink: 0,
                        background: 'var(--surface-2)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <div style={{
                          fontSize: 9,
                          color: 'var(--muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '.05em',
                        }}>
                          {new Date(s.completed_at).toLocaleDateString('en-AU', { month: 'short' })}
                        </div>
                        <div className="mono" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1, color: 'var(--ink)' }}>
                          {new Date(s.completed_at).getDate()}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>
                          {s.routine_name || 'Once-off'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                          {fmtDur(s.started_at, s.completed_at)}
                          {sets > 0 ? ` · ${sets} sets` : ''}
                        </div>
                      </div>
                      <Icon name="chev-r" size={16} style={{ color: 'var(--faint)', flexShrink: 0 }} />
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}
