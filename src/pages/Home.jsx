import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoutines } from '../hooks/useRoutines'
import RoutineTile from '../components/RoutineTile'
import BottomSheet from '../components/BottomSheet'
import ThemeToggle from '../components/ThemeToggle'

export default function Home() {
  const navigate = useNavigate()
  const { routines, loading } = useRoutines()
  const [selectedRoutine, setSelectedRoutine] = useState(null)

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
        padding: '56px 20px 16px',
        paddingTop: 'max(56px, calc(env(safe-area-inset-top) + 16px))',
        background: 'var(--bg)',
        flexShrink: 0,
      }}>
        <div className="font-display" style={{ fontSize: 36, color: 'var(--accent)', lineHeight: 1 }}>
          IRONLOG
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <ThemeToggle />
          <button
            onClick={() => navigate('/settings')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 22,
              padding: 8,
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              color: 'var(--text-secondary)',
            }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Routine grid */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '8px 16px 100px' }}>
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}>
            {routines.map(r => (
              <RoutineTile key={r.id} routine={r} onClick={() => setSelectedRoutine(r)} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/routines/new')}
        aria-label="New routine"
        style={{
          position: 'fixed',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)',
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

      {/* Routine bottom sheet */}
      <BottomSheet
        open={!!selectedRoutine}
        onClose={() => setSelectedRoutine(null)}
      >
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

            {/* Exercise list */}
            <div style={{ marginBottom: 20 }}>
              {(selectedRoutine.routine_exercises || []).map((re, i) => (
                <div key={re.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}>
                      {re.exercises?.name || 'Unknown'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      {re.default_sets} sets × {re.default_reps} reps
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn-primary"
              onClick={() => {
                navigate(`/workout/${selectedRoutine.id}`)
                setSelectedRoutine(null)
              }}
              style={{ marginBottom: 10 }}
            >
              Start Workout
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                navigate(`/routines/${selectedRoutine.id}/edit`)
                setSelectedRoutine(null)
              }}
            >
              Edit Routine
            </button>

            <button
              onClick={() => navigate('/history')}
              style={{
                display: 'block',
                width: '100%',
                background: 'none',
                border: 'none',
                padding: '12px 0 4px',
                color: 'var(--text-secondary)',
                fontFamily: 'DM Sans',
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              View History
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
