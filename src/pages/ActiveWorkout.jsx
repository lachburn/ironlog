import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoutines } from '../hooks/useRoutines'
import { useWorkout } from '../hooks/useWorkout'
import { useWeightUnit } from '../context/WeightUnitContext'
import BottomSheet from '../components/BottomSheet'
import { Icon } from '../components/Icon'

const TYPE_LABELS = { weighted: 'Weighted', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight', cardio: 'Cardio' }

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function fmtElapsed(startIso) {
  const s = Math.floor((Date.now() - new Date(startIso)) / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function formatSetDisplay(s, unit = 'kg', toDisplay = v => v) {
  if (s.duration_seconds) {
    return `${formatDuration(s.duration_seconds)}${s.distance_metres ? ` · ${s.distance_metres}m` : ''}`
  }
  if (!s.weight) return `${s.reps} reps`
  return `${toDisplay(s.weight)}${unit} × ${s.reps}`
}

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

// Inline set row with editable fields
function SetRow({ idx, set, type, update, remove }) {
  const isWeighted = type === 'weighted' || type === 'dumbbell'
  const isCardio = type === 'cardio'
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: set.done ? 'var(--surface-2)' : 'var(--surface)',
      border: `1px solid ${set.done ? 'var(--border)' : 'var(--border)'}`,
      borderRadius: 14,
      padding: '10px 12px',
      transition: 'background .15s',
    }}>
      {/* Set number badge */}
      <div className="mono" style={{
        width: 28, height: 28, borderRadius: 8,
        background: set.done ? 'var(--accent)' : 'var(--bg-deep)',
        color: set.done ? 'var(--accent-ink)' : 'var(--muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 600, flexShrink: 0,
      }}>
        {idx}
      </div>

      {isWeighted && (
        <>
          <FieldInline label="kg" value={set.weight} onChange={v => update({ weight: v })} decimal />
          <span style={{ color: 'var(--faint)' }}>×</span>
          <FieldInline label="reps" value={set.reps} onChange={v => update({ reps: v })} />
        </>
      )}
      {type === 'bodyweight' && (
        <FieldInline label="reps" value={set.reps} onChange={v => update({ reps: v })} wide />
      )}
      {isCardio && (
        <FieldInline label="sec" value={set.duration || set.reps} onChange={v => update({ duration: v, reps: v })} wide />
      )}

      {/* Done toggle */}
      <button
        onClick={() => update({ done: !set.done })}
        aria-label="Toggle set"
        style={{
          marginLeft: 'auto',
          width: 36, height: 36, borderRadius: 999,
          background: set.done ? 'var(--accent)' : 'var(--bg-deep)',
          border: set.done ? 'none' : '1px solid var(--border)',
          color: set.done ? 'var(--accent-ink)' : 'var(--muted)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name="check" size={16} stroke={2.4} />
      </button>

      {/* Remove */}
      <button
        onClick={remove}
        aria-label="Remove set"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--faint)', padding: 4,
          display: 'flex', alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  )
}

function FieldInline({ label, value, onChange, decimal, wide }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, minWidth: wide ? 80 : 60 }}>
      <input
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mono"
        style={{
          width: wide ? 64 : 44,
          padding: '4px 0',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--border)',
          color: 'var(--ink)',
          fontSize: 17,
          fontWeight: 600,
          textAlign: 'center',
          outline: 'none',
          fontFamily: 'inherit',
        }}
        onFocus={e => e.target.select()}
      />
      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</span>
    </div>
  )
}

