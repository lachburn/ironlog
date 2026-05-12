import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'
import { useWeightUnit } from '../context/WeightUnitContext'
import { useActiveWorkout } from '../context/ActiveWorkoutContext'
import BottomNav from '../components/BottomNav'
import IronLogLogo from '../components/IronLogLogo'
import { Icon } from '../components/Icon'

function LivePill({ activeWorkout, navigate }) {
  if (!activeWorkout) return null
  return (
    <button
      onClick={() => navigate(`/workout/${activeWorkout.routineId}`)}
      style={{
        background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer',
        borderRadius: 999, padding: '6px 12px 6px 9px',
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12, fontWeight: 600, fontFamily: 'inherit', flexShrink: 0,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 999, background: 'currentColor' }} />
      {activeWorkout.routineName}
    </button>
  )
}

function fmtDur(start, end) {
  if (!end) return '—'
  const s = Math.floor((new Date(end) - new Date(start)) / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function timeAgo(iso) {
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function SortPills({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 0 12px' }}>
      {options.map(o => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            style={{
              padding: '6px 12px', borderRadius: 999,
              background: active ? 'var(--ink)' : 'var(--surface-2)',
              color: active ? 'var(--bg)' : 'var(--ink-2)',
              border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              letterSpacing: '0.01em',
            }}
          >{o.label}</button>
        )
      })}
    </div>
  )
}

function WorkoutsList({ sessions, navigate }) {
  const [sort, setSort] = useState('recent')

  const sorted = [...sessions].sort((a, b) => {
    if (sort === 'recent') return new Date(b.completed_at) - new Date(a.completed_at)
    if (sort === 'duration') {
      return (new Date(b.completed_at) - new Date(b.started_at)) -
             (new Date(a.completed_at) - new Date(a.started_at))
    }
    if (sort === 'name') return (a.routine_name || '').localeCompare(b.routine_name || '')
    return 0
  })

  const groups = {}
  sorted.forEach(s => {
    const k = new Date(s.completed_at).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
    ;(groups[k] = groups[k] || []).push(s)
  })

  if (sessions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Icon name="list" size={24} />
        </div>
        <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)', marginBottom: 4 }}>No workouts yet</div>
        <div style={{ fontSize: 13, maxWidth: 240 }}>Finish your first workout to see history here.</div>
      </div>
    )
  }

  return (
    <>
      <SortPills
        value={sort}
        onChange={setSort}
        options={[
          { id: 'recent', label: 'Recent' },
          { id: 'duration', label: 'Duration' },
          { id: 'name', label: 'A–Z' },
        ]}
      />
      {Object.entries(groups).map(([month, list]) => (
        <div key={month} style={{ marginBottom: 18 }}>
          <div className="eyebrow" style={{ padding: '4px 4px 8px' }}>{month}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map(s => {
              const sets = (s.logged_sets || []).length
              return (
                <button
                  key={s.id}
                  onClick={() => navigate(`/history/${s.id}`)}
                  className="card row-tap"
                  style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer',
                    padding: '14px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: 'var(--surface-2)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      {new Date(s.completed_at).toLocaleDateString('en-AU', { month: 'short' })}
                    </div>
                    <div className="mono" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1, color: 'var(--ink)' }}>
                      {new Date(s.completed_at).getDate()}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{s.routine_name || 'Once-off'}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {fmtDur(s.started_at, s.completed_at)}
                      {sets > 0 ? ` · ${sets} sets` : ''}
                    </div>
                  </div>
                  <Icon name="chev-r" size={16} style={{ color: 'var(--faint)', flexShrink: 0 }} />
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}

function ExercisesList({ navigate }) {
  const { fetchExerciseHistory } = useHistory()
  const { unit, toDisplay } = useWeightUnit()
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('recent')

  useEffect(() => {
    fetchExerciseHistory().then(data => {
      setExercises(data || [])
      setLoading(false)
    })
  }, [fetchExerciseHistory])

  const sorted = [...exercises].sort((a, b) => {
    if (sort === 'weight') return b.heaviest_weight - a.heaviest_weight
    if (sort === 'recent') return new Date(b.last_done || 0) - new Date(a.last_done || 0)
    if (sort === 'name') return a.exercise_name.localeCompare(b.exercise_name)
    return 0
  })

  if (loading) {
    return <div style={{ textAlign: 'center', paddingTop: 40, color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
  }

  if (sorted.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Icon name="chart" size={24} />
        </div>
        <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)', marginBottom: 4 }}>No data yet</div>
        <div style={{ fontSize: 13, maxWidth: 240 }}>Complete a workout to see exercise history</div>
      </div>
    )
  }

  return (
    <>
      <SortPills
        value={sort}
        onChange={setSort}
        options={[
          { id: 'weight', label: 'Weight' },
          { id: 'recent', label: 'Recent' },
          { id: 'name', label: 'A–Z' },
        ]}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(ex => (
          <button
            key={ex.exercise_id}
            onClick={() => navigate(`/exercise-history/${ex.exercise_id}`)}
            className="card row-tap"
            style={{
              width: '100%', textAlign: 'left', cursor: 'pointer',
              padding: '14px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface)', border: '1px solid var(--border)',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'var(--chip-bg)', color: 'var(--chip-ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em',
            }}>
              {ex.exercise_name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{ex.exercise_name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                {ex.total_sets} sets
                {ex.heaviest_weight > 0 ? ` · ${toDisplay(ex.heaviest_weight)}${unit} best` : ''}
                {ex.last_done ? ` · ${timeAgo(ex.last_done)}` : ''}
              </div>
            </div>
            <Icon name="chev-r" size={16} style={{ color: 'var(--faint)', flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </>
  )
}

export default function History() {
  const navigate = useNavigate()
  const { sessions, loading } = useHistory()
  const { activeWorkout } = useActiveWorkout()
  const [subtab, setSubtab] = useState('workouts')

  return (
    <div style={{
      background: 'var(--bg)', height: '100dvh',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* App Header */}
      <div style={{ flexShrink: 0, padding: '10px 18px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 32 }}>
          <IronLogLogo height={28} />
          <div style={{ flex: 1 }} />
          <LivePill activeWorkout={activeWorkout} navigate={navigate} />
          <button
            onClick={() => navigate('/settings')}
            style={{
              marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer',
              width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink)', padding: 0,
            }}
          >
            <Icon name="cog" size={18} />
          </button>
        </div>
        <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.05, marginTop: 6, color: 'var(--ink)' }}>
          History
        </div>
        {/* Segmented control */}
        <div style={{
          display: 'flex', gap: 4, background: 'var(--surface-2)',
          padding: 4, borderRadius: 12, marginTop: 10,
        }}>
          {[
            { id: 'workouts', label: 'Workouts' },
            { id: 'exercises', label: 'Exercises' },
          ].map(t => {
            const active = subtab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setSubtab(t.id)}
                style={{
                  flex: 1, padding: '9px 12px',
                  background: active ? 'var(--surface)' : 'transparent',
                  color: active ? 'var(--ink)' : 'var(--muted)',
                  fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
                  border: 'none', borderRadius: 9,
                  boxShadow: active ? 'var(--shadow)' : 'none',
                  cursor: 'pointer', transition: 'all .15s ease',
                }}
              >{t.label}</button>
            )
          })}
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '12px 18px 24px' }}>
        {loading && subtab === 'workouts' ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
        ) : subtab === 'workouts' ? (
          <WorkoutsList sessions={sessions} navigate={navigate} />
        ) : (
          <ExercisesList navigate={navigate} />
        )}
      </div>

      <BottomNav />
    </div>
  )
}
