import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useWeightUnit } from '../context/WeightUnitContext'
import { useWeekStart } from '../context/WeekStartContext'
import { Icon } from '../components/Icon'

export default function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { unit: weightUnit, setUnit: handleWeightUnit } = useWeightUnit()
  const { weekStart, setWeekStart } = useWeekStart()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
  }

  const initial = (user?.email || 'A').charAt(0).toUpperCase()

  const THEMES = [
    { id: 'light',  label: 'Light',  icon: 'sun',     bg: 'oklch(98.4% 0.005 80)',  iconColor: 'oklch(38% 0.012 60)' },
    { id: 'dark',   label: 'Dark',   icon: 'moon',    bg: 'oklch(15% 0.008 250)',   iconColor: 'oklch(96% 0.005 250)' },
    { id: 'tilly',  label: 'Tilly',  icon: 'sparkle', bg: 'oklch(93% 0.055 350)',   iconColor: 'oklch(62% 0.28 350)' },
  ]

  const WEEK_DAYS = [
    { id: 1, label: 'Monday' },
    { id: 0, label: 'Sunday' },
    { id: 6, label: 'Saturday' },
  ]

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
        flexShrink: 0,
        padding: '8px 18px 8px',
        background: 'var(--bg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 44, gap: 10 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ink)',
              padding: 0,
            }}
          >
            <Icon name="chev-l" size={18} />
          </button>
          <div style={{
            flex: 1,
            textAlign: 'center',
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: '-0.01em',
          }}>
            Settings
          </div>
          <div style={{ width: 36 }} />
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 18px 40px' }}>

        {/* Avatar + user info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0 20px' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            background: 'var(--accent)',
            color: 'var(--accent-ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {initial}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>
              {user?.email || 'Athlete'}
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="eyebrow" style={{ padding: '8px 4px 6px' }}>Appearance</div>
        <div className="card" style={{ padding: 6, marginBottom: 18 }}>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: theme === t.id ? 'var(--surface-2)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '12px 12px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: 'var(--ink)',
                transition: 'background .15s ease',
              }}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: t.bg,
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: t.iconColor,
                flexShrink: 0,
              }}>
                <Icon name={t.icon} size={14} />
              </div>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{t.label}</div>
              {theme === t.id && (
                <Icon name="check" size={16} style={{ color: 'var(--accent)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Units */}
        <div className="eyebrow" style={{ padding: '8px 4px 6px' }}>Units</div>
        <div className="card" style={{ padding: 6, marginBottom: 18 }}>
          {[
            { value: 'kg', label: 'Kilograms (kg)' },
            { value: 'lbs', label: 'Pounds (lb)' },
          ].map(u => (
            <button
              key={u.value}
              onClick={() => handleWeightUnit(u.value)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: weightUnit === u.value ? 'var(--surface-2)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '12px 12px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: 'var(--ink)',
                transition: 'background .15s ease',
              }}
            >
              <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{u.label}</div>
              {weightUnit === u.value && (
                <Icon name="check" size={16} style={{ color: 'var(--accent)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Week starts on */}
        <div className="eyebrow" style={{ padding: '8px 4px 6px' }}>Week starts on</div>
        <div className="card" style={{ padding: 6, marginBottom: 18 }}>
          {WEEK_DAYS.map(d => (
            <button
              key={d.id}
              onClick={() => setWeekStart(d.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: weekStart === d.id ? 'var(--surface-2)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '12px 12px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: 'var(--ink)',
                transition: 'background .15s ease',
                fontFamily: 'inherit',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'var(--surface-2)', color: 'var(--ink-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name="calendar" size={14} />
              </div>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{d.label}</div>
              {weekStart === d.id && (
                <Icon name="check" size={16} style={{ color: 'var(--accent)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Account */}
        <div className="eyebrow" style={{ padding: '8px 4px 6px' }}>Account</div>
        <div className="card" style={{ padding: 6 }}>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '12px 12px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: 'var(--danger)',
              fontSize: 14,
              fontWeight: 500,
              opacity: signingOut ? 0.5 : 1,
              transition: 'opacity .15s ease',
              fontFamily: 'inherit',
            }}
          >
            <Icon name="log-out" size={16} />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 26, color: 'var(--faint)', fontSize: 11 }}>
          ironlog · v0.1.3
        </div>
      </div>
    </div>
  )
}
