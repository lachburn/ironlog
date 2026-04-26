export default function RoutineTile({ routine, onClick }) {
  const exerciseCount = routine.routine_exercises?.length || 0

  return (
    <button
      onClick={onClick}
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
      }}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
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
