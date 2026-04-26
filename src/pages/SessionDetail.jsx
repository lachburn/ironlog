import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDuration(start, end) {
  if (!end) return '—'
  const secs = Math.floor((new Date(end) - new Date(start)) / 1000)
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function groupByExercise(sets) {
  const map = new Map()
  for (const s of sets) {
    const key = s.exercise_name || s.exercise_id
    if (!map.has(key)) map.set(key, { name: key, type: s.exercise_type, sets: [] })
    map.get(key).sets.push(s)
  }
  return Array.from(map.values())
}

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchSession } = useHistory()
  const [session, setSession] = useState(null)
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSession(id).then(({ session: s, sets }) => {
      setSession(s)
      setExercises(groupByExercise(sets))
      setLoading(false)
    })
  }, [id]) // eslint-disable-line

  if (loading || !session) {
    return (
      <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading…</div>
      </div>
    )
  }

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
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--accent)', padding: '4px 8px', minHeight: 44 }}
        >
          ←
        </button>
        <div>
          <div className="font-display" style={{ fontSize: 22, color: 'var(--text-primary)', letterSpacing: 1 }}>
            {session.routine_name || 'Workout'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {formatDate(session.started_at)} · {formatDuration(session.started_at, session.completed_at)}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 16px 40px' }}>
        {exercises.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 40, fontSize: 14 }}>
            No sets logged for this session.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {exercises.map((ex, i) => (
              <div key={i} className="card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)', marginBottom: 12 }}>
                  {ex.name}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 8 }}>Set</th>
                      {ex.type === 'cardio' ? (
                        <>
                          <th style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 8 }}>Duration</th>
                          <th style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 8 }}>Distance</th>
                        </>
                      ) : ex.type === 'bodyweight' ? (
                        <th style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 8 }}>Reps</th>
                      ) : (
                        <>
                          <th style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 8 }}>Weight</th>
                          <th style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 8 }}>Reps</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {ex.sets.map((s, j) => (
                      <tr key={j}>
                        <td style={{ padding: '6px 0', fontSize: 14, color: 'var(--text-secondary)' }}>{s.set_number}</td>
                        {ex.type === 'cardio' ? (
                          <>
                            <td style={{ textAlign: 'right', padding: '6px 0', fontSize: 14, color: 'var(--text-primary)' }}>
                              {s.duration_seconds ? `${Math.floor(s.duration_seconds / 60)}:${String(s.duration_seconds % 60).padStart(2, '0')}` : '—'}
                            </td>
                            <td style={{ textAlign: 'right', padding: '6px 0', fontSize: 14, color: 'var(--text-primary)' }}>
                              {s.distance_metres ? `${s.distance_metres}m` : '—'}
                            </td>
                          </>
                        ) : ex.type === 'bodyweight' ? (
                          <td style={{ textAlign: 'right', padding: '6px 0', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{s.reps}</td>
                        ) : (
                          <>
                            <td style={{ textAlign: 'right', padding: '6px 0', fontSize: 14, color: 'var(--text-primary)' }}>{s.weight}kg</td>
                            <td style={{ textAlign: 'right', padding: '6px 0', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{s.reps}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
