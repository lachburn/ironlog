import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'
import { useWeightUnit } from '../context/WeightUnitContext'
import BottomSheet from '../components/BottomSheet'
import { Icon } from '../components/Icon'

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

function TypeChip({ type }) {
  const labels = { weighted: 'Weighted', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight', cardio: 'Cardio' }
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
      {labels[type] || type}
    </span>
  )
}

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchSession, deleteWorkout } = useHistory()
  const { unit, toDisplay } = useWeightUnit()
  const [session, setSession] = useState(null)
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDeleteSheet, setShowDeleteSheet] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchSession(id).then(({ session: s, sets }) => {
      setSession(s)
      setExercises(groupByExercise(sets || []))
      setLoading(false)
    })
  }, [id]) // eslint-disable-line

  const handleDelete = async () => {
    setDeleting(true)
    await deleteWorkout(id)
    navigate('/history', { replace: true })
  }

  if (loading || !session) {
    return (
      <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
      </div>
    )
  }

  const duration = formatDuration(session.started_at, session.completed_at)
  const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0)

  return (
    <div style={{
      background: 'var(--bg)',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
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
            {session.routine_name || 'Once-off'}
          </div>
          <button
            onClick={() => setShowDeleteSheet(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--danger)', padding: 0,
            }}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 18px 24px' }}>
        {/* Stats card */}
        <div className="card" style={{ padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            {formatDate(session.completed_at || session.started_at)}
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            {[
              { v: exercises.length, l: 'exercises' },
              { v: totalSets, l: 'sets' },
              { v: duration, l: 'duration' },
            ].map((x, i) => (
              <div key={i} style={{
                flex: 1,
                borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                paddingLeft: i > 0 ? 14 : 0,
              }}>
                <div className="mono" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                  {x.v}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{x.l}</div>
              </div>
            ))}
          </div>
        </div>

        {exercises.length === 0 ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', paddingTop: 40, fontSize: 14 }}>
            No sets logged for this session.
          </div>
        ) : (
          exercises.map((ex, i) => {
            const isW = ex.type === 'weighted' || ex.type === 'dumbbell'
            const isCardio = ex.type === 'cardio'
            return (
              <div key={i} className="card" style={{ padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <button
                    onClick={() => ex.exercise_id && navigate(`/exercise-history/${ex.exercise_id}`)}
                    style={{
                      flex: 1,
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600,
                      fontSize: 15,
                      color: 'var(--ink)',
                      fontFamily: 'inherit',
                    }}
                  >
                    {ex.name}
                  </button>
                  <TypeChip type={ex.type} />
                </div>
                {ex.sets.map((st, si) => (
                  <div
                    key={si}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '24px 1fr 1fr auto',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 0',
                      borderTop: si === 0 ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    <div className="mono" style={{ color: 'var(--muted)', fontSize: 12 }}>{si + 1}</div>
                    {isW && (
                      <>
                        <div className="mono" style={{ fontSize: 14, color: 'var(--ink)' }}>
                          {toDisplay(st.weight)} <span style={{ color: 'var(--muted)', fontSize: 11 }}>{unit}</span>
                        </div>
                        <div className="mono" style={{ fontSize: 14, color: 'var(--ink)' }}>
                          {st.reps} <span style={{ color: 'var(--muted)', fontSize: 11 }}>reps</span>
                        </div>
                      </>
                    )}
                    {ex.type === 'bodyweight' && (
                      <div className="mono" style={{ fontSize: 14, gridColumn: '2 / 4', color: 'var(--ink)' }}>
                        {st.reps} <span style={{ color: 'var(--muted)', fontSize: 11 }}>reps</span>
                      </div>
                    )}
                    {isCardio && (
                      <div className="mono" style={{ fontSize: 14, gridColumn: '2 / 4', color: 'var(--ink)' }}>
                        {st.duration_seconds
                          ? `${Math.floor(st.duration_seconds / 60)}:${String(st.duration_seconds % 60).padStart(2, '0')}`
                          : '—'}
                        {' '}<span style={{ color: 'var(--muted)', fontSize: 11 }}>dur</span>
                      </div>
                    )}
                    <div>
                      {st.is_failure && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: 'var(--good)',
                          background: 'color-mix(in oklch, var(--good) 12%, transparent)',
                          padding: '2px 7px',
                          borderRadius: 999,
                          whiteSpace: 'nowrap',
                        }}>
                          To Failure
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>

      {/* Delete sheet */}
      {showDeleteSheet && (
        <BottomSheet open={showDeleteSheet} onClose={() => !deleting && setShowDeleteSheet(false)}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
              Delete this workout?
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
              <strong>{session.routine_name}</strong> on {formatDate(session.started_at)}.
              {' '}This cannot be undone.
            </div>
          </div>
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete workout'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setShowDeleteSheet(false)}
            disabled={deleting}
            style={{ marginTop: 8 }}
          >
            Cancel
          </button>
        </BottomSheet>
      )}
    </div>
  )
}
