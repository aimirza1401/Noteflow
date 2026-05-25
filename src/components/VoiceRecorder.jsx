import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Square, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'bs-BA', label: 'Bosanski',  flag: '🇧🇦' },
  { code: 'hr-HR', label: 'Hrvatski',  flag: '🇭🇷' },
  { code: 'sr-RS', label: 'Srpski',    flag: '🇷🇸' },
  { code: 'en-US', label: 'English',   flag: '🇬🇧' },
  { code: 'de-DE', label: 'Deutsch',   flag: '🇩🇪' },
]

// Mapiranje i18n jezika na Speech API jezik
const LANG_MAP = {
  bs: 'bs-BA',
  hr: 'hr-HR',
  sr: 'sr-RS',
  en: 'en-US',
  de: 'de-DE',
}

export default function VoiceRecorder({ onResult, onClose }) {
  const { i18n } = useTranslation()
  const defaultLang = LANG_MAP[i18n.language] || 'bs-BA'

  const [status,     setStatus]     = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [seconds,    setSeconds]    = useState(0)
  const [supported,  setSupported]  = useState(true)
  const [selLang,    setSelLang]    = useState(defaultLang)

  const recogRef   = useRef(null)
  const timerRef   = useRef(null)
  const finalRef   = useRef('')
  const statusRef  = useRef('idle')

  useEffect(() => { statusRef.current = status }, [status])

  const buildRecognizer = (lang) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setSupported(false); return null }

    const r = new SR()
    r.continuous      = true
    r.interimResults  = true
    r.lang            = lang
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
      if (e.error === 'not-allowed') {
        setStatus('error')
        setTranscript('Mikrofon nije dozvoljen. Dozvoli pristup u browser settingsima.')
      } else if (e.error === 'no-speech') {
        // Ignoriraj – korisnik je u pauzi
      } else {
        console.warn('Speech error:', e.error)
      }
    }

    r.onend = () => {
      if (statusRef.current === 'recording') {
        // Automatski restart ako se prekinulo (mobilni browser)
        try { r.start() } catch {}
      }
    }

    return r
  }

  useEffect(() => {
    return () => {
      try { recogRef.current?.stop() } catch {}
      clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = () => {
    try {
      finalRef.current = ''
      setTranscript('')
      setSeconds(0)

      const r = buildRecognizer(selLang)
      if (!r) return
      recogRef.current = r
      r.start()

      setStatus('recording')
      statusRef.current = 'recording'
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch (e) {
      setStatus('error')
      setTranscript('Greška pri pokretanju mikrofona: ' + e.message)
    }
  }

  const stopRecording = () => {
    try { recogRef.current?.stop() } catch {}
    clearInterval(timerRef.current)
    setStatus('done')
    statusRef.current = 'done'
  }

  const handleLangChange = (lang) => {
    setSelLang(lang)
    // Ako snimamo, restartaj s novim jezikom
    if (status === 'recording') {
      try { recogRef.current?.stop() } catch {}
      clearInterval(timerRef.current)
      setStatus('idle')
      statusRef.current = 'idle'
      setTranscript('')
      finalRef.current = ''
      setSeconds(0)
    }
  }

  const handleSave = () => {
    onResult(transcript.trim())
    onClose()
  }

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  const currentLangLabel = LANGUAGES.find(l => l.code === selLang)

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.2);opacity:.6} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes ripple { 0%{transform:scale(1);opacity:.4} 100%{transform:scale(1.8);opacity:0} }
      `}</style>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
        zIndex:300, display:'flex', alignItems:'center', justifyContent:'center',
        padding:16, fontFamily:"'DM Sans',sans-serif" }}
        onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{ background:'var(--surface)', borderRadius:20, width:'100%',
          maxWidth:380, padding:'24px 20px', border:'1px solid var(--border)' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center',
            justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#FEF9C3',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎤</div>
              <div>
                <div style={{ fontSize:14, fontWeight:500, color:'var(--text-1)' }}>
                  Glasovna bilješka
                </div>
                <div style={{ fontSize:11, color:'var(--text-3)' }}>
                  Govori – tekst se automatski upiše
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'transparent', border:'none',
              color:'var(--text-3)', cursor:'pointer', padding:4, borderRadius:6,
              display:'flex', alignItems:'center' }}>
              <X size={18} />
            </button>
          </div>

          {!supported ? (
            <div style={{ padding:'16px', background:'var(--red-bg)',
              border:'1px solid var(--red-bd)', borderRadius:10,
              fontSize:13, color:'var(--red)', textAlign:'center', lineHeight:1.5 }}>
              Ovaj browser ne podržava glasovni unos.<br />
              <strong>Koristi Chrome ili Safari.</strong>
            </div>
          ) : (
            <>
              {/* Odabir jezika */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:500,
                  textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>
                  Jezik govora
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {LANGUAGES.map(({ code, label, flag }) => (
                    <button key={code} onClick={() => handleLangChange(code)}
                      disabled={status === 'recording'}
                      style={{
                        padding:'6px 12px', borderRadius:20, fontSize:12, cursor:'pointer',
                        border:`1.5px solid ${selLang===code ? 'var(--blue)' : 'var(--border)'}`,
                        background: selLang===code ? 'var(--blue-bg)' : 'transparent',
                        color: selLang===code ? 'var(--blue)' : 'var(--text-2)',
                        fontFamily:"'DM Sans',sans-serif",
                        fontWeight: selLang===code ? 500 : 400,
                        opacity: status === 'recording' ? .5 : 1,
                        transition:'all .15s',
                      }}>
                      {flag} {label}
                    </button>
                  ))}
                </div>
                {status === 'recording' && (
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:5 }}>
                    Zaustavi snimanje da promijeniš jezik
                  </div>
                )}
              </div>

              {/* Vizualizacija mikrofona */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
                gap:14, padding:'16px 0' }}>
                <div style={{ position:'relative', width:80, height:80 }}>
                  {status === 'recording' && (
                    <>
                      <div style={{ position:'absolute', inset:-10, borderRadius:'50%',
                        background:'rgba(220,38,38,.2)',
                        animation:'ripple 1.5s ease-out infinite' }} />
                      <div style={{ position:'absolute', inset:-20, borderRadius:'50%',
                        background:'rgba(220,38,38,.1)',
                        animation:'ripple 1.5s .4s ease-out infinite' }} />
                    </>
                  )}
                  <div onClick={status === 'idle' ? startRecording : undefined}
                    style={{
                      width:80, height:80, borderRadius:40,
                      background: status === 'recording' ? '#dc2626'
                        : status === 'done' ? 'var(--green-bg)' : 'var(--blue-bg)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      transition:'background .3s',
                      cursor: status === 'idle' ? 'pointer' : 'default',
                      boxShadow: status === 'recording'
                        ? '0 0 0 4px rgba(220,38,38,.2)'
                        : '0 2px 8px rgba(0,0,0,.1)',
                    }}>
                    {status === 'recording'
                      ? <MicOff size={30} color="#fff" />
                      : status === 'done'
                      ? <Mic size={30} color="var(--green)" />
                      : <Mic size={30} color="var(--blue)" />
                    }
                  </div>
                </div>

                {/* Status tekst */}
                {status === 'idle' && (
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:13, color:'var(--text-2)', marginBottom:2 }}>
                      Klikni mikrofon za početak
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-3)' }}>
                      {currentLangLabel?.flag} Govori {currentLangLabel?.label}
                    </div>
                  </div>
                )}
                {status === 'recording' && (
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:14, color:'var(--red)', fontWeight:500,
                      display:'flex', alignItems:'center', gap:7, justifyContent:'center' }}>
                      <div style={{ width:8, height:8, borderRadius:4, background:'var(--red)',
                        animation:'blink 1s infinite' }} />
                      Snimam · {fmt(seconds)}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>
                      {currentLangLabel?.flag} {currentLangLabel?.label}
                    </div>
                  </div>
                )}
                {status === 'done' && (
                  <div style={{ fontSize:13, color:'var(--green)', fontWeight:500 }}>
                    ✓ Snimanje završeno · {fmt(seconds)}
                  </div>
                )}
                {status === 'error' && (
                  <div style={{ fontSize:12, color:'var(--red)', textAlign:'center' }}>
                    {transcript || 'Greška pri snimanju'}
                  </div>
                )}
              </div>

              {/* Transkript */}
              {transcript && status !== 'error' && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:5,
                    fontWeight:500, textTransform:'uppercase', letterSpacing:'.05em',
                    display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span>Prepoznati tekst</span>
                    <span style={{ fontSize:10, fontWeight:400 }}>
                      {transcript.split(/\s+/).filter(Boolean).length} riječi
                    </span>
                  </div>
                  <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
                    rows={4} style={{
                      width:'100%', padding:'10px 12px',
                      border:'1px solid var(--border)', borderRadius:10,
                      fontSize:13, color:'var(--text-1)', background:'var(--bg)',
                      outline:'none', resize:'vertical',
                      fontFamily:"'DM Sans',sans-serif", lineHeight:1.6,
                      boxSizing:'border-box', WebkitAppearance:'none',
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
                {(status === 'done' || (status === 'error' && !transcript.includes('Mikrofon'))) && (
                  <>
                    <button onClick={() => {
                      setStatus('idle'); setTranscript('');
                      finalRef.current = ''; setSeconds(0)
                    }} style={{
                      padding:'12px 16px', background:'transparent',
                      border:'1px solid var(--border)', borderRadius:10,
                      fontSize:13, color:'var(--text-2)', cursor:'pointer',
                      fontFamily:"'DM Sans',sans-serif" }}>
                      Ponovi
                    </button>
                    <button onClick={handleSave}
                      disabled={!transcript.trim() || status === 'error'}
                      style={{
                        flex:1, padding:'12px', background:'var(--blue)', color:'#fff',
                        border:'none', borderRadius:10, fontSize:14, fontWeight:500,
                        cursor: transcript.trim() ? 'pointer' : 'not-allowed',
                        opacity: transcript.trim() ? 1 : .5,
                        fontFamily:"'DM Sans',sans-serif" }}>
                      Dodaj u bilješku
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
