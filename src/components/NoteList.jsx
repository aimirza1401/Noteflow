import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Star, MoreVertical, Bell } from 'lucide-react'

const VIEW_LABELS_KEYS = {
  sve: 'allNotes', danas: 'remindersToday',
  zadaci: 'tasks', zvjezdice: 'starred',
  posao: 'work', projekti: 'projects', licno: 'personal',
}

const NOTE_ICONS = [
  { bg:'#EEF2FF', color:'#4F46E5', emoji:'📋' },
  { bg:'#F0FDF4', color:'#16A34A', emoji:'📗' },
  { bg:'#FEF9C3', color:'#CA8A04', emoji:'✏️' },
  { bg:'#FDF4FF', color:'#9333EA', emoji:'📖' },
  { bg:'#FFF1F2', color:'#E11D48', emoji:'❤️' },
  { bg:'#F0F9FF', color:'#0284C7', emoji:'📘' },
  { bg:'#FFF7ED', color:'#EA580C', emoji:'🔖' },
  { bg:'#F0FDF4', color:'#15803D', emoji:'📝' },
]

function getIcon(id) {
  const idx = typeof id === 'string'
    ? id.charCodeAt(0) % NOTE_ICONS.length
    : (id || 0) % NOTE_ICONS.length
  return NOTE_ICONS[idx]
}

function timeAgo(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (isNaN(date.getTime())) return ''
  const diff = Date.now() - date.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 2) return 'Upravo'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `Danas, ${date.toLocaleTimeString('bs-BA', { hour:'2-digit', minute:'2-digit' })}`
  const d = Math.floor(h / 24)
  if (d === 1) return `Juče, ${date.toLocaleTimeString('bs-BA', { hour:'2-digit', minute:'2-digit' })}`
  return date.toLocaleDateString('bs-BA', { day:'numeric', month:'short' }) +
    ', ' + date.toLocaleTimeString('bs-BA', { hour:'2-digit', minute:'2-digit' })
}

const FILTERS = [
  { id:'sve',       tKey:'allNotes'  },
  { id:'zadaci',    tKey:'tasks'     },
  { id:'zvjezdice', tKey:'starred'   },
  { id:'posao',     tKey:'work'      },
  { id:'projekti',  tKey:'projects'  },
  { id:'licno',     tKey:'personal'  },
]

