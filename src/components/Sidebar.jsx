import { useTranslation } from 'react-i18next'
import { Search, BookOpen, Bell, CheckSquare, Star, Folder, Plus, LogOut, Moon, Sun } from 'lucide-react'
import styles from './Sidebar.module.css'

const LANGS = [
  { code:'bs', flag:'🇧🇦' },
  { code:'hr', flag:'🇭🇷' },
  { code:'sr', flag:'🇷🇸' },
  { code:'en', flag:'🇬🇧' },
  { code:'de', flag:'🇩🇪' },
]

export default function Sidebar({ view, setView, search, setSearch, notes, createNote,
  userEmail, onLogout, dark, setDark, currentLang, onLangChange }) {
  const { t } = useTranslation()
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

  const NAV = [
    { id:'sve',       label: t('allNotes'),        Icon: BookOpen },
    { id:'danas',     label: t('remindersToday'),  Icon: Bell,        accent: true },
    { id:'zadaci',    label: t('tasks'),            Icon: CheckSquare },
    { id:'zvjezdice', label: t('starred'),          Icon: Star },
  ]
  const FOLDERS = [
    { id:'posao',    label: t('work') },
    { id:'projekti', label: t('projects') },
    { id:'licno',    label: t('personal') },
  ]

  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}><BookOpen size={15} /></div>
          <span className={styles.logoName}>NoteFlow</span>
          <button onClick={() => setDark(v => !v)} style={{
            marginLeft:'auto', background:'transparent', border:'none',
            color:'var(--text-3)', cursor:'pointer', padding:4,
            borderRadius:6, display:'flex', alignItems:'center',
          }} title={t('darkMode')}>
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder={t('allNotes') + '...'}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.sectionLabel}>{t('overview')}</div>
        {NAV.map(({ id, label, Icon, accent }) => (
          <button key={id}
            className={`${styles.navItem} ${view === id ? styles.active : ''}`}
            onClick={() => setView(id)}>
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
        <div className={styles.sectionLabel}>{t('folders')}</div>
        {FOLDERS.map(({ id, label }) => (
          <button key={id}
            className={`${styles.navItem} ${view === id ? styles.active : ''}`}
            onClick={() => setView(id)}>
            <Folder size={14} />
            <span>{label}</span>
            {counts[id] > 0 && <span className={styles.badge}>{counts[id]}</span>}
          </button>
        ))}
      </div>

      {/* Language switcher */}
      <div style={{ padding:'8px 14px' }}>
        <div className={styles.sectionLabel}>{t('chooseLanguage')}</div>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:4 }}>
          {LANGS.map(({ code, flag }) => (
            <button key={code} onClick={() => onLangChange(code)} style={{
              background: currentLang === code ? 'var(--blue-bg)' : 'transparent',
              border: `1px solid ${currentLang === code ? 'var(--blue-bd)' : 'var(--border)'}`,
              borderRadius:6, padding:'3px 7px', cursor:'pointer', fontSize:14,
            }}>{flag}</button>
          ))}
        </div>
      </div>

      <div className={styles.bottom}>
        <button className={styles.newBtn} onClick={createNote}>
          <Plus size={14} /> {t('newNote')}
        </button>
        {userEmail && (
          <div className={styles.user}>
            <span className={styles.userEmail}>{userEmail}</span>
            <button className={styles.logoutBtn} onClick={onLogout} title={t('logout')}>
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
