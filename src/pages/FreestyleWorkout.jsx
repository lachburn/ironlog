import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkout } from '../hooks/useWorkout'
import { useRoutines } from '../hooks/useRoutines'
import { useHistory } from '../hooks/useHistory'
import { useWeightUnit } from '../context/WeightUnitContext'
import { useActiveWorkout } from '../context/ActiveWorkoutContext'
import ExerciseSearchModal from '../components/ExerciseSearchModal'
import BottomSheet from '../components/BottomSheet'
import { Icon } from '../components/Icon'

const FREESTYLE_KEY = 'ironlog-freestyle-workout'
const TYPE_LABELS = { weighted: 'Weighted', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight', cardio: 'Cardio', run: 'Run' }

function parseMmSs(str) {
  if (!str) return null
  const parts = str.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + (parts[1] || 0)
  return parts[0] || null
}

function fmtElapsed(startIso) {
  const s = Math.floor((Date.now() - new Date(startIso)) / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function getSavedFreestyle() {
  try {
    const raw = localStorage.getItem(FREESTYLE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
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

function SetRow({ idx, set, type, update, remove }) {
  const isWeighted = type === 'weighted' || type === 'dumbbell'
  const isCardio = type === 'cardio'
  const isRun = type === 'run'
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: set.done ? 'var(--surface-2)' : 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '10px 12px',
      transition: 'background .15s',
    }}>
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
      {isRun && (
        <>
          <FieldInline label="mm:ss" value={set.duration || ''} onChange={v => update({ duration: v })} text wide />
          <FieldInline label="km" value={set.distance || ''} onChange={v => update({ distance: v })} decimal />
          <FieldInline label="bpm" value={set.heartRate || ''} onChange={v => update({ heartRate: v })} />
        </>
      )}

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

function FieldInline({ label, value, onChange, decimal, wide, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, minWidth: wide ? 80 : 60 }}>
      <input
        type="text"
        inputMode={text ? undefined : decimal ? 'decimal' : 'numeric'}
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

export default function FreestyleWorkout() {
  const navigate = useNavigate()
  const { startSession, finishSession, cancelSession, logSet, getLastSets } = useWorkout()
  const { createRoutine, saveRoutineExercises } = useRoutines()
  const { fetchSessions } = useHistory()
  const { unit, toDisplay, toKg } = useWeightUnit()
  const { setActiveWorkout, clearActiveWorkout } = useActiveWorkout()

  // Load any saved freestyle session on mount
  const savedRef = useRef(getSavedFreestyle())
  const saved = savedRef.current

  const [sessionId, setSessionId] = useState(saved?.sessionId ?? null)
  const [startedAt] = useState(() => saved?.startedAt ?? new Date().toISOString())
  const [phase, setPhase] = useState(saved ? (saved.phase === 'finishing' ? 'logging' : saved.phase) : 'picking')
  const [exercises, setExercises] = useState(saved?.exercises ?? [])
  const [exerciseIndex, setExerciseIndex] = useState(saved?.exerciseIndex ?? 0)
  const [exerciseSets, setExerciseSets] = useState(saved?.exerciseSets ?? {})
  const [lastSets, setLastSets] = useState([])
  const [finishing, setFinishing] = useState(false)
  const [showFinishEarly, setShowFinishEarly] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [, setNow] = useState(Date.now())

  // Ref to prevent quit dialog when modal closes immediately after selection
  const justSelectedRef = useRef(false)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Start new session or resume saved one
  useEffect(() => {
    if (saved?.sessionId) {
      setActiveWorkout({ routineId: 'freestyle', routineName: 'Once-off', startedAt })
      return
    }
    startSession(null, 'Once-Off Workout').then(({ session }) => {
      if (session) {
        setSessionId(session.id)
        setActiveWorkout({ routineId: 'freestyle', routineName: 'Once-off', startedAt })
      }
    })
  }, []) // eslint-disable-line

  // Persist state whenever anything changes
  useEffect(() => {
    if (!sessionId) return
    localStorage.setItem(FREESTYLE_KEY, JSON.stringify({
      sessionId, startedAt, phase, exercises, exerciseSets, exerciseIndex,
    }))
  }, [sessionId, startedAt, phase, exercises, exerciseSets, exerciseIndex])

  const currentEx = exercises[exerciseIndex] || null
  const currentExId = currentEx?.id
  const exerciseType = currentEx?.type || 'weighted'
  const isWeighted = exerciseType === 'weighted' || exerciseType === 'dumbbell'

  const inlineSets = currentExId ? (exerciseSets[currentExId] || []) : []

  const setInlineSets = (updater) => {
    if (!currentExId) return
    setExerciseSets(prev => ({
      ...prev,
      [currentExId]: typeof updater === 'function' ? updater(prev[currentExId] || []) : updater,
    }))
  }

  const updateInlineSet = (i, patch) => setInlineSets(prev => prev.map((s, si) => si !== i ? s : { ...s, ...patch }))
  const addInlineSet = () => {
    const last = inlineSets[inlineSets.length - 1] || {}
    setInlineSets(prev => [...prev, { ...last, done: false }])
  }
  const removeInlineSet = (i) => setInlineSets(prev => prev.filter((_, si) => si !== i))

  // Load last sets & prefill when exercise changes
  useEffect(() => {
    if (!currentEx) return
    getLastSets(currentEx.id).then(sets => {
      setLastSets(sets)
      setExerciseSets(prev => {
        if (prev[currentEx.id] && prev[currentEx.id].length > 0) return prev
        const defaultRows = sets.length > 0
          ? sets.map(s => ({ weight: s.weight ?? '', reps: s.reps ?? '', done: false }))
          : [{ weight: '', reps: '', done: false }]
        return { ...prev, [currentEx.id]: defaultRows }
      })
    })
  }, [exerciseIndex, exercises.length]) // eslint-disable-line

  const handleSelectExercise = (ex) => {
    justSelectedRef.current = true
    const newEx = { id: ex.id, name: ex.name, type: ex.type }
    setExercises(prev => {
      if (prev.some(e => e.id === ex.id)) return prev
      return [...prev, newEx]
    })
    setExerciseIndex(prev => {
      // If this exercise is already in the list, stay at its index
      const idx = exercises.findIndex(e => e.id === ex.id)
      return idx >= 0 ? idx : exercises.length
    })
    setPhase('logging')
  }

  const handleModalClose = () => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }
    if (exercises.length === 0) {
      handleQuit()
    } else {
      setPhase('logging')
    }
  }

  const goPrevExercise = () => {
    if (exerciseIndex > 0) setExerciseIndex(exerciseIndex - 1)
  }

  const goNextExercise = () => {
    setPhase('picking')
  }

  const clearWorkoutData = () => {
    localStorage.removeItem(FREESTYLE_KEY)
    clearActiveWorkout()
  }

  // Log all done sets from all exercises
  const logAllSets = async () => {
    for (const ex of exercises) {
      const sets = exerciseSets[ex.id] || []
      const doneSets = sets.filter(s => s.done)
      for (let i = 0; i < doneSets.length; i++) {
        const s = doneSets[i]
        const isRunType = ex.type === 'run'
        const weightInKg = (!isRunType && s.weight != null && s.weight !== '') ? toKg(parseFloat(s.weight) || 0) : null
        await logSet({
          session_id: sessionId,
          exercise_id: ex.id,
          exercise_name: ex.name,
          exercise_type: ex.type,
          set_number: i + 1,
          weight: isRunType ? (s.heartRate ? parseFloat(s.heartRate) : null) : weightInKg,
          reps: isRunType ? null : parseInt(s.reps) || 0,
          duration_seconds: isRunType ? parseMmSs(s.duration) : ex.type === 'cardio' ? (parseInt(s.duration) || parseInt(s.reps) || 0) : null,
          distance_metres: isRunType ? (s.distance ? parseFloat(s.distance) * 1000 : null) : null,
        })
      }
    }
  }

  const handleFinish = async () => {
    if (!sessionId) return
    setFinishing(true)
    await logAllSets()
    setPhase('finishing')
    setFinishing(false)
  }

  const handleFinishRequest = () => {
    const anyUndone = Object.values(exerciseSets).some(sets => sets.some(s => !s.done))
    if (anyUndone) {
      setShowFinishEarly(true)
    } else {
      handleFinish()
    }
  }

  const handleSaveOnceOff = async () => {
    if (!saveName.trim()) { setSaveError('Please enter a workout name'); return }
    setSaving(true)
    await finishSession(sessionId, saveName.trim())
    clearWorkoutData()
    await fetchSessions()
    navigate(`/history/${sessionId}`, { replace: true })
  }

  const handleSaveAsRoutine = async () => {
    if (!saveName.trim()) { setSaveError('Please enter a workout name'); return }
    setSaving(true)
    await finishSession(sessionId, saveName.trim())
    const { data: routine } = await createRoutine({ name: saveName.trim(), emoji: '' })
    if (routine && exercises.length > 0) {
      await saveRoutineExercises(routine.id, exercises.map(ex => ({
        exercise_id: ex.id,
        default_sets: 3,
        default_reps: 10,
        default_weight: 0,
      })))
    }
    clearWorkoutData()
    await fetchSessions()
    navigate(`/history/${sessionId}`, { replace: true })
  }

  const handleQuit = async () => {
    if (sessionId) await cancelSession(sessionId)
    clearWorkoutData()
    navigate('/')
  }

  const isLastExercise = exerciseIndex >= exercises.length - 1
  const doneSetsCount = inlineSets.filter(s => s.done).length
  const totalSetsCount = inlineSets.length
  const hasAnyExercise = exercises.length > 0
  const progressPct = exercises.length > 0
    ? ((exerciseIndex + (doneSetsCount / Math.max(totalSetsCount, 1))) / exercises.length) * 100
    : 0

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
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
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
          onClick={handleFinishRequest}
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

      {phase === 'logging' && hasAnyExercise && (
        <>
          {/* Exercise chip pager */}
          <div className="no-scrollbar" style={{ flexShrink: 0, padding: '8px 18px 4px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {exercises.map((ex, i) => {
                const active = i === exerciseIndex
                const done = i < exerciseIndex
                return (
                  <button
                    key={ex.id}
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
                    {ex.name}
                  </button>
                )
              })}
              <button
                onClick={() => setPhase('picking')}
                style={{
                  background: 'var(--surface-2)',
                  color: 'var(--accent)',
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
                  fontFamily: 'inherit',
                }}
              >
                <Icon name="plus" size={12} /> Add
              </button>
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
        </>
      )}

      {/* Main content */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 16px' }}>
        {phase === 'logging' && currentEx ? (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div className="eyebrow">Exercise {exerciseIndex + 1} of {exercises.length}</div>
                <div style={{
                  fontSize: 26,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  marginTop: 4,
                  color: 'var(--ink)',
                }}>
                  {currentEx.name}
                </div>
                <div style={{ marginTop: 8 }}>
                  <TypeChip type={exerciseType} />
                </div>
              </div>
            </div>

            {lastSets.length > 0 && (
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
                    <span key={i} className="mono" style={{
                      background: 'var(--bg)',
                      borderRadius: 6,
                      padding: '3px 7px',
                      fontSize: 12,
                      color: 'var(--ink-2)',
                    }}>
                      {isWeighted
                        ? `${toDisplay(s.weight)} ${unit} × ${s.reps}`
                        : exerciseType === 'run'
                        ? [s.duration_seconds != null ? `${Math.floor(s.duration_seconds / 60)}:${String(s.duration_seconds % 60).padStart(2, '0')}` : null, s.distance_metres ? `${(s.distance_metres / 1000).toFixed(1)}km` : null].filter(Boolean).join(' · ')
                        : exerciseType === 'cardio'
                        ? `${s.duration_seconds || s.reps}s`
                        : `${s.reps} reps`}
                    </span>
                  ))}
                </div>
              </div>
            )}

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

            <button className="btn btn-ghost" onClick={addInlineSet} style={{ marginTop: 12 }}>
              <Icon name="plus" size={14} /> Add set
            </button>
          </>
        ) : phase !== 'picking' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--muted)',
            fontSize: 14,
          }}>
            {exercises.length === 0 ? 'Add an exercise to get started' : 'Choose an exercise'}
          </div>
        )}
      </div>

      {/* Footer action bar */}
      {phase === 'logging' && hasAnyExercise && (
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
            onClick={goPrevExercise}
            style={{ flex: 1 }}
          >
            <Icon name="chev-l" size={14} /> Prev
          </button>
          {isLastExercise ? (
            <button
              className="btn btn-primary"
              onClick={handleFinish}
              disabled={finishing || !hasAnyExercise}
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
      )}

      {/* Exercise picker */}
      <ExerciseSearchModal
        open={phase === 'picking'}
        onClose={handleModalClose}
        onSelect={handleSelectExercise}
      />

      {/* Finishing / save sheet */}
      {phase === 'finishing' && (
        <BottomSheet open={true} onClose={() => setPhase('logging')}>
          <div style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--ink)',
            letterSpacing: '-0.01em',
            marginBottom: 16,
          }}>
            Name your workout
          </div>

          <input
            type="text"
            placeholder="Workout name"
            value={saveName}
            onChange={e => { setSaveName(e.target.value); setSaveError('') }}
            autoFocus
            style={{ marginBottom: 16 }}
          />

          {saveError && (
            <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{saveError}</div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSaveAsRoutine}
            disabled={saving}
            style={{ marginBottom: 8, opacity: saving ? 0.5 : 1 }}
          >
            {saving ? 'Saving…' : 'Save as routine'}
          </button>
          <button className="btn btn-ghost" onClick={handleSaveOnceOff} disabled={saving}>
            Save as once-off
          </button>
        </BottomSheet>
      )}

      {/* Finish early confirmation */}
      {showFinishEarly && (
        <BottomSheet open={showFinishEarly} onClose={() => setShowFinishEarly(false)}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
              Finish workout early?
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
              Some sets haven't been completed. Your ticked sets will still be saved.
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { setShowFinishEarly(false); handleFinish() }}
            disabled={finishing}
          >
            {finishing ? 'Saving…' : 'Yes, finish workout'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setShowFinishEarly(false)}
            style={{ marginTop: 8 }}
          >
            No, keep going
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => { setShowFinishEarly(false); handleQuit() }}
            style={{ marginTop: 8, color: 'var(--danger)' }}
          >
            Discard workout
          </button>
        </BottomSheet>
      )}
    </div>
  )
}
