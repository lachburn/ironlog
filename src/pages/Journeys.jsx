import { useNavigate } from 'react-router-dom'
import { useJourneys } from '../hooks/useJourneys'
import { useActiveWorkout } from '../context/ActiveWorkoutContext'
import BottomNav from '../components/BottomNav'
import IronLogLogo from '../components/IronLogLogo'
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

function countChipStyle(done, total) {
  const complete = total > 0 && done === total
  return complete
    ? { background: 'color-mix(in oklch, var(--good) 18%, transparent)', color: 'var(--good)' }
    : { background: 'var(--accent-soft)', color: 'var(--accent)' }
}

function ProgressRing({ pct, size = 80, stroke = 7 }) {
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
          fontSize: Math.round(size * 0.24), fontWeight: 600,
          letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1,
        }}>
          {Math.round(pct * 100)}<span style={{ fontSize: Math.round(size * 0.13), color: 'var(--muted)', marginLeft: 1 }}>%</span>
        </div>
      </div>
    </div>
  )
}

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

export default function Journeys() {
  const navigate = useNavigate()
  const { journeys } = useJourneys()
  const { activeWorkout } = useActiveWorkout()

  return (
    <div style={{
      background: 'var(--bg)', height: '100dvh',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
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
          Journeys
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '10px 18px 24px' }}>

        {journeys.length > 0 && (
          <>
            <div className="eyebrow" style={{ padding: '4px 4px 8px' }}>In progress</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {journeys.map(j => {
                const pct = journeyPct(j)
                const done = j.items.filter(i => i.completed).length
                const total = j.items.length
                const days = daysUntil(j.target_date)
                return (
                  <button
                    key={j.id}
                    className="card row-tap"
                    onClick={() => navigate(`/journeys/${j.id}`)}
                    style={{
                      width: '100%', textAlign: 'left', cursor: 'pointer',
                      padding: '16px 16px',
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                    }}
                  >
                    <ProgressRing pct={pct} size={80} stroke={7} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{
                          fontWeight: 600, fontSize: 17, color: 'var(--ink)',
                          letterSpacing: '-0.01em', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {j.title}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', paddingTop: 2, flexShrink: 0 }}>
                          {days > 0 ? `${days}d left` : 'Goal day!'}
                        </span>
                      </div>
                      {j.goal && <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3 }}>{j.goal}</div>}
                      <div style={{ marginTop: 8 }}>
                        <span className="mono" style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                          ...countChipStyle(done, total),
                        }}>
                          {done}/{total}
                        </span>
                      </div>
                    </div>
                    <Icon name="chev-r" size={16} style={{ color: 'var(--faint)', flexShrink: 0, alignSelf: 'center' }} />
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* New journey CTA */}
        <button
          onClick={() => navigate('/journeys/new')}
          className="row-tap"
          style={{
            width: '100%', textAlign: 'left', cursor: 'pointer',
            padding: '14px 14px',
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'var(--surface)', border: '1px dashed var(--border-2)',
            borderRadius: 18, fontFamily: 'inherit',
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 13,
            background: 'var(--surface-2)', color: 'var(--ink-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="plus" size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>New Journey</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Train for a marathon, comp, or any long-term goal
            </div>
          </div>
          <Icon name="chev-r" size={16} style={{ color: 'var(--faint)', flexShrink: 0 }} />
        </button>

      </div>

      <BottomNav />
    </div>
  )
}
