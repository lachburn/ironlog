import { useState, useEffect } from 'react'

export default function SetLogger({ setNumber, exerciseType, initialWeight, initialReps, onComplete }) {
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

  const handleComplete = () => {
    if (isCardio) {
      const [min = 0, sec = 0] = duration.split(':').map(Number)
      onComplete({
        weight: null,
        reps: null,
        duration_seconds: min * 60 + sec,
        distance_metres: distance ? parseFloat(distance) : null,
      })
    } else if (isBodyweight) {
      onComplete({ weight: null, reps: parseInt(reps) || 0, duration_seconds: null, distance_metres: null })
    } else {
      onComplete({ weight: parseFloat(weight) || 0, reps: parseInt(reps) || 0, duration_seconds: null, distance_metres: null })
    }
  }

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
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Set {setNumber}
      </div>

      {isCardio ? (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Duration (mm:ss)</div>
            <input
              type="text"
              placeholder="0:00"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              style={{ textAlign: 'center', fontSize: 24, fontWeight: 600 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Distance (m)</div>
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
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Weight (kg)</div>
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
            <div style={{ color: 'var(--text-secondary)', paddingBottom: 14, fontSize: 18 }}>×</div>
          )}
          <div style={{ flex: isBodyweight ? 'auto' : 1, width: isBodyweight ? '100%' : undefined }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Reps</div>
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
        className="btn-primary"
        onClick={handleComplete}
        disabled={!canComplete}
        style={{ opacity: canComplete ? 1 : 0.5 }}
      >
        Complete Set ▶
      </button>
    </div>
  )
}
