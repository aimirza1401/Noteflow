import './index.css'
import { useEffect, useState } from 'react'
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
import SharedNote from './components/SharedNote'

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
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}

export default function App() {
  const { i18n } = useTranslation()
  const [session, setSession] = useState(undefined)
  const [langChosen, setLangChosen] = useState(() => {
    try { return !!localStorage.getItem('nf_lang_chosen') } catch { return false }
  })
  const [onboardingDone, setOnboardingDone] = useState(() => {
    try { return !!localStorage.getItem('nf_onboarding_done') } catch { return false }
  })

  // Check if this is a share link
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

  // Public share page – no auth needed
  if (shareId) return <SharedNote shareId={shareId} />

  // Language picker – first time only
  if (!langChosen) return <LanguagePicker onDone={() => setLangChosen(true)} />

  // Onboarding – after language, before login
  if (!onboardingDone) return (
    <Onboarding lang={i18n.language} onDone={() => setOnboardingDone(true)} />
  )

  if (session === undefined) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', fontFamily:"'DM Sans',sans-serif", color:'var(--text-3)',
      fontSize:13, background:'var(--bg)' }}>Učitavanje...</div>
  )

  if (!session) return <Login />
  return <NoteApp userId={session.user.id} userEmail={session.user.email} />
}

const BOTTOM_NAV_KEYS = [
  { id:'sve',       tKey:'allNotes'       },
  { id:'danas',     tKey:'remindersToday' },
  { id:'zadaci',    tKey:'tasks'          },
  { id:'zvjezdice', tKey:'starred'        },
  { id:'settings',  tKey:'profile'        },
]

