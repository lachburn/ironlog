import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Icon } from './Icon'

const TYPES = ['weighted', 'dumbbell', 'bodyweight', 'cardio']
const TYPE_LABELS = { weighted: 'Weighted', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight', cardio: 'Cardio' }

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

export default function ExerciseSearchModal({ open, onClose, onSelect, excludeIds = [] }) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [exercises, setExercises] = useState([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('weighted')

  useEffect(() => {
    if (!open) return
    setQuery('')
    setCreating(false)
    setNewName('')
    fetchExercises('')
  }, [open])

  const fetchExercises = async (q) => {
    let qb = supabase
      .from('exercises')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    if (q) qb = qb.ilike('name', `%${q}%`)
    const { data } = await qb
    setExercises(data || [])
  }

  const handleSearch = (val) => {
    setQuery(val)
    fetchExercises(val)
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    const { data, error } = await supabase
      .from('exercises')
      .insert({ user_id: user.id, name: newName.trim(), type: newType })
      .select()
      .single()
    if (!error && data) {
      onSelect(data)
      onClose()
    }
  }

  if (!open) return null

  const filtered = exercises.filter(e => !excludeIds.includes(e.id))

  return (
    <>
      <div className="backdrop" onClick={onClose} style={{ zIndex: 60 }} />
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--surface)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        border: '1px solid var(--border)',
        borderBottom: 'none',
        zIndex: 70,
        height: '80dvh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 250ms ease',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 10px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-2)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '0 18px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: creating ? 0 : 12, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
            {creating ? 'New exercise' : 'Add exercise'}
          </div>
          {!creating && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface-2)',
              borderRadius: 12,
              padding: '0 12px',
              border: '1px solid var(--border)',
            }}>
              <Icon name="search" size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search exercises…"
                value={query}
                onChange={e => handleSearch(e.target.value)}
                autoFocus
                style={{
                  flex: 1,
                  padding: '11px 0',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink)',
                  fontSize: 15,
                  outline: 'none',
                  fontFamily: 'inherit',
                  width: 'auto',
                  borderRadius: 0,
                }}
              />
              {query && (
                <button
                  onClick={() => handleSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}
                >
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!creating ? (
            <>
              <button
                onClick={() => { setCreating(true); setNewName('') }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 18px',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  color: 'var(--accent)',
                  fontSize: 15,
                  fontWeight: 500,
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <Icon name="plus" size={16} />
                Create "{query || 'new exercise'}"
              </button>

              {filtered.map((ex, i) => (
                <button
                  key={ex.id}
                  onClick={() => { onSelect(ex); onClose() }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ color: 'var(--ink)', fontSize: 15, fontWeight: 500 }}>{ex.name}</div>
                  <TypeChip type={ex.type} />
                </button>
              ))}

              {filtered.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                  No exercises found
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                placeholder="Exercise name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    style={{
                      padding: '12px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: newType === t ? 'var(--ink)' : 'var(--surface-2)',
                      color: newType === t ? 'var(--bg)' : 'var(--ink)',
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: 'inherit',
                    }}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setCreating(false)} style={{ flex: 1 }}>
                  Back
                </button>
                <button className="btn btn-primary" onClick={handleCreate} style={{ flex: 2 }}>
                  Add exercise
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
