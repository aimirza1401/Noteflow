import { useState, useRef, useEffect } from 'react'
import { Star, Bell, Trash2, Plus, X, Camera, Download, Share2, Mic, Clock } from 'lucide-react'
import { TAGS } from '../data/notes'
import ReminderPanel from './ReminderPanel'
import OCRCapture from './OCRCapture'
import ConfirmModal from './ConfirmModal'
import ShareModal from './ShareModal'
import VoiceRecorder from './VoiceRecorder'
import HistoryPanel, { saveToHistory, getHistory } from './HistoryPanel'
import { requestPermission, scheduleNotification, cancelNotification } from '../notifications'
import { exportNoteToPDF } from '../exportPDF'
import styles from './Editor.module.css'

// Auto-save historija svakih 30s dok se edituje
const HISTORY_INTERVAL = 30000

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('bs-BA', {
      day:'numeric', month:'long', year:'numeric',
      hour:'2-digit', minute:'2-digit'
    })
  } catch { return '' }
}

export default function Editor({
  note, updateNote, toggleCheckItem, addCheckItem,
  deleteCheckItem, toggleStar, setReminder, deleteNote,
}) {
  const [showReminder,  setShowReminder]  = useState(false)
  const [showOCR,       setShowOCR]       = useState(false)
  const [showConfirm,   setShowConfirm]   = useState(false)
  const [showShare,     setShowShare]     = useState(false)
  const [showVoice,     setShowVoice]     = useState(false)
  const [showHistory,   setShowHistory]   = useState(false)
  const [newTask,       setNewTask]       = useState('')
  const [exporting,     setExporting]     = useState(false)
  const [historyCount,  setHistoryCount]  = useState(0)
  const [notifGranted,  setNotifGranted]  = useState(() => {
    try { return typeof Notification !== 'undefined' && Notification.permission === 'granted' }
    catch { return false }
  })
  const newTaskRef   = useRef(null)
  const histTimerRef = useRef(null)
  const lastNoteId   = useRef(null)

  if (!note) return null

  const today = new Date().toISOString().split('T')[0]
  const hasUrgentReminder = note.reminder && note.reminder.date === today

  // Auto-save historija
  useEffect(() => {
    if (lastNoteId.current !== note.id) {
      lastNoteId.current = note.id
      setHistoryCount(getHistory(note.id).length)
    }
    clearInterval(histTimerRef.current)
    histTimerRef.current = setInterval(() => {
      saveToHistory(note.id, {
        title:     note.title,
        content:   note.content,
        checklist: note.checklist,
      })
      setHistoryCount(getHistory(note.id).length)
    }, HISTORY_INTERVAL)
    return () => clearInterval(histTimerRef.current)
  }, [note.id, note.title, note.content, note.checklist])

  // Sačuvaj odmah pri promjeni naslova ili sadržaja
  const handleTitleChange = (e) => {
    // Uvijek šalji checklist da se ne izgubi
    updateNote(note.id, {
      title:     e.target.value,
      content:   note.content,
      checklist: note.checklist,
    })
    saveToHistory(note.id, { title: e.target.value, content: note.content, checklist: note.checklist })
    setHistoryCount(getHistory(note.id).length)
  }

  const handleContentChange = (e) => {
    // Uvijek šalji checklist da se ne izgubi
    updateNote(note.id, {
      title:     note.title,
      content:   e.target.value,
      checklist: note.checklist,
    })
    saveToHistory(note.id, { title: note.title, content: e.target.value, checklist: note.checklist })
    setHistoryCount(getHistory(note.id).length)
  }

  const handleAddTask = (e) => {
    if (e.key === 'Enter' && newTask.trim()) {
      addCheckItem(note.id, newTask.trim())
      setNewTask('')
    }
  }

  const handleVoiceResult = (text) => {
    const current = (() => {
      if (!note.content) return ''
      if (!note.content.includes('<')) return note.content
      const div = document.createElement('div')
      div.innerHTML = note.content
      return (div.innerText || div.textContent || '').trim()
    })()
    const combined = current ? current + '\n\n' + text : text
    updateNote(note.id, { content: combined })
    saveToHistory(note.id, { title: note.title, content: combined, checklist: note.checklist })
  }

  const handleOCRSave = ({ title, content }) => updateNote(note.id, { title, content })

  const handleRestore = (snapshot) => {
    updateNote(note.id, {
      title:     snapshot.title,
      content:   snapshot.content,
      checklist: snapshot.checklist,
    })
  }

  const handleDeleteConfirmed = () => {
    setShowConfirm(false)
    try { cancelNotification(note.id) } catch {}
    deleteNote(note.id)
  }

  const handleSaveReminder = async (reminder) => {
    setReminder(note.id, reminder)
    if (reminder) {
      try {
        let granted = notifGranted
        if (!granted) { granted = await requestPermission(); setNotifGranted(granted) }
        if (granted) scheduleNotification({ ...note, reminder })
      } catch {}
    } else {
      try { cancelNotification(note.id) } catch {}
    }
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try { await exportNoteToPDF(note) } catch (e) { console.error(e) }
    setExporting(false)
  }

const handleExportMarkdown = () => {
  const checklistMd = checklist.length
    ? '\n\n## Zadaci\n' + checklist.map(i => `- [${i.done ? 'x' : ' '}] ${i.text}`).join('\n')
    : ''
  const content = `# ${note.title || 'Bilješka'}\n\n> ${formatDate(note.updatedAt || note.updated_at)}\n\n${plainContent}${checklistMd}`
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(note.title || 'biljeska').replace(/\s+/g, '-').toLowerCase()}.md`
  a.click()
  URL.revokeObjectURL(url)
}
  const checklist  = note.checklist || []
  const doneCount  = checklist.filter(c => c.done).length
  const totalCount = checklist.length

  const plainContent = (() => {
    try {
      if (!note.content) return ''
      if (!note.content.includes('<')) return note.content
      const div = document.createElement('div')
      div.innerHTML = note.content
      return div.innerText || div.textContent || ''
    } catch { return note.content || '' }
  })()

  return (
    <div className={styles.editor}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={`${styles.tbBtn} ${note.starred ? styles.tbBtnStar : ''}`}
          onClick={() => toggleStar(note.id)} title="Zvjezdica">
          <Star size={14} />
        </button>

        <button
          className={`${styles.tbBtn} ${note.reminder ? styles.tbBtnBell : ''} ${hasUrgentReminder ? styles.tbBtnBellUrgent : ''}`}
          onClick={() => setShowReminder(v => !v)} title="Podsjetnik">
          <Bell size={14} />
          {note.reminder && <span className={styles.tbBellDot} />}
        </button>

        <button className={styles.tbBtn} onClick={() => setShowVoice(true)} title="Glasovna bilješka"
          style={{ display:'flex', alignItems:'center', gap:4 }}>
          <Mic size={14} />
          <span style={{ fontSize:11 }}>Glas</span>
        </button>

        <button className={styles.tbBtn} onClick={() => setShowOCR(true)} title="Slika u tekst"
          style={{ display:'flex', alignItems:'center', gap:4 }}>
          <Camera size={14} />
          <span style={{ fontSize:11 }}>OCR</span>
        </button>

        <button className={styles.tbBtn} onClick={handleExportPDF} disabled={exporting}
          title="Export u PDF" style={{ display:'flex', alignItems:'center', gap:4 }}>
          <Download size={14} />
          <span style={{ fontSize:11 }}>{exporting ? '...' : 'PDF'}</span>
        </button>
	<button className={styles.tbBtn} onClick={handleExportMarkdown}
  	title="Export kao Markdown" style={{ display:'flex', alignItems:'center', gap:4 }}>
  	<Download size={14} />
  	<span style={{ fontSize:11 }}>MD</span>
	</button>

        <button className={styles.tbBtn} onClick={() => setShowShare(true)}
          title="Dijeli" style={{ display:'flex', alignItems:'center', gap:4 }}>
          <Share2 size={14} />
          <span style={{ fontSize:11 }}>Dijeli</span>
        </button>

        <button className={styles.tbBtn} onClick={() => setShowHistory(true)}
          title="Historija izmjena" style={{ display:'flex', alignItems:'center', gap:4, position:'relative' }}>
          <Clock size={14} />
          <span style={{ fontSize:11 }}>Hist.</span>
          {historyCount > 0 && (
            <span style={{ position:'absolute', top:-4, right:-4, background:'var(--purple)',
              color:'#fff', fontSize:9, borderRadius:8, padding:'1px 4px', lineHeight:1.4 }}>
              {historyCount}
            </span>
          )}
        </button>

        <div className={styles.tbSep} />
        <div style={{ flex:1 }} />

        <button className={`${styles.tbBtn} ${styles.tbBtnDanger}`}
          onClick={() => setShowConfirm(true)} title="Obriši">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.meta}>
          {formatDate(note.updatedAt || note.updated_at)}
          {note.folder && <span className={styles.metaFolder}> · {note.folder}</span>}
        </div>

        <input className={styles.title} value={note.title || ''}
          onChange={handleTitleChange} placeholder="Naslov bilješke..." />

        <textarea value={plainContent} onChange={handleContentChange}
          placeholder="Počni pisati..." rows={6}
          style={{ width:'100%', border:'1px solid var(--border)', borderRadius:10,
            padding:'12px 14px', fontSize:14, color:'var(--text-2)',
            background:'var(--surface)', outline:'none',
            fontFamily:"'DM Sans',sans-serif", lineHeight:1.75, resize:'vertical',
            boxSizing:'border-box', WebkitAppearance:'none' }} />

        {/* Checklist */}
        <div className={styles.checklist}>
          {totalCount > 0 && (
            <div className={styles.checklistHeader}>
              <span className={styles.checklistLabel}>Zadaci</span>
              <span className={styles.checklistCount}>{doneCount}/{totalCount}</span>
              <div className={styles.checkProgress}>
                <div className={styles.checkProgressFill}
                  style={{ width:`${totalCount>0?Math.round((doneCount/totalCount)*100):0}%` }} />
              </div>
            </div>
          )}
          {checklist.map(item => (
            <div key={item.id} className={`${styles.checkItem} ${item.done ? styles.checkDone : ''}`}>
              <input type="checkbox" checked={item.done}
                onChange={() => toggleCheckItem(note.id, item.id)}
                className={styles.checkbox} />
              <span className={styles.checkText}>{item.text}</span>
              <button className={styles.deleteCheck}
                onClick={() => deleteCheckItem(note.id, item.id)}>
                <X size={11} />
              </button>
            </div>
          ))}
          <div className={styles.addTask}>
            <Plus size={12} className={styles.addIcon} />
            <input ref={newTaskRef} className={styles.addInput}
              value={newTask} onChange={e => setNewTask(e.target.value)}
              onKeyDown={handleAddTask} placeholder="Dodaj zadatak... (Enter)" />
          </div>
        </div>

        {(note.tags || []).length > 0 && (
          <div className={styles.tags}>
            {note.tags.map(t => {
              const tag = TAGS[t]
              return tag ? (
                <span key={t} className={styles.tag}
                  style={{ background:tag.bg, color:tag.color }}>{tag.label}</span>
              ) : null
            })}
          </div>
        )}
      </div>

      {/* Notifikacija banner */}
      {!notifGranted && (
        <div style={{ margin:'0 16px 10px', padding:'9px 12px',
          background:'var(--amber-bg)', border:'1px solid var(--amber-bd)',
          borderRadius:8, display:'flex', alignItems:'center', gap:10, fontSize:12 }}>
          <span>⚠️</span>
          <span style={{ flex:1, color:'var(--amber)' }}>Dozvoli notifikacije za podsjetnike</span>
          <button onClick={async () => {
            try {
              if (typeof Notification === 'undefined') return
              if (Notification.permission === 'denied') {
                alert('Notifikacije su blokirane. Idi u Settings browsera.')
                return
              }
              const ok = await requestPermission()
              setNotifGranted(ok)
            } catch {}
          }} style={{ padding:'4px 10px', background:'var(--amber)', color:'#fff',
            border:'none', borderRadius:6, fontSize:11, cursor:'pointer',
            fontWeight:500, fontFamily:"'DM Sans',sans-serif" }}>
            Dozvoli
          </button>
        </div>
      )}

      {/* Reminder bar */}
      {note.reminder && !showReminder && (
        <div className={`${styles.reminderBar} ${hasUrgentReminder ? styles.reminderUrgent : ''}`}>
          <Bell size={13} />
          <div className={styles.reminderInfo}>
            <span className={styles.reminderTitle}>
              {hasUrgentReminder ? 'Podsjetnik danas!' : 'Podsjetnik aktivan'}
            </span>
            <span className={styles.reminderTime}>
              {note.reminder.date === today ? 'Danas' :
               note.reminder.date === new Date(Date.now()+86400000).toISOString().split('T')[0]
               ? 'Sutra' : note.reminder.date} · {note.reminder.time}
            </span>
          </div>
          <button className={styles.reminderEdit} onClick={() => setShowReminder(true)}>Uredi</button>
        </div>
      )}

      {showReminder  && <ReminderPanel reminder={note.reminder} onSave={handleSaveReminder} onClose={() => setShowReminder(false)} />}
      {showOCR       && <OCRCapture    onSave={handleOCRSave}    onClose={() => setShowOCR(false)} />}
      {showVoice     && <VoiceRecorder onResult={handleVoiceResult} onClose={() => setShowVoice(false)} />}
      {showHistory   && <HistoryPanel  note={note} onRestore={handleRestore} onClose={() => setShowHistory(false)} />}
      {showShare     && <ShareModal    note={note} onClose={() => setShowShare(false)} />}
      {showConfirm   && <ConfirmModal  title="Obriši bilješku?" message={`"${note.title}" će biti trajno obrisana.`} onConfirm={handleDeleteConfirmed} onCancel={() => setShowConfirm(false)} />}
    </div>
  )
}
