import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoutines } from '../hooks/useRoutines'
import { useWorkout } from '../hooks/useWorkout'
import SetLogger from '../components/SetLogger'
import BottomSheet from '../components/BottomSheet'

const TYPE_LABELS = { weighted: 'Weighted', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight', cardio: 'Cardio' }
const TYPE_COLORS = { weighted: '#C9A84C', dumbbell: '#E2C06E', bodyweight: '#4CAF50', cardio: '#2196F3' }

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function formatSetDisplay(s) {
  if (s.duration_seconds) {
    return `${formatDuration(s.duration_seconds)}${s.distance_metres ? ` · ${s.distance_metres}m` : ''}`
  }
  if (!s.weight) return `${s.reps} reps`
  return `${s.weight}kg × ${s.reps}`
}

export default function ActiveWorkout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { routines } = useRoutines()
  const { startSession, finishSession, cancelSession, logSet, getLastSets, saveProgress, getProgress } = useWorkout()

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
  const [keepAwake, setKeepAwake] = useState(false)
  const wakeLockRef = useRef(null)

  // Superset state
  const [supersetState, setSupersetState] = useState(null)
  const [showSupersetPicker, setShowSupersetPicker] = useState(false)
  const [supersetSelections, setSupersetSelections] = useState([]) // indices, max 2

  const acquireWakeLock = async () => {
    if (!('wakeLock' in navigator)) return
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen')
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null
      })
    } catch {
      setKeepAwake(false)
    }
  }

  const toggleKeepAwake = async () => {
    if (keepAwake) {
      wakeLockRef.current?.release()
      wakeLockRef.current = null
      setKeepAwake(false)
    } else {
      await acquireWakeLock()
      setKeepAwake(true)
    }
  }

  useEffect(() => {
    const handleVisibility = () => {
      if (keepAwake && document.visibilityState === 'visible' && !wakeLockRef.current) {
        acquireWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [keepAwake])

  useEffect(() => {
    return () => { wakeLockRef.current?.release() }
  }, [])

  useEffect(() => {
    if (exerciseQueue === null && exercises.length > 0) {
      setExerciseQueue([...exercises])
    }
  }, [exercises.length]) // eslint-disable-line

  const queue = exerciseQueue || exercises
  const currentExercise = queue[exerciseIndex]
  const exerciseType = currentExercise?.exercises?.type || 'weighted'

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
  }, [exerciseIndex, currentExercise]) // eslint-disable-line

  const currentExId = currentExercise?.exercises?.id
  const currentExSets = loggedSets.filter(s => s._exerciseId === currentExId)
  const targetSets = currentExercise?.default_sets || null
  const effectiveTarget = (targetSets || 0) + bonusSets
  const allSetsComplete = targetSets !== null && currentExSets.length >= effectiveTarget

  const handleCompleteSet = async (setData) => {
    if (!sessionId) return
    const set = {
      session_id: sessionId,
      exercise_id: currentExId,
      exercise_name: currentExercise.exercises?.name,
      exercise_type: exerciseType,
      set_number: setCount,
      ...setData,
    }
    const { data } = await logSet(set)
    const withMeta = { ...set, ...data, _exerciseId: currentExId }
    setLoggedSets(prev => [...prev, withMeta])

    const nextLastSet = lastSets[setCount]
    if (nextLastSet) {
      setNextSetWeight(nextLastSet.weight ?? setData.weight)
      setNextSetReps(nextLastSet.reps ?? setData.reps)
    } else {
      if (setData.weight !== undefined) setNextSetWeight(setData.weight)
      if (setData.reps !== undefined) setNextSetReps(setData.reps)
    }

    setSetCount(c => c + 1)
  }

  const handleSupersetCompleteSet = async (setData) => {
    if (!sessionId) return
    const ss = supersetState
    const isLegA = ss.leg === 'A'
    const activeEx = isLegA ? ss.exA : ss.exB
    const activeSetCount = isLegA ? ss.setCountA : ss.setCountB

    const set = {
      session_id: sessionId,
      exercise_id: activeEx.exercises.id,
      exercise_name: activeEx.exercises.name,
      exercise_type: activeEx.exercises.type,
      set_number: activeSetCount + 1,
      ...setData,
    }
    const { data } = await logSet(set)
    const withMeta = { ...set, ...data, _exerciseId: activeEx.exercises.id }
    setLoggedSets(prev => [...prev, withMeta])

    const newSetCount = activeSetCount + 1
    const lastSetsForLeg = isLegA ? ss.lastSetsA : ss.lastSetsB
    const nextLastSet = lastSetsForLeg[newSetCount]
    const nextWeight = nextLastSet ? (nextLastSet.weight ?? setData.weight) : setData.weight
    const nextReps = nextLastSet ? (nextLastSet.reps ?? setData.reps) : setData.reps

    const nextLeg = isLegA ? 'B' : 'A'

    setSupersetState(prev => ({
      ...prev,
      leg: nextLeg,
      setCountA: isLegA ? newSetCount : prev.setCountA,
      setCountB: isLegA ? prev.setCountB : newSetCount,
      nextWeightA: isLegA ? nextWeight : prev.nextWeightA,
      nextRepsA: isLegA ? nextReps : prev.nextRepsA,
      nextWeightB: isLegA ? prev.nextWeightB : nextWeight,
      nextRepsB: isLegA ? prev.nextRepsB : nextReps,
    }))
  }

  const goNextExercise = () => {
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
    await finishSession(sessionId)
    navigate(`/history/${sessionId}`, { replace: true })
  }

  const exitSuperset = () => {
    if (!supersetState) return
    const { idxA, idxB } = supersetState
    const nextIdx = Math.max(idxA, idxB) + 1
    setSupersetState(null)
    setSupersetSelections([])
    if (nextIdx >= queue.length) {
      handleFinish()
    } else {
      setExerciseIndex(nextIdx)
      saveProgress(sessionId, nextIdx)
      setBonusSets(0)
    }
  }

  const startSuperset = async () => {
    if (supersetSelections.length < 2) return
    const [idxA, idxB] = supersetSelections
    const exA = queue[idxA]
    const exB = queue[idxB]

    const [setsA, setsB] = await Promise.all([
      getLastSets(exA.exercises.id),
      getLastSets(exB.exercises.id),
    ])

    const nextWeightA = setsA.length > 0 ? setsA[0].weight : (exA.default_weight || null)
    const nextRepsA = setsA.length > 0 ? setsA[0].reps : (exA.default_reps || null)
    const nextWeightB = setsB.length > 0 ? setsB[0].weight : (exB.default_weight || null)
    const nextRepsB = setsB.length > 0 ? setsB[0].reps : (exB.default_reps || null)

    setSupersetState({
      idxA,
      idxB,
      exA,
      exB,
      leg: 'A',
      setCountA: 0,
      setCountB: 0,
      bonusRounds: 0,
      lastSetsA: setsA,
      lastSetsB: setsB,
      nextWeightA,
      nextRepsA,
      nextWeightB,
      nextRepsB,
    })
    setShowSupersetPicker(false)
    setSupersetSelections([])
  }

  const handleSupersetPickerSelect = (idx) => {
    setSupersetSelections(prev => {
      if (prev.includes(idx)) {
        return prev.filter(i => i !== idx)
      }
      if (prev.length >= 2) {
        return [prev[1], idx]
      }
      return [...prev, idx]
    })
  }

  if (!routine || queue.length === 0) {
    return (
      <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading workout…</div>
      </div>
    )
  }

  const isLastExercise = exerciseIndex >= queue.length - 1
  const hasLoggedAtLeastOneSet = currentExSets.length > 0
  const remainingExercises = queue.length - exerciseIndex
  const canStartSuperset = remainingExercises >= 2 && !supersetState

  // ── Superset active render ──
  if (supersetState) {
    const ss = supersetState
    const activeEx = ss.leg === 'A' ? ss.exA : ss.exB
    const otherEx = ss.leg === 'A' ? ss.exB : ss.exA
    const activeType = activeEx.exercises?.type || 'weighted'
    const activeSetCount = ss.leg === 'A' ? ss.setCountA : ss.setCountB
    const targetSetsA = ss.exA.default_sets || 3
    const targetSetsB = ss.exB.default_sets || 3
    const effectiveTargetA = targetSetsA + ss.bonusRounds
    const effectiveTargetB = targetSetsB + ss.bonusRounds
    const effectiveTargetActive = ss.leg === 'A' ? effectiveTargetA : effectiveTargetB
    const bothComplete = ss.setCountA >= effectiveTargetA && ss.setCountB >= effectiveTargetB

    const activeInitialWeight = ss.leg === 'A' ? ss.nextWeightA : ss.nextWeightB
    const activeInitialReps = ss.leg === 'A' ? ss.nextRepsA : ss.nextRepsB

    const setsForA = loggedSets.filter(s => s._exerciseId === ss.exA.exercises.id)
    const setsForB = loggedSets.filter(s => s._exerciseId === ss.exB.exercises.id)

    const ssIsAtEnd = Math.max(ss.idxA, ss.idxB) >= queue.length - 1

    return (
      <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Top: progress bar + superset info ── */}
        <div style={{ flexShrink: 0, padding: '0 16px 12px' }}>
          <div style={{
            paddingTop: 'calc(env(safe-area-inset-top) + 4px)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 10,
          }}>
            <button
              onClick={() => setShowQuit(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 22, padding: 4, minHeight: 44 }}
            >
              ✕
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>
                Exercise {ss.idxA + 1}–{ss.idxB + 1} of {queue.length}
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${((Math.min(ss.idxA, ss.idxB) + 1) / queue.length) * 100}%`,
                  background: 'var(--accent)',
                  borderRadius: 2,
                  transition: 'width 300ms ease',
                }} />
              </div>
            </div>

            {/* Wake lock toggle */}
            <button
              onClick={toggleKeepAwake}
              aria-label={keepAwake ? 'Screen stay-on: on' : 'Screen stay-on: off'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, minHeight: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
            >
              <div style={{
                width: 44,
                height: 26,
                borderRadius: 13,
                background: keepAwake ? '#C9A84C' : 'rgba(255,255,255,0.15)',
                position: 'relative',
                transition: 'background 250ms ease',
                flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute',
                  top: 3,
                  left: keepAwake ? 21 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  transition: 'left 250ms ease',
                }} />
              </div>
              <span style={{ fontSize: 9, color: keepAwake ? '#C9A84C' : 'var(--text-secondary)', fontWeight: 600, letterSpacing: 0.3, transition: 'color 250ms ease' }}>
                AWAKE
              </span>
            </button>
          </div>

          {/* Superset badge */}
          <div style={{
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 700,
            color: '#C9A84C',
            background: '#C9A84C22',
            padding: '3px 10px',
            borderRadius: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 6,
          }}>
            ⚡ Superset
          </div>

          <div className="font-display" style={{ fontSize: 36, color: 'var(--text-primary)', letterSpacing: 1, lineHeight: 1, marginBottom: 4 }}>
            {activeEx.exercises?.name}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Next: {otherEx.exercises?.name}
          </div>

          <div style={{
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 600,
            color: TYPE_COLORS[activeType] || 'var(--accent)',
            background: (TYPE_COLORS[activeType] || 'var(--accent)') + '22',
            padding: '3px 10px',
            borderRadius: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 4,
          }}>
            {TYPE_LABELS[activeType] || activeType}
          </div>
        </div>

        {/* ── Middle: set logger + completed sets (scrollable) ── */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column', padding: '0 16px 12px', gap: 10 }}>

          {bothComplete ? (
            <>
              <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--accent)', fontSize: 18 }}>✓</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                    Superset Complete ✓
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {effectiveTargetA} rounds completed
                  </div>
                </div>
              </div>
              <button
                className="btn-ghost"
                onClick={() => setSupersetState(prev => ({ ...prev, bonusRounds: prev.bonusRounds + 1 }))}
              >
                + Add Set
              </button>
            </>
          ) : (
            <SetLogger
              key={`ss-${ss.leg}-${activeSetCount}`}
              setNumber={activeSetCount + 1}
              targetSets={effectiveTargetActive}
              exerciseType={activeType}
              initialWeight={activeInitialWeight}
              initialReps={activeInitialReps}
              onComplete={handleSupersetCompleteSet}
            />
          )}

          {/* Completed sets for both exercises */}
          {setsForA.length > 0 && (
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                {ss.exA.exercises?.name} — Completed Sets
              </div>
              <div>
                {setsForA.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 0',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                  }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>✓</span>
                    <span>Set {s.set_number}:</span>
                    <span style={{ color: 'var(--text-primary)' }}>{formatSetDisplay(s)}</span>
                    {s.is_failure && <span style={{ color: '#4CAF50', fontSize: 14, flexShrink: 0 }}>⚡</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {setsForB.length > 0 && (
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                {ss.exB.exercises?.name} — Completed Sets
              </div>
              <div>
                {setsForB.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 0',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                  }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>✓</span>
                    <span>Set {s.set_number}:</span>
                    <span style={{ color: 'var(--text-primary)' }}>{formatSetDisplay(s)}</span>
                    {s.is_failure && <span style={{ color: '#4CAF50', fontSize: 14, flexShrink: 0 }}>⚡</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Quit confirmation ── */}
        <BottomSheet open={showQuit} onClose={() => setShowQuit(false)}>
          <div style={{ padding: '8px 20px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛑</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Quit workout?
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Your progress will be lost.
              </div>
            </div>
            <button
              className="btn-destructive"
              onClick={async () => { await cancelSession(sessionId); navigate('/') }}
              style={{ marginBottom: 10 }}
            >
              Quit Workout
            </button>
            <button className="btn-ghost" onClick={() => setShowQuit(false)}>
              Keep Going
            </button>
          </div>
        </BottomSheet>

        {/* ── Footer actions ── */}
        <div style={{
          padding: '12px 16px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {bothComplete && (
            <button
              className="btn-primary"
              onClick={exitSuperset}
              disabled={finishing}
              style={{ opacity: finishing ? 0.5 : 1 }}
            >
              {finishing ? 'Finishing…' : ssIsAtEnd ? 'Finish Workout' : 'Continue →'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Normal (non-superset) render ──
  return (
    <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Top: progress bar + exercise info ── */}
      <div style={{ flexShrink: 0, padding: '0 16px 12px' }}>
        <div style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 4px)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 10,
        }}>
          <button
            onClick={() => setShowQuit(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 22, padding: 4, minHeight: 44 }}
          >
            ✕
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>
              Exercise {exerciseIndex + 1} of {queue.length}
            </div>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${((exerciseIndex + 1) / queue.length) * 100}%`,
                background: 'var(--accent)',
                borderRadius: 2,
                transition: 'width 300ms ease',
              }} />
            </div>
          </div>

          {/* Wake lock toggle */}
          <button
            onClick={toggleKeepAwake}
            aria-label={keepAwake ? 'Screen stay-on: on' : 'Screen stay-on: off'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, minHeight: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
          >
            <div style={{
              width: 44,
              height: 26,
              borderRadius: 13,
              background: keepAwake ? '#C9A84C' : 'rgba(255,255,255,0.15)',
              position: 'relative',
              transition: 'background 250ms ease',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute',
                top: 3,
                left: keepAwake ? 21 : 3,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                transition: 'left 250ms ease',
              }} />
            </div>
            <span style={{ fontSize: 9, color: keepAwake ? '#C9A84C' : 'var(--text-secondary)', fontWeight: 600, letterSpacing: 0.3, transition: 'color 250ms ease' }}>
              AWAKE
            </span>
          </button>
        </div>

        <div className="font-display" style={{ fontSize: 36, color: 'var(--text-primary)', letterSpacing: 1, lineHeight: 1, marginBottom: 6 }}>
          {currentExercise.exercises?.name}
        </div>

        <div style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 600,
          color: TYPE_COLORS[exerciseType] || 'var(--accent)',
          background: (TYPE_COLORS[exerciseType] || 'var(--accent)') + '22',
          padding: '3px 10px',
          borderRadius: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        }}>
          {TYPE_LABELS[exerciseType] || exerciseType}
        </div>

      </div>

      {/* ── Middle: set logger + completed sets (scrollable) ── */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column', padding: '0 16px 12px', gap: 10 }}>

        {allSetsComplete ? (
          <>
            <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--accent)', fontSize: 18 }}>✓</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>All {effectiveTarget} sets complete</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Proceed to the next exercise</div>
              </div>
            </div>
            <button
              className="btn-ghost"
              onClick={() => setBonusSets(b => b + 1)}
            >
              + Add Set
            </button>
          </>
        ) : (
          <SetLogger
            key={`${exerciseIndex}-${setCount}`}
            setNumber={setCount}
            targetSets={effectiveTarget}
            exerciseType={exerciseType}
            initialWeight={nextSetWeight}
            initialReps={nextSetReps}
            onComplete={handleCompleteSet}
          />
        )}

        {currentExSets.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Completed Sets
            </div>
            <div>
              {currentExSets.map((s, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>✓</span>
                  <span>Set {s.set_number}:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatSetDisplay(s)}</span>
                  {s.is_failure && <span style={{ color: '#4CAF50', fontSize: 14, flexShrink: 0 }}>⚡</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Quit confirmation ── */}
      <BottomSheet open={showQuit} onClose={() => setShowQuit(false)}>
        <div style={{ padding: '8px 20px 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛑</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Quit workout?
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Your progress will be lost.
            </div>
          </div>
          <button
            className="btn-destructive"
            onClick={async () => { await cancelSession(sessionId); navigate('/') }}
            style={{ marginBottom: 10 }}
          >
            Quit Workout
          </button>
          <button className="btn-ghost" onClick={() => setShowQuit(false)}>
            Keep Going
          </button>
        </div>
      </BottomSheet>

      {/* ── Superset picker sheet ── */}
      <BottomSheet
        open={showSupersetPicker}
        onClose={() => { setShowSupersetPicker(false); setSupersetSelections([]) }}
        title="Choose Superset Exercises"
      >
        <div style={{ padding: '12px 20px' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Select 2 exercises to interleave set-by-set.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {queue.slice(exerciseIndex).map((ex, relIdx) => {
              const absIdx = exerciseIndex + relIdx
              const exType = ex.exercises?.type || 'weighted'
              const isSelected = supersetSelections.includes(absIdx)
              const selectionOrder = supersetSelections.indexOf(absIdx)
              return (
                <button
                  key={absIdx}
                  onClick={() => handleSupersetPickerSelect(absIdx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: isSelected ? '2px solid #C9A84C' : '1px solid var(--border)',
                    background: isSelected ? '#C9A84C11' : 'var(--surface)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 150ms ease, background 150ms ease',
                    minHeight: 52,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {ex.exercises?.name}
                    </div>
                    <div style={{
                      display: 'inline-block',
                      fontSize: 10,
                      fontWeight: 600,
                      color: TYPE_COLORS[exType] || 'var(--accent)',
                      background: (TYPE_COLORS[exType] || 'var(--accent)') + '22',
                      padding: '2px 8px',
                      borderRadius: 6,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginTop: 4,
                    }}>
                      {TYPE_LABELS[exType] || exType}
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#C9A84C',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#000',
                    }}>
                      {selectionOrder === 0 ? 'A' : 'B'}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          {supersetSelections.length === 2 && (
            <button
              className="btn-primary"
              onClick={startSuperset}
            >
              Start Superset →
            </button>
          )}
        </div>
      </BottomSheet>

      {/* ── Footer actions ── */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {isLastExercise ? (
          <>
            <button
              className="btn-primary"
              onClick={handleFinish}
              disabled={finishing || !hasLoggedAtLeastOneSet}
              style={{ opacity: (finishing || !hasLoggedAtLeastOneSet) ? 0.5 : 1 }}
            >
              {finishing ? 'Finishing…' : 'Finish Workout'}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" onClick={handleFinish} style={{ flex: 1 }}>
                Skip &amp; Finish
              </button>
              <button className="btn-ghost" onClick={handleDoLater} style={{ flex: 1 }}>
                Do Later
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              className="btn-primary"
              onClick={goNextExercise}
              disabled={!hasLoggedAtLeastOneSet}
              style={{ opacity: hasLoggedAtLeastOneSet ? 1 : 0.5 }}
            >
              Next Exercise →
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" onClick={goNextExercise} style={{ flex: 1 }}>
                Skip Exercise
              </button>
              <button className="btn-ghost" onClick={handleDoLater} style={{ flex: 1 }}>
                Do Later
              </button>
            </div>
          </>
        )}

        {/* ── Superset pill ── */}
        {canStartSuperset && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setShowSupersetPicker(true)}
              style={{
                background: 'transparent',
                border: '1px solid #C9A84C',
                borderRadius: 20,
                padding: '5px 16px',
                fontSize: 12,
                fontWeight: 600,
                color: '#C9A84C',
                cursor: 'pointer',
                letterSpacing: 0.3,
                minHeight: 32,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'background 150ms ease',
              }}
            >
              ⚡ Superset
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
