import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Icon } from './Icon'

const TYPES = ['weighted', 'dumbbell', 'bodyweight', 'cardio']
const TYPE_LABELS = { weighted: 'Weighted', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight', cardio: 'Cardio' }

const TYPE_COLORS = {
  weighted: 'var(--muted)',
  dumbbell: 'var(--muted)',
  bodyweight: 'var(--muted)',
  cardio: 'var(--muted)',
}

export default function ExerciseSearchModal({ open, onClose, onSelect, excludeIds = [] }) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [exercises, setExercises] = useState([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('weighted')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setCreating(false)
    setNewName('')
    fetchExercises('')
    setTimeout(() => inputRef.current?.focus(), 50)
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
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        border: '1px solid var(--border)',
        borderBottom: 'none',
        zIndex: 70,
        height: '56dvh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 220ms ease',
        paddingBottom: 'env(safe-area-inset-bottom, 12px)',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
          <div style={{ width: 32, height: 4, borderRadius: 2, background: 'var(--border-2)' }} />
        </div>

        {!creating ? (
          <>
            {/* Search bar — compact, no heavy header */}
            <div style={{ padding: '10px 14px 8px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--bg)', borderRadius: 10,
                padding: '0 10px', border: '1px solid var(--border)',
              }}>
                <Icon name="search" size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search exercises…"
                  value={query}
                  onChange={e => handleSearch(e.target.value)}
                  style={{
                    flex: 1, padding: '9px 0', background: 'transparent',
                    border: 'none', color: 'var(--ink)', fontSize: 14,
                    outline: 'none', fontFamily: 'inherit', width: 'auto', borderRadius: 0,
                  }}
                />
                {query ? (
                  <button
                    onClick={() => handleSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}
                  >
                    <Icon name="x" size={13} />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, fontSize: 12, fontFamily: 'inherit' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Create new option */}
              <button
                onClick={() => { setCreating(true); setNewName(query) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', width: '100%',
                  background: 'none', border: 'none', borderBottom: '1px solid var(--border)',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'var(--accent-soft)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon name="plus" size={13} style={{ color: 'var(--accent)' }} />
                </div>
                <span style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 500 }}>
                  {query ? `Create "${query}"` : 'Create new exercise'}
                </span>
              </button>

              {filtered.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => { onSelect(ex); onClose() }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 14px', width: '100%',
                    background: 'none', border: 'none',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  <span style={{ color: 'var(--ink)', fontSize: 14, fontWeight: 400 }}>{ex.name}</span>
                  <span className="eyebrow" style={{
                    fontSize: 9, padding: '2px 6px', borderRadius: 5,
                    background: 'var(--surface-2)', color: 'var(--muted)',
                    letterSpacing: '0.06em',
                  }}>
                    {TYPE_LABELS[ex.type] || ex.type}
                  </span>
                </button>
              ))}

              {filtered.length === 0 && (
                <div style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  No exercises found
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 14px', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <button
                onClick={() => setCreating(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}
              >
                <Icon name="chev-l" size={18} />
              </button>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                New exercise
              </div>
            </div>
            <input
              type="text"
              placeholder="Exercise name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  style={{
                    padding: '10px', borderRadius: 10, cursor: 'pointer',
                    background: newType === t ? 'var(--ink)' : 'var(--surface-2)',
                    color: newType === t ? 'var(--bg)' : 'var(--ink)',
                    border: 'none', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                  }}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={!newName.trim()}
              style={{ marginTop: 'auto' }}
            >
              Add exercise
            </button>
          </div>
        )}
      </div>
    </>
  )
}
