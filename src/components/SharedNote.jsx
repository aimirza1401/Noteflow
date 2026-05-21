import { useEffect, useState } from 'react'
import { getSharedNote } from '../shareNote'

function htmlToPlain(html) {
  if (!html) return ''
  if (!html.includes('<')) return html
  const div = document.createElement('div')
  div.innerHTML = html
  return div.innerText || div.textContent || ''
}

export default function SharedNote({ shareId }) {
  const [note,    setNote]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!shareId) return
    getSharedNote(shareId)
      .then(setNote)
      .catch(() => setError('Bilješka nije pronađena ili je link istekao.'))
      .finally(() => setLoading(false))
  }, [shareId])

  const s = { fontFamily: "'DM Sans', sans-serif" }

  if (loading) return (
    <div style={{ ...s, display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', color:'#a8a59f', fontSize:14 }}>
      Učitavanje...
    </div>
  )

  if (error) return (
    <div style={{ ...s, display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', height:'100vh', gap:12, padding:24 }}>
      <span style={{ fontSize:40 }}>🔗</span>
      <span style={{ fontSize:15, color:'#6b6860', textAlign:'center' }}>{error}</span>
      <a href="/" style={{ color:'#2563eb', fontSize:13 }}>← Otvori NoteFlow</a>
    </div>
  )

  const checklist = note?.checklist || []
  const doneCount = checklist.filter(c => c.done).length

  return (
    <div style={{ ...s, minHeight:'100vh', background:'#f7f6f3' }}>
      {/* Header */}
      <div style={{ background:'#2563eb', padding:'12px 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>📝</span>
          <span style={{ fontSize:14, fontWeight:500, color:'#fff' }}>NoteFlow</span>
        </div>
        <a href="/" style={{ fontSize:12, color:'rgba(255,255,255,.8)',
          textDecoration:'none' }}>Kreiraj nalog →</a>
      </div>

      {/* Content */}
      <div style={{ maxWidth:640, margin:'0 auto', padding:'32px 20px' }}>
        <div style={{ background:'#fff', borderRadius:16, padding:'28px 24px',
          border:'1px solid #e8e6e1', boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>

          <h1 style={{ fontSize:22, fontWeight:500, color:'#1a1916',
            margin:'0 0 8px', lineHeight:1.3 }}>
            {note.title}
          </h1>

          <div style={{ fontSize:12, color:'#a8a59f', marginBottom:20 }}>
            Podijeljeno putem NoteFlow
            {note.expires_at && ` · Ističe ${new Date(note.expires_at).toLocaleDateString('bs-BA')}`}
          </div>

          {note.content && (
            <div style={{ fontSize:14, color:'#6b6860', lineHeight:1.75,
              whiteSpace:'pre-wrap', marginBottom:20 }}>
              {htmlToPlain(note.content)}
            </div>
          )}

          {checklist.length > 0 && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                marginBottom:10 }}>
                <span style={{ fontSize:13, fontWeight:500, color:'#1a1916' }}>Zadaci</span>
                <span style={{ fontSize:12, color:'#a8a59f' }}>{doneCount}/{checklist.length}</span>
              </div>
              <div style={{ background:'#e8e6e1', borderRadius:4, height:4,
                marginBottom:12, overflow:'hidden' }}>
                <div style={{ height:'100%', background:'#2563eb', borderRadius:4,
                  width: checklist.length > 0 ? `${Math.round((doneCount/checklist.length)*100)}%` : '0%' }} />
              </div>
              {checklist.map(item => (
                <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10,
                  padding:'8px 0', borderBottom:'1px solid #f0ede8',
                  color: item.done ? '#a8a59f' : '#1a1916',
                  textDecoration: item.done ? 'line-through' : 'none', fontSize:14 }}>
                  <span>{item.done ? '✅' : '⬜'}</span>
                  {item.text}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:20 }}>
          <a href="/" style={{ fontSize:13, color:'#2563eb', textDecoration:'none' }}>
            Kreiraj vlastite bilješke u NoteFlow →
          </a>
        </div>
      </div>
    </div>
  )
}
