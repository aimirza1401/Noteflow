import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

export default function InstallBanner() {
  const [prompt,    setPrompt]    = useState(null)
  const [show,      setShow]      = useState(false)
  const [installed, setInstalled] = useState(false)
  const [platform,  setPlatform]  = useState('other')

  useEffect(() => {
    // Provjeri je li već instalirana
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    // Detektuj platformu
    const ua = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios')
    else if (/android/.test(ua)) setPlatform('android')
    else setPlatform('desktop')

    // Provjeri je li korisnik već odbio
    const dismissed = localStorage.getItem('nf_install_dismissed')
    if (dismissed) {
      const days = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24)
      if (days < 7) return // Čekaj 7 dana prije nego pokažeš ponovo
    }

    // Android/Desktop – čekaj beforeinstallprompt event
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS – pokaži manualnu uputu nakon 5 sekundi
    if (/iphone|ipad|ipod/.test(ua) && !dismissed) {
      const timer = setTimeout(() => setShow(true), 5000)
      return () => { clearTimeout(timer); window.removeEventListener('beforeinstallprompt', handler) }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (prompt) {
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') setInstalled(true)
    }
    setShow(false)
  }

  const handleDismiss = () => {
    setShow(false)
    try { localStorage.setItem('nf_install_dismissed', Date.now().toString()) } catch {}
  }

  if (!show || installed) return null

  // iOS – manualane upute
  if (platform === 'ios') {
    return (
      <div style={{
        position: 'fixed', bottom: 80, left: 12, right: 12, zIndex: 150,
        background: '#1a1916', color: '#f0ede8',
        borderRadius: 14, padding: '14px 16px',
        boxShadow: '0 4px 20px rgba(0,0,0,.3)',
        fontFamily: "'DM Sans',sans-serif",
      }}>
        <button onClick={handleDismiss} style={{
          position: 'absolute', top: 10, right: 10,
          background: 'transparent', border: 'none',
          color: '#a8a59f', cursor: 'pointer', padding: 4,
          display: 'flex', alignItems: 'center',
        }}><X size={16} /></button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#2563eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            flexShrink: 0 }}>📝</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Instaliraj NoteFlow</div>
            <div style={{ fontSize: 11, color: '#a8a59f' }}>Dodaj na Home Screen</div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#d4d1cb', lineHeight: 1.6 }}>
          Klikni <strong style={{ color: '#fff' }}>
            <span style={{ fontSize: 14 }}>⎙</span> Dijeli
          </strong> pa odaberi <strong style={{ color: '#fff' }}>"Dodaj na početni zaslon"</strong>
        </div>
      </div>
    )
  }

  // Android / Desktop
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 12, right: 12, zIndex: 150,
      background: '#fff', border: '1px solid #e8e6e1',
      borderRadius: 14, padding: '14px 16px',
      boxShadow: '0 4px 20px rgba(0,0,0,.15)',
      fontFamily: "'DM Sans',sans-serif",
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#2563eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, flexShrink: 0 }}>📝</div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1916', marginBottom: 2 }}>
          Instaliraj NoteFlow
        </div>
        <div style={{ fontSize: 11, color: '#a8a59f' }}>
          Radi offline · Brži pristup
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={handleDismiss} style={{
          background: 'transparent', border: '1px solid #e8e6e1',
          borderRadius: 8, padding: '7px 12px',
          fontSize: 12, color: '#6b6860', cursor: 'pointer',
          fontFamily: "'DM Sans',sans-serif",
        }}>Ne</button>
        <button onClick={handleInstall} style={{
          background: '#2563eb', border: 'none',
          borderRadius: 8, padding: '7px 14px',
          fontSize: 12, fontWeight: 500, color: '#fff',
          cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Download size={13} /> Instaliraj
        </button>
      </div>

      <button onClick={handleDismiss} style={{
        position: 'absolute', top: 8, right: 8,
        background: 'transparent', border: 'none',
        color: '#a8a59f', cursor: 'pointer', padding: 2,
        display: 'flex', alignItems: 'center',
      }}><X size={14} /></button>
    </div>
  )
}
