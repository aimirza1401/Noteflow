import { Search, BookOpen, Bell, CheckSquare, Star, Folder, Plus, LogOut } from 'lucide-react'
import styles from './Sidebar.module.css'

const NAV = [
  { id: 'sve',       label: 'Sve bilješke',     Icon: BookOpen },
  { id: 'danas',     label: 'Podsjetnici danas', Icon: Bell,        accent: true },
  { id: 'zadaci',    label: 'Zadaci',            Icon: CheckSquare },
  { id: 'zvjezdice', label: 'Označene',          Icon: Star },
]

const FOLDERS = [
  { id: 'posao',    label: 'Posao' },
  { id: 'projekti', label: 'Projekti' },
  { id: 'licno',    label: 'Lično' },
]

const TAGS = [
  { label: 'posao',    cls: 'tagGreen'  },
  { label: 'ideje',    cls: 'tagPurple' },
  { label: 'lično',    cls: 'tagAmber'  },
  { label: 'projekti', cls: 'tagBlue'   },
]

export default function Sidebar({ view, setView, search, setSearch, notes, createNote, userEmail, onLogout }) {
  const today = new Date().toISOString().split('T')[0]
  const counts = {
    sve:       notes.length,
    danas:     notes.filter(n => n.reminder && n.reminder.date === today).length,
    zadaci:    notes.filter(n => n.checklist && n.checklist.length > 0).length,
    zvjezdice: notes.filter(n => n.starred).length,
    posao:     notes.filter(n => n.folder === 'posao').length,
    projekti:  notes.filter(n => n.folder === 'projekti').length,
    licno:     notes.filter(n => n.folder === 'licno').length,
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}><BookOpen size={15} /></div>
          <span className={styles.logoName}>NoteFlow</span>
        </div>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Pretraži bilješke..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.sectionLabel}>Pregled</div>
        {NAV.map(({ id, label, Icon, accent }) => (
          <button key={id}
            className={`${styles.navItem} ${view === id ? styles.active : ''}`}
            onClick={() => setView(id)}
          >
            <Icon size={14} />
            <span>{label}</span>
            {counts[id] > 0 && (
              <span className={`${styles.badge} ${accent && counts[id] > 0 ? styles.badgeRed : ''}`}>
                {counts[id]}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className={styles.nav}>
        <div className={styles.sectionLabel}>Folderi</div>
        {FOLDERS.map(({ id, label }) => (
          <button key={id}
            className={`${styles.navItem} ${view === id ? styles.active : ''}`}
            onClick={() => setView(id)}
          >
            <Folder size={14} />
            <span>{label}</span>
            {counts[id] > 0 && <span className={styles.badge}>{counts[id]}</span>}
          </button>
        ))}
      </div>

      <div className={styles.tagSection}>
        <div className={styles.sectionLabel}>Tagovi</div>
        <div className={styles.tags}>
          {TAGS.map(({ label, cls }) => (
            <span key={label} className={`${styles.tag} ${styles[cls]}`}>{label}</span>
          ))}
        </div>
      </div>

      <div className={styles.bottom}>
        <button className={styles.newBtn} onClick={createNote}>
          <Plus size={14} /> Nova bilješka
        </button>
        {userEmail && (
          <div className={styles.user}>
            <span className={styles.userEmail}>{userEmail}</span>
            <button className={styles.logoutBtn} onClick={onLogout} title="Odjavi se">
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
