import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoutines } from '../hooks/useRoutines'
import { useWorkout } from '../hooks/useWorkout'
import SetLogger from '../components/SetLogger'
import RestTimer from '../components/RestTimer'

const TYPE_LABELS = { weighted: 'Weighted', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight', cardio: 'Cardio' }
const TYPE_COLORS = { weighted: '#C9A84C', dumbbell: '#E2C06E', bodyweight: '#4CAF50', cardio: '#2196F3' }

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export default function ActiveWorkout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { routines } = useRoutines()
  const { startSession, finishSession, logSet, getLastSets, saveProgress, getProgress } = useWorkout()

  const routine = routines.find(r => r.id === id)
  const exercises = routine?.routine_exercises || []

  const [sessionId, setSessionId] = useState(null)
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [loggedSets, setLoggedSets] = useState([])  // all sets this session
  const [lastSets, setLastSets] = useState([])
  const [showRest, setShowRest] = useState(false)
  const [nextSetWeight, setNextSetWeight] = useState(null)
  const [nextSetReps, setNextSetReps] = useState(null)
  const [setCount, setSetCount] = useState(1)
  const [finishing, setFinishing] = useState(false)
  const [startedAt] = useState(Date.now())
  const [initialized, setInitialized] = useState(false)

  const currentExercise = exercises[exerciseIndex]
  const exerciseType = currentExercise?.exercises?.type || 'weighted'

  // Initialise session on mount
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

  // Load last performance when exercise changes
  useEffect(() => {
    if (!currentExercise) return
    const exId = currentExercise.exercises?.id
    if (!exId) return

    getLastSets(exId).then(sets => {
      setLastSets(sets)
      if (sets.length > 0) {
        const last = sets[sets.length - 1]
        setNextSetWeight(last.weight)
        setNextSetReps(last.reps)
      } else {
        setNextSetWeight(currentExercise.default_weight || null)
        setNextSetReps(currentExercise.default_reps || null)
      }
    })
    setSetCount(1)
    setShowRest(false)
  }, [exerciseIndex, currentExercise]) // eslint-disable-line

  const currentExSets = loggedSets.filter(s => s._exerciseIndex === exerciseIndex)

  const handleCompleteSet = async (setData) => {
    if (!sessionId) return
    const set = {
      session_id: sessionId,
      exercise_id: currentExercise.exercises?.id,
      exercise_name: currentExercise.exercises?.name,
      exercise_type: exerciseType,
      set_number: setCount,
      ...setData,
    }
    const { data } = await logSet(set)
    const withMeta = { ...set, ...data, _exerciseIndex: exerciseIndex }
    setLoggedSets(prev => [...prev, withMeta])
    setSetCount(c => c + 1)

    // Pre-fill next set from this set
    if (setData.weight !== undefined) setNextSetWeight(setData.weight)
    if (setData.reps !== undefined) setNextSetReps(setData.reps)

    setShowRest(true)
  }

  const goNextExercise = () => {
    const nextIdx = exerciseIndex + 1
    setExerciseIndex(nextIdx)
    saveProgress(sessionId, nextIdx)
    setShowRest(false)
  }

  const handleFinish = async () => {
    if (!sessionId) return
    setFinishing(true)
    await finishSession(sessionId)
    navigate(`/history/${sessionId}`, { replace: true })
  }

  if (!routine || exercises.length === 0) {
    return (
      <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading workout…</div>
      </div>
    )
  }

  const isLastExercise = exerciseIndex >= exercises.length - 1
  const hasLoggedAtLeastOneSet = currentExSets.length > 0

  return (
    <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Progress bar header */}
      <div style={{
        paddingTop: 'max(48px, calc(env(safe-area-inset-top) + 12px))',
        padding: '12px 16px 0',
        paddingTop: 'max(48px, calc(env(safe-area-inset-top) + 12px))',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <button
            onClick={() => {
              if (confirm('Quit this workout? Progress will be lost.')) {
                navigate('/')
              }
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 22, padding: 4, minHeight: 44 }}
          >
            ✕
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Exercise {exerciseIndex + 1} of {exercises.length} · {formatDuration(Math.floor((Date.now() - startedAt) / 1000))}
            </div>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${((exerciseIndex + 1) / exercises.length) * 100}%`,
                background: 'var(--accent)',
                borderRadius: 2,
                transition: 'width 300ms ease',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 16px 120px' }}>
        {/* Exercise name */}
        <div className="font-display" style={{ fontSize: 42, color: 'var(--text-primary)', letterSpacing: 1, lineHeight: 1, marginBottom: 6 }}>
          {currentExercise.exercises?.name}
        </div>

        {/* Type badge */}
        <div style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 600,
          color: TYPE_COLORS[exerciseType] || 'var(--accent)',
          background: (TYPE_COLORS[exerciseType] || 'var(--accent)') + '22',
          padding: '4px 10px',
          borderRadius: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 20,
        }}>
          {TYPE_LABELS[exerciseType] || exerciseType}
        </div>

        {/* Last performance */}
        {lastSets.length > 0 && (
          <div className="card" style={{ padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Last Time
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: 13 }}>
              {lastSets.map(s => {
                if (s.duration_seconds) {
                  return `${formatDuration(s.duration_seconds)}${s.distance_metres ? ` · ${s.distance_metres}m` : ''}`
                }
                if (!s.weight) return `${s.reps} reps`
                return `${s.weight}kg × ${s.reps}`
              }).join('   ')}
            </div>
          </div>
        )}

        {/* Set logger */}
        <SetLogger
          key={`${exerciseIndex}-${setCount}`}
          setNumber={setCount}
          targetSets={currentExercise.default_sets || null}
          exerciseType={exerciseType}
          initialWeight={nextSetWeight}
          initialReps={nextSetReps}
          onComplete={handleCompleteSet}
        />

        {/* Rest timer */}
        {showRest && <RestTimer onDismiss={() => setShowRest(false)} />}

        {/* Completed sets this exercise */}
        {currentExSets.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Completed Sets
            </div>
            {currentExSets.map((s, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
                fontSize: 14,
                color: 'var(--text-secondary)',
              }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>✓</span>
                <span>Set {s.set_number}: </span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {s.duration_seconds
                    ? `${formatDuration(s.duration_seconds)}${s.distance_metres ? ` · ${s.distance_metres}m` : ''}`
                    : s.weight
                    ? `${s.weight}kg × ${s.reps}`
                    : `${s.reps} reps`
                  }
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {isLastExercise ? (
          <button
            className="btn-primary"
            onClick={handleFinish}
            disabled={finishing || !hasLoggedAtLeastOneSet}
            style={{ opacity: (finishing || !hasLoggedAtLeastOneSet) ? 0.5 : 1 }}
          >
            {finishing ? 'Finishing…' : 'Finish Workout 🏁'}
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={goNextExercise}
            disabled={!hasLoggedAtLeastOneSet}
            style={{ opacity: hasLoggedAtLeastOneSet ? 1 : 0.5 }}
          >
            Next Exercise →
          </button>
        )}
        <button
          className="btn-ghost"
          onClick={isLastExercise ? handleFinish : goNextExercise}
        >
          {isLastExercise ? 'Finish without logging' : 'Skip Exercise'}
        </button>
      </div>
    </div>
  )
}
