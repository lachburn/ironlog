import { useRef } from 'react'

export default function RoutineTile({ routine, onClick, onLongPress }) {
  const exerciseCount = routine.routine_exercises?.length || 0
  const pressTimer = useRef(null)
  const didLongPress = useRef(false)

  const handleTouchStart = (e) => {
    didLongPress.current = false
    e.currentTarget.style.transform = 'scale(0.97)'
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true
      e.currentTarget.style.transform = 'scale(1)'
      onLongPress?.()
    }, 600)
  }

  const handleTouchEnd = (e) => {
    clearTimeout(pressTimer.current)
    e.currentTarget.style.transform = 'scale(1)'
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
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: 'pointer',
        transition: 'transform 200ms ease, border-color 200ms ease',
        minHeight: 130,
        width: '100%',
        boxShadow: 'var(--shadow)',
        textAlign: 'center',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div style={{ fontSize: 40, lineHeight: 1 }}>{routine.emoji || '💪'}</div>
      <div className="font-display" style={{ fontSize: 20, color: 'var(--text-primary)', letterSpacing: 1 }}>
        {routine.name}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
        {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
      </div>
    </button>
  )
}
