import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkout } from '../hooks/useWorkout'
import { useRoutines } from '../hooks/useRoutines'
import { useHistory } from '../hooks/useHistory'
import SetLogger from '../components/SetLogger'
import ExerciseSearchModal from '../components/ExerciseSearchModal'
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

function getGraphemes(str) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter().segment(str)].map(s => s.segment)
  }
  return Array.from(str)
}

export default function FreestyleWorkout() {
  const navigate = useNavigate()
  const { startSession, finishSession, cancelSession, logSet, getLastSets } = useWorkout()
  const { createRoutine, saveRoutineExercises } = useRoutines()
  const { fetchSessions } = useHistory()

  const [sessionId, setSessionId] = useState(null)
  // 'picking' | 'logging' | 'finishing'
  const [phase, setPhase] = useState('picking')
  const [exercises, setExercises] = useState([]) // [{id, name, type}]
  const [loggedSets, setLoggedSets] = useState([])
  const [lastSets, setLastSets] = useState([])
  const [nextSetWeight, setNextSetWeight] = useState(null)
  const [nextSetReps, setNextSetReps] = useState(null)
  const [setCount, setSetCount] = useState(1)
  const [showQuit, setShowQuit] = useState(false)

  // Finishing state
  const [saveName, setSaveName] = useState('')
  const [saveEmoji, setSaveEmoji] = useState('💪')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Start session on mount
  useEffect(() => {
    startSession(null, 'Once-Off Workout').then(({ session }) => {
      if (session) setSessionId(session.id)
    })
  }, []) // eslint-disable-line

  // Current exercise is always the last in the list
  const currentEx = exercises[exercises.length - 1] || null
  const currentExId = currentEx?.id
  const exerciseType = currentEx?.type || 'weighted'
  const currentExSets = loggedSets.filter(s => s._exerciseId === currentExId)
  const hasAnySets = loggedSets.length > 0

  // Fetch last sets for new exercise when exercises list grows
  useEffect(() => {
    if (!currentEx) return
    getLastSets(currentEx.id).then(sets => {
      setLastSets(sets)
      if (sets.length > 0) {
        setNextSetWeight(sets[0].weight)
        setNextSetReps(sets[0].reps)
      } else {
        setNextSetWeight(null)
        setNextSetReps(null)
      }
    })
    setSetCount(1)
  }, [exercises.length]) // eslint-disable-line

  const handleSelectExercise = (ex) => {
    setExercises(prev => [...prev, { id: ex.id, name: ex.name, type: ex.type }])
    setPhase('logging')
  }

  const handleModalClose = () => {
    // If no exercises yet, ask to quit; otherwise go back to logging current exercise
    if (exercises.length === 0) setShowQuit(true)
    else setPhase('logging')
  }

  const handleCompleteSet = async (setData) => {
    if (!sessionId || !currentExId) return
    const set = {
      session_id: sessionId,
      exercise_id: currentExId,
      exercise_name: currentEx.name,
      exercise_type: exerciseType,
      set_number: setCount,
      ...setData,
    }
    const { data } = await logSet(set)
    setLoggedSets(prev => [...prev, { ...set, ...data, _exerciseId: currentExId }])

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

  const handleNextExercise = () => setPhase('picking')

  const handleSaveOnceOff = async () => {
    if (!saveName.trim()) { setSaveError('Please enter a workout name'); return }
    setSaving(true)
    await finishSession(sessionId, saveName.trim())
    await fetchSessions()
    navigate('/')
  }

  const handleSaveAsRoutine = async () => {
    if (!saveName.trim()) { setSaveError('Please enter a workout name'); return }
    setSaving(true)
    await finishSession(sessionId, saveName.trim())
    const { data: routine } = await createRoutine({ name: saveName.trim(), emoji: saveEmoji })
    if (routine) {
      const doneExercises = exercises.filter(ex => loggedSets.some(s => s._exerciseId === ex.id))
      if (doneExercises.length > 0) {
        await saveRoutineExercises(routine.id, doneExercises.map(ex => ({
          exercise_id: ex.id,
          default_sets: 3,
          default_reps: 10,
          default_weight: 0,
        })))
      }
    }
    await fetchSessions()
    navigate('/')
  }

  const handleQuit = async () => {
    await cancelSession(sessionId)
    navigate('/')
  }

  return (
    <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '0 16px 12px' }}>
        <div style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4px)',
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
            <div className="font-display" style={{ fontSize: 16, color: 'var(--accent)', letterSpacing: 1 }}>
              ONCE-OFF WORKOUT
            </div>
            {exercises.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Exercise {exercises.length}{currentExSets.length > 0 ? ` · ${currentExSets.length} set${currentExSets.length !== 1 ? 's' : ''}` : ''}
              </div>
            )}
          </div>
        </div>

        {phase === 'logging' && currentEx && (
          <>
            <div className="font-display" style={{ fontSize: 36, color: 'var(--text-primary)', letterSpacing: 1, lineHeight: 1, marginBottom: 6 }}>
              {currentEx.name}
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
          </>
        )}
      </div>

      {/* Scrollable middle */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 16px 12px', gap: 10, display: 'flex', flexDirection: 'column' }}>
        {phase === 'logging' && currentEx ? (
          <>
            <SetLogger
              key={`${exercises.length}-${setCount}`}
              setNumber={setCount}
              targetSets={null}
              exerciseType={exerciseType}
              initialWeight={nextSetWeight}
              initialReps={nextSetReps}
              onComplete={handleCompleteSet}
            />

            {currentExSets.length > 0 && (
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  Completed Sets
                </div>
                {currentExSets.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 0', borderBottom: '1px solid var(--border)',
                    fontSize: 13, color: 'var(--text-secondary)',
                  }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>✓</span>
                    <span>Set {s.set_number}:</span>
                    <span style={{ color: 'var(--text-primary)' }}>{formatSetDisplay(s)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : phase === 'picking' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-secondary)', fontSize: 14 }}>
            Choose an exercise to continue
          </div>
        ) : null}
      </div>

      {/* Footer */}
      {phase === 'logging' && (
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
          <button
            className="btn-primary"
            onClick={handleNextExercise}
          >
            Next Exercise →
          </button>
          <button
            className="btn-ghost"
            onClick={() => setPhase('finishing')}
            disabled={!hasAnySets}
            style={{ opacity: hasAnySets ? 1 : 0.4 }}
          >
            Finish Workout
          </button>
        </div>
      )}

      {/* Exercise picker */}
      <ExerciseSearchModal
        open={phase === 'picking'}
        onClose={handleModalClose}
        onSelect={handleSelectExercise}
      />

      {/* Finishing / save sheet */}
      <BottomSheet open={phase === 'finishing'} onClose={() => setPhase('logging')}>
        <div style={{ padding: '8px 20px 20px' }}>
          <div className="font-display" style={{ fontSize: 22, color: 'var(--text-primary)', letterSpacing: 1, marginBottom: 16 }}>
            NAME YOUR WORKOUT
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <input
              type="text"
              value={saveEmoji}
              onChange={e => {
                const segs = getGraphemes(e.target.value)
                if (segs.length > 0) setSaveEmoji(segs[segs.length - 1])
              }}
              style={{ width: 64, height: 56, fontSize: 30, textAlign: 'center', padding: 0, borderRadius: 12, flexShrink: 0 }}
            />
            <input
              type="text"
              placeholder="Workout name"
              value={saveName}
              onChange={e => { setSaveName(e.target.value); setSaveError('') }}
              autoFocus
              style={{ flex: 1 }}
            />
          </div>

          {saveError && (
            <div style={{ color: 'var(--destructive)', fontSize: 13, marginBottom: 12 }}>{saveError}</div>
          )}

          <button
            className="btn-primary"
            onClick={handleSaveAsRoutine}
            disabled={saving}
            style={{ marginBottom: 10, opacity: saving ? 0.5 : 1 }}
          >
            {saving ? 'Saving…' : 'Save as Routine'}
          </button>
          <button
            className="btn-ghost"
            onClick={handleSaveOnceOff}
            disabled={saving}
          >
            Save as Once-Off
          </button>
        </div>
      </BottomSheet>

      {/* Quit confirmation */}
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
          <button className="btn-destructive" onClick={handleQuit} style={{ marginBottom: 10 }}>
            Quit Workout
          </button>
          <button className="btn-ghost" onClick={() => setShowQuit(false)}>
            Keep Going
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
