import { useState, useEffect } from 'react'
import { X, Clock, RotateCcw } from 'lucide-react'

const MAX_HISTORY = 20

export function saveToHistory(noteId, snapshot) {
  try {
    const key = `nf_history_${noteId}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const last = existing[0]
    // Ne čuvaj ako nije bilo promjene
    if (last && last.content === snapshot.content && last.title === snapshot.title) return
    const updated = [{ ...snapshot, savedAt: new Date().toISOString() }, ...existing]
      .slice(0, MAX_HISTORY)
    localStorage.setItem(key, JSON.stringify(updated))
  } catch {}
}

export function getHistory(noteId) {
  try {
    return JSON.parse(localStorage.getItem(`nf_history_${noteId}`) || '[]')
  } catch { return [] }
}

export function clearHistory(noteId) {
  try { localStorage.removeItem(`nf_history_${noteId}`) } catch {}
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Upravo'
  if (m < 60) return `Prije ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Prije ${h}h`
  return new Date(iso).toLocaleDateString('bs-BA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
}

function htmlToPlain(html) {
  if (!html) return ''
  if (!html.includes('<')) return html
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.innerText || div.textContent || '').trim()
}

export default function HistoryPanel({ note, onRestore, onClose }) {
  const [history,  setHistory]  = useState([])
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    setHistory(getHistory(note.id))
  }, [note.id])

  const handleRestore = () => {
    if (!selected) return
    onRestore(selected)
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      zIndex:300, display:'flex', alignItems:'center', justifyContent:'center',
      padding:16, fontFamily:"'DM Sans',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'var(--surface)', borderRadius:20, width:'100%',
        maxWidth:480, maxHeight:'85vh', display:'flex', flexDirection:'column',
        border:'1px solid var(--border)' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:'var(--purple-bg)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Clock size={16} color="var(--purple)" />
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:500, color:'var(--text-1)' }}>Historija izmjena</div>
              <div style={{ fontSize:11, color:'var(--text-3)' }}>{history.length} verzija sačuvano</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none',
            color:'var(--text-3)', cursor:'pointer', display:'flex', alignItems:'center' }}>
            <X size={18} />
          </button>
        </div>

        {history.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', gap:10, padding:32, color:'var(--text-3)' }}>
            <Clock size={36} color="var(--text-3)" />
            <span style={{ fontSize:13 }}>Nema sačuvanih verzija</span>
            <span style={{ fontSize:12, textAlign:'center' }}>
              Historija se čuva automatski dok editaš bilješku
            </span>
          </div>
        ) : (
          <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
            {/* Lista verzija */}
            <div style={{ width:200, borderRight:'1px solid var(--border)',
              overflowY:'auto', flexShrink:0 }}>
              {history.map((v, i) => (
                <div key={v.savedAt} onClick={() => { setSelected(v); setConfirmed(false) }}
                  style={{ padding:'11px 14px', cursor:'pointer',
                    borderBottom:'1px solid var(--border)',
                    background: selected?.savedAt === v.savedAt ? 'var(--blue-bg)' : 'transparent',
                    transition:'background .1s' }}>
                  <div style={{ fontSize:12, fontWeight:500,
                    color: selected?.savedAt === v.savedAt ? 'var(--blue)' : 'var(--text-1)',
                    marginBottom:3 }}>
                    {i === 0 ? '🕐 Najnovija' : timeAgo(v.savedAt)}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-3)',
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {v.title || 'Bez naslova'}
                  </div>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div style={{ flex:1, overflow:'auto', padding:'16px' }}>
              {selected ? (
                <>
                  <div style={{ fontSize:16, fontWeight:500, color:'var(--text-1)',
                    marginBottom:8 }}>{selected.title}</div>
                  <div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.7,
                    whiteSpace:'pre-wrap', marginBottom:16 }}>
                    {htmlToPlain(selected.content) || <em style={{ color:'var(--text-3)' }}>Prazna bilješka</em>}
                  </div>
                  {selected.checklist?.length > 0 && (
                    <div style={{ marginBottom:16 }}>
                      <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:6,
                        textTransform:'uppercase', letterSpacing:'.05em' }}>Zadaci</div>
                      {selected.checklist.map(c => (
                        <div key={c.id} style={{ display:'flex', alignItems:'center', gap:8,
                          padding:'4px 0', fontSize:13,
                          color: c.done ? 'var(--text-3)' : 'var(--text-1)',
                          textDecoration: c.done ? 'line-through' : 'none' }}>
                          <span>{c.done ? '✅' : '⬜'}</span>{c.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {!confirmed ? (
                    <button onClick={() => setConfirmed(true)} style={{
                      width:'100%', padding:'10px', background:'var(--blue)', color:'#fff',
                      border:'none', borderRadius:10, fontSize:13, fontWeight:500,
                      cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                      <RotateCcw size={14} /> Vrati ovu verziju
                    </button>
                  ) : (
                    <div style={{ background:'var(--amber-bg)', border:'1px solid var(--amber-bd)',
                      borderRadius:10, padding:'12px' }}>
                      <div style={{ fontSize:13, color:'var(--amber)', marginBottom:10 }}>
                        ⚠️ Trenutna bilješka će biti zamijenjena. Jesi li siguran?
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => setConfirmed(false)} style={{
                          flex:1, padding:'8px', background:'transparent',
                          border:'1px solid var(--border)', borderRadius:8,
                          fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                          Odustani
                        </button>
                        <button onClick={handleRestore} style={{
                          flex:1, padding:'8px', background:'var(--amber)', color:'#fff',
                          border:'none', borderRadius:8, fontSize:13, fontWeight:500,
                          cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                          Da, vrati
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                  height:'100%', color:'var(--text-3)', fontSize:13 }}>
                  Odaberi verziju za preview
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
