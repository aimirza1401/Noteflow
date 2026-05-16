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

const BOTTOM_NAV = [
  { id:'sve',       icon:'📋', label:'Bilješke' },
  { id:'danas',     icon:'🔔', label:'Danas'    },
  { id:'zadaci',    icon:'☑️',  label:'Zadaci'   },
  { id:'zvjezdice', icon:'⭐', label:'Označene' },
  { id:'settings',  icon:'👤', label:'Profil'   },
]

function BottomNav({ view, setView, activeTab, setActiveTab }) {
  return (
    <div style={{
      display:'flex', background:'#fff',
      borderTop:'1px solid #e8e6e1', padding:'6px 0 10px',
      position:'fixed', bottom:0, left:0, right:0, zIndex:100,
    }}>
      {BOTTOM_NAV.map(({ id, icon, label }) => {
        const isActive = id === 'settings'
          ? activeTab === 'settings'
          : view === id && activeTab !== 'settings'
        return (
          <button key={id} onClick={() => {
            if (id === 'settings') { setActiveTab('settings') }
            else { setView(id); setActiveTab('list') }
          }} style={{
            flex:1, background:'transparent', border:'none',
            display:'flex', flexDirection:'column', alignItems:'center',
            gap:2, padding:'4px 0', cursor:'pointer',
            color: isActive ? '#2563eb' : '#a8a59f',
            fontSize:10, fontFamily:"'DM Sans',sans-serif",
            fontWeight: isActive ? 500 : 400,
          }}>
            <span style={{ fontSize:20 }}>{icon}</span>
            {label}
          </button>
        )
      })}
    </div>
  )
}

function NoteApp({ userId, userEmail }) {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState('list')

  const {
    notes, filteredNotes, activeNote, activeId, setActiveId,
    view, setView, search, setSearch, loading,
    updateNote, toggleCheckItem, addCheckItem, deleteCheckItem,
    createNote, deleteNote, toggleStar, setReminder,
  } = useNotes(userId)

  const logout = () => supabase.auth.signOut()

  const handleSelectNote = (id) => {
    setActiveId(id)
    if (isMobile) setActiveTab('editor')
  }

  const handleCreateNote = async () => {
    await createNote()
    if (isMobile) setActiveTab('editor')
  }

  const handleSetView = (v) => {
    setView(v)
    if (isMobile) setActiveTab('list')
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', fontFamily:"'DM Sans',sans-serif", color:'#a8a59f', fontSize:13 }}>
      Učitavanje bilješki...
    </div>
  )

  if (isMobile) {
    return (
      <div style={{ height:'100vh', background:'var(--bg)',
        fontFamily:"'DM Sans',sans-serif", display:'flex', flexDirection:'column' }}>

        {activeTab === 'list' && (
          <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10,
              padding:'12px 14px', background:'#fff',
              borderBottom:'1px solid #e8e6e1', flexShrink:0 }}>
              <span style={{ fontSize:14, fontWeight:500, color:'#1a1916' }}>NoteFlow</span>
              <div style={{ flex:1, display:'flex', alignItems:'center', gap:7,
                background:'#f7f6f3', border:'1px solid #e8e6e1',
                borderRadius:8, padding:'7px 10px' }}>
                <span style={{ fontSize:12, color:'#a8a59f' }}>🔍</span>
                <input style={{ border:'none', background:'transparent', fontSize:13,
                  color:'#1a1916', outline:'none', width:'100%' }}
                  placeholder="Pretraži..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button onClick={handleCreateNote} style={{
                background:'#2563eb', border:'none', color:'#fff',
                borderRadius:8, padding:'7px 12px', fontSize:13,
                fontWeight:500, cursor:'pointer', flexShrink:0,
              }}>+ Nova</button>
            </div>

            <div style={{ flex:1, overflow:'auto', paddingBottom:70 }}>
              <NoteList
                notes={filteredNotes} activeId={activeId}
                setActiveId={handleSelectNote} view={view}
              />
              {filteredNotes.length === 0 && (
                <div style={{ display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center',
                  gap:12, padding:40, color:'#a8a59f' }}>
                  <span style={{ fontSize:36 }}>📝</span>
                  <span style={{ fontSize:13 }}>Nema bilješki</span>
                  <button onClick={handleCreateNote} style={{
                    padding:'8px 18px', background:'#2563eb', color:'#fff',
                    border:'none', borderRadius:8, fontSize:13,
                    fontWeight:500, cursor:'pointer'
                  }}>+ Kreiraj prvu bilješku</button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
            <div style={{ flex:1, overflow:'auto', paddingBottom:70 }}>
              {activeNote
                ? <Editor
                    note={activeNote}
                    updateNote={updateNote}
                    toggleCheckItem={toggleCheckItem}
                    addCheckItem={addCheckItem}
                    deleteCheckItem={deleteCheckItem}
                    toggleStar={toggleStar}
                    setReminder={setReminder}
                    deleteNote={(id) => { deleteNote(id); setActiveTab('list') }}
                  />
                : <div style={{ display:'flex', alignItems:'center',
                    justifyContent:'center', height:'100%',
                    color:'#a8a59f', fontSize:13 }}>
                    Odaberi bilješku
                  </div>
              }
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ flex:1, overflow:'auto', paddingBottom:90,
            background:'#fff', padding:'24px 20px 90px' }}>
            <div style={{ fontSize:16, fontWeight:500,
              marginBottom:20, color:'#1a1916' }}>Profil</div>

            <div style={{ background:'#f7f6f3', borderRadius:12, padding:'16px',
              marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:22, background:'#eff4ff',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:20 }}>👤</div>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:'#1a1916' }}>{userEmail}</div>
                <div style={{ fontSize:11, color:'#a8a59f' }}>NoteFlow nalog</div>
              </div>
            </div>

            <div style={{ background:'#f7f6f3', borderRadius:12,
              overflow:'hidden', marginBottom:16 }}>
              {[
                { icon:'📊', label:'Ukupno bilješki', value: notes.length },
                { icon:'☑️', label:'Aktivni zadaci', value: notes.filter(n=>n.checklist?.some(c=>!c.done)).length },
                { icon:'🔔', label:'Podsjetnici', value: notes.filter(n=>n.reminder).length },
                { icon:'⭐', label:'Označene', value: notes.filter(n=>n.starred).length },
              ].map(({ icon, label, value }, i, arr) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:12,
                  padding:'12px 16px',
                  borderBottom: i < arr.length-1 ? '1px solid #e8e6e1' : 'none' }}>
                  <span>{icon}</span>
                  <span style={{ flex:1, fontSize:13, color:'#1a1916' }}>{label}</span>
                  <span style={{ fontSize:13, fontWeight:500, color:'#2563eb' }}>{value}</span>
                </div>
              ))}
            </div>

            <button onClick={logout} style={{
              width:'100%', padding:'12px', background:'#fef2f2',
              color:'#dc2626', border:'1px solid #fecaca',
              borderRadius:10, fontSize:13, fontWeight:500, cursor:'pointer',
            }}>Odjavi se</button>
          </div>
        )}

        <BottomNav
          view={view} setView={handleSetView}
          activeTab={activeTab} setActiveTab={setActiveTab}
        />
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