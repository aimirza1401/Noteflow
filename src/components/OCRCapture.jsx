import { useState, useRef, useCallback } from 'react'
import { createWorker } from 'tesseract.js'
import { Camera, Upload, X, FileText, Loader, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────────────────────

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Greška pri čitanju fajla'))
    reader.readAsDataURL(file)
  })
}

function cleanText(raw) {
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join('\n')
    .trim()
}

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status, progress }) {
  const cfg = {
    idle:       { bg:'#f7f6f3', color:'#a8a59f', text:'Spreman',           Icon: FileText   },
    loading:    { bg:'#eff4ff', color:'#2563eb', text:`OCR... ${progress}%`, Icon: Loader   },
    success:    { bg:'#f0fdf4', color:'#16a34a', text:'Tekst pronađen',    Icon: CheckCircle },
    error:      { bg:'#fef2f2', color:'#dc2626', text:'Greška',            Icon: AlertCircle },
    notext:     { bg:'#fffbeb', color:'#b45309', text:'Tekst nije nađen',  Icon: AlertCircle },
  }[status] || {}

  if (status === 'idle') return null

  const { bg, color, text, Icon } = cfg
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px',
      background:bg, borderRadius:20, width:'fit-content' }}>
      <Icon size={13} color={color} className={status === 'loading' ? 'spin' : ''} />
      <span style={{ fontSize:12, color, fontWeight:500 }}>{text}</span>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OCRCapture({ onSave, onClose }) {
  const [preview,  setPreview]  = useState(null)   // base64 image
  const [file,     setFile]     = useState(null)
  const [text,     setText]     = useState('')
  const [title,    setTitle]    = useState('')
  const [status,   setStatus]   = useState('idle') // idle|loading|success|error|notext
  const [progress, setProgress] = useState(0)
  const [error,    setError]    = useState('')
  const [dragOver, setDragOver] = useState(false)

  const fileInputRef   = useRef(null)
  const cameraInputRef = useRef(null)

  // ── File selection ────────────────────────────────────────────────────────

  const handleFile = useCallback(async (f) => {
    if (!f) return
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','image/bmp']
    if (!allowed.includes(f.type)) {
      setError('Podržani formati: JPG, PNG, WEBP, GIF, BMP')
      setStatus('error'); return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Maksimalna veličina slike je 10MB')
      setStatus('error'); return
    }
    setFile(f)
    setError('')
    setText('')
    setProgress(0)
    setStatus('idle')
    const url = await readFileAsDataURL(f)
    setPreview(url)
    // auto-set title from filename
    const name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    setTitle(name.length > 0 ? name : 'Bilješka sa slike')
  }, [])

  const onInputChange  = e => handleFile(e.target.files?.[0])
  const onDrop         = e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }
  const onDragOver     = e => { e.preventDefault(); setDragOver(true)  }
  const onDragLeave    = ()  => setDragOver(false)

  // ── OCR ──────────────────────────────────────────────────────────────────

  const runOCR = useCallback(async () => {
    if (!preview) return
    setStatus('loading')
    setProgress(0)
    setText('')

    try {
      const worker = await createWorker('bos+eng+deu', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        }
      })

      const { data } = await worker.recognize(preview)
      await worker.terminate()

      const cleaned = cleanText(data.text)

      if (!cleaned) {
        setStatus('notext')
        setText('')
      } else {
        setText(cleaned)
        setStatus('success')
      }
    } catch (err) {
      console.error(err)
      setError('OCR nije uspio. Pokušaj s jasnijom slikom.')
      setStatus('error')
    }
  }, [preview])

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!text.trim()) return
    onSave({
      title: title.trim() || 'Bilješka sa slike',
      content: text.trim(),
    })
    onClose()
  }

  // ── Clear ────────────────────────────────────────────────────────────────

  const handleClear = () => {
    setPreview(null); setFile(null); setText('')
    setTitle(''); setStatus('idle'); setError(''); setProgress(0)
    if (fileInputRef.current)   fileInputRef.current.value   = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Spinner animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .spin { animation: spin 1s linear infinite }
      `}</style>

      {/* Overlay */}
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)',
        zIndex:200, display:'flex', alignItems:'center', justifyContent:'center',
        padding:16, fontFamily:"'DM Sans',sans-serif" }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:520,
          maxHeight:'90vh', overflow:'auto', display:'flex', flexDirection:'column' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'16px 20px', borderBottom:'1px solid #e8e6e1' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'#eff4ff',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Camera size={16} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:500, color:'#1a1916' }}>OCR – Slika u tekst</div>
                <div style={{ fontSize:11, color:'#a8a59f' }}>Bosanski · Engleski · Njemački</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'transparent', border:'none',
              color:'#a8a59f', cursor:'pointer', padding:4, borderRadius:6,
              display:'flex', alignItems:'center' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding:20, display:'flex', flexDirection:'column', gap:16 }}>

            {/* Drop zone */}
            {!preview ? (
              <div
                onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                style={{ border:`2px dashed ${dragOver ? '#2563eb' : '#d4d1cb'}`,
                  borderRadius:12, padding:32, textAlign:'center',
                  background: dragOver ? '#eff4ff' : '#f7f6f3',
                  transition:'all .15s', cursor:'pointer' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={28} color={dragOver ? '#2563eb' : '#a8a59f'} style={{ margin:'0 auto 10px' }} />
                <p style={{ fontSize:13, fontWeight:500, color:'#1a1916', margin:'0 0 4px' }}>
                  Prevuci sliku ovdje
                </p>
                <p style={{ fontSize:11, color:'#a8a59f', margin:'0 0 14px' }}>
                  JPG, PNG, WEBP · max 10MB
                </p>
                <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                  <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                    style={{ padding:'8px 16px', background:'#2563eb', color:'#fff',
                      border:'none', borderRadius:8, fontSize:12, fontWeight:500,
                      cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                    <Upload size={13} /> Odaberi fajl
                  </button>
                  <button onClick={e => { e.stopPropagation(); cameraInputRef.current?.click() }}
                    style={{ padding:'8px 16px', background:'#f0fdf4', color:'#16a34a',
                      border:'1px solid #bbf7d0', borderRadius:8, fontSize:12, fontWeight:500,
                      cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                    <Camera size={13} /> Kamera
                  </button>
                </div>
              </div>
            ) : (
              /* Image preview */
              <div style={{ position:'relative', borderRadius:12, overflow:'hidden',
                border:'1px solid #e8e6e1', background:'#f7f6f3' }}>
                <img src={preview} alt="Preview"
                  style={{ width:'100%', maxHeight:220, objectFit:'contain', display:'block' }} />
                <button onClick={handleClear}
                  style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,.55)',
                    border:'none', borderRadius:20, width:28, height:28, cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
                  <X size={14} />
                </button>
                {file && (
                  <div style={{ padding:'6px 10px', fontSize:11, color:'#6b6860' }}>
                    {file.name} · {(file.size / 1024).toFixed(0)} KB
                  </div>
                )}
              </div>
            )}

            {/* Hidden inputs */}
            <input ref={fileInputRef} type="file" accept="image/*"
              onChange={onInputChange} style={{ display:'none' }} />
            <input ref={cameraInputRef} type="file" accept="image/*"
              capture="environment" onChange={onInputChange} style={{ display:'none' }} />

            {/* Status + OCR button */}
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <StatusBadge status={status} progress={progress} />
              {preview && status !== 'loading' && (
                <button onClick={runOCR}
                  style={{ padding:'8px 16px', background:'#2563eb', color:'#fff',
                    border:'none', borderRadius:8, fontSize:12, fontWeight:500,
                    cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                  <Sparkles size={13} />
                  {status === 'success' ? 'Ponovi OCR' : 'Čitaj tekst'}
                </button>
              )}
            </div>

            {/* Progress bar */}
            {status === 'loading' && (
              <div style={{ background:'#e8e6e1', borderRadius:4, height:4, overflow:'hidden' }}>
                <div style={{ height:'100%', background:'#2563eb', borderRadius:4,
                  width:`${progress}%`, transition:'width .3s' }} />
              </div>
            )}

            {/* Error */}
            {status === 'error' && error && (
              <div style={{ padding:'10px 12px', background:'#fef2f2',
                border:'1px solid #fecaca', borderRadius:8,
                fontSize:12, color:'#dc2626' }}>
                {error}
              </div>
            )}

            {/* Title input */}
            {(status === 'success' || text) && (
              <div>
                <label style={{ fontSize:11, color:'#6b6860', fontWeight:500,
                  display:'block', marginBottom:4 }}>Naslov bilješke</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Upiši naslov..."
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid #e8e6e1',
                    borderRadius:8, fontSize:13, color:'#1a1916', outline:'none',
                    fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box' }} />
              </div>
            )}

            {/* Extracted text */}
            {status === 'success' && (
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  marginBottom:6 }}>
                  <label style={{ fontSize:11, color:'#6b6860', fontWeight:500 }}>
                    Prepoznati tekst
                  </label>
                  <span style={{ fontSize:10, color:'#a8a59f' }}>
                    {text.length} znakova · {text.split(/\s+/).filter(Boolean).length} riječi
                  </span>
                </div>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #e8e6e1',
                    borderRadius:8, fontSize:13, color:'#1a1916', outline:'none',
                    fontFamily:"'DM Sans',sans-serif", resize:'vertical',
                    lineHeight:1.6, boxSizing:'border-box' }} />
              </div>
            )}

            {/* No text message */}
            {status === 'notext' && (
              <div style={{ padding:'12px', background:'#fffbeb',
                border:'1px solid #fde68a', borderRadius:8, fontSize:12, color:'#b45309' }}>
                Tekst nije prepoznat. Pokušaj s jasnijom ili većom slikom, ili promijeni jezik dokumenta.
              </div>
            )}

          </div>

          {/* Footer */}
          <div style={{ padding:'12px 20px', borderTop:'1px solid #e8e6e1',
            display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button onClick={onClose}
              style={{ padding:'9px 18px', background:'transparent',
                border:'1px solid #e8e6e1', borderRadius:8,
                fontSize:13, color:'#6b6860', cursor:'pointer' }}>
              Odustani
            </button>
            <button onClick={handleSave} disabled={!text.trim()}
              style={{ padding:'9px 18px',
                background: text.trim() ? '#2563eb' : '#d4d1cb',
                border:'none', borderRadius:8, fontSize:13, fontWeight:500,
                color:'#fff', cursor: text.trim() ? 'pointer' : 'not-allowed',
                display:'flex', alignItems:'center', gap:6 }}>
              <FileText size={13} /> Sačuvaj bilješku
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
