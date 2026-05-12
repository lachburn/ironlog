import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJourneys } from '../hooks/useJourneys'
import { Icon } from '../components/Icon'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TYPE_OPTIONS = [
  'Tempo Run', 'Long Run', 'Easy Run', 'Intervals',
  'Strength', 'Recovery', 'Cross Train', 'Race Pace', 'Workout',
]

function daysUntil(iso) {
  if (!iso) return null
  return Math.ceil((new Date(iso) - new Date()) / 86400000)
}

export default function JourneyCreate() {
  const navigate = useNavigate()
  const { createJourney } = useJourneys()
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 3)
    return d.toISOString().slice(0, 10)
  })
  const [days, setDays] = useState({ 1: true, 3: true, 6: true })
  const [types, setTypes] = useState({ 1: 'Tempo Run', 3: 'Intervals', 6: 'Long Run' })

  const canSave = title.trim() && targetDate && Object.values(days).some(Boolean)
  const toggleDay = (i) => setDays(s => ({ ...s, [i]: !s[i] }))

  const handleCreate = () => {
    if (!canSave) return
    createJourney({ title, goal, target_date: targetDate, days, types })
    navigate('/journeys')
  }

  const d = daysUntil(targetDate)

  return (
    <div style={{
      background: 'var(--bg)', height: '100dvh',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '8px 18px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 44, gap: 10 }}>
          <button
            onClick={() => navigate('/journeys')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink)', padding: 0,
            }}
          >
            <Icon name="chev-l" size={18} />
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
            New Journey
          </div>
          <div style={{ width: 36 }} />
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 100px' }}>

        <div className="eyebrow" style={{ padding: '8px 4px 8px' }}>Goal</div>
        <div className="card" style={{ padding: 12, marginBottom: 16 }}>
          <input
            className="input"
            placeholder="Half marathon, weightlifting comp…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <input
            className="input"
            placeholder="What's the specific goal? (e.g. sub-1:45)"
            value={goal}
            onChange={e => setGoal(e.target.value)}
          />
        </div>

        <div className="eyebrow" style={{ padding: '8px 4px 8px' }}>Target date</div>
        <div className="card" style={{ padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'var(--surface-2)', color: 'var(--ink-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="calendar" size={18} />
          </div>
          <input
            type="date"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              fontSize: 16, fontFamily: 'inherit', color: 'var(--ink)',
              outline: 'none', padding: 0,
            }}
          />
          {d !== null && (
            <div className="mono" style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              {d}d
            </div>
          )}
        </div>

        <div className="eyebrow" style={{ padding: '8px 4px 8px' }}>Training days</div>
        <div className="card" style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {DAY_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                style={{
                  height: 44, borderRadius: 10,
                  border: '1px solid ' + (days[i] ? 'transparent' : 'var(--border)'),
                  background: days[i] ? 'var(--ink)' : 'transparent',
                  color: days[i] ? 'var(--bg)' : 'var(--ink-2)',
                  fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                  cursor: 'pointer', letterSpacing: '0.01em',
                }}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Per-day type selectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {DAY_LABELS.map((label, i) => days[i] && (
            <div key={i} className="card" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'var(--surface-2)', color: 'var(--ink-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600,
              }}>{label.slice(0, 1)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}day</div>
                <select
                  value={types[i] || TYPE_OPTIONS[0]}
                  onChange={e => setTypes(t => ({ ...t, [i]: e.target.value }))}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--ink)',
                    fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                    outline: 'none', padding: 0, marginTop: 1,
                    appearance: 'none', cursor: 'pointer', width: '100%',
                  }}
                >
                  {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <Icon name="chev-down" size={14} style={{ color: 'var(--faint)' }} />
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary"
          disabled={!canSave}
          onClick={handleCreate}
        >
          Create Journey
        </button>
      </div>
    </div>
  )
}
