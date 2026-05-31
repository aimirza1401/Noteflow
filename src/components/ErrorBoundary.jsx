import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[NoteFlow Error]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', gap: 16,
          background: 'var(--bg)', fontFamily: "'DM Sans',sans-serif",
          padding: '0 24px', textAlign: 'center',
        }}>
          <span style={{ fontSize: 48 }}>⚠️</span>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>
            Nešto je pošlo po krivu
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, maxWidth: 320 }}>
            {this.state.error?.message || 'Neočekivana greška'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '10px 24px', background: 'var(--blue)', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500,
              cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
            }}>
            Pokušaj ponovo
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 20px', background: 'transparent', color: 'var(--text-3)',
              border: '1px solid var(--border)', borderRadius: 10, fontSize: 13,
              cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
            }}>
            Osvježi stranicu
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
