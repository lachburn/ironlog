import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const TYPES = ['weighted', 'dumbbell', 'bodyweight', 'cardio']
const TYPE_LABELS = { weighted: 'Weighted', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight', cardio: 'Cardio' }
const TYPE_COLORS = { weighted: '#C9A84C', dumbbell: '#E2C06E', bodyweight: '#4CAF50', cardio: '#2196F3' }

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
        animation: 'sheetUp 250ms ease',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        <div style={{ padding: '0 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>Add Exercise</div>
          <input
            type="text"
            placeholder="Search exercises…"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            autoFocus
            style={{ marginBottom: 0 }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {!creating ? (
            <>
              <button
                onClick={() => setCreating(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  color: 'var(--accent)',
                  fontFamily: 'DM Sans',
                  fontSize: 15,
                  fontWeight: 500,
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 20 }}>+</span>
                Create "{query || 'new exercise'}"
              </button>

              {filtered.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => { onSelect(ex); onClose() }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 500 }}>{ex.name}</div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: TYPE_COLORS[ex.type] || 'var(--accent)',
                    background: (TYPE_COLORS[ex.type] || 'var(--accent)') + '22',
                    padding: '3px 8px',
                    borderRadius: 6,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    {TYPE_LABELS[ex.type] || ex.type}
                  </div>
                </button>
              ))}

              {filtered.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                  No exercises found
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>New Exercise</div>
              <input
                type="text"
                placeholder="Exercise name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                defaultValue={query}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    style={{
                      padding: '10px',
                      borderRadius: 10,
                      border: `1px solid ${newType === t ? 'var(--accent)' : 'var(--border)'}`,
                      background: newType === t ? 'var(--accent)' : 'transparent',
                      color: newType === t ? '#000' : 'var(--text-secondary)',
                      fontFamily: 'DM Sans',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                    }}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn-ghost" onClick={() => setCreating(false)} style={{ flex: 1 }}>Back</button>
                <button className="btn-primary" onClick={handleCreate} style={{ flex: 2 }}>Add Exercise</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
