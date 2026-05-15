import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useJourneys } from '../hooks/useJourneys'
import { useHistory } from '../hooks/useHistory'
import { useRoutines } from '../hooks/useRoutines'
import { useWeekStart } from '../context/WeekStartContext'
import { supabase } from '../lib/supabase'
import BottomSheet from '../components/BottomSheet'
import { Icon } from '../components/Icon'

function progressHue(pct) { return Math.round(pct * 330) }
function progressColor(pct) { return `oklch(64% 0.16 ${progressHue(pct)})` }

function journeyPct(j) {
  if (!j.items.length) return 0
  return j.items.filter(i => i.completed).length / j.items.length
}

function daysUntil(iso) {
  return Math.ceil((new Date(iso) - new Date()) / 86400000)
}

function fmtDate(iso, opts = { day: 'numeric', month: 'short' }) {
  return new Date(iso).toLocaleDateString('en-AU', opts)
}

function fmtDur(start, end) {
  if (!end) return '—'
  const s = Math.floor((new Date(end) - new Date(start)) / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function countChipStyle(done, total) {
  const complete = total > 0 && done === total
  return complete
    ? { background: 'color-mix(in oklch, var(--good) 18%, transparent)', color: 'var(--good)' }
    : { background: 'var(--accent-soft)', color: 'var(--accent)' }
}

function ProgressRing({ pct, size = 104, stroke = 9 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = c * Math.max(0, Math.min(1, pct))
  const color = progressColor(pct)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          style={{ transition: 'stroke-dasharray .6s ease, stroke .4s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      }}>
        <div className="mono" style={{
          fontSize: Math.round(size * 0.25), fontWeight: 600,
          letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1,
        }}>
          {Math.round(pct * 100)}<span style={{ fontSize: Math.round(size * 0.13), color: 'var(--muted)', marginLeft: 1 }}>%</span>
        </div>
      </div>
    </div>
  )
}

function groupByWeek(journey, startOfWeek = 1) {
  const start = new Date(journey.start_date)
  const startDow = start.getDay()
  const offset = (startDow - startOfWeek + 7) % 7
  const anchor = new Date(start)
  anchor.setDate(start.getDate() - offset)
  anchor.setHours(0, 0, 0, 0)
  const groups = new Map()
  journey.items.forEach(item => {
    const d = new Date(item.date)
    const weeksFromAnchor = Math.floor((d - anchor) / (7 * 86400000))
    const weekNumber = weeksFromAnchor + 1
    const wStart = new Date(anchor)
    wStart.setDate(anchor.getDate() + weeksFromAnchor * 7)
    const wEnd = new Date(wStart)
    wEnd.setDate(wStart.getDate() + 6)
    if (!groups.has(weekNumber)) {
      groups.set(weekNumber, { weekNumber, items: [], startISO: wStart.toISOString(), endISO: wEnd.toISOString() })
    }
    groups.get(weekNumber).items.push(item)
  })
  return Array.from(groups.values()).sort((a, b) => a.weekNumber - b.weekNumber)
}

function JourneyItemRow({ item, linked, routineName, onAction, onViewSession }) {
  return (
    <div className="card" style={{
      padding: '12px 12px',
      display: 'flex', alignItems: 'center', gap: 12,
      border: '1px solid var(--border)',
    }}>
      {/* Completion circle — visual only, filled only when a session is linked */}
      <div style={{
        flexShrink: 0, width: 28, height: 28, borderRadius: 999,
        background: item.completed ? 'var(--good)' : 'transparent',
        border: item.completed ? 'none' : '1.5px solid var(--border-2)',
        color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {item.completed && <Icon name="check" size={16} stroke={2.4} />}
      </div>

      {/* Date tile */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: 'var(--surface-2)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {new Date(item.date).toLocaleDateString('en-AU', { weekday: 'short' })}
        </div>
        <div className="mono" style={{ fontSize: 17, fontWeight: 600, lineHeight: 1, color: 'var(--ink)' }}>
          {new Date(item.date).getDate()}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600, fontSize: 15,
          color: item.completed ? 'var(--muted)' : 'var(--ink)',
          textDecoration: item.completed ? 'line-through' : 'none',
          display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap',
        }}>
          {item.type}
          {routineName && (
            <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--muted)', fontSize: 13 }}>
              {routineName}
            </span>
          )}
        </div>
        {linked && (
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            {linked.routine_name || 'Workout'} · {fmtDur(linked.started_at, linked.completed_at)}
          </div>
        )}
      </div>

      {/* Right action — arrow when done, Start workout when pending */}
      {item.completed ? (
        <button
          onClick={() => onViewSession(item.linked_session_id)}
          style={{
            flexShrink: 0, background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--ink-2)',
            padding: '7px 4px', display: 'flex', alignItems: 'center',
          }}
        >
          <Icon name="chev-r" size={18} />
        </button>
      ) : (
        <button
          onClick={() => onAction(item)}
          style={{
            flexShrink: 0,
            background: 'var(--accent)',
            color: 'var(--bg)',
            border: 'none',
            borderRadius: 8,
            padding: '7px 10px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}
        >
          Start
        </button>
      )}
    </div>
  )
}

export default function JourneyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { journeys, linkItem, deleteJourney } = useJourneys()
  const { sessions } = useHistory()
  const { routines } = useRoutines()
  const { weekStart } = useWeekStart()
  const [activities, setActivities] = useState([])

  useEffect(() => {
    supabase.from('activities').select('*').then(({ data }) => {
      if (data) setActivities(data)
    })
  }, [])

  // Action sheet state
  const [actionItem, setActionItem] = useState(null)   // the item being actioned
  const [sheetMode, setSheetMode] = useState('menu')   // 'menu' | 'sessions' | 'routines'

  // Delete sheet state
  const [showDeleteSheet, setShowDeleteSheet] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const journey = journeys.find(j => j.id === id)

  if (!journey) {
    return (
      <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Journey not found.</div>
      </div>
    )
  }

  const pct = journeyPct(journey)
  const completed = journey.items.filter(i => i.completed).length
  const total = journey.items.length
  const daysLeft = daysUntil(journey.target_date)
  const weeks = groupByWeek(journey, weekStart)

  const goalDay = new Date(journey.target_date).getDate()
  const goalMonth = new Date(journey.target_date).toLocaleDateString('en-AU', { month: 'short' })

  const openAction = (item) => {
    setActionItem(item)
    setSheetMode('menu')
  }

  const closeSheet = () => setActionItem(null)

  const handleStartWorkout = (routineId) => {
    const currentItem = actionItem
    closeSheet()
    navigate(`/workout/${routineId}?journeyId=${journey.id}&itemId=${currentItem.id}`)
  }

  const handleStartActivity = (activity) => {
    const currentItem = actionItem
    closeSheet()
    navigate('/activity/log', { state: { activity, journeyId: journey.id, journeyItemId: currentItem?.id } })
  }

  const handleLinkSession = (session) => {
    linkItem(journey.id, actionItem.id, session.id)
    closeSheet()
  }

  const handleDeleteJourney = async () => {
    setDeleting(true)
    deleteJourney(id)
    navigate('/journeys', { replace: true })
  }

  const hasRoutine = actionItem?.routine_id
  const hasActivity = actionItem?.activity_id
  const hasLinked = hasRoutine || hasActivity

  return (
    <div style={{
      background: 'var(--bg)', height: '100dvh',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '8px 18px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 44, gap: 4 }}>
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
          <div style={{ flex: 1 }} />
          <button
            onClick={() => navigate(`/journeys/${id}/edit`)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink)', padding: 0,
            }}
          >
            <Icon name="edit" size={16} />
          </button>
          <button
            onClick={() => setShowDeleteSheet(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--danger)', padding: 0,
            }}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 18px 24px' }}>

        {/* Hero */}
        <div style={{ padding: '8px 0 18px' }}>
          <div className="eyebrow" style={{ color: progressColor(pct), marginBottom: 6 }}>
            <Icon name="flag" size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
            Journey
          </div>
          <div style={{
            fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em',
            lineHeight: 1.1, color: 'var(--ink)', marginBottom: 4,
          }}>
            {journey.title}
          </div>
          {journey.goal && <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>{journey.goal}</div>}
        </div>

        {/* Progress card */}
        <div className="card" style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ProgressRing pct={pct} size={104} stroke={9} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mono" style={{
                fontSize: 26, fontWeight: 600, lineHeight: 1,
                letterSpacing: '-0.03em', color: 'var(--ink)',
              }}>
                {completed}<span style={{ color: 'var(--faint)', fontSize: 18 }}>/{total}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>workouts done</div>
              <div style={{ marginTop: 14 }}>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1, color: 'var(--ink)' }}>
                  {daysLeft > 0 ? daysLeft : 0}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>days left</div>
              </div>
            </div>

            {/* Goal date — right side, large */}
            <div style={{
              flexShrink: 0, textAlign: 'center',
              borderLeft: '1px solid var(--border)', paddingLeft: 16,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              alignSelf: 'stretch',
            }}>
              <div className="mono" style={{
                fontSize: 36, fontWeight: 700, lineHeight: 1,
                letterSpacing: '-0.04em', color: 'var(--ink)',
              }}>
                {goalDay}
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', marginTop: 2, letterSpacing: '-0.01em' }}>
                {goalMonth}
              </div>
              <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Goal
              </div>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div style={{ padding: '4px 4px 10px' }}>
          <div className="eyebrow">Plan</div>
        </div>

        {weeks.map(w => {
          const wDone = w.items.filter(i => i.completed).length
          return (
            <div key={w.weekNumber} style={{ marginBottom: 18 }}>
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                padding: '4px 4px 8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span className="eyebrow">Week {w.weekNumber}</span>
                  <span style={{ fontSize: 11, color: 'var(--faint)' }}>
                    {fmtDate(w.startISO)} – {fmtDate(w.endISO)}
                  </span>
                </div>
                <span className="mono" style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                  ...countChipStyle(wDone, w.items.length),
                }}>
                  {wDone}/{w.items.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {w.items.map(item => {
                  const linked = item.linked_session_id
                    ? sessions.find(s => s.id === item.linked_session_id)
                    : null
                  const linkedName = item.routine_id
                    ? routines.find(r => r.id === item.routine_id)?.name
                    : item.activity_id
                    ? activities.find(a => a.id === item.activity_id)?.name
                    : null
                  return (
                    <JourneyItemRow
                      key={item.id}
                      item={item}
                      linked={linked}
                      routineName={linkedName}
                      onAction={openAction}
                      onViewSession={(sessionId) => navigate(`/history/${sessionId}`)}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Action bottom sheet */}
      {actionItem && (
        <BottomSheet open={true} onClose={closeSheet} title={actionItem.type}>

          {/* ── Menu view ── */}
          {sheetMode === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {hasLinked ? (
                <>
                  {hasRoutine ? (
                    <button className="btn btn-primary" onClick={() => handleStartWorkout(actionItem.routine_id)}>
                      <Icon name="play" size={14} /> Start workout
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={() => {
                      const act = activities.find(a => a.id === actionItem.activity_id)
                      if (act) handleStartActivity(act)
                    }}>
                      <Icon name="play" size={14} /> Start activity
                    </button>
                  )}
                  <button className="btn btn-ghost" onClick={() => setSheetMode('sessions')}>
                    Select from finished activity
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={() => setSheetMode('picker')}>
                    <Icon name="play" size={14} /> Select activity
                  </button>
                  <button className="btn btn-ghost" onClick={() => setSheetMode('sessions')}>
                    Select from finished activity
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Finished sessions list ── */}
          {sheetMode === 'sessions' && (
            <>
              <button
                onClick={() => setSheetMode('menu')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}
              >
                <Icon name="chev-l" size={14} /> Back
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '52vh', overflowY: 'auto' }}>
                {sessions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 14 }}>
                    No finished activities yet.
                  </div>
                ) : sessions.slice(0, 30).map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleLinkSession(s)}
                    style={{
                      width: '100%', textAlign: 'left',
                      background: 'var(--surface-2)', border: 'none', cursor: 'pointer',
                      padding: '12px 14px', borderRadius: 12,
                      display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{s.routine_name || 'Once-off'}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {new Date(s.completed_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' · '}{fmtDur(s.started_at, s.completed_at)}
                      </div>
                    </div>
                    <Icon name="chev-r" size={14} style={{ color: 'var(--faint)' }} />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Combined workout / activity picker ── */}
          {sheetMode === 'picker' && (
            <>
              <button
                onClick={() => setSheetMode('menu')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}
              >
                <Icon name="chev-l" size={14} /> Back
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '56vh', overflowY: 'auto' }}>

                {/* Workouts section */}
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 4px 4px' }}>
                  Workouts
                </div>
                {routines.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleStartWorkout(r.id)}
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
                    <div style={{ flex: 1, fontSize: 15, fontWeight: 400, color: 'var(--ink)' }}>{r.name}</div>
                  </button>
                ))}
                <button
                  onClick={() => handleStartWorkout('freestyle')}
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
                    color: 'var(--ink)',
                  }}>
                    <Icon name="sparkle" size={14} />
                  </div>
                  <div style={{ flex: 1, fontSize: 15, fontWeight: 400, color: 'var(--ink)' }}>Once-off workout</div>
                </button>

                {/* Activities section */}
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 4px 4px' }}>
                  Activities
                </div>
                {activities.map(a => (
                  <button
                    key={a.id}
                    onClick={() => handleStartActivity(a)}
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
                    <div style={{ flex: 1, fontSize: 15, fontWeight: 400, color: 'var(--ink)' }}>{a.name}</div>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                      padding: '2px 6px', borderRadius: 4,
                      background: 'var(--surface-2)', color: 'var(--muted)',
                      textTransform: 'uppercase',
                    }}>
                      {a.type === 'run' ? 'Run' : 'Sport'}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

        </BottomSheet>
      )}

      {/* Delete journey sheet */}
      {showDeleteSheet && (
        <BottomSheet open={showDeleteSheet} onClose={() => !deleting && setShowDeleteSheet(false)}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
              Delete this journey?
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
              <strong>{journey.title}</strong> and all its progress will be permanently deleted. This cannot be undone.
            </div>
          </div>
          <button
            className="btn btn-danger"
            onClick={handleDeleteJourney}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete journey'}
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
    </div>
  )
}
