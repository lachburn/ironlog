import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoutines } from '../hooks/useRoutines'
import { useHistory } from '../hooks/useHistory'
import { useJourneys } from '../hooks/useJourneys'
import { useActiveWorkout } from '../context/ActiveWorkoutContext'
import BottomSheet from '../components/BottomSheet'
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

function toYMD(d) {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function workoutsThisWeek(sessions) {
  const now = new Date()
  const daysSinceMon = (now.getDay() + 6) % 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysSinceMon)
  monday.setHours(0, 0, 0, 0)
  return sessions.filter(s => new Date(s.completed_at) >= monday).length
}

function calcStreak(sessions) {
  const dateSet = new Set(sessions.map(s => toYMD(s.completed_at)))
  const today = new Date()
  const todayStr = toYMD(today)
  const startOffset = dateSet.has(todayStr) ? 0 : 1
  let streak = 0
  for (let i = startOffset; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (dateSet.has(toYMD(d))) streak++
    else break
  }
  return streak
}

function timeAgo(iso) {
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function Monogram({ name, emoji, size = 48 }) {
  const letter = (name || '?').trim().charAt(0).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.27),
      background: 'var(--chip-bg)', color: 'var(--chip-ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: emoji ? Math.round(size * 0.52) : Math.round(size * 0.42),
      fontWeight: 600, letterSpacing: '-0.02em', flexShrink: 0,
    }}>
      {emoji || letter}
    </div>
  )
}

