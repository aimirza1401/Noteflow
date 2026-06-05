import { useTranslation } from 'react-i18next'
import { Search, BookOpen, Bell, CheckSquare, Star, Folder, Plus, LogOut, X } from 'lucide-react'
import { useTheme } from '../ThemeContext'
import styles from './Sidebar.module.css'

const LANGS = [
  { code:'bs', flag:'🇧🇦' },
  { code:'hr', flag:'🇭🇷' },
  { code:'sr', flag:'🇷🇸' },
  { code:'en', flag:'🇬🇧' },
  { code:'de', flag:'🇩🇪' },
  { code:'fr', flag:'🇫🇷' },
  { code:'it', flag:'🇮🇹' },
  { code:'es', flag:'🇪🇸' },
  { code:'tr', flag:'🇹🇷' },
  { code:'pt', flag:'🇧🇷' },
  { code:'ar', flag:'🇸🇦' },
  { code:'ja', flag:'🇯🇵' },
]

const THEMES = [
  { id:'light', icon:'☀️' },
  { id:'dark',  icon:'🌙' },
  { id:'wc26',  icon:'⚽' },
]

export default function Sidebar({ view, setView, search, setSearch, notes, createNote,
  userEmail, onLogout, dark, setDark, currentLang, onLangChange,
  searchResults, searchLoading, onClearSearch }) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const today = new Date().toISOString().split('T')[0]

  const activeLang = LANGS.find(l => l.code === currentLang) || LANGS[0]
  const isSearching = search.trim().length > 0

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

          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
            {/* LangIndicator */}
            <div style={{
              display:'flex', alignItems:'center', gap:4,
              padding:'3px 8px', borderRadius:6,
              border:'1px solid var(--border)', background:'var(--bg)',
              fontSize:12, color:'var(--text-2)', cursor:'default',
            }} title={`Aktivan jezik: ${activeLang.code.toUpperCase()}`}>
              <span style={{ fontSize:14 }}>{activeLang.flag}</span>
              <span style={{ fontWeight:500, letterSpacing:'.03em' }}>
                {activeLang.code.toUpperCase()}
              </span>
            </div>

            {/* Theme selector */}
            <div style={{ display:'flex', gap:2 }}>
              {THEMES.map(({ id, icon }) => (
                <button key={id} onClick={() => setTheme(id)} title={id} style={{
                  background: theme === id ? 'var(--blue-bg)' : 'transparent',
                  border: `1px solid ${theme === id ? 'var(--blue-bd)' : 'transparent'}`,
                  borderRadius:6, padding:'3px 5px', cursor:'pointer', fontSize:13,
                  lineHeight:1,
                }}>{icon}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Search input */}
        <div className={styles.searchWrap} style={{ position:'relative' }}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder={t('allNotes') + '...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {isSearching && (
            <button
              onClick={onClearSearch}
              style={{
                position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
                background:'transparent', border:'none', color:'var(--text-3)',
                cursor:'pointer', display:'flex', alignItems:'center', padding:2,
                borderRadius:4,
              }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Search rezultati */}
        {isSearching && (
          <div style={{
            padding:'4px 14px 6px',
            fontSize:11, color:'var(--text-3)',
            display:'flex', alignItems:'center', gap:6,
          }}>
            {searchLoading ? (
              <>
                <span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</span>
                Pretražujem...
              </>
            ) : searchResults ? (
              <>
                <span style={{ color: searchResults.length > 0 ? 'var(--blue)' : 'var(--text-3)' }}>
                  {searchResults.length > 0
                    ? `${searchResults.length} ${searchResults.length === 1 ? 'rezultat' : 'rezultata'}`
                    : 'Nema rezultata'}
                </span>
                za „{search}"
              </>
            ) : null}
          </div>
        )}
      </div>

      <nav className={styles.nav}>
        <div className={styles.sectionLabel}>{t('overview')}</div>
        {NAV.map(({ id, label, Icon, accent }) => (
          <button key={id}
            className={`${styles.navItem} ${view === id ? styles.active : ''}`}
            onClick={() => { setView(id); onClearSearch && onClearSearch() }}>
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
            onClick={() => { setView(id); onClearSearch && onClearSearch() }}>
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
              transition:'all .15s',
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
