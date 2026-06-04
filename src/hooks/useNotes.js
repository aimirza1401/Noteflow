import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { restoreNotifications } from '../notifications'
import {
  getAllNotesLocal, saveNotesLocal, saveNoteLocal,
  deleteNoteLocal, addToQueue, getQueue, removeFromQueue,
} from '../offlineDB'

export function useNotes(userId) {
  const [notes,    setNotes]    = useState([])
  const [activeId, setActiveId] = useState(null)
  const [view,     setView]     = useState('sve')
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [syncing,  setSyncing]  = useState(false)
  const activeRef = useRef(null)

  useEffect(() => { activeRef.current = activeId }, [activeId])

  const syncQueue = useCallback(async () => {
    const queue = await getQueue()
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
        await removeFromQueue(item.qid)
      } catch (e) { console.warn('sync item failed:', e) }
    }
    setSyncing(false)
  }, [])

  useEffect(() => {
    const handler = () => syncQueue()
    window.addEventListener('online', handler)
    return () => window.removeEventListener('online', handler)
  }, [syncQueue])

  useEffect(() => {
    if (!userId) return
    setLoading(true)

    const load = async () => {
      try {
        const local = await getAllNotesLocal()
        if (local.length > 0) {
          const sorted = [...local].sort((a, b) =>
            new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
          setNotes(sorted)
          setActiveId(sorted[0].id)
          restoreNotifications(sorted)
          setLoading(false)
        }
      } catch (e) { console.warn('local load:', e) }

      try {
        const { data, error } = await supabase
          .from('notes').select('*')
          .order('updated_at', { ascending: false })
        if (error) throw error
        const fetched = data || []
        await saveNotesLocal(fetched).catch(() => {})
        setNotes(fetched)
        if (fetched.length > 0 && !activeRef.current) setActiveId(fetched[0].id)
        restoreNotifications(fetched)
        await syncQueue()
      } catch (e) {
        console.warn('supabase load:', e.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  const activeNote = notes.find(n => n.id === activeId) || null

  const filteredNotes = notes.filter(n => {
    const q = search.toLowerCase()
    const match = !q ||
      n.title?.toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q)
    if (!match) return false
    const today = new Date().toISOString().split('T')[0]
    if (view === 'danas')     return n.reminder?.date === today
    if (view === 'zadaci')    return n.checklist?.length > 0
    if (view === 'zvjezdice') return n.starred
    if (['posao','projekti','licno'].includes(view)) return n.folder === view
    return true
  })

  const updateTimers = useRef({})

  const updateNote = useCallback(async (id, changes) => {
    const ts = new Date().toISOString()
    const updated = { ...changes, updated_at: ts }

    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updated } : n))

    if (updateTimers.current[id]) clearTimeout(updateTimers.current[id])
    updateTimers.current[id] = setTimeout(async () => {
      setNotes(prev => {
        const fresh = prev.find(n => n.id === id)
        if (!fresh) return prev
        const fullUpdate = {
          title:      fresh.title,
          content:    fresh.content,
          checklist:  fresh.checklist,
          tables:     fresh.tables || [],   // ← tabele
          tags:       fresh.tags,
          starred:    fresh.starred,
          reminder:   fresh.reminder,
          folder:     fresh.folder,
          updated_at: new Date().toISOString(),
        }
        saveNoteLocal({ ...fresh, ...fullUpdate }).catch(() => {})
        if (navigator.onLine) {
          supabase.from('notes').update(fullUpdate).eq('id', id)
            .then(({ error }) => { if (error) console.error('updateNote:', error) })
        } else {
          addToQueue({ type: 'update', noteId: id, data: fullUpdate }).catch(() => {})
        }
        return prev
      })
    }, 800)
  }, [])

  const toggleCheckItem = useCallback((noteId, itemId) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === noteId)
      if (!note) return prev
      const checklist = note.checklist.map(c =>
        c.id === itemId ? { ...c, done: !c.done } : c)
      const updated = { ...note, checklist, updated_at: new Date().toISOString() }
      saveNoteLocal(updated).catch(() => {})
      if (navigator.onLine)
        supabase.from('notes').update({ checklist, updated_at: updated.updated_at })
          .eq('id', noteId)
          .then(({ error }) => { if (error) console.error('toggleCheckItem:', error) })
      else
        addToQueue({ type: 'update', noteId, data: { checklist } }).catch(() => {})
      return prev.map(n => n.id === noteId ? updated : n)
    })
  }, [])

  const addCheckItem = useCallback((noteId, text) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === noteId)
      if (!note) return prev
      const item = { id: 'c' + Date.now(), text, done: false }
      const checklist = [...(note.checklist || []), item]
      const updated = { ...note, checklist, updated_at: new Date().toISOString() }
      saveNoteLocal(updated).catch(() => {})
      if (navigator.onLine)
        supabase.from('notes').update({ checklist, updated_at: updated.updated_at })
          .eq('id', noteId)
          .then(({ error }) => { if (error) console.error('addCheckItem:', error) })
      else
        addToQueue({ type: 'update', noteId, data: { checklist } }).catch(() => {})
      return prev.map(n => n.id === noteId ? updated : n)
    })
  }, [])

  const deleteCheckItem = useCallback((noteId, itemId) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === noteId)
      if (!note) return prev
      const checklist = note.checklist.filter(c => c.id !== itemId)
      const updated = { ...note, checklist, updated_at: new Date().toISOString() }
      saveNoteLocal(updated).catch(() => {})
      if (navigator.onLine)
        supabase.from('notes').update({ checklist, updated_at: updated.updated_at })
          .eq('id', noteId)
          .then(({ error }) => { if (error) console.error('deleteCheckItem:', error) })
      else
        addToQueue({ type: 'update', noteId, data: { checklist } }).catch(() => {})
      return prev.map(n => n.id === noteId ? updated : n)
    })
  }, [])

  const createNote = useCallback(async () => {
    const noteData = {
      user_id:  userId,
      title:    'Nova bilješka',
      content:  '',
      checklist: [],
      tables:   [],           // ← tabele
      tags:     [],
      starred:  false,
      folder:   ['posao','projekti','licno'].includes(view) ? view : 'projekti',
      reminder: null,
      updated_at: new Date().toISOString(),
    }
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('notes').insert(noteData).select().single()
      if (error) { console.error(error); return }
      await saveNoteLocal(data).catch(() => {})
      setNotes(prev => [data, ...prev])
      setActiveId(data.id)
    } else {
      const local = { ...noteData, id: 'local_' + Date.now() }
      await saveNoteLocal(local).catch(() => {})
      await addToQueue({ type:'create', noteId: local.id, data: local }).catch(() => {})
      setNotes(prev => [local, ...prev])
      setActiveId(local.id)
    }
  }, [userId, view])

  const deleteNote = useCallback(async (id) => {
    await deleteNoteLocal(id).catch(() => {})
    setNotes(prev => {
      const rest = prev.filter(n => n.id !== id)
      if (activeRef.current === id) setActiveId(rest[0]?.id || null)
      return rest
    })
    if (navigator.onLine)
      await supabase.from('notes').delete().eq('id', id)
    else
      await addToQueue({ type:'delete', noteId: id }).catch(() => {})
  }, [])

  const toggleStar = useCallback((id) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === id)
      if (!note) return prev
      const starred = !note.starred
      const updated = { ...note, starred }
      saveNoteLocal(updated).catch(() => {})
      if (navigator.onLine)
        supabase.from('notes').update({ starred }).eq('id', id)
          .then(({ error }) => { if (error) console.error('toggleStar:', error) })
      else
        addToQueue({ type:'update', noteId: id, data:{ starred } }).catch(() => {})
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
    if (navigator.onLine)
      await supabase.from('notes').update({ reminder }).eq('id', id)
        .then(({ error }) => { if (error) console.error('setReminder:', error) })
    else
      await addToQueue({ type:'update', noteId: id, data:{ reminder } }).catch(() => {})
  }, [])

  return {
    notes, filteredNotes, activeNote, activeId, setActiveId,
    view, setView, search, setSearch, loading, syncing,
    updateNote, toggleCheckItem, addCheckItem, deleteCheckItem,
    createNote, deleteNote, toggleStar, setReminder,
  }
}
