import { useState, useRef } from 'react';
import { Star, Bell, Trash2, Plus, X } from 'lucide-react';
import { TAGS } from '../data/notes';
import ReminderPanel from './ReminderPanel';
import styles from './Editor.module.css';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('bs-BA', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function Editor({
  note, updateNote, toggleCheckItem, addCheckItem,
  deleteCheckItem, toggleStar, setReminder, deleteNote,
}) {
  const [showReminder, setShowReminder] = useState(false);
  const [newTask, setNewTask] = useState('');
  const newTaskRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const hasUrgentReminder = note.reminder && note.reminder.date === today;

  const handleTitleChange = (e) => updateNote(note.id, { title: e.target.value });
  const handleContentChange = (e) => updateNote(note.id, { content: e.target.value });

  const handleAddTask = (e) => {
    if (e.key === 'Enter' && newTask.trim()) {
      addCheckItem(note.id, newTask.trim());
      setNewTask('');
    }
  };

  const doneCount = note.checklist.filter(c => c.done).length;
  const totalCount = note.checklist.length;

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <button
          className={`${styles.tbBtn} ${note.starred ? styles.tbBtnStar : ''}`}
          onClick={() => toggleStar(note.id)}
          aria-label="Označi zvjezdicom"
          title="Označi zvjezdicom"
        >
          <Star size={14} />
        </button>

        <button
          className={`${styles.tbBtn} ${note.reminder ? styles.tbBtnBell : ''} ${hasUrgentReminder ? styles.tbBtnBellUrgent : ''}`}
          onClick={() => setShowReminder(v => !v)}
          aria-label="Podsjetnik"
          title="Podsjetnik"
        >
          <Bell size={14} />
          {note.reminder && <span className={styles.tbBellDot} />}
        </button>

        <div className={styles.tbSep} />

        <div style={{ flex: 1 }} />

        <button
          className={`${styles.tbBtn} ${styles.tbBtnDanger}`}
          onClick={() => deleteNote(note.id)}
          aria-label="Obriši bilješku"
          title="Obriši bilješku"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          {formatDate(note.updatedAt)}
          {note.folder && <span className={styles.metaFolder}> · {note.folder}</span>}
        </div>

        <input
          className={styles.title}
          value={note.title}
          onChange={handleTitleChange}
          placeholder="Naslov bilješke..."
          aria-label="Naslov bilješke"
        />

        <textarea
          className={styles.content}
          value={note.content}
          onChange={handleContentChange}
          placeholder="Počni pisati..."
          rows={5}
          aria-label="Sadržaj bilješke"
        />

        {(note.checklist.length > 0 || true) && (
          <div className={styles.checklist}>
            {note.checklist.length > 0 && (
              <div className={styles.checklistHeader}>
                <span className={styles.checklistLabel}>Zadaci</span>
                <span className={styles.checklistCount}>{doneCount}/{totalCount}</span>
                {totalCount > 0 && (
                  <div className={styles.checkProgress}>
                    <div
                      className={styles.checkProgressFill}
                      style={{ width: `${Math.round((doneCount / totalCount) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {note.checklist.map(item => (
              <div key={item.id} className={`${styles.checkItem} ${item.done ? styles.checkDone : ''}`}>
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleCheckItem(note.id, item.id)}
                  className={styles.checkbox}
                  aria-label={item.text}
                />
                <span className={styles.checkText}>{item.text}</span>
                <button
                  className={styles.deleteCheck}
                  onClick={() => deleteCheckItem(note.id, item.id)}
                  aria-label="Ukloni zadatak"
                >
                  <X size={11} />
                </button>
              </div>
            ))}

            <div className={styles.addTask}>
              <Plus size={12} className={styles.addIcon} />
              <input
                ref={newTaskRef}
                className={styles.addInput}
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={handleAddTask}
                placeholder="Dodaj zadatak... (Enter)"
                aria-label="Novi zadatak"
              />
            </div>
          </div>
        )}

        {note.tags.length > 0 && (
          <div className={styles.tags}>
            {note.tags.map(t => {
              const tag = TAGS[t];
              return tag ? (
                <span key={t} className={styles.tag} style={{ background: tag.bg, color: tag.color }}>
                  {tag.label}
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {note.reminder && !showReminder && (
        <div className={`${styles.reminderBar} ${hasUrgentReminder ? styles.reminderUrgent : ''}`}>
          <Bell size={13} />
          <div className={styles.reminderInfo}>
            <span className={styles.reminderTitle}>
              {hasUrgentReminder ? 'Podsjetnik danas!' : 'Podsjetnik aktivan'}
            </span>
            <span className={styles.reminderTime}>
              {note.reminder.date === today ? 'Danas' :
               note.reminder.date === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? 'Sutra' :
               note.reminder.date} · {note.reminder.time}
              {note.reminder.repeat?.length > 0 && ` · Ponavlja se`}
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
          onSave={(r) => setReminder(note.id, r)}
          onClose={() => setShowReminder(false)}
        />
      )}
    </div>
  );
}
