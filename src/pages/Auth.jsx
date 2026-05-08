import { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import IronLogLogo from '../components/IronLogLogo'
import { Icon } from '../components/Icon'

export default function Auth() {
  const { sendOtp, verifyOtp } = useAuth()
  const [email, setEmail] = useState('')
  const [step, setStep] = useState('email') // 'email' | 'pin'
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef([])

  const pinValue = pin.join('')

  // Step 1: send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await sendOtp(email)
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setStep('pin')
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }

  // Step 2: verify OTP
  const handleVerify = async (e) => {
    e?.preventDefault()
    if (pinValue.length < 6) return
    setError('')
    setLoading(true)
    const { error: err } = await verifyOtp(email, pinValue)
    setLoading(false)
    if (err) {
      setError('Invalid code. Try again.')
      setPin(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    }
    // On success, AuthContext's onAuthStateChange fires and navigates automatically
  }

  const handlePinChange = (i, val) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...pin]
    next[i] = digit
    setPin(next)
    if (digit && i < 5) inputRefs.current[i + 1]?.focus()
    if (digit && i === 5) {
      const complete = [...next].join('')
      if (complete.length === 6) setTimeout(() => handleVerify(), 100)
    }
  }

  const handlePinKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !pin[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  const handlePinPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6)
      setPin(next)
      inputRefs.current[Math.min(pasted.length, 5)]?.focus()
      if (pasted.length === 6) setTimeout(() => handleVerify(), 100)
      e.preventDefault()
    }
  }

  return (
    <div style={{
      background: 'var(--bg)',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflow: 'hidden',
    }}>
      {/* Main content — centered */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 28px',
      }}>
        {/* Logo + wordmark */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ marginBottom: 14 }}>
            <IronLogLogo height={52} />
          </div>
          <div style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: 'var(--ink)',
          }}>
            ironlog
          </div>
          <div style={{
            fontSize: 15,
            color: 'var(--muted)',
            marginTop: 8,
          }}>
            {step === 'email'
              ? 'Welcome back. Lift heavy, log clean.'
              : 'Check your email for a 6-digit code.'}
          </div>
        </div>

        {step === 'email' ? (
          /* ── Step 1: email ── */
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Email</div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--surface-2)',
                borderRadius: 14,
                padding: '0 14px',
                border: '1px solid var(--border)',
              }}>
                <Icon name="mail" size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                <input
                  type="email"
                  placeholder="you@athlete.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '14px 0',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--ink)',
                    fontSize: 16,
                    outline: 'none',
                    fontFamily: 'inherit',
                    width: 'auto',
                    borderRadius: 0,
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading || !email}>
              {loading ? 'Sending…' : 'Send Code'}
              {!loading && <Icon name="arrow-r" size={14} />}
            </button>
          </form>
        ) : (
          /* ── Step 2: 6-digit OTP ── */
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Code sent to</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{email}</div>
            </div>

            {/* PIN boxes */}
            <div
              style={{ display: 'flex', gap: 8, justifyContent: 'center' }}
              onPaste={handlePinPaste}
            >
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handlePinChange(i, e.target.value)}
                  onKeyDown={e => handlePinKeyDown(i, e)}
                  style={{
                    width: 46,
                    height: 58,
                    textAlign: 'center',
                    fontSize: 24,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    borderRadius: 14,
                    border: `2px solid ${digit ? 'var(--accent)' : 'var(--border-2)'}`,
                    background: digit ? 'var(--accent-soft)' : 'var(--surface)',
                    color: 'var(--ink)',
                    outline: 'none',
                    transition: 'border-color 150ms ease, background 150ms ease',
                    padding: 0,
                    caretColor: 'transparent',
                  }}
                />
              ))}
            </div>

            {error && (
              <div style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading || pinValue.length < 6}
            >
              {loading ? 'Verifying…' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('email'); setPin(['', '', '', '', '', '']); setError('') }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontSize: 13,
                cursor: 'pointer',
                padding: '4px 0',
                textAlign: 'center',
                fontFamily: 'inherit',
              }}
            >
              <Icon name="arrow-l" size={12} style={{ marginRight: 4 }} />
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