export default function NoteList({ notes, activeId, setActiveId, view, setView, allNotes }) {
  const { t } = useTranslation()
  const [sortBy, setSortBy] = useState('date_desc')

  const sortedNotes = [...notes].sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':  return new Date(a.updated_at||a.updatedAt) - new Date(b.updated_at||b.updatedAt)
      case 'title_asc': return (a.title||'').localeCompare(b.title||'')
      case 'title_desc':return (b.title||'').localeCompare(a.title||'')
      default:          return new Date(b.updated_at||b.updatedAt) - new Date(a.updated_at||a.updatedAt)
    }
  })

  const recentNotes = sortedNotes.slice(0, 3)
  const olderNotes  = sortedNotes.slice(3)

  const counts = {
    sve:       allNotes.length,
    zadaci:    allNotes.filter(n => n.checklist?.length > 0).length,
    zvjezdice: allNotes.filter(n => n.starred).length,
    posao:     allNotes.filter(n => n.folder === 'posao').length,
    projekti:  allNotes.filter(n => n.folder === 'projekti').length,
    licno:     allNotes.filter(n => n.folder === 'licno').length,
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%',
      background:'var(--bg)', fontFamily:"'DM Sans',sans-serif" }}>

      {/* Horizontal filters */}
      <div style={{ padding:'12px 16px 0', overflowX:'auto',
        display:'flex', gap:8, flexShrink:0,
        scrollbarWidth:'none', msOverflowStyle:'none' }}>
        {FILTERS.filter(f => counts[f.id] > 0 || f.id === 'sve').map(({ id, tKey }) => (
          <button key={id} onClick={() => setView(id)} style={{
            display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
            padding:'7px 14px', borderRadius:20, cursor:'pointer', flexShrink:0,
            border: view === id ? 'none' : '1px solid var(--border)',
            background: view === id ? 'var(--blue)' : 'var(--surface)',
            color: view === id ? '#fff' : 'var(--text-2)',
            fontSize:13, fontWeight: view === id ? 500 : 400,
            fontFamily:"'DM Sans',sans-serif",
          }}>
            {t(tKey)}
            {counts[id] > 0 && (
              <span style={{
                background: view === id ? 'rgba(255,255,255,.25)' : 'var(--bg)',
                color: view === id ? '#fff' : 'var(--text-3)',
                fontSize:11, padding:'1px 6px', borderRadius:10,
              }}>{counts[id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <div style={{ padding:'8px 16px 0', display:'flex', justifyContent:'flex-end' }}>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            fontSize:12, color:'var(--text-2)', background:'var(--surface)',
            border:'1px solid var(--border)', borderRadius:8, padding:'4px 8px',
            fontFamily:"'DM Sans',sans-serif", cursor:'pointer', outline:'none',
          }}>
          <option value="date_desc">Najnovije</option>
          <option value="date_asc">Najstarije</option>
          <option value="title_asc">Naslov A→Z</option>
          <option value="title_desc">Naslov Z→A</option>
        </select>
      </div>

      {/* Note list */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 80px' }}>

        {notes.length === 0 && (
          <div style={{ textAlign:'center', padding:40, color:'var(--text-3)', fontSize:13 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📝</div>
            {t('noNotes')}
          </div>
        )}

        {recentNotes.length > 0 && (
          <>
            <div style={{ display:'flex', alignItems:'center',
              justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:14, fontWeight:500, color:'var(--text-1)' }}>Nedavno</span>
              {notes.length > 3 && (
                <span style={{ fontSize:13, color:'var(--blue)', cursor:'pointer' }}>
                  Prikaži sve →
                </span>
              )}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
              {recentNotes.map(note => (
                <NoteCard key={note.id} note={note}
                  isActive={note.id === activeId} onSelect={setActiveId} />
              ))}
            </div>
          </>
        )}

        {olderNotes.length > 0 && (
          <>
            <div style={{ fontSize:14, fontWeight:500, color:'var(--text-1)', marginBottom:10 }}>
              Starije
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {olderNotes.map(note => (
                <NoteCard key={note.id} note={note}
                  isActive={note.id === activeId} onSelect={setActiveId} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function NoteCard({ note, isActive, onSelect }) {
  const icon = getIcon(note.id)
  const today = new Date().toISOString().split('T')[0]
  const hasUrgent = note.reminder && note.reminder.date === today

  return (
    <div onClick={() => onSelect(note.id)} style={{
      display:'flex', alignItems:'center', gap:14,
      background:'var(--surface)', borderRadius:16, padding:'14px 16px',
      cursor:'pointer', transition:'all .15s',
      border: isActive
        ? '2px solid var(--blue)'
        : '1px solid var(--border)',
      boxShadow: isActive ? '0 0 0 3px var(--blue-bg)' : '0 1px 3px rgba(0,0,0,.04)',
    }}>
      {/* Icon */}
      <div style={{ width:44, height:44, borderRadius:12, flexShrink:0,
        background:icon.bg, display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:22 }}>
        {icon.emoji}
      </div>

      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
          <span style={{ fontSize:14, fontWeight:500, color:'var(--text-1)',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1 }}>
            {note.title}
          </span>
          {note.reminder && (
            <span style={{ fontSize:12 }}>📌</span>
          )}
        </div>

        {note.content && (
          <p style={{ fontSize:13, color:'var(--text-3)', margin:'0 0 4px',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {note.content}
          </p>
        )}

        {note.checklist?.length > 0 && !note.content && (
          <p style={{ fontSize:12, color:'var(--text-3)', margin:'0 0 4px' }}>
            {note.checklist.filter(c=>c.done).length}/{note.checklist.length} zadataka
          </p>
        )}

        <span style={{ fontSize:12, color:'var(--blue)', fontWeight:400 }}>
          {timeAgo(note.updated_at || note.updatedAt)}
        </span>
      </div>

      {/* Right actions */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
        gap:6, flexShrink:0 }}>
        {note.starred && <Star size={16} fill="#FBBF24" color="#FBBF24" />}
        {hasUrgent && <Bell size={14} color="var(--red)" />}
        <MoreVertical size={16} color="var(--text-3)" />
      </div>
    </div>
  )
}