export default function ActiveWorkout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { routines } = useRoutines()
  const { startSession, finishSession, cancelSession, logSet, getLastSets, saveProgress, getProgress } = useWorkout()
  const { unit, toDisplay, toKg } = useWeightUnit()

  const routine = routines.find(r => r.id === id)
  const exercises = routine?.routine_exercises || []

  const [sessionId, setSessionId] = useState(null)
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [exerciseQueue, setExerciseQueue] = useState(null)
  const [loggedSets, setLoggedSets] = useState([])
  const [lastSets, setLastSets] = useState([])
  const [nextSetWeight, setNextSetWeight] = useState(null)
  const [nextSetReps, setNextSetReps] = useState(null)
  const [setCount, setSetCount] = useState(1)
  const [bonusSets, setBonusSets] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [showQuit, setShowQuit] = useState(false)
  const [startedAt] = useState(() => new Date().toISOString())
  const [now, setNow] = useState(Date.now())

  // Inline set logging state (new design uses inline rows instead of SetLogger)
  const [inlineSets, setInlineSets] = useState([])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (exerciseQueue === null && exercises.length > 0) {
      setExerciseQueue([...exercises])
    }
  }, [exercises.length]) // eslint-disable-line

  const queue = exerciseQueue || exercises
  const currentExercise = queue[exerciseIndex]
  const exerciseType = currentExercise?.exercises?.type || 'weighted'
  const isWeighted = exerciseType === 'weighted' || exerciseType === 'dumbbell'

  useEffect(() => {
    if (initialized || !routine) return
    setInitialized(true)

    const resume = getProgress()
    if (resume && resume.sessionId) {
      setSessionId(resume.sessionId)
      setExerciseIndex(resume.exerciseIndex || 0)
    } else {
      startSession(routine.id, routine.name).then(({ session }) => {
        if (session) {
          setSessionId(session.id)
          saveProgress(session.id, 0)
        }
      })
    }
  }, [routine, initialized]) // eslint-disable-line

  useEffect(() => {
    if (!currentExercise) return
    const exId = currentExercise.exercises?.id
    if (!exId) return

    getLastSets(exId).then(sets => {
      setLastSets(sets)
      if (sets.length > 0) {
        setNextSetWeight(sets[0].weight)
        setNextSetReps(sets[0].reps)
      } else {
        setNextSetWeight(currentExercise.default_weight || null)
        setNextSetReps(currentExercise.default_reps || null)
      }
    })
    setSetCount(1)
    setBonusSets(0)

    // Build initial inline set rows from defaults
    const defaultSets = currentExercise.default_sets || 3
    setInlineSets(
      Array.from({ length: defaultSets }).map(() => ({
        weight: currentExercise.default_weight || '',
        reps: currentExercise.default_reps || '',
        done: false,
      }))
    )
  }, [exerciseIndex, currentExercise]) // eslint-disable-line

  // Update inline sets with last session data when it arrives
  useEffect(() => {
    if (!lastSets.length) return
    setInlineSets(prev => prev.map((s, i) => {
      const last = lastSets[i] || lastSets[lastSets.length - 1]
      return {
        ...s,
        weight: s.done ? s.weight : (last?.weight ?? s.weight),
        reps: s.done ? s.reps : (last?.reps ?? s.reps),
      }
    }))
  }, [lastSets]) // eslint-disable-line

  const currentExId = currentExercise?.exercises?.id
  const currentExSets = loggedSets.filter(s => s._exerciseId === currentExId)
  const targetSets = currentExercise?.default_sets || null
  const effectiveTarget = (targetSets || 0) + bonusSets
  const isLastExercise = exerciseIndex >= queue.length - 1
  const hasLoggedAtLeastOneSet = currentExSets.length > 0 || inlineSets.some(s => s.done)

  const doneSetsCount = inlineSets.filter(s => s.done).length
  const totalSetsCount = inlineSets.length

  const updateInlineSet = (i, patch) => {
    setInlineSets(prev => prev.map((s, si) => si !== i ? s : { ...s, ...patch }))
  }

  const addInlineSet = () => {
    const last = inlineSets[inlineSets.length - 1] || { weight: '', reps: '', done: false }
    setInlineSets(prev => [...prev, { weight: last.weight, reps: last.reps, done: false }])
  }

  const removeInlineSet = (i) => {
    setInlineSets(prev => prev.filter((_, si) => si !== i))
  }

  const handleLogDoneSets = async () => {
    if (!sessionId) return
    const doneSets = inlineSets.filter(s => s.done)
    for (let i = 0; i < doneSets.length; i++) {
      const s = doneSets[i]
      const weightInKg = s.weight != null && s.weight !== '' ? toKg(parseFloat(s.weight) || 0) : null
      const set = {
        session_id: sessionId,
        exercise_id: currentExId,
        exercise_name: currentExercise.exercises?.name,
        exercise_type: exerciseType,
        set_number: i + 1,
        weight: weightInKg,
        reps: parseInt(s.reps) || 0,
        duration_seconds: null,
        distance_metres: null,
      }
      const { data } = await logSet(set)
      const withMeta = { ...set, ...data, _exerciseId: currentExId }
      setLoggedSets(prev => [...prev, withMeta])
    }
  }

  const goNextExercise = async () => {
    await handleLogDoneSets()
    const nextIdx = exerciseIndex + 1
    setExerciseIndex(nextIdx)
    saveProgress(sessionId, nextIdx)
    setBonusSets(0)
  }

  const handleDoLater = () => {
    setExerciseQueue(prev => {
      const q = [...(prev || exercises)]
      const [moved] = q.splice(exerciseIndex, 1)
      q.push(moved)
      return q
    })
    setBonusSets(0)
  }

  const handleFinish = async () => {
    if (!sessionId) return
    setFinishing(true)
    await handleLogDoneSets()
    await finishSession(sessionId)
    navigate(`/history/${sessionId}`, { replace: true })
  }

  const handleQuit = async () => {
    await cancelSession(sessionId)
    navigate('/')
  }

  if (!routine || queue.length === 0) {
    return (
      <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)' }}>Loading workout…</div>
      </div>
    )
  }

  // Progress bar
  const progressPct = queue.length > 0 ? ((exerciseIndex + (doneSetsCount / Math.max(totalSetsCount, 1))) / queue.length) * 100 : 0

  // Last time hint
  const lastExData = lastSets.length > 0 ? lastSets : null

  return (
    <div style={{
      background: 'var(--bg)',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Status bar */}
      <div style={{
        flexShrink: 0,
        padding: '8px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--bg)',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'var(--surface-2)',
            border: 'none',
            borderRadius: 999,
            padding: '7px 13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--ink)',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'inherit',
          }}
        >
          <Icon name="chev-down" size={14} /> Minimise
        </button>
        <div className="mono" style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--muted)' }}>
          {fmtElapsed(startedAt)}
        </div>
        <button
          onClick={() => setShowQuit(true)}
          style={{
            background: 'var(--ink)',
            color: 'var(--bg)',
            border: 'none',
            borderRadius: 999,
            padding: '7px 13px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          Finish
        </button>
      </div>

      {/* Exercise chip pager */}
      <div className="no-scrollbar" style={{ flexShrink: 0, padding: '8px 18px 4px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {queue.map((re, i) => {
            const ex = re.exercises || {}
            const active = i === exerciseIndex
            const done = i < exerciseIndex
            return (
              <button
                key={i}
                onClick={() => setExerciseIndex(i)}
                style={{
                  background: active ? 'var(--ink)' : 'var(--surface-2)',
                  color: active ? 'var(--bg)' : done ? 'var(--muted)' : 'var(--ink)',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 999,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  textDecoration: done && !active ? 'line-through' : 'none',
                  opacity: done && !active ? 0.7 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {done && <Icon name="check" size={12} stroke={2.4} />}
                {ex.name || `Exercise ${i + 1}`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ flexShrink: 0, padding: '8px 18px 0' }}>
        <div style={{ height: 3, borderRadius: 2, background: 'var(--surface-2)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'var(--accent)',
            width: `${progressPct}%`,
            transition: 'width .25s',
          }} />
        </div>
      </div>

      {/* Main content */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 16px' }}>
        {/* Exercise header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">
              Exercise {exerciseIndex + 1} of {queue.length}
            </div>
            <div style={{
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginTop: 4,
              color: 'var(--ink)',
            }}>
              {currentExercise.exercises?.name}
            </div>
            <div style={{ marginTop: 8 }}>
              <TypeChip type={exerciseType} />
            </div>
          </div>
        </div>

        {/* Last time hint */}
        {lastExData && (
          <div style={{
            padding: '10px 12px',
            borderRadius: 12,
            background: 'var(--surface-2)',
            marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Icon name="rotate" size={12} style={{ color: 'var(--muted)' }} />
              <span className="eyebrow" style={{ fontSize: 10 }}>Last time</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {lastSets.map((s, i) => (
                <span
                  key={i}
                  className="mono"
                  style={{
                    background: 'var(--bg)',
                    borderRadius: 6,
                    padding: '3px 7px',
                    fontSize: 12,
                    color: 'var(--ink-2)',
                  }}
                >
                  {isWeighted
                    ? `${toDisplay(s.weight)} ${unit} × ${s.reps}`
                    : exerciseType === 'cardio'
                    ? `${s.duration_seconds || s.reps}s`
                    : `${s.reps} reps`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Inline set rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {inlineSets.map((s, i) => (
            <SetRow
              key={i}
              idx={i + 1}
              set={s}
              type={exerciseType}
              update={patch => updateInlineSet(i, patch)}
              remove={() => removeInlineSet(i)}
            />
          ))}
        </div>

        <button
          className="btn btn-ghost"
          onClick={addInlineSet}
          style={{ marginTop: 12 }}
        >
          <Icon name="plus" size={14} /> Add set
        </button>
      </div>

      {/* Footer action bar */}
      <div style={{
        flexShrink: 0,
        padding: '10px 18px calc(env(safe-area-inset-bottom,0px) + 14px)',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
        display: 'flex',
        gap: 10,
      }}>
        <button
          className="btn btn-ghost"
          disabled={exerciseIndex === 0}
          onClick={() => setExerciseIndex(exerciseIndex - 1)}
          style={{ flex: 1 }}
        >
          <Icon name="chev-l" size={14} /> Prev
        </button>
        {isLastExercise ? (
          <button
            className="btn btn-primary"
            onClick={handleFinish}
            disabled={finishing}
            style={{ flex: 2 }}
          >
            {finishing ? 'Saving…' : 'Finish'} <Icon name="check" size={14} />
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={goNextExercise}
            style={{ flex: 2 }}
          >
            Next <Icon name="chev-r" size={14} />
          </button>
        )}
      </div>

      {/* Quit sheet */}
      {showQuit && (
        <BottomSheet open={showQuit} onClose={() => setShowQuit(false)}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
              Quit workout?
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
              Your progress will be lost.
            </div>
          </div>
          <button className="btn btn-danger" onClick={handleQuit}>Quit workout</button>
          <button className="btn btn-ghost" onClick={() => setShowQuit(false)} style={{ marginTop: 8 }}>
            Keep going
          </button>
        </BottomSheet>
      )}
    </div>
  )
}
