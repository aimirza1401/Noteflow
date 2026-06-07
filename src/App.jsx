import './index.css'
import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from './supabase'
import { useNotes } from './hooks/useNotes'
import { useTheme } from './ThemeContext'
import Sidebar from './components/Sidebar'
import NoteList from './components/NoteList'
import Editor from './components/Editor'
import Login from './components/Login'
import LanguagePicker from './components/LanguagePicker'
import Onboarding from './components/Onboarding'
import InstallBanner from './components/InstallBanner'
import SharedNote from './components/SharedNote'
import ErrorBoundary from './components/ErrorBoundary'
import { useSearch } from './hooks/useSearch'

// ─── Hookovi ─────────────────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online',  on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────

const BOTTOM_NAV_KEYS = [
  { id: 'sve',       tKey: 'allNotes'       },
  { id: 'danas',     tKey: 'remindersToday' },
  { id: 'zadaci',    tKey: 'tasks'          },
  { id: 'zvjezdice', tKey: 'starred'        },
  { id: 'settings',  tKey: 'profile'        },
]

const NAV_ICONS = {
  sve: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={a ? 'var(--blue)' : 'var(--text-3)'} strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <line x1="7" y1="9" x2="17" y2="9"/>
      <line x1="7" y1="13" x2="13" y2="13"/>
    </svg>
  ),
  danas: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={a ? 'var(--blue)' : 'var(--text-3)'} strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
    </svg>
  ),
  zadaci: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={a ? 'var(--blue)' : 'var(--text-3)'} strokeWidth="2">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
  zvjezdice: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24"
      fill={a ? 'var(--blue)' : 'none'}
      stroke={a ? 'var(--blue)' : 'var(--text-3)'} strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  settings: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={a ? 'var(--blue)' : 'var(--text-3)'} strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
}

