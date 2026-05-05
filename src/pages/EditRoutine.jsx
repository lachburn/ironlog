import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoutines } from '../hooks/useRoutines'
import ExerciseSearchModal from '../components/ExerciseSearchModal'
import BottomSheet from '../components/BottomSheet'

const TYPE_LABELS = { weighted: 'Weighted', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight', cardio: 'Cardio' }

function getGraphemes(str) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter().segment(str)].map(s => s.segment)
  }
  return Array.from(str)
}

export default function EditRoutine() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { routines, createRoutine, updateRoutine, saveRoutineExercises, deleteRoutine } = useRoutines()
  const isNew = !id

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('💪')
  const [exercises, setExercises] = useState([])
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [configuringExercise, setConfiguringExercise] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteSheet, setShowDeleteSheet] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  // Called when user picks an exercise from the search modal
  const handleAddExercise = (ex) => {
    setShowExerciseModal(false)
    setConfiguringExercise({
      exercise: { id: ex.id, name: ex.name, type: ex.type },
      editIndex: null,
      sets: '3',
      reps: '10',
      weight: (ex.type === 'weighted' || ex.type === 'dumbbell') ? '0' : null,
    })
  }

  // Called when user taps subtitle on an existing row
  const handleEditDefaults = (i) => {
    const ex = exercises[i]
    setConfiguringExercise({
      exercise: { id: ex.exercise_id, name: ex.name, type: ex.type },
      editIndex: i,
      sets: String(ex.default_sets ?? 3),
      reps: String(ex.default_reps ?? 10),
      weight: (ex.type === 'weighted' || ex.type === 'dumbbell')
        ? String(ex.default_weight ?? 0)
        : null,
    })
  }

  const handleConfigConfirm = () => {
    const { exercise, editIndex, sets, reps, weight } = configuringExercise
    const entry = {
      exercise_id: exercise.id,
      name: exercise.name,
      type: exercise.type,
      default_sets: Math.max(1, parseInt(sets) || 1),
      default_reps: Math.max(1, parseInt(reps) || 1),
      default_weight: weight !== null ? parseFloat(weight) || 0 : 0,
    }
    if (editIndex === null) {
      setExercises(prev => [...prev, entry])
    } else {
      setExercises(prev => prev.map((e, i) =>
        i === editIndex ? { ...e, ...entry } : e
      ))
    }
    setConfiguringExercise(null)
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
    setDeleting(true)
    await deleteRoutine(id)
    navigate('/')
  }

  const cfgType = configuringExercise?.exercise?.type
  const cfgIsCardio = cfgType === 'cardio'
  const cfgShowWeight = cfgType === 'weighted' || cfgType === 'dumbbell'

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
            onClick={() => setShowDeleteSheet(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', padding: '4px 8px', minHeight: 44, display: 'flex', alignItems: 'center' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 16px 120px' }}>
        {/* Emoji input + Name */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>ICON</div>
            <input
              type="text"
              value={emoji}
              onChange={e => {
                const val = e.target.value
                if (!val) return
                const segs = getGraphemes(val)
                if (segs.length > 0) setEmoji(segs[segs.length - 1])
              }}
              style={{
                width: 64,
                height: 56,
                borderRadius: 12,
                fontSize: 30,
                textAlign: 'center',
                padding: 0,
                lineHeight: '56px',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>NAME</div>
            <input
              type="text"
              placeholder="Routine name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
        </div>

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
                    <button
                      onClick={() => handleEditDefaults(i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: 'var(--accent)',
                        fontSize: 12,
                        fontFamily: 'DM Sans',
                        textAlign: 'left',
                        marginTop: 2,
                      }}
                    >
                      {TYPE_LABELS[ex.type]} · {ex.default_sets} sets × {ex.default_reps} reps
                      {ex.default_weight > 0 ? ` @ ${ex.default_weight}kg` : ''} ✎
                    </button>
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

      {/* Delete confirmation sheet */}
      <BottomSheet open={showDeleteSheet} onClose={() => !deleting && setShowDeleteSheet(false)}>
        <div style={{ padding: '8px 20px 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Delete "{name}"?
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              This will permanently delete the routine. Your workout history will not be affected.
            </div>
          </div>
          <button
            className="btn-destructive"
            onClick={handleDelete}
            disabled={deleting}
            style={{ marginBottom: 10, opacity: deleting ? 0.5 : 1 }}
          >
            {deleting ? 'Deleting…' : 'Delete Routine'}
          </button>
          <button className="btn-ghost" onClick={() => setShowDeleteSheet(false)} disabled={deleting}>
            Cancel
          </button>
        </div>
      </BottomSheet>

      {/* Exercise defaults config sheet */}
      <BottomSheet
        open={!!configuringExercise}
        onClose={() => setConfiguringExercise(null)}
        title={configuringExercise?.editIndex === null ? 'Set Defaults' : 'Edit Defaults'}
      >
        {configuringExercise && (
          <div style={{ padding: '8px 20px 20px' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 16 }}>
                {configuringExercise.exercise.name}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                {TYPE_LABELS[configuringExercise.exercise.type] || configuringExercise.exercise.type}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>
                  SETS
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={configuringExercise.sets}
                  onChange={e => setConfiguringExercise(prev => ({ ...prev, sets: e.target.value }))}
                  style={{ textAlign: 'center', fontSize: 22, fontWeight: 600 }}
                />
              </div>

              {!cfgIsCardio && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>
                    REPS
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={configuringExercise.reps}
                    onChange={e => setConfiguringExercise(prev => ({ ...prev, reps: e.target.value }))}
                    style={{ textAlign: 'center', fontSize: 22, fontWeight: 600 }}
                  />
                </div>
              )}

              {cfgShowWeight && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>
                    WEIGHT (KG)
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={configuringExercise.weight}
                    onChange={e => setConfiguringExercise(prev => ({ ...prev, weight: e.target.value }))}
                    style={{ textAlign: 'center', fontSize: 22, fontWeight: 600 }}
                  />
                </div>
              )}
            </div>

            <button className="btn-primary" onClick={handleConfigConfirm}>
              {configuringExercise.editIndex === null ? 'Add Exercise' : 'Save Changes'}
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
