import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    const fn = mode === 'signin' ? signIn : signUp
    const { error: err, data } = await fn(email, password)
    setLoading(false)
    if (err) {
      setError(err.message)
    } else if (mode === 'signup' && data?.user && !data?.session) {
      setMessage('Check your email to confirm your account.')
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
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div className="font-display" style={{ fontSize: 64, color: 'var(--accent)', lineHeight: 1 }}>
          IRONLOG
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>
          Track every rep. Own every session.
        </div>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['signin', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setMessage('') }}
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />

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

          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? '…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
