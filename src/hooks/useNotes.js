import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../supabase'

export function useNotes(userId) {
  const [notes,    setNotes]    = useState([])
  const [activeId, setActiveId] = useState(null)
  const [view,     setView]     = useState('sve')
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!userId) return

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('updated_at', { ascending: false })

        if (error) throw error
        const fetched = data || []
        setNotes(fetched)
        if (fetched.length > 0) setActiveId(fetched[0].id)
      } catch (e) {
        console.error('Greška pri učitavanju:', e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  const activeNote = notes.find(n => n.id === activeId) || null

  const filteredNotes = notes.filter(n => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      n.title?.toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q)
    if (!matchSearch) return false
    const today = new Date().toISOString().split('T')[0]
    if (view === 'danas')     return n.reminder && n.reminder.date === today
    if (view === 'zadaci')    return n.checklist && n.checklist.length > 0
    if (view === 'zvjezdice') return n.starred
    if (['posao','projekti','licno'].includes(view)) return n.folder === view
    return true
  })

  const updateNote = useCallback(async (id, changes) => {
    const updated = { ...changes, updated_at: new Date().toISOString() }
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updated } : n))
    await supabase.from('notes').update(updated).eq('id', id)
  }, [])

  const toggleCheckItem = useCallback(async (noteId, itemId) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === noteId)
      if (!note) return prev
      const checklist = note.checklist.map(c =>
        c.id === itemId ? { ...c, done: !c.done } : c)
      supabase.from('notes').update({ checklist }).eq('id', noteId)
      return prev.map(n => n.id === noteId ? { ...n, checklist } : n)
    })
  }, [])

  const addCheckItem = useCallback(async (noteId, text) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === noteId)
      if (!note) return prev
      const item = { id: 'c' + Date.now(), text, done: false }
      const checklist = [...(note.checklist || []), item]
      supabase.from('notes').update({ checklist }).eq('id', noteId)
      return prev.map(n => n.id === noteId ? { ...n, checklist } : n)
    })
  }, [])

  const deleteCheckItem = useCallback(async (noteId, itemId) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === noteId)
      if (!note) return prev
      const checklist = note.checklist.filter(c => c.id !== itemId)
      supabase.from('notes').update({ checklist }).eq('id', noteId)
      return prev.map(n => n.id === noteId ? { ...n, checklist } : n)
    })
  }, [])

  const createNote = useCallback(async () => {
    const note = {
      user_id: userId,
      title: 'Nova bilješka',
      content: '',
      checklist: [],
      tags: [],
      starred: false,
      folder: ['posao','projekti','licno'].includes(view) ? view : 'projekti',
      reminder: null,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('notes').insert(note).select().single()
    if (error) { console.error(error); return }
    setNotes(prev => [data, ...prev])
    setActiveId(data.id)
  }, [userId, view])

  const deleteNote = useCallback(async (id) => {
    setNotes(prev => {
      const remaining = prev.filter(n => n.id !== id)
      if (activeId === id) setActiveId(remaining.length > 0 ? remaining[0].id : null)
      return remaining
    })
    await supabase.from('notes').delete().eq('id', id)
  }, [activeId])

  const toggleStar = useCallback(async (id) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === id)
      if (!note) return prev
      const starred = !note.starred
      supabase.from('notes').update({ starred }).eq('id', id)
      return prev.map(n => n.id === id ? { ...n, starred } : n)
    })
  }, [])

  const setReminder = useCallback(async (id, reminder) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, reminder } : n))
    await supabase.from('notes').update({ reminder }).eq('id', id)
  }, [])

  return {
    notes, filteredNotes, activeNote, activeId, setActiveId,
    view, setView, search, setSearch, loading,
    updateNote, toggleCheckItem, addCheckItem, deleteCheckItem,
    createNote, deleteNote, toggleStar, setReminder,
  }
}
