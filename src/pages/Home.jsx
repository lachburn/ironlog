import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { useRoutines } from '../hooks/useRoutines'
import { useHistory } from '../hooks/useHistory'
import RoutineTile from '../components/RoutineTile'
import BottomSheet from '../components/BottomSheet'
import BottomNav from '../components/BottomNav'
import IronLogLogo from '../components/IronLogLogo'

// ── Date helpers ────────────────────────────────────────────────
function toYMD(d) {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function formatSessionDate(iso) {
  const d = new Date(iso)
  const weekday = d.toLocaleDateString('en-AU', { weekday: 'short' })
  const day = d.getDate()
  const month = d.toLocaleDateString('en-AU', { month: 'long' })
  return `${weekday} ${day} ${month}`
}

// ── Stats helpers ────────────────────────────────────────────────
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

// ── Card styles ──────────────────────────────────────────────────
const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  boxShadow: 'var(--shadow)',
}

export default function Home() {
  const navigate = useNavigate()
  const { routines, loading, deleteRoutine } = useRoutines()
  const { sessions, fetchSession } = useHistory()
  const [selectedRoutine, setSelectedRoutine] = useState(null)
  const [deletingRoutine, setDeletingRoutine] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [lastSets, setLastSets] = useState(null)
  const [showNewSheet, setShowNewSheet] = useState(false)

  // Fetch sets for the most recent session to compute volume
  useEffect(() => {
    if (!sessions.length) return
    fetchSession(sessions[0].id).then(({ sets }) => setLastSets(sets || []))
  }, [sessions])

  const handleDelete = async () => {
    if (!deletingRoutine) return
    setDeleting(true)
    await deleteRoutine(deletingRoutine.id)
    setDeletingRoutine(null)
    setDeleting(false)
  }

  const lastSession = sessions[0] ?? null
  const durationMins = lastSession
    ? Math.round((new Date(lastSession.completed_at) - new Date(lastSession.started_at)) / 60000)
    : 0
  const totalVolume = lastSets
    ? lastSets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0)
    : null

  const weekCount = workoutsThisWeek(sessions)
  const streak = calcStreak(sessions)
  const totalSessions = sessions.length

  return (
    <div style={{
      background: 'var(--bg)',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px 16px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        background: 'var(--bg)',
        flexShrink: 0,
      }}>
        <IronLogLogo height={42} />
        <button
          onClick={() => navigate('/settings')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            minWidth: 44,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            color: 'var(--accent)',
          }}
        >
          <SlidersHorizontal size={22} />
        </button>
      </div>

      {/* Scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '8px 16px 120px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading…</div>
          </div>
        ) : routines.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💪</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: 'var(--text-primary)', marginBottom: 8 }}>
              NO ROUTINES YET
            </div>
            <div style={{ fontSize: 14 }}>Tap + to create your first workout routine</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {routines.map(r => (
              <RoutineTile
                key={r.id}
                routine={r}
                onClick={() => setSelectedRoutine(r)}
                onLongPress={() => setDeletingRoutine(r)}
              />
            ))}
          </div>
        )}

        {/* ── Last Session card ── */}
        {lastSession && (
          <div style={{ ...card, padding: '16px 18px', marginTop: 20 }}>
            <div className="font-display" style={{ fontSize: 13, color: 'var(--accent)', letterSpacing: 1, marginBottom: 10 }}>
              LAST SESSION
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {lastSession.routine_name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {formatSessionDate(lastSession.completed_at)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {durationMins}m
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>duration</div>
              </div>
            </div>
            {totalVolume !== null && totalVolume > 0 && (
              <div style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total volume</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {totalVolume.toLocaleString()} kg
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Weekly stats strip ── */}
        {sessions.length > 0 && (
          <div style={{ ...card, padding: '14px 16px', marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { icon: '🗓', value: weekCount, label: 'This week' },
                { icon: '🔥', value: streak, label: 'Day streak' },
                { icon: '💪', value: totalSessions, label: 'All time' },
              ].map(({ icon, value, label }) => (
                <div key={label} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '10px 4px',
                  background: 'var(--bg)',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 18 }}>{icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowNewSheet(true)}
        aria-label="New workout"
        style={{
          position: 'fixed',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)',
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--accent)',
          color: '#000',
          border: 'none',
          fontSize: 28,
          fontWeight: 300,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 30,
          transition: 'transform 200ms ease',
        }}
        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.92)'}
        onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        +
      </button>

      {/* New workout sheet */}
      <BottomSheet open={showNewSheet} onClose={() => setShowNewSheet(false)}>
        <div style={{ padding: '8px 20px 20px' }}>
          <div className="font-display" style={{ fontSize: 22, color: 'var(--text-primary)', letterSpacing: 1, marginBottom: 20 }}>
            START A WORKOUT
          </div>
          <button
            className="btn-primary"
            onClick={() => { setShowNewSheet(false); navigate('/routines/new') }}
            style={{ marginBottom: 12 }}
          >
            Create New Routine
          </button>
          <button
            className="btn-ghost"
            onClick={() => { setShowNewSheet(false); navigate('/workout/freestyle') }}
          >
            Once-Off Workout
          </button>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
            Once-off workouts let you pick exercises on the fly.<br />You can save the session as a routine afterwards.
          </div>
        </div>
      </BottomSheet>

      {/* Routine action sheet */}
      <BottomSheet open={!!selectedRoutine} onClose={() => setSelectedRoutine(null)}>
        {selectedRoutine && (
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 48 }}>{selectedRoutine.emoji || '💪'}</span>
              <div>
                <div className="font-display" style={{ fontSize: 28, color: 'var(--text-primary)', letterSpacing: 1 }}>
                  {selectedRoutine.name}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {selectedRoutine.routine_exercises?.length || 0} exercises
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              {(selectedRoutine.routine_exercises || []).map((re, i) => (
                <div key={re.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'var(--accent)', color: '#000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}>
                      {re.exercises?.name || 'Unknown'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      {re.default_sets} sets × {re.default_reps} reps
                      {re.default_weight > 0 ? ` @ ${re.default_weight}kg` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-primary" onClick={() => { navigate(`/workout/${selectedRoutine.id}`); setSelectedRoutine(null) }} style={{ marginBottom: 10 }}>
              Start Workout
            </button>
            <button className="btn-ghost" onClick={() => { navigate(`/routines/${selectedRoutine.id}/edit`); setSelectedRoutine(null) }}>
              Edit Routine
            </button>
            <button
              onClick={() => navigate('/history')}
              style={{
                display: 'block', width: '100%', background: 'none', border: 'none',
                padding: '12px 0 4px', color: 'var(--text-secondary)',
                fontFamily: 'DM Sans', fontSize: 13, cursor: 'pointer', textAlign: 'center',
              }}
            >
              View History
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Delete confirmation sheet */}
      <BottomSheet open={!!deletingRoutine} onClose={() => setDeletingRoutine(null)}>
        {deletingRoutine && (
          <div style={{ padding: '8px 20px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Delete "{deletingRoutine.name}"?
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                This will permanently delete the routine. Your workout history will not be affected.
              </div>
            </div>
            <button className="btn-destructive" onClick={handleDelete} disabled={deleting} style={{ marginBottom: 10, opacity: deleting ? 0.5 : 1 }}>
              {deleting ? 'Deleting…' : 'Delete Routine'}
            </button>
            <button className="btn-ghost" onClick={() => setDeletingRoutine(null)}>Cancel</button>
          </div>
        )}
      </BottomSheet>

      <BottomNav />
    </div>
  )
}
