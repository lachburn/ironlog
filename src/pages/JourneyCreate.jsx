import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJourneys } from '../hooks/useJourneys'
import { useRoutines } from '../hooks/useRoutines'
import { Icon } from '../components/Icon'
import BottomSheet from '../components/BottomSheet'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_FULL   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS     = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December']
const TYPE_OPTIONS = [
  'Workout', 'Tempo Run', 'Long Run', 'Easy Run', 'Intervals',
  'Strength', 'Recovery', 'Cross Train', 'Race Pace',
]

function daysUntil(iso) {
  if (!iso) return null
  return Math.ceil((new Date(iso) - new Date()) / 86400000)
}

function formatDisplay(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function CalendarPicker({ value, onChange }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const sel = value ? new Date(value + 'T00:00:00') : null
  const [vY, setVY] = useState(sel ? sel.getFullYear() : today.getFullYear())
  const [vM, setVM] = useState(sel ? sel.getMonth() : today.getMonth())

  const firstDow = new Date(vY, vM, 1).getDay()
  const daysInMo = new Date(vY, vM + 1, 0).getDate()
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMo }, (_, i) => i + 1)]

  const prev = () => { if (vM === 0) { setVM(11); setVY(y => y - 1) } else setVM(m => m - 1) }
  const next = () => { if (vM === 11) { setVM(0); setVY(y => y + 1) } else setVM(m => m + 1) }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={prev} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', padding: '6px 10px', borderRadius: 8 }}>
          <Icon name="chev-l" size={18} />
        </button>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          {MONTHS[vM]} {vY}
        </div>
        <button onClick={next} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', padding: '6px 10px', borderRadius: 8 }}>
          <Icon name="chev-r" size={18} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', fontWeight: 600, paddingBottom: 8 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />
          const cellDate = new Date(vY, vM, d)
          const past = cellDate < today
          const isToday = cellDate.getTime() === today.getTime()
          const isSel = sel && sel.getFullYear() === vY && sel.getMonth() === vM && sel.getDate() === d
          return (
            <button
              key={i}
              onClick={() => !past && onChange(`${vY}-${String(vM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)}
              style={{
                height: 40, borderRadius: 10, border: 'none', fontFamily: 'inherit',
                background: isSel ? 'var(--accent)' : isToday ? 'var(--surface-2)' : 'transparent',
                color: past ? 'var(--faint)' : isSel ? '#111' : 'var(--ink)',
                fontSize: 14, fontWeight: isSel ? 700 : 400,
                cursor: past ? 'default' : 'pointer',
              }}
            >{d}</button>
          )
        })}
      </div>
    </div>
  )
}

export default function JourneyCreate() {
  const navigate = useNavigate()
  const { createJourney } = useJourneys()
  const { routines } = useRoutines()

  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 3)
    return d.toISOString().slice(0, 10)
  })
  const [days, setDays] = useState({ 1: true, 3: true, 6: true })
  const [types, setTypes] = useState({ 1: 'Tempo Run', 3: 'Intervals', 6: 'Long Run' })
  const [routineLinks, setRoutineLinks] = useState({})
  // null | 'calendar' | { kind: 'type', day: n } | { kind: 'routine', day: n }
  const [openSheet, setOpenSheet] = useState(null)

  const canSave = title.trim() && targetDate && Object.values(days).some(Boolean)
  const toggleDay = (i) => setDays(s => ({ ...s, [i]: !s[i] }))

  const handleCreate = () => {
    if (!canSave) return
    createJourney({ title, goal, target_date: targetDate, days, types, routineLinks })
    navigate('/journeys')
  }

  const d = daysUntil(targetDate)
  const activeSheet = openSheet

  return (
    <div style={{
      background: 'var(--bg)', height: '100dvh',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
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

        {/* Goal */}
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

        {/* Target date */}
        <div className="eyebrow" style={{ padding: '8px 4px 8px' }}>Target date</div>
        <button
          onClick={() => setOpenSheet('calendar')}
          className="card row-tap"
          style={{
            width: '100%', textAlign: 'left', cursor: 'pointer',
            padding: '12px 14px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--surface)', border: '1px solid var(--border)',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'var(--surface-2)', color: 'var(--ink-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="calendar" size={18} />
          </div>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>
            {formatDisplay(targetDate)}
          </div>
          {d !== null && (
            <div className="mono" style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{d}d</div>
          )}
          <Icon name="chev-down" size={14} style={{ color: 'var(--faint)' }} />
        </button>

        {/* Training days toggle */}
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

        {/* Per-day config cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {DAY_LABELS.map((label, i) => {
            if (!days[i]) return null
            const linkedRoutine = routines.find(r => r.id === routineLinks[i])
            return (
              <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>

                {/* Session type row */}
                <button
                  onClick={() => setOpenSheet({ kind: 'type', day: i })}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none', border: 'none',
                    padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: 'var(--surface-2)', color: 'var(--ink-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                  }}>{label.slice(0, 1)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                      {DAY_FULL[i]}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
                      {types[i] || TYPE_OPTIONS[0]}
                    </div>
                  </div>
                  <Icon name="chev-down" size={14} style={{ color: 'var(--faint)' }} />
                </button>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--border)', marginLeft: 62 }} />

                {/* Routine row */}
                <button
                  onClick={() => setOpenSheet({ kind: 'routine', day: i })}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none', border: 'none',
                    padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: 'var(--surface-2)', color: 'var(--ink-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="dumbbell" size={13} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                      Routine
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: linkedRoutine ? 'var(--ink)' : 'var(--faint)' }}>
                      {linkedRoutine ? linkedRoutine.name : 'Optional'}
                    </div>
                  </div>
                  <Icon name="chev-down" size={14} style={{ color: 'var(--faint)' }} />
                </button>

              </div>
            )
          })}
        </div>

        <button className="btn btn-primary" disabled={!canSave} onClick={handleCreate}>
          Create Journey
        </button>
      </div>

      {/* ── Calendar sheet ──────────────────────────────── */}
      <BottomSheet open={activeSheet === 'calendar'} onClose={() => setOpenSheet(null)} title="Select date">
        <CalendarPicker
          value={targetDate}
          onChange={(v) => { setTargetDate(v); setOpenSheet(null) }}
        />
      </BottomSheet>

      {/* ── Type picker sheet ────────────────────────────── */}
      <BottomSheet
        open={activeSheet?.kind === 'type'}
        onClose={() => setOpenSheet(null)}
        title={activeSheet?.kind === 'type' ? DAY_FULL[activeSheet.day] : ''}
      >
        {activeSheet?.kind === 'type' && TYPE_OPTIONS.map(opt => {
          const selected = (types[activeSheet.day] || TYPE_OPTIONS[0]) === opt
          return (
            <button
              key={opt}
              onClick={() => { setTypes(t => ({ ...t, [activeSheet.day]: opt })); setOpenSheet(null) }}
              style={{
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                padding: '14px 4px', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)',
                color: selected ? 'var(--accent)' : 'var(--ink)',
                fontSize: 15, fontWeight: selected ? 600 : 400,
              }}
            >
              {opt}
              {selected && <Icon name="check" size={16} style={{ color: 'var(--accent)' }} />}
            </button>
          )
        })}
      </BottomSheet>

      {/* ── Routine picker sheet ─────────────────────────── */}
      <BottomSheet
        open={activeSheet?.kind === 'routine'}
        onClose={() => setOpenSheet(null)}
        title={activeSheet?.kind === 'routine' ? `${DAY_FULL[activeSheet.day]} — Routine` : ''}
      >
        {activeSheet?.kind === 'routine' && [{ id: null, name: 'No routine', emoji: null }, ...routines].map(r => {
          const selected = (routineLinks[activeSheet.day] ?? null) === r.id
          return (
            <button
              key={r.id ?? 'none'}
              onClick={() => { setRoutineLinks(l => ({ ...l, [activeSheet.day]: r.id })); setOpenSheet(null) }}
              style={{
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                padding: '14px 4px', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: r.emoji ? 'var(--surface-2)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: r.emoji ? 16 : 18, color: 'var(--faint)',
              }}>
                {r.emoji ?? <Icon name="x" size={14} />}
              </div>
              <div style={{ flex: 1, fontSize: 15, fontWeight: selected ? 600 : 400, color: selected ? 'var(--accent)' : 'var(--ink)' }}>
                {r.name}
              </div>
              {selected && <Icon name="check" size={16} style={{ color: 'var(--accent)' }} />}
            </button>
          )
        })}
      </BottomSheet>
    </div>
  )
}
