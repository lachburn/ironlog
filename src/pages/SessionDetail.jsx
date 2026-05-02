import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDuration(start, end) {
  if (!end) return '—'
  const totalSecs = Math.floor((new Date(end) - new Date(start)) / 1000)
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function groupByExercise(sets) {
  const map = new Map()
  for (const s of sets) {
    const key = s.exercise_id || s.exercise_name
    if (!map.has(key)) {
      map.set(key, {
        exercise_id: s.exercise_id,
        name: s.exercise_name || 'Unknown',
        type: s.exercise_type,
        sets: [],
      })
    }
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

  const duration = formatDuration(session.started_at, session.completed_at)

  return (
    <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '56px 16px 16px',
        paddingTop: 'max(56px, calc(env(safe-area-inset-top) + 16px))',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--accent)', padding: '4px 8px', minHeight: 44, marginTop: -4 }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <div className="font-display" style={{ fontSize: 24, color: 'var(--text-primary)', letterSpacing: 1 }}>
              {session.routine_name || 'Workout'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {formatDate(session.started_at)}
            </div>
          </div>
          {/* Big MM:SS duration */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="font-display" style={{ fontSize: 32, color: 'var(--accent)', letterSpacing: 1, lineHeight: 1 }}>
              {duration}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>duration</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 16px 40px' }}>
        {exercises.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 40, fontSize: 14 }}>
            No sets logged for this session.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {exercises.map((ex, i) => (
              <button
                key={i}
                onClick={() => ex.exercise_id && navigate(`/exercise-history/${ex.exercise_id}`)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: 16,
                  cursor: ex.exercise_id ? 'pointer' : 'default',
                  boxShadow: 'var(--shadow)',
                  transition: 'border-color 200ms ease',
                }}
              >
                {/* Exercise header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
                    {ex.name}
                  </div>
                  {ex.exercise_id && (
                    <div style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 500 }}>
                      History ›
                    </div>
                  )}
                </div>

                {/* Sets table */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 6 }}>Set</th>
                      {ex.type === 'cardio' ? (
                        <>
                          <th style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 6 }}>Duration</th>
                          <th style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 6 }}>Distance</th>
                        </>
                      ) : ex.type === 'bodyweight' ? (
                        <th style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 6 }}>Reps</th>
                      ) : (
                        <>
                          <th style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 6 }}>Weight</th>
                          <th style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 6 }}>Reps</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {ex.sets.map((s, j) => (
                      <tr key={j}>
                        <td style={{ padding: '5px 0', fontSize: 13, color: 'var(--text-secondary)' }}>{s.set_number}</td>
                        {ex.type === 'cardio' ? (
                          <>
                            <td style={{ textAlign: 'right', padding: '5px 0', fontSize: 13, color: 'var(--text-primary)' }}>
                              {s.duration_seconds
                                ? `${Math.floor(s.duration_seconds / 60)}:${String(s.duration_seconds % 60).padStart(2, '0')}`
                                : '—'}
                            </td>
                            <td style={{ textAlign: 'right', padding: '5px 0', fontSize: 13, color: 'var(--text-primary)' }}>
                              {s.distance_metres ? `${s.distance_metres}m` : '—'}
                            </td>
                          </>
                        ) : ex.type === 'bodyweight' ? (
                          <td style={{ textAlign: 'right', padding: '5px 0', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.reps}</td>
                        ) : (
                          <>
                            <td style={{ textAlign: 'right', padding: '5px 0', fontSize: 13, color: 'var(--text-primary)' }}>{s.weight}kg</td>
                            <td style={{ textAlign: 'right', padding: '5px 0', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.reps}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
