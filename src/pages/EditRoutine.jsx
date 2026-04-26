import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoutines } from '../hooks/useRoutines'
import ExerciseSearchModal from '../components/ExerciseSearchModal'

const EMOJIS = ['💪', '🏋️', '🔥', '⚡', '🎯', '🦵', '🤸', '🏃', '🚴', '🧗', '🤼', '🥊', '🏊', '⛹️', '🧘', '🦾', '🏅', '💥', '🎽', '🩻']

const TYPE_LABELS = { weighted: 'Weighted', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight', cardio: 'Cardio' }

export default function EditRoutine() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { routines, createRoutine, updateRoutine, saveRoutineExercises, deleteRoutine } = useRoutines()
  const isNew = !id

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('💪')
  const [exercises, setExercises] = useState([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isNew && routines.length > 0) {
      const r = routines.find(r => r.id === id)
      if (r) {
        setName(r.name)
        setEmoji(r.emoji || '💪')
        setExercises(
          (r.routine_exercises || []).map(re => ({
            id: re.id,
            exercise_id: re.exercises?.id || re.exercise_id,
            name: re.exercises?.name || '',
            type: re.exercises?.type || 'weighted',
            default_sets: re.default_sets,
            default_reps: re.default_reps,
            default_weight: re.default_weight,
          }))
        )
      }
    }
  }, [id, isNew, routines])

  const handleAddExercise = (ex) => {
    setExercises(prev => [...prev, {
      exercise_id: ex.id,
      name: ex.name,
      type: ex.type,
      default_sets: 3,
      default_reps: 10,
      default_weight: 0,
    }])
  }

  const moveUp = (i) => {
    if (i === 0) return
    const next = [...exercises]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    setExercises(next)
  }

  const moveDown = (i) => {
    if (i === exercises.length - 1) return
    const next = [...exercises]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    setExercises(next)
  }

  const removeExercise = (i) => {
    setExercises(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Routine name is required'); return }
    setSaving(true)
    setError('')

    if (isNew) {
      const { data, error: err } = await createRoutine({ name: name.trim(), emoji })
      if (err) { setError(err.message); setSaving(false); return }
      if (exercises.length > 0) await saveRoutineExercises(data.id, exercises)
      navigate('/')
    } else {
      await updateRoutine(id, { name: name.trim(), emoji })
      await saveRoutineExercises(id, exercises)
      navigate('/')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this routine?')) return
    await deleteRoutine(id)
    navigate('/')
  }

  return (
    <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '56px 16px 16px',
        paddingTop: 'max(56px, calc(env(safe-area-inset-top) + 16px))',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--accent)', padding: '4px 8px', minHeight: 44 }}
        >
          ←
        </button>
        <div className="font-display" style={{ fontSize: 26, color: 'var(--text-primary)', flex: 1, letterSpacing: 1 }}>
          {isNew ? 'NEW ROUTINE' : 'EDIT ROUTINE'}
        </div>
        {!isNew && (
          <button
            onClick={handleDelete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', fontSize: 13, fontFamily: 'DM Sans', padding: '4px 8px', minHeight: 44 }}
          >
            Delete
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 16px 120px' }}>
        {/* Emoji + Name */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={{
              width: 64,
              height: 56,
              borderRadius: 12,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              fontSize: 32,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {emoji}
          </button>
          <input
            type="text"
            placeholder="Routine name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 8,
            marginBottom: 20,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 12,
          }}>
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => { setEmoji(e); setShowEmojiPicker(false) }}
                style={{
                  fontSize: 28,
                  background: emoji === e ? 'var(--accent)' : 'none',
                  border: 'none',
                  borderRadius: 10,
                  padding: 8,
                  cursor: 'pointer',
                  minHeight: 48,
                }}
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Exercises */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
            Exercises
          </div>

          {exercises.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
              No exercises yet. Add some below.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {exercises.map((ex, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '12px 12px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 500 }}>{ex.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      {TYPE_LABELS[ex.type]} · {ex.default_sets}×{ex.default_reps}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: i === 0 ? 'var(--border)' : 'var(--text-secondary)', fontSize: 16, padding: 4, minHeight: 28 }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveDown(i)}
                      disabled={i === exercises.length - 1}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: i === exercises.length - 1 ? 'var(--border)' : 'var(--text-secondary)', fontSize: 16, padding: 4, minHeight: 28 }}
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    onClick={() => removeExercise(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', fontSize: 18, padding: 4, minHeight: 44, minWidth: 36 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="btn-ghost"
          onClick={() => setShowExerciseModal(true)}
          style={{ marginBottom: 8 }}
        >
          + Add Exercise
        </button>

        {error && (
          <div style={{ color: 'var(--destructive)', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>
            {error}
          </div>
        )}
      </div>

      {/* Footer save button */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
        flexShrink: 0,
      }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Routine'}
        </button>
      </div>

      <ExerciseSearchModal
        open={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        onSelect={handleAddExercise}
        excludeIds={exercises.map(e => e.exercise_id)}
      />
    </div>
  )
}
