import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useHistory } from '../hooks/useHistory'
import { useJourneys } from '../hooks/useJourneys'
import { Icon } from '../components/Icon'

function parseMmSs(str) {
  if (!str) return null
  const parts = str.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + (parts[1] || 0)
  return parts[0] || null
}

function FieldBlock({ label, value, onChange, placeholder, inputMode, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        fontSize: 11, color: 'var(--muted)', fontWeight: 600,
        letterSpacing: '0.07em', textTransform: 'uppercase',
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '14px 16px', gap: 8,
      }}>
        <input
          type="text"
          inputMode={inputMode || 'numeric'}
          placeholder={placeholder || '—'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="mono"
          style={{
            flex: 1, background: 'transparent', border: 'none',
            color: 'var(--ink)', fontSize: 26, fontWeight: 600,
            outline: 'none', fontFamily: 'inherit', minWidth: 0,
          }}
          onFocus={e => e.target.select()}
        />
        {hint && (
          <span style={{ fontSize: 13, color: 'var(--muted)', flexShrink: 0 }}>{hint}</span>
        )}
      </div>
    </div>
  )
}

export default function LogActivity() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { user } = useAuth()
  const { fetchSessions } = useHistory()
  const { linkItem } = useJourneys()

  const activity = state?.activity
  const journeyId = state?.journeyId
  const journeyItemId = state?.journeyItemId

  const [duration, setDuration] = useState('')
  const [heartRate, setHeartRate] = useState('')
  const [calories, setCalories] = useState('')
  const [distance, setDistance] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleDurationChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) {
      setDuration(digits.slice(0, digits.length - 2) + ':' + digits.slice(-2))
    } else {
      setDuration(digits)
    }
  }

  const handleHeartRateChange = (val) => {
    setHeartRate(val.replace(/\D/g, '').slice(0, 3))
  }

  const handleDistanceChange = (val) => {
    let clean = val.replace(/[^\d.]/g, '')
    const dot = clean.indexOf('.')
    if (dot !== -1) {
      clean = clean.slice(0, dot + 1) + clean.slice(dot + 1).replace(/\./g, '')
      if (clean.length > dot + 3) clean = clean.slice(0, dot + 3)
    }
    setDistance(clean)
  }

  if (!activity) {
    navigate('/', { replace: true })
    return null
  }

  const isRun = activity.type === 'run'

  const handleSave = async () => {
    if (!duration.trim()) {
      setError('Please enter a duration')
      return
    }
    setSaving(true)
    setError('')

    const now = new Date().toISOString()
    const durSecs = parseMmSs(duration) || 0
    const startedAt = new Date(Date.now() - durSecs * 1000).toISOString()

    const { data: session, error: sessionErr } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        routine_id: null,
        routine_name: activity.name,
        session_type: 'activity',
        started_at: startedAt,
        completed_at: now,
      })
      .select()
      .single()

    if (sessionErr || !session) {
      setError('Failed to save. Please try again.')
      setSaving(false)
      return
    }

    await supabase.from('activity_logs').insert({
      session_id: session.id,
      activity_id: activity.id,
      activity_name: activity.name,
      activity_type: activity.type,
      duration_seconds: durSecs || null,
      avg_heart_rate: heartRate ? parseInt(heartRate) : null,
      calories: (!isRun && calories) ? parseInt(calories) : null,
      distance_metres: (isRun && distance) ? parseFloat(distance) * 1000 : null,
    })

    if (journeyId && journeyItemId) {
      await linkItem(journeyId, journeyItemId, session.id)
    }

    await fetchSessions()
    navigate(`/history/${session.id}`, { replace: true })
  }

  return (
    <div style={{
      background: 'var(--bg)', height: '100dvh',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: '8px 18px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--bg)',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'var(--surface-2)', border: 'none', borderRadius: 999,
            padding: '7px 13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--ink)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
          }}
        >
          <Icon name="chev-l" size={14} /> Back
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: 'var(--ink)', color: 'var(--bg)',
            border: 'none', borderRadius: 999,
            padding: '7px 16px', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Log Activity'}
        </button>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 48px' }}>
        {/* Activity name */}
        <div style={{ marginBottom: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Log activity</div>
          <div style={{
            fontSize: 34, fontWeight: 600, letterSpacing: '-0.025em',
            lineHeight: 1.05, color: 'var(--ink)', marginBottom: 10,
          }}>
            {activity.name}
          </div>
          <span className="eyebrow" style={{
            display: 'inline-block', padding: '3px 8px', borderRadius: 6,
            background: 'var(--surface-2)', color: 'var(--muted)',
            letterSpacing: '0.06em', fontSize: 10,
          }}>
            {isRun ? 'Run' : 'Sport'}
          </span>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FieldBlock
            label="Duration"
            value={duration}
            onChange={handleDurationChange}
            placeholder="00:00"
            inputMode="numeric"
            hint="mm:ss"
          />
          <FieldBlock
            label="Avg Heart Rate"
            value={heartRate}
            onChange={handleHeartRateChange}
            placeholder="—"
            hint="bpm"
          />
          {isRun ? (
            <FieldBlock
              label="Distance"
              value={distance}
              onChange={handleDistanceChange}
              placeholder="0.0"
              inputMode="decimal"
              hint="km"
            />
          ) : (
            <FieldBlock
              label="Calories Burnt"
              value={calories}
              onChange={setCalories}
              placeholder="—"
              hint="kcal"
            />
          )}
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 16 }}>{error}</div>
        )}

        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
            Enter your stats after completing the activity. Duration is required; other fields are optional.
          </p>
        </div>
      </div>
    </div>
  )
}
