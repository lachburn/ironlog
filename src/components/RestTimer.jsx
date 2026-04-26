import { useEffect, useRef, useState } from 'react'

export default function RestTimer({ seconds = 90, onDismiss }) {
  const [remaining, setRemaining] = useState(seconds)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(intervalRef.current)
          onDismiss?.()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [onDismiss])

  const pct = (remaining / seconds) * 100
  const r = 28
  const circ = 2 * Math.PI * r

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '12px 16px',
      marginTop: 16,
    }}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          transform="rotate(-90 32 32)"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        <text x="32" y="37" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontFamily="DM Sans" fontWeight="600">
          {remaining}s
        </text>
      </svg>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Rest Timer</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Take a breather</div>
      </div>

      <button
        onClick={onDismiss}
        style={{
          background: 'var(--border)',
          border: 'none',
          borderRadius: 10,
          padding: '8px 14px',
          color: 'var(--text-secondary)',
          fontFamily: 'DM Sans',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          minHeight: 36,
        }}
      >
        Skip
      </button>
    </div>
  )
}
