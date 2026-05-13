import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoutines } from '../hooks/useRoutines'
import ExerciseSearchModal from '../components/ExerciseSearchModal'
import BottomSheet from '../components/BottomSheet'
import { Icon } from '../components/Icon'

const TYPE_LABELS = { weighted: 'Weighted', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight', cardio: 'Cardio', run: 'Run' }

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

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

function Mini({ label, value, set, decimal }) {
  return (
    <div style={{ flex: 1, background: 'var(--bg-deep)', borderRadius: 10, padding: '8px 10px' }}>
      <div className="eyebrow" style={{ fontSize: 9 }}>{label}</div>
      <input
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        value={value}
        onChange={e => set(e.target.value)}
        onFocus={e => e.target.select()}
        className="mono"
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          color: 'var(--ink)',
          fontSize: 17,
          fontWeight: 600,
          padding: 0,
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}

export default function EditRoutine() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { routines, createRoutine, updateRoutine, saveRoutineExercises, deleteRoutine } = useRoutines()
  const isNew = !id

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
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
        setEmoji(r.emoji || '')
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
    setShowExerciseModal(false)
    setConfiguringExercise({
      exercise: { id: ex.id, name: ex.name, type: ex.type },
      editIndex: null,
      sets: '3',
      reps: '10',
      weight: (ex.type === 'weighted' || ex.type === 'dumbbell') ? '0' : null,
    })
  }

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
      setExercises(prev => prev.map((e, i) => i === editIndex ? { ...e, ...entry } : e))
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
      const { data, error: err } = await createRoutine({ name: name.trim(), emoji: emoji.trim() })
      if (err) { setError(err.message); setSaving(false); return }
      if (exercises.length > 0) await saveRoutineExercises(data.id, exercises)
      navigate('/')
    } else {
      await updateRoutine(id, { name: name.trim(), emoji: emoji.trim() })
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
  const cfgIsRun = cfgType === 'run'
  const cfgShowWeight = cfgType === 'weighted' || cfgType === 'dumbbell'

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
      <div style={{ flexShrink: 0, padding: '8px 18px 8px', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 44, gap: 10 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink)',
              fontSize: 14,
              padding: '6px 4px',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <div style={{
            flex: 1,
            textAlign: 'center',
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: '-0.01em',
            color: 'var(--ink)',
          }}>
            {isNew ? 'New routine' : 'Edit routine'}
          </div>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !exercises.length}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink)',
              fontSize: 14,
              fontWeight: 600,
              padding: '6px 4px',
              opacity: name.trim() && exercises.length ? 1 : 0.4,
              fontFamily: 'inherit',
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 18px 24px' }}>
        {/* Emoji + Name row */}
        <Field label="Routine name">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => setShowEmojiPicker(true)}
              style={{
                width: 48, height: 48, borderRadius: 13, flexShrink: 0,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                cursor: 'pointer', fontSize: 24, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {emoji || <span style={{ fontSize: 18, color: 'var(--muted)' }}>🏷️</span>}
            </button>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Push Day"
              style={{ flex: 1 }}
            />
          </div>
        </Field>

        {/* Exercises header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          marginTop: 4,
        }}>
          <div className="eyebrow">Exercises</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{exercises.length}</div>
        </div>

        {exercises.length === 0 && (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            borderRadius: 14,
            border: '1px dashed var(--border-2)',
            color: 'var(--muted)',
            fontSize: 13,
            marginBottom: 12,
          }}>
            No exercises yet. Add one below.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {exercises.map((re, i) => {
            const isW = re.type === 'weighted' || re.type === 'dumbbell'
            return (
              <div key={i} className="card" style={{ padding: '12px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>{re.name}</div>
                    <div style={{ marginTop: 4 }}>
                      <TypeChip type={re.type} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: i === 0 ? 'var(--faint)' : 'var(--ink-2)',
                        width: 32, height: 32, borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      <Icon name="chev-up" size={14} />
                    </button>
                    <button
                      onClick={() => moveDown(i)}
                      disabled={i === exercises.length - 1}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: i === exercises.length - 1 ? 'var(--faint)' : 'var(--ink-2)',
                        width: 32, height: 32, borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      <Icon name="chev-down" size={14} />
                    </button>
                    <button
                      onClick={() => removeExercise(i)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--muted)',
                        width: 32, height: 32, borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Mini
                    label="Sets"
                    value={re.default_sets}
                    set={v => setExercises(exercises.map((x, j) => j === i ? { ...x, default_sets: v } : x))}
                  />
                  <Mini
                    label="Reps"
                    value={re.default_reps}
                    set={v => setExercises(exercises.map((x, j) => j === i ? { ...x, default_reps: v } : x))}
                  />
                  {isW && (
                    <Mini
                      label="kg"
                      value={re.default_weight}
                      decimal
                      set={v => setExercises(exercises.map((x, j) => j === i ? { ...x, default_weight: v } : x))}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <button className="btn btn-ghost" onClick={() => setShowExerciseModal(true)}>
          <Icon name="plus" size={14} /> Add exercise
        </button>

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
            {error}
          </div>
        )}

        {!isNew && (
          <button
            onClick={() => setShowDeleteSheet(true)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--danger)',
              fontSize: 13,
              padding: '14px 0',
              marginTop: 16,
              fontFamily: 'inherit',
            }}
          >
            Delete routine
          </button>
        )}
      </div>

      <ExerciseSearchModal
        open={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        onSelect={handleAddExercise}
        excludeIds={exercises.map(e => e.exercise_id)}
      />

      {/* Delete confirmation sheet */}
      {showDeleteSheet && (
        <BottomSheet open={showDeleteSheet} onClose={() => !deleting && setShowDeleteSheet(false)}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
              Delete "{name}"?
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
              This will permanently delete the routine. Your workout history will not be affected.
            </div>
          </div>
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete routine'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setShowDeleteSheet(false)}
            disabled={deleting}
            style={{ marginTop: 8 }}
          >
            Cancel
          </button>
        </BottomSheet>
      )}

      {/* Emoji picker sheet */}
      {showEmojiPicker && (
        <BottomSheet open={showEmojiPicker} onClose={() => setShowEmojiPicker(false)} title="Pick an emoji">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 12 }}>
            {['🔥','💪','🦵','🏋️','🤸','🏃','⚡','🎯','💥','🧠','🏅','🥇','🦾','🚀','❤️','🌊','🧲','🏔️','⛰️','🎖️','🥊','🎽','🩺','🧘','🏊','🚴','🤼','🏇','🌟','⭐','💎','🔑','🌀','🎪','🦅'].map(e => (
              <button
                key={e}
                onClick={() => { setEmoji(e); setShowEmojiPicker(false) }}
                style={{
                  fontSize: 26, background: emoji === e ? 'var(--accent-soft)' : 'var(--surface-2)',
                  border: emoji === e ? '1.5px solid var(--accent)' : '1px solid transparent',
                  borderRadius: 10, padding: '6px 0', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  aspectRatio: '1',
                }}
              >
                {e}
              </button>
            ))}
          </div>
          {emoji && (
            <button
              className="btn btn-ghost"
              onClick={() => { setEmoji(''); setShowEmojiPicker(false) }}
            >
              Remove emoji
            </button>
          )}
        </BottomSheet>
      )}

      {/* Exercise defaults config sheet */}
      {configuringExercise && (
        <BottomSheet
          open={!!configuringExercise}
          onClose={() => setConfiguringExercise(null)}
          title={configuringExercise?.editIndex === null ? 'Set defaults' : 'Edit defaults'}
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 16 }}>
              {configuringExercise.exercise.name}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
              {TYPE_LABELS[configuringExercise.exercise.type] || configuringExercise.exercise.type}
            </div>
          </div>

          {cfgIsRun ? (
            <div style={{ padding: '12px 0 16px', color: 'var(--muted)', fontSize: 13 }}>
              Run exercises log duration, distance, and heart rate per session — no set defaults needed.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div className="eyebrow" style={{ marginBottom: 4 }}>Sets</div>
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
                  <div className="eyebrow" style={{ marginBottom: 4 }}>Reps</div>
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
                  <div className="eyebrow" style={{ marginBottom: 4 }}>kg</div>
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
          )}

          <button className="btn btn-primary" onClick={handleConfigConfirm}>
            {configuringExercise.editIndex === null ? 'Add exercise' : 'Save changes'}
          </button>
        </BottomSheet>
      )}
    </div>
  )
}
