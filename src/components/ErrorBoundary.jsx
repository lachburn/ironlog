import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          background: '#000',
          color: '#fff',
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'monospace',
          gap: 16,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C' }}>Something went wrong</div>
          <div style={{
            fontSize: 13,
            color: '#ff6b6b',
            background: '#1a0000',
            padding: '12px 16px',
            borderRadius: 8,
            maxWidth: 400,
            wordBreak: 'break-word',
          }}>
            {this.state.error.message}
          </div>
          <div style={{ fontSize: 11, color: '#555', maxWidth: 360 }}>
            {this.state.error.stack?.split('\n').slice(1, 4).join('\n')}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              padding: '10px 24px',
              background: '#C9A84C',
              color: '#000',
              border: 'none',
              borderRadius: 10,
              fontFamily: 'sans-serif',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
