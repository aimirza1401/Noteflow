import { useState } from 'react'
import { X, Link, Copy, Check, Trash2 } from 'lucide-react'
import { createShareLink, deleteShareLink } from '../shareNote'

export default function ShareModal({ note, onClose }) {
  const [link,    setLink]    = useState('')
  const [loading, setLoading] = useState(false)
  const [copied,  setCopied]  = useState(false)
  const [error,   setError]   = useState('')

  const handleCreate = async () => {
    setLoading(true); setError('')
    try {
      const url = await createShareLink(note)
      setLink(url)
    } catch (e) {
      setError('Greška. Provjeri da li si kreirao shared_notes tabelu u Supabaseu.')
    }
    setLoading(false)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = link
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDelete = async () => {
    await deleteShareLink(note.id)
    setLink('')
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)',
      zIndex:300, display:'flex', alignItems:'center', justifyContent:'center',
      padding:16, fontFamily:"'DM Sans',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'var(--surface)', borderRadius:16,
        width:'100%', maxWidth:400, padding:'20px',
        border:'1px solid var(--border)' }}>

        <div style={{ display:'flex', alignItems:'center',
          justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'var(--blue-bg)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Link size={16} color="var(--blue)" />
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:500, color:'var(--text-1)' }}>Dijeli bilješku</div>
              <div style={{ fontSize:11, color:'var(--text-3)' }}>Link važi 30 dana</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none',
            color:'var(--text-3)', cursor:'pointer', padding:4, borderRadius:6,
            display:'flex', alignItems:'center' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ background:'var(--bg)', borderRadius:10, padding:'12px',
          marginBottom:14, fontSize:13, color:'var(--text-2)', lineHeight:1.5 }}>
          📋 <strong style={{ color:'var(--text-1)' }}>{note.title}</strong> će biti vidljiva
          svima koji imaju link. Ne trebaju nalog.
        </div>

        {error && (
          <div style={{ padding:'8px 12px', background:'var(--red-bg)',
            border:'1px solid var(--red-bd)', borderRadius:8,
            fontSize:12, color:'var(--red)', marginBottom:12 }}>
            {error}
          </div>
        )}

        {!link ? (
          <button onClick={handleCreate} disabled={loading} style={{
            width:'100%', padding:'11px', background: loading ? '#93aef5' : 'var(--blue)',
            color:'#fff', border:'none', borderRadius:10, fontSize:14,
            fontWeight:500, cursor: loading ? 'wait' : 'pointer',
            fontFamily:"'DM Sans',sans-serif",
          }}>
            {loading ? 'Kreiram link...' : '🔗 Kreiraj link za dijeljenje'}
          </button>
        ) : (
          <div>
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              <input readOnly value={link}
                style={{ flex:1, padding:'9px 12px', border:'1px solid var(--border)',
                  borderRadius:8, fontSize:12, color:'var(--text-2)',
                  background:'var(--bg)', outline:'none',
                  fontFamily:"'DM Sans',sans-serif" }} />
              <button onClick={handleCopy} style={{
                padding:'9px 14px', background: copied ? 'var(--green-bg)' : 'var(--blue)',
                color: copied ? 'var(--green)' : '#fff',
                border: copied ? '1px solid var(--green-bd)' : 'none',
                borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', gap:5,
                fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif",
              }}>
                {copied ? <><Check size={14} /> Kopirano</> : <><Copy size={14} /> Kopiraj</>}
              </button>
            </div>
            <button onClick={handleDelete} style={{
              width:'100%', padding:'9px', background:'transparent',
              color:'var(--red)', border:'1px solid var(--red-bd)',
              borderRadius:8, fontSize:13, cursor:'pointer',
              fontFamily:"'DM Sans',sans-serif",
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}>
              <Trash2 size={13} /> Ukloni link
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
