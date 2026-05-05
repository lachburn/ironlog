import { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import IronLogLogo from '../components/IronLogLogo'

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
    // Auto-submit when last digit filled
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <IronLogLogo height={96} />
        </div>
        <div className="font-display" style={{ fontSize: 64, color: 'var(--accent)', lineHeight: 1 }}>
          IRONLOG
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>
          Track every rep. Own every session.
        </div>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 24 }}>
        {step === 'email' ? (
          /* ── Step 1: email ── */
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="font-display" style={{ fontSize: 22, color: 'var(--text-primary)', marginBottom: 4 }}>
                SIGN IN
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Enter your email and we'll send you a 6-digit code.
              </div>
            </div>

            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />

            {error && (
              <div style={{ color: 'var(--destructive)', fontSize: 13, textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading || !email}>
              {loading ? 'Sending…' : 'Send Code →'}
            </button>
          </form>
        ) : (
          /* ── Step 2: 6-digit OTP ── */
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div className="font-display" style={{ fontSize: 22, color: 'var(--text-primary)', marginBottom: 4 }}>
                CHECK YOUR EMAIL
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                We sent a 6-digit code to{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{email}</span>
              </div>
            </div>

            {/* PIN boxes */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={handlePinPaste}>
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
                    width: 44,
                    height: 56,
                    textAlign: 'center',
                    fontSize: 24,
                    fontWeight: 700,
                    borderRadius: 12,
                    border: `2px solid ${digit ? 'var(--accent)' : 'var(--border)'}`,
                    background: 'var(--bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 200ms ease',
                    padding: 0,
                    caretColor: 'transparent',
                  }}
                />
              ))}
            </div>

            {error && (
              <div style={{ color: 'var(--destructive)', fontSize: 13, textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={loading || pinValue.length < 6}
              style={{ opacity: pinValue.length < 6 ? 0.5 : 1 }}
            >
              {loading ? 'Verifying…' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('email'); setPin(['', '', '', '', '', '']); setError('') }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontFamily: 'DM Sans',
                fontSize: 13,
                cursor: 'pointer',
                padding: '4px 0',
                textAlign: 'center',
              }}
            >
              ← Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
