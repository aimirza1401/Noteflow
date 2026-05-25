import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, FileText, Loader, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'

const VISION_KEY = import.meta.env.VITE_GOOGLE_VISION_KEY

async function googleVisionOCR(base64Image) {
  // Ukloni data:image/...;base64, prefix
  const imageData = base64Image.split(',')[1]

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${VISION_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: imageData },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
          imageContext: {
            languageHints: ['bs', 'hr', 'sr', 'en', 'de'],
          },
        }],
      }),
    }
  )

  const data = await response.json()

  if (data.error) throw new Error(data.error.message)

  const annotation = data.responses?.[0]?.fullTextAnnotation
  if (!annotation) return ''

  // Čisti i formatira tekst
  return annotation.text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join('\n')
}

// Fallback na Tesseract ako nema Google ključa
async function tesseractFallback(base64Image, onProgress) {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('bos+eng+deu', 1, {
    logger: m => {
      if (m.status === 'recognizing text') onProgress(Math.round(m.progress * 100))
    }
  })
  const { data } = await worker.recognize(base64Image)
  await worker.terminate()
  return data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n')
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Greška pri čitanju fajla'))
    reader.readAsDataURL(file)
  })
}

export default function OCRCapture({ onSave, onClose }) {
  const [preview,  setPreview]  = useState(null)
  const [file,     setFile]     = useState(null)
  const [text,     setText]     = useState('')
  const [title,    setTitle]    = useState('')
  const [status,   setStatus]   = useState('idle')
  const [progress, setProgress] = useState(0)
  const [error,    setError]    = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [engine,   setEngine]   = useState(VISION_KEY ? 'google' : 'tesseract')

  const fileInputRef   = useRef(null)
  const cameraInputRef = useRef(null)

  const handleFile = useCallback(async (f) => {
    if (!f) return
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','image/bmp']
    if (!allowed.includes(f.type)) { setError('Podržani: JPG, PNG, WEBP, GIF, BMP'); setStatus('error'); return }
    if (f.size > 10 * 1024 * 1024) { setError('Max 10MB'); setStatus('error'); return }
    setFile(f); setError(''); setText(''); setProgress(0); setStatus('idle')
    const url = await readFileAsDataURL(f)
    setPreview(url)
    const name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    setTitle(name || 'Bilješka sa slike')
  }, [])

  const onInputChange  = e => handleFile(e.target.files?.[0])
  const onDrop         = e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }
  const onDragOver     = e => { e.preventDefault(); setDragOver(true) }
  const onDragLeave    = () => setDragOver(false)

  const runOCR = useCallback(async () => {
    if (!preview) return
    setStatus('loading'); setProgress(0); setText('')

    try {
      let result = ''
      if (VISION_KEY && engine === 'google') {
        result = await googleVisionOCR(preview)
      } else {
        result = await tesseractFallback(preview, setProgress)
      }

      if (!result.trim()) { setStatus('notext'); return }
      setText(result)
      setStatus('success')
    } catch (err) {
      console.error('OCR error:', err)
      // Ako Google API zakaže, pokušaj Tesseract
      if (engine === 'google') {
        try {
          setError('Google OCR nije uspio, pokušavam rezervni...')
          const result = await tesseractFallback(preview, setProgress)
          if (result.trim()) { setText(result); setStatus('success'); setError('') }
          else setStatus('notext')
        } catch {
          setError('OCR nije uspio. Pokušaj s jasnijom slikom.')
          setStatus('error')
        }
      } else {
        setError('OCR nije uspio. Pokušaj s jasnijom slikom.')
        setStatus('error')
      }
    }
  }, [preview, engine])

  const handleSave = () => {
    if (!text.trim()) return
    onSave({ title: title.trim() || 'Bilješka sa slike', content: text.trim() })
    onClose()
  }

  const handleClear = () => {
    setPreview(null); setFile(null); setText(''); setTitle('')
    setStatus('idle'); setError(''); setProgress(0)
    if (fileInputRef.current)   fileInputRef.current.value   = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}`}</style>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)',
        zIndex:200, display:'flex', alignItems:'center', justifyContent:'center',
        padding:16, fontFamily:"'DM Sans',sans-serif" }}
        onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{ background:'var(--surface)', borderRadius:16, width:'100%',
          maxWidth:520, maxHeight:'90vh', overflow:'auto',
          display:'flex', flexDirection:'column' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'var(--blue-bg)',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Camera size={16} color="var(--blue)" />
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:500, color:'var(--text-1)' }}>
                  OCR – Slika u tekst
                </div>
                <div style={{ fontSize:11, color:'var(--text-3)' }}>
                  {VISION_KEY ? '✨ Google Vision AI · Visoka preciznost' : 'Tesseract.js · Lokalni OCR'}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'transparent', border:'none',
              color:'var(--text-3)', cursor:'pointer', display:'flex' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>

            {/* Engine selector ako ima Google key */}
            {VISION_KEY && (
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => setEngine('google')} style={{
                  flex:1, padding:'8px', border:`1.5px solid ${engine==='google'?'var(--blue)':'var(--border)'}`,
                  borderRadius:8, background: engine==='google'?'var(--blue-bg)':'transparent',
                  color: engine==='google'?'var(--blue)':'var(--text-2)',
                  fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  ✨ Google Vision (bolji)
                </button>
                <button onClick={() => setEngine('tesseract')} style={{
                  flex:1, padding:'8px', border:`1.5px solid ${engine==='tesseract'?'var(--blue)':'var(--border)'}`,
                  borderRadius:8, background: engine==='tesseract'?'var(--blue-bg)':'transparent',
                  color: engine==='tesseract'?'var(--blue)':'var(--text-2)',
                  fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  Tesseract (offline)
                </button>
              </div>
            )}

            {/* Dropzone */}
            {!preview ? (
              <div onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                style={{ border:`2px dashed ${dragOver?'var(--blue)':'var(--border-s)'}`,
                  borderRadius:12, padding:32, textAlign:'center',
                  background: dragOver?'var(--blue-bg)':'var(--bg)',
                  cursor:'pointer', transition:'all .15s' }}
                onClick={() => fileInputRef.current?.click()}>
                <Upload size={28} color={dragOver?'var(--blue)':'var(--text-3)'}
                  style={{ margin:'0 auto 10px' }} />
                <p style={{ fontSize:13, fontWeight:500, color:'var(--text-1)', margin:'0 0 4px' }}>
                  Prevuci sliku ovdje
                </p>
                <p style={{ fontSize:11, color:'var(--text-3)', margin:'0 0 14px' }}>
                  JPG, PNG, WEBP · max 10MB
                </p>
                <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                  <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                    style={{ padding:'8px 16px', background:'var(--blue)', color:'#fff',
                      border:'none', borderRadius:8, fontSize:12, fontWeight:500,
                      cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                      fontFamily:"'DM Sans',sans-serif" }}>
                    <Upload size={13} /> Odaberi fajl
                  </button>
                  <button onClick={e => { e.stopPropagation(); cameraInputRef.current?.click() }}
                    style={{ padding:'8px 16px', background:'var(--green-bg)', color:'var(--green)',
                      border:'1px solid var(--green-bd)', borderRadius:8, fontSize:12, fontWeight:500,
                      cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                      fontFamily:"'DM Sans',sans-serif" }}>
                    <Camera size={13} /> Kamera
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ position:'relative', borderRadius:12, overflow:'hidden',
                border:'1px solid var(--border)', background:'var(--bg)' }}>
                <img src={preview} alt="Preview"
                  style={{ width:'100%', maxHeight:200, objectFit:'contain', display:'block' }} />
                <button onClick={handleClear} style={{
                  position:'absolute', top:8, right:8, background:'rgba(0,0,0,.55)',
                  border:'none', borderRadius:20, width:28, height:28, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
                  <X size={14} />
                </button>
                {file && (
                  <div style={{ padding:'5px 10px', fontSize:11, color:'var(--text-3)' }}>
                    {file.name} · {(file.size/1024).toFixed(0)} KB
                  </div>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*"
              onChange={onInputChange} style={{ display:'none' }} />
            <input ref={cameraInputRef} type="file" accept="image/*"
              capture="environment" onChange={onInputChange} style={{ display:'none' }} />

            {/* Status + OCR dugme */}
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              {status === 'loading' && (
                <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px',
                  background:'var(--blue-bg)', borderRadius:20 }}>
                  <Loader size={13} color="var(--blue)" className="spin" />
                  <span style={{ fontSize:12, color:'var(--blue)', fontWeight:500 }}>
                    {engine === 'google' ? 'Google Vision obrađuje...' : `Tesseract... ${progress}%`}
                  </span>
                </div>
              )}
              {status === 'success' && (
                <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px',
                  background:'var(--green-bg)', borderRadius:20 }}>
                  <CheckCircle size={13} color="var(--green)" />
                  <span style={{ fontSize:12, color:'var(--green)', fontWeight:500 }}>Tekst pronađen</span>
                </div>
              )}
              {preview && status !== 'loading' && (
                <button onClick={runOCR} style={{
                  padding:'8px 16px', background:'var(--blue)', color:'#fff',
                  border:'none', borderRadius:8, fontSize:12, fontWeight:500,
                  cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                  fontFamily:"'DM Sans',sans-serif" }}>
                  <Sparkles size={13} />
                  {status === 'success' ? 'Ponovi' : 'Čitaj tekst'}
                </button>
              )}
            </div>

            {/* Progress bar za Tesseract */}
            {status === 'loading' && engine === 'tesseract' && (
              <div style={{ background:'var(--border)', borderRadius:4, height:4, overflow:'hidden' }}>
                <div style={{ height:'100%', background:'var(--blue)', borderRadius:4,
                  width:`${progress}%`, transition:'width .3s' }} />
              </div>
            )}

            {/* Greška */}
            {(status === 'error' || error) && (
              <div style={{ padding:'10px 12px', background:'var(--red-bg)',
                border:'1px solid var(--red-bd)', borderRadius:8, fontSize:12, color:'var(--red)' }}>
                {error || 'Greška pri OCR-u.'}
              </div>
            )}

            {status === 'notext' && (
              <div style={{ padding:'10px 12px', background:'var(--amber-bg)',
                border:'1px solid var(--amber-bd)', borderRadius:8, fontSize:12, color:'var(--amber)' }}>
                Tekst nije prepoznat. Pokušaj s jasnijom ili većom slikom.
              </div>
            )}

            {/* Naslov */}
            {status === 'success' && (
              <div>
                <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:500,
                  display:'block', marginBottom:4 }}>Naslov bilješke</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Upiši naslov..."
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid var(--border)',
                    borderRadius:8, fontSize:13, color:'var(--text-1)', outline:'none',
                    fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box',
                    background:'var(--surface)' }} />
              </div>
            )}

            {/* Tekst */}
            {status === 'success' && (
              <div>
                <div style={{ display:'flex', alignItems:'center',
                  justifyContent:'space-between', marginBottom:6 }}>
                  <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:500 }}>
                    Prepoznati tekst
                  </label>
                  <span style={{ fontSize:10, color:'var(--text-3)' }}>
                    {text.length} znakova · {text.split(/\s+/).filter(Boolean).length} riječi
                  </span>
                </div>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid var(--border)',
                    borderRadius:8, fontSize:13, color:'var(--text-1)', outline:'none',
                    fontFamily:"'DM Sans',sans-serif", resize:'vertical',
                    lineHeight:1.6, boxSizing:'border-box', background:'var(--surface)' }} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)',
            display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button onClick={onClose} style={{ padding:'9px 18px', background:'transparent',
              border:'1px solid var(--border)', borderRadius:8, fontSize:13,
              color:'var(--text-2)', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              Odustani
            </button>
            <button onClick={handleSave} disabled={!text.trim()} style={{
              padding:'9px 18px',
              background: text.trim() ? 'var(--blue)' : 'var(--border)',
              border:'none', borderRadius:8, fontSize:13, fontWeight:500,
              color: text.trim() ? '#fff' : 'var(--text-3)',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              display:'flex', alignItems:'center', gap:6,
              fontFamily:"'DM Sans',sans-serif" }}>
              <FileText size={13} /> Sačuvaj bilješku
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
