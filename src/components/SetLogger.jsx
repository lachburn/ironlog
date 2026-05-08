import { useState, useEffect } from 'react'
import { Icon } from './Icon'

export default function SetLogger({ setNumber, targetSets, exerciseType, initialWeight, initialReps, unit = 'kg', onComplete }) {
  const isBodyweight = exerciseType === 'bodyweight'
  const isCardio = exerciseType === 'cardio'

  const [weight, setWeight] = useState(initialWeight ?? '')
  const [reps, setReps] = useState(initialReps ?? '')
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')

  useEffect(() => {
    if (!isCardio && !isBodyweight) setWeight(initialWeight ?? '')
    setReps(initialReps ?? '')
  }, [initialWeight, initialReps, setNumber, isCardio, isBodyweight])

  const buildData = (isFailure) => {
    if (isCardio) {
      const [min = 0, sec = 0] = duration.split(':').map(Number)
      return {
        weight: null,
        reps: null,
        duration_seconds: min * 60 + sec,
        distance_metres: distance ? parseFloat(distance) : null,
        is_failure: isFailure,
      }
    }
    if (isBodyweight) {
      return { weight: null, reps: parseInt(reps) || 0, duration_seconds: null, distance_metres: null, is_failure: isFailure }
    }
    return { weight: parseFloat(weight) || 0, reps: parseInt(reps) || 0, duration_seconds: null, distance_metres: null, is_failure: isFailure }
  }

  const handleComplete = () => onComplete(buildData(false))
  const handleFailure = () => onComplete(buildData(true))

  const canComplete = isCardio
    ? duration.length > 0
    : isBodyweight
    ? reps !== ''
    : weight !== '' && reps !== ''

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--accent)',
      borderRadius: 16,
      padding: 16,
    }}>
      <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 12 }}>
        Set {setNumber}{targetSets ? ` of ${targetSets}` : ''}
      </div>

      {isCardio ? (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Duration (mm:ss)</div>
            <input
              type="text"
              placeholder="0:00"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              style={{ textAlign: 'center', fontSize: 24, fontWeight: 600 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Distance (m)</div>
            <input
              type="number"
              placeholder="—"
              value={distance}
              onChange={e => setDistance(e.target.value)}
              style={{ textAlign: 'center', fontSize: 24, fontWeight: 600 }}
            />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 14 }}>
          {!isBodyweight && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Weight ({unit})</div>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                style={{ textAlign: 'center', fontSize: 24, fontWeight: 600 }}
              />
            </div>
          )}
          {!isBodyweight && (
            <div style={{ color: 'var(--muted)', paddingBottom: 14, fontSize: 18 }}>×</div>
          )}
          <div style={{ flex: isBodyweight ? 'auto' : 1, width: isBodyweight ? '100%' : undefined }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Reps</div>
            <input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={reps}
              onChange={e => setReps(e.target.value)}
              style={{ textAlign: 'center', fontSize: 24, fontWeight: 600 }}
            />
          </div>
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleComplete}
        disabled={!canComplete}
        style={{ opacity: canComplete ? 1 : 0.5 }}
      >
        Complete set
      </button>

      <button
        onClick={handleFailure}
        disabled={!canComplete}
        style={{
          marginTop: 8,
          width: '100%',
          background: 'transparent',
          border: '1px solid var(--good)',
          borderRadius: 14,
          padding: '10px 24px',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--good)',
          cursor: canComplete ? 'pointer' : 'not-allowed',
          opacity: canComplete ? 1 : 0.35,
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontFamily: 'inherit',
          transition: 'opacity 200ms ease',
        }}
      >
        <Icon name="trophy" size={14} /> Failure
      </button>
    </div>
  )
}
