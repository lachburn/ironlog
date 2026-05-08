import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'
import { useWeightUnit } from '../context/WeightUnitContext'
import LineChart from '../components/LineChart'
import { Icon } from '../components/Icon'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })
}

function formatDuration(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function timeAgo(iso) {
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

const TYPE_LABELS = { weighted: 'Weighted', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight', cardio: 'Cardio' }

function TypeChip({ type }) {
  return (
    <span className="eyebrow" style={{
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: 6,
      background: 'var(--surface-2)',
      color: 'var(--muted)',
      letterSpacing: '0.06em',
      fontSize: 10,
    }}>
      {TYPE_LABELS[type] || type}
    </span>
  )
}

function PRCard({ l, v, sub }) {
  return (
    <div className="card" style={{ padding: '10px 12px' }}>
      <div className="eyebrow">{l}</div>
      <div className="mono" style={{
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: '-0.02em',
        marginTop: 4,
        color: 'var(--ink)',
      }}>
        {v}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function ExerciseDetail() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const { fetchExerciseDetail } = useHistory()
  const { unit, toDisplay } = useWeightUnit()
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
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
      </div>
    )
  }

  const { sessions, sets } = data
  const exerciseName = sets[0]?.exercise_name || 'Exercise'
  const exerciseType = sets[0]?.exercise_type || 'weighted'
  const isCardio = exerciseType === 'cardio'
  const isBodyweight = exerciseType === 'bodyweight'
  const isW = exerciseType === 'weighted' || exerciseType === 'dumbbell'

  // PRs
  let prWeight = 0, prReps = 0, prVol = 0, pr1RM = 0, prDuration = 0
  sets.forEach(s => {
    if (isW) {
      prWeight = Math.max(prWeight, s.weight || 0)
      prReps = Math.max(prReps, s.reps || 0)
      const v = (s.weight || 0) * (s.reps || 0)
      prVol = Math.max(prVol, v)
      const e1 = (s.weight || 0) * (1 + (s.reps || 0) / 30)
      pr1RM = Math.max(pr1RM, e1)
    } else if (isCardio) {
      prDuration = Math.max(prDuration, s.duration_seconds || 0)
    } else {
      prReps = Math.max(prReps, s.reps || 0)
    }
  })

  // Build chart data — max weight per session
  const chartData = sessions
    .filter(s => isCardio ? s.sets?.some(x => x.duration_seconds) : s.max_weight > 0)
    .map(s => ({
      x: s.date,
      y: isCardio
        ? (s.sets?.reduce((acc, x) => acc + (x.duration_seconds || 0), 0) / (s.sets?.length || 1))
        : toDisplay(s.max_weight),
    }))

  const totalSets = sets.length
  const setsWithReps = sets.filter(s => s.reps != null && s.reps > 0)
  const avgReps = setsWithReps.length > 0
    ? (setsWithReps.reduce((a, s) => a + s.reps, 0) / setsWithReps.length).toFixed(1)
    : null
  const heaviest = Math.max(...sets.map(s => s.weight || 0))
  const totalSessions = sessions.length

  return (
    <div style={{
      background: 'var(--bg)',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '8px 18px 8px', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 44, gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink)', padding: 0,
            }}
          >
            <Icon name="chev-l" size={18} />
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>
            {exerciseName}
          </div>
          <div style={{ width: 36 }} />
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 18px 24px' }}>
        {/* Exercise name + type */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--ink)' }}>
            {exerciseName}
          </div>
          <div style={{ marginTop: 8 }}>
            <TypeChip type={exerciseType} />
          </div>
        </div>

        {/* PRs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {isW && [
            { l: 'Heaviest', v: `${toDisplay(prWeight)} ${unit}`, sub: '' },
            { l: 'Top set 1RM', v: `${toDisplay(Math.round(pr1RM))} ${unit}`, sub: 'estimated' },
            { l: 'Best volume', v: `${toDisplay(Math.round(prVol))} ${unit}`, sub: 'single set' },
            { l: 'Most reps', v: `${prReps}`, sub: '' },
          ].map((p, i) => <PRCard key={i} {...p} />)}
          {isBodyweight && [
            { l: 'Best reps', v: `${prReps}`, sub: 'single set' },
            { l: 'Sessions', v: `${totalSessions}`, sub: '' },
          ].map((p, i) => <PRCard key={i} {...p} />)}
          {isCardio && [
            { l: 'Longest', v: `${prDuration}s`, sub: '' },
            { l: 'Sessions', v: `${totalSessions}`, sub: '' },
          ].map((p, i) => <PRCard key={i} {...p} />)}
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="card" style={{ padding: 14, marginBottom: 14 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}>
              <div className="eyebrow">
                {isW ? 'Estimated 1RM' : isCardio ? 'Longest set' : 'Best reps'}
              </div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
                {chartData.length} session{chartData.length !== 1 ? 's' : ''}
              </div>
            </div>
            <LineChart data={chartData} color="var(--accent)" />
          </div>
        )}

        {/* History */}
        <div className="eyebrow" style={{ padding: '4px 4px 8px' }}>History</div>
        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
            No history yet
          </div>
        ) : (
          sessions.map((session, i) => {
            const sessionSets = session.sets || []
            return (
              <button
                key={i}
                onClick={() => navigate(`/history/${session.session_id}`)}
                className="card row-tap"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: '12px 14px',
                  marginBottom: 8,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                    {formatDate(session.date)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{timeAgo(session.date)}</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {sessionSets.map((s, j) => (
                    <span
                      key={j}
                      className="mono"
                      style={{
                        background: 'var(--surface-2)',
                        borderRadius: 6,
                        padding: '3px 7px',
                        fontSize: 12,
                        color: 'var(--ink-2)',
                      }}
                    >
                      {isW
                        ? `${toDisplay(s.weight)} ${unit} × ${s.reps}`
                        : isCardio
                        ? (s.duration_seconds ? formatDuration(s.duration_seconds) : `${s.reps}s`)
                        : `${s.reps} reps`}
                    </span>
                  ))}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
