import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useJourneys } from '../hooks/useJourneys'
import { useRoutines } from '../hooks/useRoutines'
import { supabase } from '../lib/supabase'
import { Icon } from '../components/Icon'
import BottomSheet from '../components/BottomSheet'

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

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
          const isToday = cellDate.getTime() === today.getTime()
          const isSel = sel && sel.getFullYear() === vY && sel.getMonth() === vM && sel.getDate() === d
          return (
            <button
              key={i}
              onClick={() => onChange(`${vY}-${String(vM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)}
              style={{
                height: 40, borderRadius: 10, border: 'none', fontFamily: 'inherit',
                background: isSel ? 'var(--accent)' : isToday ? 'var(--surface-2)' : 'transparent',
                color: isSel ? '#111' : 'var(--ink)',
                fontSize: 14, fontWeight: isSel ? 700 : 400,
                cursor: 'pointer',
              }}
            >{d}</button>
          )
        })}
      </div>
    </div>
  )
}

export default function JourneyEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { journeys, updateJourney } = useJourneys()
  const { routines } = useRoutines()
  const [activities, setActivities] = useState([])

  useEffect(() => {
    supabase.from('activities').select('*').then(({ data }) => {
      if (data) setActivities(data)
    })
  }, [])

  const journey = journeys.find(j => j.id === id)

  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [targetDate, setTargetDate] = useState('')
  // itemEdits: { [itemId]: { type, routine_id, activity_id } }
  const [itemEdits, setItemEdits] = useState({})
  const [initialized, setInitialized] = useState(false)

  const [openSheet, setOpenSheet] = useState(null) // null | 'calendar' | { kind: 'linked', itemId }
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (journey && !initialized) {
      setTitle(journey.title || '')
      setGoal(journey.goal || '')
      setTargetDate(journey.target_date ? journey.target_date.slice(0, 10) : '')
      const edits = {}
      for (const item of journey.items) {
        edits[item.id] = {
          type: item.type || '',
          routine_id: item.routine_id || null,
          activity_id: item.activity_id || null,
        }
      }
      setItemEdits(edits)
      setInitialized(true)
    }
  }, [journey, initialized])

  if (!journey) {
    return (
      <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Journey not found.</div>
      </div>
    )
  }

  const canSave = title.trim() && targetDate

  const handleSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    const itemUpdates = journey.items.map(item => ({
      id: item.id,
      type: itemEdits[item.id]?.type ?? item.type,
      routine_id: itemEdits[item.id]?.routine_id ?? null,
      activity_id: itemEdits[item.id]?.activity_id ?? null,
    }))
    await updateJourney(id, { title, goal, target_date: targetDate, itemUpdates })
    navigate(`/journeys/${id}`, { replace: true })
  }

  const setItemField = (itemId, field, value) => {
    setItemEdits(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }))
  }

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
            onClick={() => navigate(`/journeys/${id}`)}
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
            Edit Journey
          </div>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{
              background: 'var(--ink)', color: 'var(--bg)',
              border: 'none', borderRadius: 999,
              padding: '7px 16px', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              opacity: (!canSave || saving) ? 0.4 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
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
          <Icon name="chev-down" size={14} style={{ color: 'var(--faint)' }} />
        </button>

        {/* Schedule items */}
        <div className="eyebrow" style={{ padding: '8px 4px 8px' }}>Schedule</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {journey.items.map(item => {
            const edit = itemEdits[item.id] || {}
            const linkedRoutine = routines.find(r => r.id === edit.routine_id)
            const linkedActivity = activities.find(a => a.id === edit.activity_id)
            const linkedLabel = linkedRoutine?.name || linkedActivity?.name || null
            const isActivityLinked = !!linkedActivity

            return (
              <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>

                {/* Date + type row */}
                <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: item.completed ? 'color-mix(in oklch, var(--good) 12%, transparent)' : 'var(--surface-2)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ fontSize: 9, color: item.completed ? 'var(--good)' : 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      {new Date(item.date).toLocaleDateString('en-AU', { weekday: 'short' })}
                    </div>
                    <div className="mono" style={{ fontSize: 17, fontWeight: 600, lineHeight: 1, color: item.completed ? 'var(--good)' : 'var(--ink)' }}>
                      {new Date(item.date).getDate()}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      {new Date(item.date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                    </div>
                    <input
                      value={edit.type || ''}
                      onChange={e => setItemField(item.id, 'type', e.target.value)}
                      placeholder="Session type…"
                      style={{
                        background: 'none', border: 'none', outline: 'none',
                        fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                        color: 'var(--ink)', width: '100%', padding: 0,
                      }}
                    />
                  </div>
                  {item.completed && (
                    <div style={{ flexShrink: 0, color: 'var(--good)' }}>
                      <Icon name="check" size={16} stroke={2.4} />
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--border)', marginLeft: 70 }} />

                {/* Workout / Activity link row */}
                <button
                  onClick={() => setOpenSheet({ kind: 'linked', itemId: item.id })}
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
                    <Icon name={isActivityLinked ? 'route' : 'dumbbell'} size={13} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                      Workout / Activity
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: linkedLabel ? 'var(--ink)' : 'var(--faint)' }}>
                      {linkedLabel || 'Optional'}
                    </div>
                  </div>
                  <Icon name="chev-down" size={14} style={{ color: 'var(--faint)' }} />
                </button>

              </div>
            )
          })}
        </div>
      </div>

      {/* Calendar sheet */}
      <BottomSheet open={activeSheet === 'calendar'} onClose={() => setOpenSheet(null)} title="Select date">
        <CalendarPicker
          value={targetDate}
          onChange={(v) => { setTargetDate(v); setOpenSheet(null) }}
        />
      </BottomSheet>

      {/* Workout / Activity picker sheet */}
      <BottomSheet
        open={activeSheet?.kind === 'linked'}
        onClose={() => setOpenSheet(null)}
        title="Workout / Activity"
      >
        {activeSheet?.kind === 'linked' && (() => {
          const itemId = activeSheet.itemId
          const edit = itemEdits[itemId] || {}
          const selRoutine = edit.routine_id ?? null
          const selActivity = edit.activity_id ?? null

          const selectRoutine = (rid) => {
            setItemField(itemId, 'routine_id', rid)
            setItemField(itemId, 'activity_id', null)
            setOpenSheet(null)
          }
          const selectActivity = (aid) => {
            setItemField(itemId, 'activity_id', aid)
            setItemField(itemId, 'routine_id', null)
            setOpenSheet(null)
          }
          const clearBoth = () => {
            setItemField(itemId, 'routine_id', null)
            setItemField(itemId, 'activity_id', null)
            setOpenSheet(null)
          }
          const isNone = !selRoutine && !selActivity

          return (
            <>
              <button
                onClick={clearBoth}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  padding: '14px 4px', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--faint)',
                }}>
                  <Icon name="x" size={14} />
                </div>
                <div style={{ flex: 1, fontSize: 15, fontWeight: isNone ? 600 : 400, color: isNone ? 'var(--accent)' : 'var(--ink)' }}>
                  None
                </div>
                {isNone && <Icon name="check" size={16} style={{ color: 'var(--accent)' }} />}
              </button>

              {routines.length > 0 && (
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 4px 4px' }}>
                  Workouts
                </div>
              )}
              {routines.map(r => {
                const selected = selRoutine === r.id
                return (
                  <button
                    key={r.id}
                    onClick={() => selectRoutine(r.id)}
                    style={{
                      width: '100%', textAlign: 'left', background: 'none', border: 'none',
                      padding: '12px 4px', cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 12,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: 'var(--surface-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>
                      {r.emoji || '🏋️'}
                    </div>
                    <div style={{ flex: 1, fontSize: 15, fontWeight: selected ? 600 : 400, color: selected ? 'var(--accent)' : 'var(--ink)' }}>
                      {r.name}
                    </div>
                    {selected && <Icon name="check" size={16} style={{ color: 'var(--accent)' }} />}
                  </button>
                )
              })}

              {activities.length > 0 && (
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 4px 4px' }}>
                  Activities
                </div>
              )}
              {activities.map(a => {
                const selected = selActivity === a.id
                return (
                  <button
                    key={a.id}
                    onClick={() => selectActivity(a.id)}
                    style={{
                      width: '100%', textAlign: 'left', background: 'none', border: 'none',
                      padding: '12px 4px', cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 12,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: 'var(--surface-2)', color: 'var(--ink-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name="route" size={13} />
                    </div>
                    <div style={{ flex: 1, fontSize: 15, fontWeight: selected ? 600 : 400, color: selected ? 'var(--accent)' : 'var(--ink)' }}>
                      {a.name}
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                      padding: '2px 6px', borderRadius: 4,
                      background: 'var(--surface-2)', color: 'var(--muted)',
                      textTransform: 'uppercase', marginRight: 6,
                    }}>
                      {a.type === 'run' ? 'Run' : 'Sport'}
                    </span>
                    {selected && <Icon name="check" size={16} style={{ color: 'var(--accent)' }} />}
                  </button>
                )
              })}
            </>
          )
        })()}
      </BottomSheet>
    </div>
  )
}
