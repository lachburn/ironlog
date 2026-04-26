import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [weightUnit, setWeightUnit] = useState(() => localStorage.getItem('ironlog-weight-unit') || 'kg')
  const [signingOut, setSigningOut] = useState(false)

  const handleWeightUnit = (unit) => {
    setWeightUnit(unit)
    localStorage.setItem('ironlog-weight-unit', unit)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
  }

  const Row = ({ label, children }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 0',
      borderBottom: '1px solid var(--border)',
      minHeight: 56,
    }}>
      <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  )

  const SegmentedControl = ({ value, options, onChange }) => (
    <div style={{
      display: 'flex',
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: 2,
      gap: 2,
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'DM Sans',
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 200ms ease',
            background: value === opt.value ? 'var(--accent)' : 'transparent',
            color: value === opt.value ? '#000' : 'var(--text-secondary)',
            minHeight: 34,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )

  return (
    <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '56px 16px 16px',
        paddingTop: 'max(56px, calc(env(safe-area-inset-top) + 16px))',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--accent)', padding: '4px 8px', minHeight: 44 }}
        >
          ←
        </button>
        <div className="font-display" style={{ fontSize: 26, color: 'var(--text-primary)', letterSpacing: 1 }}>
          SETTINGS
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 16px 40px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, padding: '20px 0 4px' }}>
          Preferences
        </div>

        <Row label="Theme">
          <SegmentedControl
            value={theme}
            options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]}
            onChange={toggleTheme}
          />
        </Row>

        <Row label="Weight Unit">
          <SegmentedControl
            value={weightUnit}
            options={[{ value: 'kg', label: 'kg' }, { value: 'lbs', label: 'lbs' }]}
            onChange={handleWeightUnit}
          />
        </Row>

        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, padding: '20px 0 4px' }}>
          Account
        </div>

        <Row label="Email">
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{user?.email}</div>
        </Row>

        <div style={{ marginTop: 24 }}>
          <button
            className="btn-destructive"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>

        <div style={{ textAlign: 'center', paddingTop: 32, color: 'var(--text-secondary)', fontSize: 12 }}>
          <div className="font-display" style={{ fontSize: 20, color: 'var(--accent)', marginBottom: 4 }}>IRONLOG</div>
          Track every rep. Own every session.
        </div>
      </div>
    </div>
  )
}