function BottomNav({ view, setView, activeTab, setActiveTab }) {
  const { t } = useTranslation()
  const ICONS = {
    sve:       (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?'var(--blue)':'var(--text-3)'} strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="13" x2="13" y2="13"/></svg>,
    danas:     (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?'var(--blue)':'var(--text-3)'} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    zadaci:    (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?'var(--blue)':'var(--text-3)'} strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    zvjezdice: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a?'var(--blue)':'none'} stroke={a?'var(--blue)':'var(--text-3)'} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    settings:  (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?'var(--blue)':'var(--text-3)'} strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  }
  return (
    <div style={{ display:'flex', background:'var(--surface)',
      borderTop:'1px solid var(--border)', padding:'8px 0 12px',
      position:'fixed', bottom:0, left:0, right:0, zIndex:100 }}>
      {BOTTOM_NAV_KEYS.map(({ id, tKey }) => {
        const isActive = id === 'settings' ? activeTab === 'settings' : view === id && activeTab !== 'settings'
        return (
          <button key={id} onClick={() => {
            if (id === 'settings') setActiveTab('settings')
            else { setView(id); setActiveTab('list') }
          }} style={{ flex:1, background:'transparent', border:'none',
            display:'flex', flexDirection:'column', alignItems:'center',
            gap:3, padding:'2px 0', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            {ICONS[id]?.(isActive)}
            <span style={{ fontSize:10, color:isActive?'var(--blue)':'var(--text-3)', fontWeight:isActive?500:400 }}>
              {t(tKey).split(' ')[0]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function NoteApp({ userId, userEmail }) {
  const { t, i18n } = useTranslation()
  const { dark, setDark } = useTheme()
  const isMobile  = useIsMobile()
  const isOnline  = useOnline()
  const [activeTab, setActiveTab] = useState('list')
  const today = new Date().toISOString().split('T')[0]

  const {
    notes, filteredNotes, activeNote, activeId, setActiveId,
    view, setView, search, setSearch, loading, syncing,
    updateNote, toggleCheckItem, addCheckItem, deleteCheckItem,
    createNote, deleteNote, toggleStar, setReminder,
  } = useNotes(userId)

  const logout = () => supabase.auth.signOut()
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang)
    try { localStorage.setItem('nf_lang', lang) } catch {}
  }
  const handleSelectNote  = (id) => { setActiveId(id); if (isMobile) setActiveTab('editor') }
  const handleCreateNote  = async () => { await createNote(); if (isMobile) setActiveTab('editor') }
  const handleSetView     = (v) => { setView(v); if (isMobile) setActiveTab('list') }
  const todayCount = notes.filter(n => n.reminder && n.reminder.date === today).length

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', fontFamily:"'DM Sans',sans-serif",
      color:'var(--text-3)', fontSize:13, background:'var(--bg)' }}>
      {t('loadingNotes')}
    </div>
  )

  // ── MOBILE ──
  if (isMobile) {
    return (
      <div style={{ height:'100vh', background:'var(--bg)',
        fontFamily:"'DM Sans',sans-serif", display:'flex', flexDirection:'column' }}>

        {!isOnline && (
          <div style={{ background:'#1a1916', color:'#f0ede8', padding:'7px 16px',
            fontSize:12, display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <span>📵</span> Offline mod – bilješke se čuvaju lokalno
          </div>
        )}
        {isOnline && syncing && (
          <div style={{ background:'var(--blue-bg)', color:'var(--blue)', padding:'6px 16px',
            fontSize:12, display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <span>🔄</span> Sinhronizujem...
          </div>
        )}

        {activeTab === 'list' && (
          <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
            <div style={{ padding:'16px 16px 8px', background:'var(--bg)', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'var(--blue-bg)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📝</div>
                  <span style={{ fontSize:20, fontWeight:600, color:'var(--text-1)' }}>NoteFlow</span>
                </div>
                <div style={{ position:'relative' }}>
                  <div style={{ width:40, height:40, borderRadius:20, background:'var(--surface)',
                    border:'1px solid var(--border)', display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:18 }}>🔔</div>
                  {todayCount > 0 && (
                    <div style={{ position:'absolute', top:4, right:4, width:8, height:8,
                      borderRadius:4, background:'var(--blue)' }} />
                  )}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8,
                background:'var(--surface)', border:'1px solid var(--border)',
                borderRadius:12, padding:'10px 14px' }}>
                <span style={{ fontSize:14, color:'var(--text-3)' }}>🔍</span>
                <input style={{ border:'none', background:'transparent', fontSize:14,
                  color:'var(--text-1)', outline:'none', width:'100%',
                  fontFamily:"'DM Sans',sans-serif" }}
                  placeholder={t('allNotes') + '...'}
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              <NoteList notes={filteredNotes} activeId={activeId}
                setActiveId={handleSelectNote} view={view}
                setView={handleSetView} allNotes={notes} />
              {filteredNotes.length === 0 && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
                  gap:12, padding:40, color:'var(--text-3)' }}>
                  <span style={{ fontSize:36 }}>📝</span>
                  <span style={{ fontSize:13 }}>{t('noNotes')}</span>
                </div>
              )}
            </div>
            <button onClick={handleCreateNote} style={{
              position:'fixed', bottom:80, right:20, width:56, height:56,
              borderRadius:28, background:'var(--blue)', border:'none',
              color:'#fff', fontSize:28, cursor:'pointer', zIndex:99,
              boxShadow:'0 4px 16px rgba(37,99,235,.4)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
          </div>
        )}

        {activeTab === 'editor' && (
          <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px',
              background:'var(--surface)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <button onClick={() => setActiveTab('list')} style={{
                background:'transparent', border:'none', color:'var(--blue)',
                fontSize:15, fontWeight:500, cursor:'pointer',
                fontFamily:"'DM Sans',sans-serif" }}>
                ← {t('allNotes')}
              </button>
            </div>
            <div style={{ flex:1, overflow:'auto', paddingBottom:70 }}>
              {activeNote
                ? <Editor note={activeNote} updateNote={updateNote}
                    toggleCheckItem={toggleCheckItem} addCheckItem={addCheckItem}
                    deleteCheckItem={deleteCheckItem} toggleStar={toggleStar}
                    setReminder={setReminder}
                    deleteNote={(id) => { deleteNote(id); setActiveTab('list') }} />
                : <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                    height:'100%', color:'var(--text-3)', fontSize:13 }}>
                    {t('selectOrCreate')}
                  </div>
              }
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ flex:1, overflowY:'auto', background:'var(--bg)', paddingBottom:90 }}>
            <div style={{ padding:'20px 16px 12px' }}>
              <span style={{ fontSize:18, fontWeight:600, color:'var(--text-1)' }}>{t('profile')}</span>
            </div>
            <div style={{ margin:'0 16px 16px', background:'var(--surface)',
              borderRadius:16, padding:'16px', border:'1px solid var(--border)',
              display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:52, height:52, borderRadius:26, background:'var(--blue-bg)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>👤</div>
              <div>
                <div style={{ fontSize:14, fontWeight:500, color:'var(--text-1)' }}>{userEmail}</div>
                <div style={{ fontSize:12, color:'var(--text-3)' }}>{t('account')}</div>
              </div>
            </div>
            <div style={{ margin:'0 16px 16px', background:'var(--surface)',
              borderRadius:16, overflow:'hidden', border:'1px solid var(--border)' }}>
              {[
                { icon:'📊', label:t('totalNotes'),  value: notes.length },
                { icon:'☑️',  label:t('activeTasks'), value: notes.filter(n=>n.checklist?.some(c=>!c.done)).length },
                { icon:'🔔', label:t('reminders'),    value: notes.filter(n=>n.reminder).length },
                { icon:'⭐', label:t('starred'),      value: notes.filter(n=>n.starred).length },
              ].map(({ icon, label, value }, i, arr) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:14,
                  padding:'14px 16px',
                  borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize:18 }}>{icon}</span>
                  <span style={{ flex:1, fontSize:14, color:'var(--text-1)' }}>{label}</span>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--blue)' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ margin:'0 16px 12px', background:'var(--surface)',
              borderRadius:16, padding:'14px 16px', border:'1px solid var(--border)',
              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:20 }}>{dark ? '🌙' : '☀️'}</span>
                <span style={{ fontSize:14, color:'var(--text-1)' }}>{t('darkMode')}</span>
              </div>
              <div onClick={() => setDark(v => !v)} style={{
                width:48, height:26, borderRadius:13, cursor:'pointer',
                background: dark ? 'var(--blue)' : 'var(--border)', position:'relative',
                transition:'background .2s' }}>
                <div style={{ position:'absolute', top:3, left: dark ? 25 : 3,
                  width:20, height:20, borderRadius:10, background:'#fff',
                  transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.2)' }} />
              </div>
            </div>
            <div style={{ margin:'0 16px 16px', background:'var(--surface)',
              borderRadius:16, padding:'16px', border:'1px solid var(--border)' }}>
              <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:10,
                fontWeight:500, textTransform:'uppercase', letterSpacing:'.06em' }}>
                {t('chooseLanguage')}
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {[
                  { code:'bs', label:'Bosanski', flag:'🇧🇦' },
                  { code:'hr', label:'Hrvatski', flag:'🇭🇷' },
                  { code:'sr', label:'Srpski',   flag:'🇷🇸' },
                  { code:'en', label:'English',  flag:'🇬🇧' },
                  { code:'de', label:'Deutsch',  flag:'🇩🇪' },
                ].map(({ code, label, flag }) => (
                  <button key={code} onClick={() => changeLanguage(code)} style={{
                    padding:'7px 14px', borderRadius:20, fontSize:13, cursor:'pointer',
                    border:`1.5px solid ${i18n.language===code?'var(--blue)':'var(--border)'}`,
                    background: i18n.language===code ? 'var(--blue-bg)' : 'transparent',
                    color: i18n.language===code ? 'var(--blue)' : 'var(--text-2)',
                    fontFamily:"'DM Sans',sans-serif", fontWeight: i18n.language===code?500:400,
                  }}>{flag} {label}</button>
                ))}
              </div>
            </div>
            <div style={{ margin:'0 16px' }}>
              <button onClick={logout} style={{
                width:'100%', padding:'14px', background:'var(--red-bg)',
                color:'var(--red)', border:'1px solid var(--red-bd)',
                borderRadius:14, fontSize:14, fontWeight:500, cursor:'pointer',
                fontFamily:"'DM Sans',sans-serif" }}>{t('logout')}</button>
            </div>
          </div>
        )}

        <BottomNav view={view} setView={handleSetView}
          activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    )
  }

  // ── DESKTOP ──
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      {!isOnline && (
        <div style={{ background:'#1a1916', color:'#f0ede8', padding:'7px 16px',
          fontSize:12, display:'flex', alignItems:'center', gap:8 }}>
          <span>📵</span> Offline mod – bilješke se čuvaju lokalno i sinhronizuju kad se vratiš online
        </div>
      )}
      {isOnline && syncing && (
        <div style={{ background:'var(--blue-bg)', color:'var(--blue)', padding:'6px 16px',
          fontSize:12, display:'flex', alignItems:'center', gap:8 }}>
          <span>🔄</span> Sinhronizujem promjene...
        </div>
      )}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar view={view} setView={setView} search={search} setSearch={setSearch}
          notes={notes} createNote={createNote} userEmail={userEmail} onLogout={logout}
          dark={dark} setDark={setDark} currentLang={i18n.language} onLangChange={changeLanguage} />
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          <div style={{ width:340, flexShrink:0, borderRight:'1px solid var(--border)',
            overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <NoteList notes={filteredNotes} activeId={activeId}
              setActiveId={setActiveId} view={view} setView={setView} allNotes={notes} />
            <button onClick={createNote} style={{
              position:'fixed', bottom:24, left:370, width:52, height:52,
              borderRadius:26, background:'var(--blue)', border:'none',
              color:'#fff', fontSize:26, cursor:'pointer', zIndex:99,
              boxShadow:'0 4px 16px rgba(37,99,235,.35)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
          </div>
          {activeNote
            ? <Editor note={activeNote} updateNote={updateNote}
                toggleCheckItem={toggleCheckItem} addCheckItem={addCheckItem}
                deleteCheckItem={deleteCheckItem} toggleStar={toggleStar}
                setReminder={setReminder} deleteNote={deleteNote} />
            : <div style={{ flex:1, display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', gap:12,
                color:'var(--text-3)', fontSize:13, background:'var(--surface)' }}>
                <span style={{ fontSize:40 }}>📝</span>
                <span style={{ fontSize:15 }}>{t('selectOrCreate')}</span>
                <button onClick={createNote} style={{ padding:'10px 22px',
                  background:'var(--blue)', color:'#fff', border:'none',
                  borderRadius:10, fontSize:13, fontWeight:500, cursor:'pointer' }}>
                  + {t('newNote')}
                </button>
              </div>
          }
        </div>
      </div>
    </div>
  )
}
