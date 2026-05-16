import { Bell, Star } from 'lucide-react';
import { TAGS } from '../data/notes';
import styles from './NoteList.module.css';

const VIEW_LABELS = {
  sve: 'Sve bilješke', danas: 'Podsjetnici danas',
  zadaci: 'Zadaci', zvjezdice: 'Označene',
  posao: 'Posao', projekti: 'Projekti', licno: 'Lično',
};

function timeAgo(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return 'Upravo';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Jučer';
  if (d < 7) return `${d}d`;
  return date.toLocaleDateString('bs-BA', { day: 'numeric', month: 'short' });
}

export default function NoteList({ notes, activeId, setActiveId, view }) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.list}>
      <div className={styles.header}>
        <span className={styles.title}>{VIEW_LABELS[view] || 'Bilješke'}</span>
        <span className={styles.count}>{notes.length}</span>
      </div>

      {notes.length === 0 && (
        <div className={styles.empty}>
          <span>Nema bilješki</span>
        </div>
      )}

      {notes.map(note => {
        const isActive = note.id === activeId;
        const hasUrgentReminder = note.reminder && note.reminder.date === today;
        const tasksDone = note.checklist.filter(c => c.done).length;
        const tasksTotal = note.checklist.length;

        return (
          <button
            key={note.id}
            className={`${styles.card} ${isActive ? styles.active : ''}`}
            onClick={() => setActiveId(note.id)}
          >
            <div className={styles.cardTop}>
              <span className={styles.cardTitle}>{note.title}</span>
              <div className={styles.cardIcons}>
                {note.starred && <Star size={11} className={styles.starIcon} />}
                {note.reminder && (
                  <Bell size={11} className={hasUrgentReminder ? styles.bellRed : styles.bellAmber} />
                )}
              </div>
            </div>

            {note.content && (
              <p className={styles.preview}>
                {note.content.replace(/\n/g, ' ').slice(0, 55)}{note.content.length > 55 ? '…' : ''}
              </p>
            )}

            {tasksTotal > 0 && (
              <div className={styles.progress}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${Math.round((tasksDone / tasksTotal) * 100)}%` }}
                  />
                </div>
                <span className={styles.progressText}>{tasksDone}/{tasksTotal}</span>
              </div>
            )}

            <div className={styles.cardBottom}>
              <span className={styles.date}>{timeAgo(note.updatedAt)}</span>
              <div className={styles.cardTags}>
                {note.tags.slice(0, 2).map(t => {
                  const tag = TAGS[t];
                  return tag ? (
                    <span key={t} className={styles.tag} style={{ background: tag.bg, color: tag.color }}>
                      {tag.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
