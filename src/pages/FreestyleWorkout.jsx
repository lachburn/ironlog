import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkout } from '../hooks/useWorkout'
import { useRoutines } from '../hooks/useRoutines'
import { useHistory } from '../hooks/useHistory'
import SetLogger from '../components/SetLogger'
import ExerciseSearchModal from '../components/ExerciseSearchModal'
import BottomSheet from '../components/BottomSheet'
import { Icon } from '../components/Icon'

const TYPE_LABELS = { weighted: 'Weighted', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight', cardio: 'Cardio' }

function formatSetDisplay(s) {
  if (s.duration_seconds) {
    const m = Math.floor(s.duration_seconds / 60)
    const sec = s.duration_seconds % 60
    return `${m}m ${sec}s${s.distance_metres ? ` · ${s.distance_metres}m` : ''}`
  }
  if (!s.weight) return `${s.reps} reps`
  return `${s.weight}kg × ${s.reps}`
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

export default function FreestyleWorkout() {
  const navigate = useNavigate()
  const { startSession, finishSession, cancelSession, logSet, getLastSets } = useWorkout()
  const { createRoutine, saveRoutineExercises } = useRoutines()
  const { fetchSessions } = useHistory()

  const [sessionId, setSessionId] = useState(null)
  const [phase, setPhase] = useState('picking') // 'picking' | 'logging' | 'finishing'
  const [exercises, setExercises] = useState([])
  const [loggedSets, setLoggedSets] = useState([])
  const [lastSets, setLastSets] = useState([])
  const [nextSetWeight, setNextSetWeight] = useState(null)
  const [nextSetReps, setNextSetReps] = useState(null)
  const [setCount, setSetCount] = useState(1)
  const [showQuit, setShowQuit] = useState(false)
  const selectingRef = useRef(false)

  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    startSession(null, 'Once-Off Workout').then(({ session }) => {
      if (session) setSessionId(session.id)
    })
  }, []) // eslint-disable-line

  const currentEx = exercises[exercises.length - 1] || null
  const currentExId = currentEx?.id
  const exerciseType = currentEx?.type || 'weighted'
  const currentExSets = loggedSets.filter(s => s._exerciseId === currentExId)
  const hasAnySets = loggedSets.length > 0

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
    selectingRef.current = true
    setExercises(prev => [...prev, { id: ex.id, name: ex.name, type: ex.type }])
    setPhase('logging')
  }

  const handleModalClose = () => {
    if (selectingRef.current) {
      selectingRef.current = false
      return
    }
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
    const { data: routine } = await createRoutine({ name: saveName.trim(), emoji: '' })
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
    <div style={{
      background: 'var(--bg)',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '8px 18px 12px' }}>
        <div style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4px)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 10,
        }}>
          <button
            onClick={() => setShowQuit(true)}
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
            <Icon name="x" size={14} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', letterSpacing: '-0.01em' }}>
              Once-off workout
            </div>
            {exercises.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Exercise {exercises.length}
                {currentExSets.length > 0 ? ` · ${currentExSets.length} set${currentExSets.length !== 1 ? 's' : ''}` : ''}
              </div>
            )}
          </div>
        </div>

        {phase === 'logging' && currentEx && (
          <>
            <div style={{
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: 6,
              color: 'var(--ink)',
            }}>
              {currentEx.name}
            </div>
            <TypeChip type={exerciseType} />
          </>
        )}
      </div>

      {/* Scrollable middle */}
      <div className="no-scrollbar" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 18px 12px',
        gap: 10,
        display: 'flex',
        flexDirection: 'column',
      }}>
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
                <div className="eyebrow" style={{ marginBottom: 6 }}>Completed sets</div>
                {currentExSets.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 0',
                      borderBottom: '1px solid var(--border)',
                      fontSize: 13,
                      color: 'var(--muted)',
                    }}
                  >
                    <Icon name="check" size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <span>Set {s.set_number}:</span>
                    <span style={{ color: 'var(--ink)' }}>{formatSetDisplay(s)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : phase === 'picking' ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            color: 'var(--muted)',
            fontSize: 14,
          }}>
            Choose an exercise to continue
          </div>
        ) : null}
      </div>

      {/* Footer */}
      {phase === 'logging' && (
        <div style={{
          padding: '12px 18px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <button className="btn btn-primary" onClick={() => setPhase('picking')}>
            Next exercise <Icon name="chev-r" size={14} />
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setPhase('finishing')}
            disabled={!hasAnySets}
            style={{ opacity: hasAnySets ? 1 : 0.4 }}
          >
            Finish workout
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
          <button
            className="btn btn-ghost"
            onClick={handleSaveOnceOff}
            disabled={saving}
          >
            Save as once-off
          </button>
        </BottomSheet>
      )}

      {/* Quit confirmation */}
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