function TypeChip({ type }) {
  const labels = { weighted: 'Weighted', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight', cardio: 'Cardio' }
  return (
    <span className="eyebrow" style={{
      display: 'inline-block', padding: '3px 8px', borderRadius: 6,
      background: 'var(--surface-2)', color: 'var(--muted)', letterSpacing: '0.06em', fontSize: 10,
    }}>
      {labels[type] || type}
    </span>
  )
}

function progressHue(pct) { return Math.round(pct * 330) }
function progressColor(pct) { return `oklch(64% 0.16 ${progressHue(pct)})` }

function JourneyCard({ journey, navigate }) {
  const pct = journey.items.length
    ? journey.items.filter(i => i.completed).length / journey.items.length
    : 0
  const done = journey.items.filter(i => i.completed).length
  const total = journey.items.length
  const daysLeft = Math.ceil((new Date(journey.target_date) - new Date()) / 86400000)
  const size = 76
  const stroke = 7
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = c * Math.max(0, Math.min(1, pct))
  const color = progressColor(pct)

  return (
    <button
      className="card row-tap"
      onClick={() => navigate(`/journeys/${journey.id}`)}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        padding: '14px 14px', marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'var(--surface)', border: '1px solid var(--border)',
      }}
    >
      {/* Mini ring */}
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
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="mono" style={{
            fontSize: 16, fontWeight: 600, letterSpacing: '-0.03em',
            color: 'var(--ink)', lineHeight: 1,
          }}>
            {Math.round(pct * 100)}<span style={{ fontSize: 10, color: 'var(--muted)' }}>%</span>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="eyebrow" style={{ color: progressColor(pct), marginBottom: 2 }}>Journey</div>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {journey.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
          {done} / {total} · {daysLeft > 0 ? `${daysLeft} days left` : 'Goal day!'}
        </div>
      </div>
      <Icon name="chev-r" size={16} style={{ color: 'var(--faint)', flexShrink: 0 }} />
    </button>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { routines, loading } = useRoutines()
  const { sessions } = useHistory()
  const { journeys } = useJourneys()
  const { activeWorkout } = useActiveWorkout()
  const [picked, setPicked] = useState(null)

  const lastSession = sessions[0] ?? null
  const weekCount = workoutsThisWeek(sessions)
  const streak = calcStreak(sessions)
  const totalSessions = sessions.length
  const activeJourney = journeys[0] ?? null

  return (
    <div style={{
      background: 'var(--bg)', height: '100dvh',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.05, color: 'var(--ink)' }}>
            Train
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '10px 18px 24px' }}>

        {/* Stats card */}
        <div className="card" style={{ padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="eyebrow">This week</div>
            {lastSession && (
              <button
                onClick={() => navigate(`/history/${lastSession.id}`)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--muted)', fontSize: 12,
                  display: 'flex', alignItems: 'center', gap: 2, fontFamily: 'inherit',
                }}
              >
                Last session <Icon name="chev-r" size={12} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            {[
              { v: weekCount, l: 'sessions' },
              { v: streak, l: streak === 1 ? 'day streak' : 'days streak' },
              { v: totalSessions, l: 'all-time' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, borderLeft: i ? '1px solid var(--border)' : 'none', paddingLeft: i ? 14 : 0 }}>
                <div className="mono" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
                  {s.v}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Journey card */}
        {activeJourney && <JourneyCard journey={activeJourney} navigate={navigate} />}

        {/* Routines header */}
        <div style={{ marginBottom: 10, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="eyebrow">Routines</div>
          <button
            onClick={() => navigate('/routines/new')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#fff', fontSize: 13, fontWeight: 500,
              fontFamily: 'inherit', padding: 0,
            }}
          >
            + New routine
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {routines.map(r => {
              const lastForR = sessions.find(s => s.routine_id === r.id)
              const exCount = r.routine_exercises?.length || 0
              return (
                <button
                  key={r.id}
                  onClick={() => setPicked(r)}
                  className="card row-tap"
                  style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer',
                    padding: '14px 14px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                  }}
                >
                  <Monogram name={r.name} emoji={r.emoji} size={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {exCount} exercise{exCount !== 1 ? 's' : ''}{lastForR ? ` · ${timeAgo(lastForR.completed_at)}` : ' · never'}
                    </div>
                  </div>
                  <Icon name="chev-r" size={16} style={{ color: 'var(--faint)', flexShrink: 0 }} />
                </button>
              )
            })}

          </div>
        )}

        {/* Once-off workout */}
        <button
          onClick={() => navigate('/workout/freestyle')}
          className="card row-tap"
          style={{
            width: '100%', textAlign: 'left', cursor: 'pointer',
            marginTop: 8, padding: '14px 14px',
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'var(--surface)', border: '1px dashed var(--border)',
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 13,
            background: 'var(--surface-2)', color: 'var(--ink-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="sparkle" size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>Once-off workout</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Quick session, won't save as routine</div>
          </div>
          <Icon name="chev-r" size={16} style={{ color: 'var(--faint)', flexShrink: 0 }} />
        </button>
      </div>

      <BottomNav />

      {/* Routine preview sheet */}
      {picked && (
        <BottomSheet open={!!picked} onClose={() => setPicked(null)} title={picked?.name}>
          <RoutinePreview
            routine={picked}
            onStart={() => { setPicked(null); navigate(`/workout/${picked.id}`) }}
            onEdit={() => { setPicked(null); navigate(`/routines/${picked.id}/edit`) }}
          />
        </BottomSheet>
      )}
    </div>
  )
}

function RoutinePreview({ routine, onStart, onEdit }) {
  const exercises = routine.routine_exercises || []
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        {exercises.map((re, i) => {
          const ex = re.exercises || {}
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0',
              borderBottom: i === exercises.length - 1 ? 'none' : '1px solid var(--border)',
            }}>
              <div className="mono" style={{ width: 22, color: 'var(--muted)', fontSize: 13 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{ex.name || 'Unknown'}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>
                  {re.default_sets} × {re.default_reps}
                  {re.default_weight > 0 ? ` · ${re.default_weight}kg` : ''}
                </div>
              </div>
              <TypeChip type={ex.type} />
            </div>
          )
        })}
      </div>
      <button className="btn btn-primary" onClick={onStart}>
        <Icon name="play" size={14} /> Start workout
      </button>
      <button className="btn btn-ghost" onClick={onEdit} style={{ marginTop: 8 }}>
        <Icon name="edit" size={14} /> Edit routine
      </button>
    </div>
  )
}
