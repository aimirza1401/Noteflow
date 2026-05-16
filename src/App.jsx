import './index.css'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useNotes } from './hooks/useNotes'
import Sidebar from './components/Sidebar'
import NoteList from './components/NoteList'
import Editor from './components/Editor'
import Login from './components/Login'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', fontFamily:"'DM Sans',sans-serif", color:'#a8a59f', fontSize:13 }}>
      Učitavanje...
    </div>
  )

  if (!session) return <Login />
  return <NoteApp userId={session.user.id} userEmail={session.user.email} />
}

function NoteApp({ userId, userEmail }) {
  const isMobile = useIsMobile()
  const [mobileView, setMobileView] = useState('list')

  const {
    notes, filteredNotes, activeNote, activeId, setActiveId,
    view, setView, search, setSearch, loading,
    updateNote, toggleCheckItem, addCheckItem, deleteCheckItem,
    createNote, deleteNote, toggleStar, setReminder,
  } = useNotes(userId)

  const logout = () => supabase.auth.signOut()

  const handleSelectNote = (id) => {
    setActiveId(id)
    if (isMobile) setMobileView('editor')
  }

  const handleCreateNote = async () => {
    await createNote()
    if (isMobile) setMobileView('editor')
  }

  const handleSetView = (v) => {
    setView(v)
    if (isMobile) setMobileView('list')
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', fontFamily:"'DM Sans',sans-serif", color:'#a8a59f', fontSize:13 }}>
      Učitavanje bilješki...
    </div>
  )

  if (isMobile) {
    return (
      <div style={{ height:'100vh', overflow:'hidden', background:'var(--bg)',
        fontFamily:"'DM Sans',sans-serif" }}>

        {mobileView === 'sidebar' && (
          <div style={{ height:'100%', overflow:'auto' }}>
            <Sidebar
              view={view} setView={handleSetView}
              search={search} setSearch={setSearch}
              notes={notes} createNote={handleCreateNote}
              userEmail={userEmail} onLogout={logout}
            />
          </div>
        )}

        {mobileView === 'list' && (
          <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10,
              padding:'12px 14px', background:'var(--surface)',
              borderBottom:'1px solid var(--border)' }}>
              <button onClick={() => setMobileView('sidebar')} style={{
                background:'transparent', border:'none', fontSize:20,
                cursor:'pointer', color:'var(--text-2)', padding:'0 4px'
              }}>☰</button>
              <div style={{ flex:1, display:'flex', alignItems:'center', gap:7,
                background:'var(--bg)', border:'1px solid var(--border)',
                borderRadius:8, padding:'7px 10px' }}>
                <span style={{ fontSize:13, color:'var(--text-3)' }}>🔍</span>
                <input
                  style={{ border:'none', background:'transparent', fontSize:13,
                    color:'var(--text-1)', outline:'none', width:'100%' }}
                  placeholder="Pretraži..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button onClick={handleCreateNote} style={{
                background:'var(--blue)', border:'none', color:'#fff',
                borderRadius:8, padding:'7px 12px', fontSize:13,
                fontWeight:500, cursor:'pointer'
              }}>+ Nova</button>
            </div>

            <div style={{ flex:1, overflow:'auto' }}>
              <NoteList
                notes={filteredNotes} activeId={activeId}
                setActiveId={handleSelectNote} view={view}
              />
            </div>

            <div style={{ display:'flex', background:'var(--surface)',
              borderTop:'1px solid var(--border)', padding:'8px 0' }}>
              {[
                { id:'sve', icon:'📋', label:'Sve' },
                { id:'danas', icon:'🔔', label:'Danas' },
                { id:'zadaci', icon:'✓', label:'Zadaci' },
                { id:'zvjezdice', icon:'⭐', label:'Označene' },
              ].map(({ id, icon, label }) => (
                <button key={id} onClick={() => handleSetView(id)} style={{
                  flex:1, background:'transparent', border:'none',
                  display:'flex', flexDirection:'column', alignItems:'center',
                  gap:2, padding:'6px 0', cursor:'pointer',
                  color: view === id ? 'var(--blue)' : 'var(--text-3)',
                  fontSize:11, fontFamily:"'DM Sans',sans-serif"
                }}>
                  <span style={{ fontSize:18 }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {mobileView === 'editor' && (
          <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10,
              padding:'12px 14px', background:'var(--surface)',
              borderBottom:'1px solid var(--border)' }}>
              <button onClick={() => setMobileView('list')} style={{
                background:'transparent', border:'none', fontSize:15,
                cursor:'pointer', color:'var(--blue)', fontWeight:500,
                display:'flex', alignItems:'center', gap:4,
                fontFamily:"'DM Sans',sans-serif"
              }}>← Nazad</button>
            </div>
            <div style={{ flex:1, overflow:'auto' }}>
              {activeNote
                ? <Editor
                    note={activeNote}
                    updateNote={updateNote}
                    toggleCheckItem={toggleCheckItem}
                    addCheckItem={addCheckItem}
                    deleteCheckItem={deleteCheckItem}
                    toggleStar={toggleStar}
                    setReminder={setReminder}
                    deleteNote={(id) => { deleteNote(id); setMobileView('list') }}
                  />
                : <div style={{ display:'flex', alignItems:'center',
                    justifyContent:'center', height:'100%',
                    color:'var(--text-3)', fontSize:13 }}>
                    Odaberi bilješku
                  </div>
              }
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar
        view={view} setView={setView}
        search={search} setSearch={setSearch}
        notes={notes} createNote={createNote}
        userEmail={userEmail} onLogout={logout}
      />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <NoteList
          notes={filteredNotes} activeId={activeId}
          setActiveId={setActiveId} view={view}
        />
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
          : <div style={{ flex:1, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:12,
              color:'var(--text-3)', fontSize:13, background:'var(--surface)' }}>
              <span style={{ fontSize:32 }}>📝</span>
              <span>Odaberi bilješku ili kreiraj novu</span>
              <button onClick={createNote} style={{
                padding:'8px 18px', background:'var(--blue)', color:'#fff',
                border:'none', borderRadius:8, fontSize:12,
                fontWeight:500, cursor:'pointer'
              }}>+ Nova bilješka</button>
            </div>
        }
      </div>
    </div>
  )
}
