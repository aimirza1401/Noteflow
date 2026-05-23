import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Square, X } from 'lucide-react'

export default function VoiceRecorder({ onResult, onClose }) {
  const [status,     setStatus]     = useState('idle') // idle | recording | processing | done | error
  const [transcript, setTranscript] = useState('')
  const [seconds,    setSeconds]    = useState(0)
  const [supported,  setSupported]  = useState(true)

  const recogRef   = useRef(null)
  const timerRef   = useRef(null)
  const finalRef   = useRef('')

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setSupported(false); return }

    const r = new SR()
    r.continuous      = true
    r.interimResults  = true
    r.lang            = navigator.language || 'bs-BA'
    r.maxAlternatives = 1

    r.onresult = (e) => {
      let interim = ''
      let final   = finalRef.current
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t + ' '
        else interim = t
      }
      finalRef.current = final
      setTranscript(final + interim)
    }

    r.onerror = (e) => {
      console.warn('Speech error:', e.error)
      if (e.error === 'not-allowed') {
        setStatus('error')
        setTranscript('Mikrofon nije dozvoljen. Dozvoli pristup u browser settingsima.')
      }
    }

    r.onend = () => {
      if (status === 'recording') setStatus('done')
    }

    recogRef.current = r
    return () => { try { r.stop() } catch {} clearInterval(timerRef.current) }
  }, [])

  const startRecording = () => {
    try {
      finalRef.current = ''
      setTranscript('')
      setSeconds(0)
      recogRef.current.start()
      setStatus('recording')
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch (e) {
      setStatus('error')
      setTranscript('Greška pri pokretanju mikrofona.')
    }
  }

  const stopRecording = () => {
    try { recogRef.current.stop() } catch {}
    clearInterval(timerRef.current)
    setStatus('done')
  }

  const handleSave = () => {
    onResult(transcript.trim())
    onClose()
  }

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      zIndex:300, display:'flex', alignItems:'center', justifyContent:'center',
      padding:16, fontFamily:"'DM Sans',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'var(--surface)', borderRadius:20, width:'100%',
        maxWidth:380, padding:'24px 20px', border:'1px solid var(--border)' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'#FEF9C3',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎤</div>
            <div>
              <div style={{ fontSize:14, fontWeight:500, color:'var(--text-1)' }}>Glasovna bilješka</div>
              <div style={{ fontSize:11, color:'var(--text-3)' }}>Govori – tekst se automatski upiše</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none',
            color:'var(--text-3)', cursor:'pointer', padding:4, borderRadius:6,
            display:'flex', alignItems:'center' }}><X size={18} /></button>
        </div>

        {!supported ? (
          <div style={{ padding:'16px', background:'var(--red-bg)', border:'1px solid var(--red-bd)',
            borderRadius:10, fontSize:13, color:'var(--red)', textAlign:'center' }}>
            Ovaj browser ne podržava glasovni unos.<br />
            <strong>Koristi Chrome ili Safari na mobitelu.</strong>
          </div>
        ) : (
          <>
            {/* Vizualizacija */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
              gap:16, padding:'20px 0' }}>
              <div style={{ position:'relative' }}>
                {status === 'recording' && (
                  <>
                    <div style={{ position:'absolute', inset:-8, borderRadius:'50%',
                      background:'rgba(220,38,38,.15)', animation:'pulse 1.5s infinite' }} />
                    <div style={{ position:'absolute', inset:-16, borderRadius:'50%',
                      background:'rgba(220,38,38,.08)', animation:'pulse 1.5s .3s infinite' }} />
                  </>
                )}
                <div style={{
                  width:72, height:72, borderRadius:36,
                  background: status === 'recording' ? '#dc2626' : status === 'done' ? 'var(--green-bg)' : 'var(--blue-bg)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'background .3s', cursor: status === 'idle' ? 'pointer' : 'default',
                }} onClick={status === 'idle' ? startRecording : undefined}>
                  {status === 'recording'
                    ? <MicOff size={28} color="#fff" />
                    : status === 'done'
                    ? <Mic size={28} color="var(--green)" />
                    : <Mic size={28} color="var(--blue)" />}
                </div>
              </div>

              {status === 'recording' && (
                <div style={{ fontSize:13, color:'var(--red)', fontWeight:500,
                  display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:4, background:'var(--red)',
                    animation:'blink 1s infinite' }} />
                  Snimam · {fmt(seconds)}
                </div>
              )}
              {status === 'idle' && (
                <div style={{ fontSize:13, color:'var(--text-3)' }}>Klikni mikrofon za početak</div>
              )}
              {status === 'done' && (
                <div style={{ fontSize:13, color:'var(--green)' }}>✓ Snimanje završeno</div>
              )}
            </div>

            {/* Transkript */}
            {transcript && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:6,
                  fontWeight:500, textTransform:'uppercase', letterSpacing:'.05em' }}>
                  Prepoznati tekst
                </div>
                <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
                  rows={4} style={{
                    width:'100%', padding:'10px 12px', border:'1px solid var(--border)',
                    borderRadius:10, fontSize:13, color:'var(--text-1)',
                    background:'var(--bg)', outline:'none', resize:'vertical',
                    fontFamily:"'DM Sans',sans-serif", lineHeight:1.6,
                    boxSizing:'border-box',
                  }} />
              </div>
            )}

            {/* Dugmad */}
            <div style={{ display:'flex', gap:8 }}>
              {status === 'idle' && (
                <button onClick={startRecording} style={{
                  flex:1, padding:'12px', background:'var(--blue)', color:'#fff',
                  border:'none', borderRadius:10, fontSize:14, fontWeight:500,
                  cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <Mic size={16} /> Počni snimati
                </button>
              )}
              {status === 'recording' && (
                <button onClick={stopRecording} style={{
                  flex:1, padding:'12px', background:'var(--red)', color:'#fff',
                  border:'none', borderRadius:10, fontSize:14, fontWeight:500,
                  cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <Square size={16} /> Zaustavi
                </button>
              )}
              {status === 'done' && (
                <>
                  <button onClick={startRecording} style={{
                    padding:'12px 16px', background:'transparent',
                    border:'1px solid var(--border)', borderRadius:10,
                    fontSize:13, color:'var(--text-2)', cursor:'pointer',
                    fontFamily:"'DM Sans',sans-serif" }}>
                    Ponovi
                  </button>
                  <button onClick={handleSave} disabled={!transcript.trim()} style={{
                    flex:1, padding:'12px', background:'var(--blue)', color:'#fff',
                    border:'none', borderRadius:10, fontSize:14, fontWeight:500,
                    cursor: transcript.trim() ? 'pointer' : 'not-allowed',
                    opacity: transcript.trim() ? 1 : .6,
                    fontFamily:"'DM Sans',sans-serif" }}>
                    Dodaj u bilješku
                  </button>
                </>
              )}
            </div>
          </>
        )}

        <style>{`
          @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:.7} }
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        `}</style>
      </div>
    </div>
  )
}
