import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'
import { useWeightUnit } from '../context/WeightUnitContext'
import BottomNav from '../components/BottomNav'
import IronLogLogo from '../components/IronLogLogo'
import { Icon } from '../components/Icon'

const SORTS = [
  { key: 'recent',    label: 'Recent' },
  { key: 'completed', label: 'Most Done' },
  { key: 'heaviest',  label: 'Heaviest' },
  { key: 'az',        label: 'A → Z' },
]

function sortExercises(list, sort) {
  return [...list].sort((a, b) => {
    if (sort === 'recent')    return new Date(b.last_done) - new Date(a.last_done)
    if (sort === 'completed') return b.total_sets - a.total_sets
    if (sort === 'heaviest')  return b.heaviest_weight - a.heaviest_weight
    if (sort === 'az')        return a.exercise_name.localeCompare(b.exercise_name)
    return 0
  })
}

function timeAgo(iso) {
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function Empty({ query }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 20px',
      textAlign: 'center',
      color: 'var(--muted)',
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 18,
        background: 'var(--surface-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
      }}>
        <Icon name={query ? 'search' : 'chart'} size={24} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)', marginBottom: 4 }}>
        {query ? 'Nothing found' : 'No data yet'}
      </div>
      <div style={{ fontSize: 13, maxWidth: 240 }}>
        {query ? 'Try a different search' : 'Complete a workout to see exercise history'}
      </div>
    </div>
  )
}

export default function ExerciseHistory() {
  const navigate = useNavigate()
  const { fetchExerciseHistory, exHistCacheExists } = useHistory()
  const { unit, toDisplay } = useWeightUnit()
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(!exHistCacheExists)
  const [sort, setSort] = useState('recent')
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchExerciseHistory().then(data => {
      setExercises(data || [])
      setLoading(false)
    })
  }, [fetchExerciseHistory])

  const filtered = sortExercises(
    exercises.filter(e => e.exercise_name.toLowerCase().includes(query.toLowerCase())),
    sort
  )

  // Group by first letter for alphabetical mode
  const groups = {}
  if (sort === 'az') {
    filtered.forEach(e => {
      const k = e.exercise_name[0].toUpperCase()
      ;(groups[k] = groups[k] || []).push(e)
    })
  }
  const groupKeys = Object.keys(groups).sort()

  return (
    <div style={{
      background: 'var(--bg)',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* App Header */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ padding: '10px 18px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', minHeight: 32 }}>
            <IronLogLogo height={28} />
            <div style={{ flex: 1 }} />
            <button
              onClick={() => navigate('/settings')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                width: 36, height: 36, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ink)', padding: 0,
              }}
            >
              <Icon name="cog" size={18} />
            </button>
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.05, marginTop: 6 }}>
            Exercises
          </div>
        </div>

        {/* Search + sort */}
        <div style={{ padding: '0 18px 10px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{
              flex: 1,
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
                placeholder="Search exercises"
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink)',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'inherit',
                  width: 'auto',
                  borderRadius: 0,
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}
                >
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            {SORTS.map(s => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                style={{
                  padding: '5px 11px',
                  borderRadius: 999,
                  background: sort === s.key ? 'var(--ink)' : 'transparent',
                  color: sort === s.key ? 'var(--bg)' : 'var(--muted)',
                  border: sort === s.key ? 'none' : '1px solid var(--border)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 18px 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 40, color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <Empty query={query} />
        ) : sort === 'az' ? (
          groupKeys.map(k => (
            <div key={k} style={{ marginBottom: 14 }}>
              <div className="eyebrow" style={{ padding: '8px 4px 6px' }}>{k}</div>
              <div style={{
                background: 'var(--surface)',
                borderRadius: 14,
                border: '1px solid var(--border)',
                overflow: 'hidden',
              }}>
                {groups[k].map((ex, i) => (
                  <ExerciseRow
                    key={ex.exercise_id}
                    ex={ex}
                    i={i}
                    total={groups[k].length}
                    unit={unit}
                    toDisplay={toDisplay}
                    navigate={navigate}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {filtered.map((ex, i) => (
              <ExerciseRow
                key={ex.exercise_id}
                ex={ex}
                i={i}
                total={filtered.length}
                unit={unit}
                toDisplay={toDisplay}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

function ExerciseRow({ ex, i, total, unit, toDisplay, navigate }) {
  return (
    <button
      onClick={() => navigate(`/exercise-history/${ex.exercise_id}`)}
      style={{
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        background: 'transparent',
        border: 'none',
        padding: '12px 14px',
        borderTop: i === 0 ? 'none' : '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: 'inherit',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{ex.exercise_name}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
          {ex.total_sets} sets
          {ex.heaviest_weight > 0 && ` · ${toDisplay(ex.heaviest_weight)}${unit} best`}
          {ex.last_done ? ` · ${timeAgo(ex.last_done)}` : ''}
        </div>
      </div>
      <Icon name="chev-r" size={14} style={{ color: 'var(--faint)', flexShrink: 0 }} />
    </button>
  )
}
