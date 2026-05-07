import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'
import { useWeightUnit } from '../context/WeightUnitContext'
import LineChart from '../components/LineChart'

const TYPE_LABELS = { weighted: 'Weighted', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight', cardio: 'Cardio' }
const TYPE_COLORS = { weighted: '#C9A84C', dumbbell: '#E2C06E', bodyweight: '#4CAF50', cardio: '#2196F3' }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })
}

function formatDuration(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ExerciseDetail() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const { fetchExerciseDetail } = useHistory()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExerciseDetail(exerciseId).then(result => {
      setData(result)
      setLoading(false)
    })
  }, [exerciseId, fetchExerciseDetail])

  if (loading || !data) {
    return (
      <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading…</div>
      </div>
    )
  }

  const { unit, toDisplay } = useWeightUnit()

  const { sessions, sets } = data
  const exerciseName = sets[0]?.exercise_name || 'Exercise'
  const exerciseType = sets[0]?.exercise_type || 'weighted'
  const accentColor = TYPE_COLORS[exerciseType] || 'var(--accent)'
  const isCardio = exerciseType === 'cardio'
  const isBodyweight = exerciseType === 'bodyweight'

  // Build chart data — max weight per session
  const chartData = sessions
    .filter(s => isCardio ? s.sets.some(x => x.duration_seconds) : s.max_weight > 0)
    .map(s => ({
      x: s.date,
      y: isCardio
        ? (s.sets.reduce((acc, x) => acc + (x.duration_seconds || 0), 0) / s.sets.length)
        : toDisplay(s.max_weight),
    }))

  // Overall stats
  const totalSets = sets.length
  const setsWithReps = sets.filter(s => s.reps != null && s.reps > 0)
  const avgReps = setsWithReps.length > 0
    ? (setsWithReps.reduce((a, s) => a + s.reps, 0) / setsWithReps.length).toFixed(1)
    : null
  const heaviest = Math.max(...sets.map(s => s.weight || 0))
  const totalSessions = sessions.length

  return (
    <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '56px 16px 16px',
        paddingTop: 'max(56px, calc(env(safe-area-inset-top) + 16px))',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--accent)', padding: '4px 8px', minHeight: 44, marginTop: -4 }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <div className="font-display" style={{ fontSize: 28, color: 'var(--text-primary)', letterSpacing: 1, lineHeight: 1.1 }}>
              {exerciseName.toUpperCase()}
            </div>
            <div style={{
              display: 'inline-block',
              marginTop: 6,
              fontSize: 11,
              fontWeight: 600,
              color: accentColor,
              background: accentColor + '22',
              padding: '3px 10px',
              borderRadius: 8,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              {TYPE_LABELS[exerciseType] || exerciseType}
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 16px 40px' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Sessions', value: totalSessions },
            { label: 'Total Sets', value: totalSets },
            avgReps != null
              ? { label: 'Avg Reps', value: avgReps }
              : heaviest > 0
              ? { label: 'Best', value: `${toDisplay(heaviest)}${unit}` }
              : { label: 'Sets', value: totalSets },
          ].map((stat, i) => (
            <div key={i} className="card" style={{ padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Bebas Neue', letterSpacing: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="card" style={{ padding: '16px 12px 8px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
              {isCardio ? 'Avg Duration per Session' : isBodyweight ? 'Reps over Time' : 'Weight over Time'}
            </div>
            <LineChart data={chartData} color={accentColor} />
            {!isCardio && !isBodyweight && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right', marginTop: 4 }}>{unit}</div>
            )}
          </div>
        )}

        {/* Sessions breakdown */}
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
          All Sessions
        </div>

        {sessions.map((session, si) => {
          const sessionAvgReps = session.set_count > 0
            ? (session.total_reps / session.set_count).toFixed(1)
            : null

          return (
            <div key={session.session_id} className="card" style={{ padding: 16, marginBottom: 12 }}>
              {/* Session header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                    {formatDate(session.date)}
                  </div>
                  {session.routine_name && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {session.routine_name}
                    </div>
                  )}
                </div>
                {sessionAvgReps && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: accentColor }}>{sessionAvgReps}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>avg reps</div>
                  </div>
                )}
              </div>

              {/* Sets table */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 6 }}>Set</th>
                    {isCardio ? (
                      <>
                        <th style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 6 }}>Duration</th>
                        <th style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 6 }}>Distance</th>
                      </>
                    ) : isBodyweight ? (
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
                  {session.sets.map((s, j) => (
                    <tr key={j}>
                      <td style={{ padding: '5px 0', fontSize: 13, color: 'var(--text-secondary)' }}>{s.set_number}</td>
                      {isCardio ? (
                        <>
                          <td style={{ textAlign: 'right', padding: '5px 0', fontSize: 13, color: 'var(--text-primary)' }}>
                            {s.duration_seconds ? formatDuration(s.duration_seconds) : '—'}
                          </td>
                          <td style={{ textAlign: 'right', padding: '5px 0', fontSize: 13, color: 'var(--text-primary)' }}>
                            {s.distance_metres ? `${s.distance_metres}m` : '—'}
                          </td>
                        </>
                      ) : isBodyweight ? (
                        <td style={{ textAlign: 'right', padding: '5px 0', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.reps}</td>
                      ) : (
                        <>
                          <td style={{ textAlign: 'right', padding: '5px 0', fontSize: 13, color: 'var(--text-primary)' }}>{toDisplay(s.weight)}{unit}</td>
                          <td style={{ textAlign: 'right', padding: '5px 0', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.reps}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
                {/* Session avg reps footer */}
                {!isCardio && session.set_count > 1 && sessionAvgReps && (
                  <tfoot>
                    <tr>
                      <td colSpan={isBodyweight ? 1 : 2} style={{ paddingTop: 8, fontSize: 12, color: 'var(--text-secondary)', borderTop: '1px solid var(--border)' }}>
                        Average
                      </td>
                      <td style={{ textAlign: 'right', paddingTop: 8, fontSize: 12, fontWeight: 600, color: accentColor, borderTop: '1px solid var(--border)' }}>
                        {sessionAvgReps} reps
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}
