import './index.css'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useNotes } from './hooks/useNotes'
import Sidebar from './components/Sidebar'
import NoteList from './components/NoteList'
import Editor from './components/Editor'
import Login from './components/Login'

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
  const {
    notes, filteredNotes, activeNote, activeId, setActiveId,
    view, setView, search, setSearch, loading,
    updateNote, toggleCheckItem, addCheckItem, deleteCheckItem,
    createNote, deleteNote, toggleStar, setReminder,
  } = useNotes(userId)

  const logout = () => supabase.auth.signOut()

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', fontFamily:"'DM Sans',sans-serif", color:'#a8a59f', fontSize:13 }}>
      Učitavanje bilješki...
    </div>
  )

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
                border:'none', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer'
              }}>+ Nova bilješka</button>
            </div>
        }
      </div>
    </div>
  )
}
