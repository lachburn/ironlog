import { useRef } from 'react'

export default function RoutineTile({ routine, onClick, onLongPress }) {
  const exerciseCount = routine.routine_exercises?.length || 0
  const pressTimer = useRef(null)
  const didLongPress = useRef(false)

  const handleTouchStart = (e) => {
    didLongPress.current = false
    e.currentTarget.style.opacity = '0.75'
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true
      e.currentTarget.style.opacity = '1'
      onLongPress?.()
    }, 600)
  }

  const handleTouchEnd = (e) => {
    clearTimeout(pressTimer.current)
    e.currentTarget.style.opacity = '1'
  }

  const handleTouchMove = () => {
    clearTimeout(pressTimer.current)
  }

  const handleClick = () => {
    if (didLongPress.current) return
    onClick?.()
  }

  return (
    <button
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        transition: 'opacity 150ms ease',
        width: '100%',
        boxShadow: 'var(--shadow)',
        textAlign: 'left',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>{routine.emoji || '💪'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="font-display" style={{ fontSize: 22, color: 'var(--text-primary)', letterSpacing: 1, lineHeight: 1.1 }}>
          {routine.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 4 }}>
          {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
        </div>
      </div>
      <div style={{
        background: 'var(--accent)',
        color: '#000',
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'DM Sans',
        padding: '4px 12px',
        borderRadius: 999,
        flexShrink: 0,
        letterSpacing: 0.3,
      }}>
        ▶ Start
      </div>
    </button>
  )
}
