import { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const inputRefs = useRef([])

  const pinValue = pin.join('')

  const handlePinChange = (i, val) => {
    // Allow only digits
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...pin]
    next[i] = digit
    setPin(next)
    // Auto-advance
    if (digit && i < 5) inputRefs.current[i + 1]?.focus()
  }

  const handlePinKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !pin[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  const handlePinPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      setPin(pasted.split('').concat(Array(6).fill('')).slice(0, 6))
      inputRefs.current[Math.min(pasted.length, 5)]?.focus()
      e.preventDefault()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (pinValue.length < 6) { setError('Enter all 6 digits'); return }
    setError('')
    setMessage('')
    setLoading(true)
    const fn = mode === 'signin' ? signIn : signUp
    const { error: err, data } = await fn(email, pinValue)
    setLoading(false)
    if (err) {
      setError(err.message)
    } else if (mode === 'signup' && data?.user && !data?.session) {
      setMessage('Check your email to confirm your account.')
    }
  }

  const resetPin = () => {
    setPin(['', '', '', '', '', ''])
    setError('')
    setMessage('')
    setTimeout(() => inputRefs.current[0]?.focus(), 50)
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
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div className="font-display" style={{ fontSize: 64, color: 'var(--accent)', lineHeight: 1 }}>
          IRONLOG
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>
          Track every rep. Own every session.
        </div>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 24 }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['signin', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); resetPin() }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'DM Sans',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 200ms ease',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#000' : 'var(--text-secondary)',
              }}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          {/* PIN input */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, textAlign: 'center' }}>
              {mode === 'signup' ? 'Create a 6-digit PIN' : '6-digit PIN'}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={handlePinPaste}>
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handlePinChange(i, e.target.value)}
                  onKeyDown={e => handlePinKeyDown(i, e)}
                  style={{
                    width: 44,
                    height: 54,
                    textAlign: 'center',
                    fontSize: 22,
                    fontWeight: 700,
                    borderRadius: 12,
                    border: `2px solid ${digit ? 'var(--accent)' : 'var(--border)'}`,
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 200ms ease',
                    padding: 0,
                    caretColor: 'transparent',
                  }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--destructive)', fontSize: 13, textAlign: 'center' }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ color: 'var(--accent)', fontSize: 13, textAlign: 'center' }}>
              {message}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading || pinValue.length < 6} style={{ opacity: pinValue.length < 6 ? 0.5 : 1 }}>
            {loading ? '…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
