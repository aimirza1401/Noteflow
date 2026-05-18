import { useState, useRef, useEffect } from 'react'
import { Star, Bell, Trash2, Plus, X, Camera } from 'lucide-react'
import { TAGS } from '../data/notes'
import ReminderPanel from './ReminderPanel'
import OCRCapture from './OCRCapture'
import ConfirmModal from './ConfirmModal'
import RichEditor from './RichEditor'
import { requestPermission, scheduleNotification, cancelNotification } from '../notifications'
import styles from './Editor.module.css'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('bs-BA', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function Editor({
  note, updateNote, toggleCheckItem, addCheckItem,
  deleteCheckItem, toggleStar, setReminder, deleteNote,
}) {
  const [showReminder,  setShowReminder]  = useState(false)
  const [showOCR,       setShowOCR]       = useState(false)
  const [showConfirm,   setShowConfirm]   = useState(false)
  const [newTask,       setNewTask]       = useState('')
  const [notifGranted,  setNotifGranted]  = useState(Notification?.permission === 'granted')
  const newTaskRef = useRef(null)
  const today = new Date().toISOString().split('T')[0]
  const hasUrgentReminder = note.reminder && note.reminder.date === today

  // Request notification permission on mount
  useEffect(() => {
    if (Notification?.permission !== 'granted') return
    setNotifGranted(true)
  }, [])

  const handleTitleChange   = e => updateNote(note.id, { title: e.target.value })
  const handleContentChange = html => updateNote(note.id, { content: html })

  const handleAddTask = e => {
    if (e.key === 'Enter' && newTask.trim()) {
      addCheckItem(note.id, newTask.trim())
      setNewTask('')
    }
  }

  const handleOCRSave = ({ title, content }) => {
    updateNote(note.id, { title, content })
  }

  const handleDeleteConfirmed = () => {
    setShowConfirm(false)
    cancelNotification(note.id)
    deleteNote(note.id)
  }

  const handleSaveReminder = async (reminder) => {
    setReminder(note.id, reminder)
    if (reminder) {
      let granted = notifGranted
      if (!granted) {
        granted = await requestPermission()
        setNotifGranted(granted)
      }
      if (granted) {
        scheduleNotification({ ...note, reminder })
      }
    } else {
      cancelNotification(note.id)
    }
  }

  const doneCount  = note.checklist?.filter(c => c.done).length || 0
  const totalCount = note.checklist?.length || 0

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <button
          className={`${styles.tbBtn} ${note.starred ? styles.tbBtnStar : ''}`}
          onClick={() => toggleStar(note.id)} title="Označi zvjezdicom">
          <Star size={14} />
        </button>

        <button
          className={`${styles.tbBtn} ${note.reminder ? styles.tbBtnBell : ''} ${hasUrgentReminder ? styles.tbBtnBellUrgent : ''}`}
          onClick={() => setShowReminder(v => !v)} title="Podsjetnik">
          <Bell size={14} />
          {note.reminder && <span className={styles.tbBellDot} />}
          {!notifGranted && note.reminder && (
            <span style={{ fontSize:9, marginLeft:2, color:'var(--amber)' }} title="Notifikacije nisu dozvoljene">⚠</span>
          )}
        </button>

        <button
          className={styles.tbBtn}
          onClick={() => setShowOCR(true)} title="Slika u tekst (OCR)"
          style={{ display:'flex', alignItems:'center', gap:5 }}>
          <Camera size={14} />
          <span style={{ fontSize:11 }}>Slika→Tekst</span>
        </button>

        <div className={styles.tbSep} />
        <div style={{ flex:1 }} />

        <button
          className={`${styles.tbBtn} ${styles.tbBtnDanger}`}
          onClick={() => setShowConfirm(true)} title="Obriši bilješku">
          <Trash2 size={14} />
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          {formatDate(note.updatedAt || note.updated_at)}
          {note.folder && <span className={styles.metaFolder}> · {note.folder}</span>}
        </div>

        <input
          className={styles.title}
          value={note.title}
          onChange={handleTitleChange}
          placeholder="Naslov bilješke..."
        />

        {/* Rich Text Editor */}
        <RichEditor
          content={note.content || ''}
          onChange={handleContentChange}
          placeholder="Počni pisati..."
        />

        {/* Checklist */}
        <div className={styles.checklist}>
          {totalCount > 0 && (
            <div className={styles.checklistHeader}>
              <span className={styles.checklistLabel}>Zadaci</span>
              <span className={styles.checklistCount}>{doneCount}/{totalCount}</span>
              <div className={styles.checkProgress}>
                <div className={styles.checkProgressFill}
                  style={{ width:`${Math.round((doneCount/totalCount)*100)}%` }} />
              </div>
            </div>
          )}

          {note.checklist?.map(item => (
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

        {note.tags?.length > 0 && (
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

      {/* Notification permission banner */}
      {!notifGranted && (
        <div style={{ margin:'0 16px 10px', padding:'9px 12px',
          background:'var(--amber-bg)', border:'1px solid var(--amber-bd)',
          borderRadius:8, display:'flex', alignItems:'center', gap:10, fontSize:12 }}>
          <span>⚠️</span>
          <span style={{ flex:1, color:'var(--amber)' }}>
            Dozvoli notifikacije za stvarne podsjetnike
          </span>
          <button onClick={async () => {
            const ok = await requestPermission()
            setNotifGranted(ok)
          }} style={{ padding:'4px 10px', background:'var(--amber)', color:'#fff',
            border:'none', borderRadius:6, fontSize:11, cursor:'pointer', fontWeight:500 }}>
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
              {note.reminder.repeat?.length > 0 && ' · Ponavlja se'}
              {notifGranted ? ' 🔔' : ' (bez notif.)'}
            </span>
          </div>
          <button className={styles.reminderEdit} onClick={() => setShowReminder(true)}>
            Uredi
          </button>
        </div>
      )}

      {showReminder && (
        <ReminderPanel
          reminder={note.reminder}
          onSave={handleSaveReminder}
          onClose={() => setShowReminder(false)}
        />
      )}

      {showOCR && (
        <OCRCapture
          onSave={handleOCRSave}
          onClose={() => setShowOCR(false)}
        />
      )}

      {showConfirm && (
        <ConfirmModal
          title="Obriši bilješku?"
          message={`"${note.title}" će biti trajno obrisana.`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
