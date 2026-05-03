import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'
import BottomNav from '../components/BottomNav'

const SORTS = [
  { key: 'recent',    label: 'Most Recent' },
  { key: 'completed', label: 'Most Completed' },
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

export default function ExerciseHistory() {
  const navigate = useNavigate()
  const { fetchExerciseHistory, exHistCacheExists } = useHistory()
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
    exercises.filter(e =>
      e.exercise_name.toLowerCase().includes(query.toLowerCase())
    ),
    sort
  )

  return (
    <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '56px 16px 12px',
        paddingTop: 'max(56px, calc(env(safe-area-inset-top) + 16px))',
        flexShrink: 0,
      }}>
        <div className="font-display" style={{ fontSize: 32, color: 'var(--text-primary)', letterSpacing: 1, marginBottom: 12 }}>
          EXERCISES
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search exercises…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        {/* Sort pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch' }}>
          {SORTS.map(s => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 20,
                border: `1px solid ${sort === s.key ? 'var(--accent)' : 'var(--border)'}`,
                background: sort === s.key ? 'var(--accent)' : 'transparent',
                color: sort === s.key ? '#000' : 'var(--text-secondary)',
                fontFamily: 'DM Sans',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 200ms ease',
                minHeight: 34,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '8px 16px 100px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 40, color: 'var(--text-secondary)', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div className="font-display" style={{ fontSize: 24, color: 'var(--text-primary)', marginBottom: 8 }}>
              {query ? 'NO RESULTS' : 'NO DATA YET'}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {query ? 'Try a different search' : 'Complete a workout to see exercise history'}
            </div>
          </div>
        ) : (
          filtered.map(ex => (
            <button
              key={ex.exercise_id}
              onClick={() => navigate(`/exercise-history/${ex.exercise_id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 0',
                borderBottom: '1px solid var(--border)',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                minHeight: 68,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: 15,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {ex.exercise_name}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>
                  {ex.total_sets} sets
                  {ex.heaviest_weight > 0 && ` · ${ex.heaviest_weight}kg best`}
                  {` · ${timeAgo(ex.last_done)}`}
                </div>
              </div>

              <div style={{ color: 'var(--text-secondary)', fontSize: 20, flexShrink: 0 }}>›</div>
            </button>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}