function BottomNav({ view, setView, activeTab, setActiveTab, todayCount }) {
  const { t } = useTranslation()
  return (
    <nav style={{
      display: 'flex',
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      padding: '8px 0 env(safe-area-inset-bottom, 12px)',
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 100,
    }}>
      {BOTTOM_NAV_KEYS.map(({ id, tKey }) => {
        const isActive = id === 'settings'
          ? activeTab === 'settings'
          : view === id && activeTab !== 'settings'

        return (
          <button
            key={id}
            onClick={() => {
              if (id === 'settings') setActiveTab('settings')
              else { setView(id); setActiveTab('list') }
            }}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3,
              padding: '2px 0', cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif",
              position: 'relative',
            }}
          >
            {NAV_ICONS[id]?.(isActive)}
            {/* Badge za podsjetnike danas */}
            {id === 'danas' && todayCount > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: '24%',
                width: 8, height: 8, borderRadius: 4,
                background: 'var(--red)',
              }} />
            )}
            <span style={{
              fontSize: 10,
              color: isActive ? 'var(--blue)' : 'var(--text-3)',
              fontWeight: isActive ? 500 : 400,
            }}>
              {t(tKey).split(' ')[0]}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

// ─── Status Bar (offline / syncing) ──────────────────────────────────────────

function StatusBar({ isOnline, syncing }) {
  if (!isOnline) return (
    <div style={{
      background: '#1a1916', color: '#f0ede8',
      padding: '7px 16px', fontSize: 12,
      display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
    }}>
      <span>📵</span> Offline mod
    </div>
  )
  if (syncing) return (
    <div style={{
      background: 'var(--blue-bg)', color: 'var(--blue)',
      padding: '6px 16px', fontSize: 12,
      display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
    }}>
      <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>🔄</span>
      Sinhronizujem...
    </div>
  )
  return null
}

// ─── Mobile Header ────────────────────────────────────────────────────────────

function MobileHeader({ activeTab, setActiveTab, t, userEmail, todayCount,
  searchQuery, setSearchQuery, onBellClick }) {
  // Lista — prikaži logo i search
  if (activeTab === 'list') return (
    <div style={{ padding: '16px 16px 8px', background: 'var(--bg)', flexShrink: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--blue-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>📝</div>
          <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-1)' }}>NoteFlow</span>
        </div>
        <button
          onClick={onBellClick}
          style={{
            width: 40, height: 40, borderRadius: 20,
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, position: 'relative', cursor: 'pointer',
          }}
        >
          🔔
          {todayCount > 0 && (
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 8, height: 8, borderRadius: 4, background: 'var(--red)',
            }} />
          )}
        </button>
      </div>
      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '10px 14px',
      }}>
        <span style={{ fontSize: 14, color: 'var(--text-3)' }}>🔍</span>
        <input
          style={{
            border: 'none', background: 'transparent', fontSize: 14,
            color: 'var(--text-1)', outline: 'none', width: '100%',
            fontFamily: "'DM Sans',sans-serif",
          }}
          placeholder={t('allNotes') + '...'}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--text-3)', cursor: 'pointer',
              fontSize: 16, lineHeight: 1, padding: 0,
            }}
          >×</button>
        )}
      </div>
    </div>
  )

  // Editor — prikaži back dugme i naslov
  if (activeTab === 'editor') return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px',
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <button
        onClick={() => setActiveTab('list')}
        style={{
          background: 'transparent', border: 'none',
          color: 'var(--blue)', fontSize: 15, fontWeight: 500,
          cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 0',
        }}
      >
        ← {t('allNotes')}
      </button>
    </div>
  )

  // Settings — prikaži naslov
  if (activeTab === 'settings') return (
    <div style={{
      padding: '16px 16px 12px',
      background: 'var(--bg)', flexShrink: 0,
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)' }}>
        {t('profile')}
      </span>
    </div>
  )

  return null
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

function SettingsPanel({ userEmail, notes, theme, setTheme, i18n, changeLanguage, logout, t }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', paddingBottom: 90 }}>

      {/* Profil */}
      <div style={{
        margin: '16px 16px 12px',
        background: 'var(--surface)', borderRadius: 16,
        padding: '16px', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 26, background: 'var(--blue-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>👤</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{userEmail}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t('account')}</div>
        </div>
      </div>

      {/* Statistike */}
      <div style={{
        margin: '0 16px 16px',
        background: 'var(--surface)', borderRadius: 16,
        overflow: 'hidden', border: '1px solid var(--border)',
      }}>
        {[
          { icon: '📊', label: t('totalNotes'),  value: notes.length },
          { icon: '☑️',  label: t('activeTasks'), value: notes.filter(n => n.checklist?.some(c => !c.done)).length },
          { icon: '🔔', label: t('reminders'),    value: notes.filter(n => n.reminder).length },
          { icon: '⭐', label: t('starred'),      value: notes.filter(n => n.starred).length },
        ].map(({ icon, label, value }, i, arr) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px',
            borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ flex: 1, fontSize: 14, color: 'var(--text-1)' }}>{label}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--blue)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Tema */}
      <div style={{
        margin: '0 16px 12px',
        background: 'var(--surface)', borderRadius: 16,
        padding: '14px 16px', border: '1px solid var(--border)',
      }}>
        <div style={{
          fontSize: 12, color: 'var(--text-3)', marginBottom: 10,
          fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em',
        }}>Tema</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'light', icon: '☀️', label: 'Svjetla' },
            { id: 'dark',  icon: '🌙', label: 'Tamna'   },
            { id: 'wc26',  icon: '⚽', label: 'WC 2026' },
          ].map(({ id, icon, label }) => (
            <button key={id} onClick={() => setTheme(id)} style={{
              flex: 1, padding: '10px 6px', borderRadius: 12, cursor: 'pointer',
              border: `2px solid ${theme === id ? 'var(--blue)' : 'var(--border)'}`,
              background: theme === id ? 'var(--blue-bg)' : 'transparent',
              color: theme === id ? 'var(--blue)' : 'var(--text-2)',
              fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Jezik */}
      <div style={{
        margin: '0 16px 16px',
        background: 'var(--surface)', borderRadius: 16,
        padding: '16px', border: '1px solid var(--border)',
      }}>
        <div style={{
          fontSize: 12, color: 'var(--text-3)', marginBottom: 10,
          fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em',
        }}>
          {t('chooseLanguage')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
          {[
            { code: 'bs', label: 'Bosanski',  flag: '🇧🇦' },
            { code: 'hr', label: 'Hrvatski',  flag: '🇭🇷' },
            { code: 'sr', label: 'Srpski',    flag: '🇷🇸' },
            { code: 'en', label: 'English',   flag: '🇬🇧' },
            { code: 'de', label: 'Deutsch',   flag: '🇩🇪' },
            { code: 'fr', label: 'Français',  flag: '🇫🇷' },
            { code: 'it', label: 'Italiano',  flag: '🇮🇹' },
            { code: 'es', label: 'Español',   flag: '🇪🇸' },
            { code: 'tr', label: 'Türkçe',    flag: '🇹🇷' },
            { code: 'pt', label: 'Português', flag: '🇧🇷' },
            { code: 'ar', label: 'العربية',   flag: '🇸🇦' },
            { code: 'ja', label: '日本語',     flag: '🇯🇵' },
          ].map(({ code, label, flag }) => (
            <button key={code} onClick={() => changeLanguage(code)} style={{
              padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
              border: `1.5px solid ${i18n.language === code ? 'var(--blue)' : 'var(--border)'}`,
              background: i18n.language === code ? 'var(--blue-bg)' : 'transparent',
              color: i18n.language === code ? 'var(--blue)' : 'var(--text-2)',
              fontFamily: "'DM Sans',sans-serif",
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
              <span style={{ fontSize: 20 }}>{flag}</span>
              <span style={{
                fontSize: 10, textAlign: 'center', lineHeight: 1.2,
                fontWeight: i18n.language === code ? 500 : 400,
              }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div style={{ margin: '0 16px' }}>
        <button onClick={logout} style={{
          width: '100%', padding: '14px',
          background: 'var(--red-bg)', color: 'var(--red)',
          border: '1px solid var(--red-bd)', borderRadius: 14,
          fontSize: 14, fontWeight: 500, cursor: 'pointer',
          fontFamily: "'DM Sans',sans-serif",
        }}>
          {t('logout')}
        </button>
      </div>
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const { i18n } = useTranslation()
  const [session, setSession] = useState(undefined)
  const [langChosen, setLangChosen] = useState(() => {
    try { return !!localStorage.getItem('nf_lang_chosen') } catch { return false }
  })
  const [onboardingDone, setOnboardingDone] = useState(() => {
    try { return !!localStorage.getItem('nf_onboarding_done') } catch { return false }
  })

  const shareId = window.location.pathname.startsWith('/share/')
    ? window.location.pathname.split('/share/')[1]
    : null

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('getSession error:', error)
      setSession(data?.session ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (shareId)        return <SharedNote shareId={shareId} />
  if (!langChosen)    return <LanguagePicker onDone={() => setLangChosen(true)} />
  if (!onboardingDone) return <Onboarding lang={i18n.language} onDone={() => setOnboardingDone(true)} />

  if (session === undefined) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontFamily: "'DM Sans',sans-serif",
      color: 'var(--text-3)', fontSize: 13, background: 'var(--bg)',
    }}>
      Učitavanje...
    </div>
  )

  if (!session) return <Login />

  return (
    <ErrorBoundary>
      <NoteApp userId={session.user.id} userEmail={session.user.email} />
    </ErrorBoundary>
  )
}

// ─── NoteApp ─────────────────────────────────────────────────────────────────

function NoteApp({ userId, userEmail }) {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const isMobile = useIsMobile()
  const isOnline = useOnline()
  const [activeTab, setActiveTab] = useState('list')
  const today = new Date().toISOString().split('T')[0]

  const {
    query: searchQuery, setQuery: setSearchQuery,
    results: searchResults, loading: searchLoading,
    clear: clearSearch,
  } = useSearch(userId)

  const {
    notes, filteredNotes, activeNote, activeId, setActiveId,
    view, setView, search, setSearch, loading, syncing,
    updateNote, toggleCheckItem, addCheckItem, deleteCheckItem,
    createNote, deleteNote, toggleStar, setReminder,
  } = useNotes(userId)

  const logout        = useCallback(() => supabase.auth.signOut(), [])
  const changeLanguage = useCallback((lang) => {
    i18n.changeLanguage(lang)
    try { localStorage.setItem('nf_lang', lang) } catch {}
  }, [i18n])

  const handleSelectNote  = useCallback((id) => {
    setActiveId(id)
    if (isMobile) setActiveTab('editor')
  }, [setActiveId, isMobile])

  const handleCreateNote  = useCallback(async () => {
    await createNote()
    if (isMobile) setActiveTab('editor')
  }, [createNote, isMobile])

  const handleSetView     = useCallback((v) => {
    setView(v)
    if (isMobile) setActiveTab('list')
  }, [setView, isMobile])

  const handleDeleteNote  = useCallback((id) => {
    deleteNote(id)
    if (isMobile) setActiveTab('list')
  }, [deleteNote, isMobile])

  // PWA shortcut parametri
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('action') === 'new-note') {
      handleCreateNote()
      window.history.replaceState({}, '', '/')
    }
    if (params.get('view') === 'danas') {
      handleSetView('danas')
      window.history.replaceState({}, '', '/')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const todayCount   = notes.filter(n => n.reminder?.date === today).length
  const visibleNotes = searchResults !== null ? searchResults : filteredNotes

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontFamily: "'DM Sans',sans-serif",
      color: 'var(--text-3)', fontSize: 13, background: 'var(--bg)',
    }}>
      {t('loadingNotes')}
    </div>
  )

  // ── MOBILNI LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        height: '100vh', background: 'var(--bg)',
        fontFamily: "'DM Sans',sans-serif",
        display: 'flex', flexDirection: 'column',
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

        <StatusBar isOnline={isOnline} syncing={syncing} />

        <MobileHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          t={t}
          userEmail={userEmail}
          todayCount={todayCount}
          searchQuery={activeTab === 'list' ? searchQuery : ''}
          setSearchQuery={setSearchQuery}
          onBellClick={() => handleSetView('danas')}
        />

        {/* Lista bilješki */}
        {activeTab === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <NoteList
                notes={visibleNotes}
                activeId={activeId}
                setActiveId={handleSelectNote}
                view={view}
                setView={handleSetView}
                allNotes={notes}
              />
              {visibleNotes.length === 0 && (
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 12,
                  padding: 40, color: 'var(--text-3)',
                }}>
                  <span style={{ fontSize: 36 }}>📝</span>
                  <span style={{ fontSize: 13 }}>{t('noNotes')}</span>
                </div>
              )}
            </div>

            {/* FAB — nova bilješka */}
            <button
              onClick={handleCreateNote}
              style={{
                position: 'fixed', bottom: 80, right: 20,
                width: 56, height: 56, borderRadius: 28,
                background: 'var(--blue)', border: 'none',
                color: '#fff', fontSize: 28, cursor: 'pointer',
                zIndex: 99,
                boxShadow: '0 4px 16px rgba(37,99,235,.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >+</button>
          </div>
        )}

        {/* Editor */}
        {activeTab === 'editor' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ flex: 1, overflow: 'auto', paddingBottom: 70 }}>
              {activeNote
                ? <Editor
                    note={activeNote}
                    updateNote={updateNote}
                    toggleCheckItem={toggleCheckItem}
                    addCheckItem={addCheckItem}
                    deleteCheckItem={deleteCheckItem}
                    toggleStar={toggleStar}
                    setReminder={setReminder}
                    deleteNote={handleDeleteNote}
                  />
                : <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '100%', color: 'var(--text-3)', fontSize: 13,
                  }}>
                    {t('selectOrCreate')}
                  </div>
              }
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <SettingsPanel
            userEmail={userEmail}
            notes={notes}
            theme={theme}
            setTheme={setTheme}
            i18n={i18n}
            changeLanguage={changeLanguage}
            logout={logout}
            t={t}
          />
        )}

        <InstallBanner />
        <BottomNav
          view={view}
          setView={handleSetView}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          todayCount={todayCount}
        />
      </div>
    )
  }

  // ── DESKTOP LAYOUT ──────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden', background: 'var(--bg)',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <StatusBar isOnline={isOnline} syncing={syncing} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          view={view}
          setView={setView}
          search={searchQuery}
          setSearch={setSearchQuery}
          searchResults={searchResults}
          searchLoading={searchLoading}
          onClearSearch={clearSearch}
          notes={visibleNotes}
          createNote={createNote}
          userEmail={userEmail}
          onLogout={logout}
          currentLang={i18n.language}
          onLangChange={changeLanguage}
        />

        {/* Lista */}
        <div style={{
          width: 340, flexShrink: 0,
          borderRight: '1px solid var(--border)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <NoteList
            notes={visibleNotes}
            activeId={activeId}
            setActiveId={setActiveId}
            view={view}
            setView={setView}
            allNotes={notes}
          />
          <button
            onClick={createNote}
            style={{
              position: 'fixed', bottom: 24, left: 370,
              width: 52, height: 52, borderRadius: 26,
              background: 'var(--blue)', border: 'none',
              color: '#fff', fontSize: 26, cursor: 'pointer',
              zIndex: 99,
              boxShadow: '0 4px 16px rgba(37,99,235,.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >+</button>
        </div>

        {/* Editor */}
        {activeNote
          ? <Editor
              note={activeNote}
              updateNote={updateNote}
              toggleCheckItem={toggleCheckItem}
              addCheckItem={addCheckItem}
              deleteCheckItem={deleteCheckItem}
              toggleStar={toggleStar}
              setReminder={setReminder}
              deleteNote={deleteNote}
            />
          : <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 12, color: 'var(--text-3)', fontSize: 13,
              background: 'var(--surface)',
            }}>
              <span style={{ fontSize: 40 }}>📝</span>
              <span style={{ fontSize: 15 }}>{t('selectOrCreate')}</span>
              <button onClick={createNote} style={{
                padding: '10px 22px', background: 'var(--blue)',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}>
                + {t('newNote')}
              </button>
            </div>
        }
      </div>
    </div>
  )
}
