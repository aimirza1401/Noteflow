import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { restoreNotifications } from '../notifications'
import {
  getAllNotesLocal, saveNoteLocal, saveNotesLocal,
  deleteNoteLocal, addToSyncQueue, getSyncQueue, clearSyncItem,
} from '../offlineDB'

export function useNotes(userId) {
  const [notes,    setNotes]    = useState([])
  const [activeId, setActiveId] = useState(null)
  const [view,     setView]     = useState('sve')
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [syncing,  setSyncing]  = useState(false)
  const activeIdRef = useRef(null)

  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  useEffect(() => {
    if (!userId) return

    const loadNotes = async () => {
      setLoading(true)

      // Timeout safety – nikad ne ostaj na loading zauvijek
      const timeout = setTimeout(() => setLoading(false), 8000)

      try {
        // 1. Lokalne bilješke odmah (offline first)
        let local = []
        try { local = await getAllNotesLocal() } catch (e) { console.warn('local load err', e) }

        if (local.length > 0) {
          const sorted = [...local].sort((a, b) =>
            new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
          setNotes(sorted)
          setActiveId(sorted[0].id)
          restoreNotifications(sorted)
          setLoading(false)
          clearTimeout(timeout)
        }

        // 2. Supabase – uvijek pokušaj bez obzira na online status
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('updated_at', { ascending: false })

        if (error) {
          console.warn('Supabase load error:', error.message)
          setLoading(false)
          clearTimeout(timeout)
          return
        }

        const fetched = data || []
        try { await saveNotesLocal(fetched) } catch (e) { console.warn('save local err', e) }
        setNotes(fetched)
        if (fetched.length > 0 && !activeIdRef.current) setActiveId(fetched[0].id)
        restoreNotifications(fetched)

        try { await processSyncQueue() } catch (e) { console.warn('sync err', e) }

      } catch (e) {
        console.warn('loadNotes error:', e)
      } finally {
        setLoading(false)
        clearTimeout(timeout)
      }
    }

    loadNotes()
  }, [userId])

  const processSyncQueue = async () => {
    const queue = await getSyncQueue()
    if (queue.length === 0) return
    setSyncing(true)
    for (const item of queue) {
      try {
        if (item.type === 'update')
          await supabase.from('notes').update(item.data).eq('id', item.noteId)
        else if (item.type === 'create')
          await supabase.from('notes').insert(item.data)
        else if (item.type === 'delete')
          await supabase.from('notes').delete().eq('id', item.noteId)
        await clearSyncItem(item.id)
      } catch (e) { console.warn('sync item err', e) }
    }
    setSyncing(false)
  }

  useEffect(() => {
    const handler = () => processSyncQueue()
    window.addEventListener('online', handler)
    return () => window.removeEventListener('online', handler)
  }, [])

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
    try {
      const full = notes.find(n => n.id === id)
      if (full) await saveNoteLocal({ ...full, ...updated })
      await supabase.from('notes').update(updated).eq('id', id)
    } catch (e) {
      await addToSyncQueue({ type: 'update', noteId: id, data: updated }).catch(() => {})
    }
  }, [notes])

  const toggleCheckItem = useCallback(async (noteId, itemId) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === noteId)
      if (!note) return prev
      const checklist = note.checklist.map(c =>
        c.id === itemId ? { ...c, done: !c.done } : c)
      const updated = { ...note, checklist }
      saveNoteLocal(updated).catch(() => {})
      supabase.from('notes').update({ checklist }).eq('id', noteId).catch(() => {})
      return prev.map(n => n.id === noteId ? updated : n)
    })
  }, [])

  const addCheckItem = useCallback(async (noteId, text) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === noteId)
      if (!note) return prev
      const item = { id: 'c' + Date.now(), text, done: false }
      const checklist = [...(note.checklist || []), item]
      const updated = { ...note, checklist }
      saveNoteLocal(updated).catch(() => {})
      supabase.from('notes').update({ checklist }).eq('id', noteId).catch(() => {})
      return prev.map(n => n.id === noteId ? updated : n)
    })
  }, [])

  const deleteCheckItem = useCallback(async (noteId, itemId) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === noteId)
      if (!note) return prev
      const checklist = note.checklist.filter(c => c.id !== itemId)
      const updated = { ...note, checklist }
      saveNoteLocal(updated).catch(() => {})
      supabase.from('notes').update({ checklist }).eq('id', noteId).catch(() => {})
      return prev.map(n => n.id === noteId ? updated : n)
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
    try {
      const { data, error } = await supabase
        .from('notes').insert(note).select().single()
      if (error) throw error
      await saveNoteLocal(data).catch(() => {})
      setNotes(prev => [data, ...prev])
      setActiveId(data.id)
    } catch (e) {
      const tempId = 'local_' + Date.now()
      const local = { ...note, id: tempId }
      await saveNoteLocal(local).catch(() => {})
      await addToSyncQueue({ type: 'create', noteId: tempId, data: local }).catch(() => {})
      setNotes(prev => [local, ...prev])
      setActiveId(tempId)
    }
  }, [userId, view])

  const deleteNote = useCallback(async (id) => {
    await deleteNoteLocal(id).catch(() => {})
    setNotes(prev => {
      const remaining = prev.filter(n => n.id !== id)
      if (activeIdRef.current === id)
        setActiveId(remaining.length > 0 ? remaining[0].id : null)
      return remaining
    })
    supabase.from('notes').delete().eq('id', id).catch(() => {
      addToSyncQueue({ type: 'delete', noteId: id }).catch(() => {})
    })
  }, [])

  const toggleStar = useCallback(async (id) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === id)
      if (!note) return prev
      const starred = !note.starred
      const updated = { ...note, starred }
      saveNoteLocal(updated).catch(() => {})
      supabase.from('notes').update({ starred }).eq('id', id).catch(() => {})
      return prev.map(n => n.id === id ? updated : n)
    })
  }, [])

  const setReminder = useCallback(async (id, reminder) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === id)
      if (!note) return prev
      const updated = { ...note, reminder }
      saveNoteLocal(updated).catch(() => {})
      return prev.map(n => n.id === id ? updated : n)
    })
    supabase.from('notes').update({ reminder }).eq('id', id).catch(() => {
      addToSyncQueue({ type: 'update', noteId: id, data: { reminder } }).catch(() => {})
    })
  }, [])

  return {
    notes, filteredNotes, activeNote, activeId, setActiveId,
    view, setView, search, setSearch, loading, syncing,
    updateNote, toggleCheckItem, addCheckItem, deleteCheckItem,
    createNote, deleteNote, toggleStar, setReminder,
  }
}
