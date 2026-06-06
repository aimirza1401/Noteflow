import { useCallback, useRef } from 'react'
import { supabase } from '../supabase'
import {
  saveNoteLocal, deleteNoteLocal, addToQueue,
} from '../offlineDB'

const FOLDER_VIEWS = ['posao', 'projekti', 'licno']

/**
 * Odgovoran za:
 * - kreiranje bilješke (online i offline)
 * - update bilješke s debouncingom (800ms)
 * - brisanje bilješke
 * - toggle zvjezdice
 * - postavljanje podsjetnika
 */
export function useNotesCRUD(userId, store) {
  const { notes, setNotes, setActiveId, activeRef, view } = store

  // Timeri za debouncing — jedan timer po bilješci
  const updateTimers = useRef({})

  // ─── UPDATE ────────────────────────────────────────────────────────────────
  const updateNote = useCallback(async (id, changes) => {
    const ts = new Date().toISOString()

    // Odmah ažuriraj UI (optimistic update)
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, ...changes, updated_at: ts } : n
    ))

    // Debounce stvarni save za 800ms da ne spamujemo DB
    if (updateTimers.current[id]) clearTimeout(updateTimers.current[id])

    updateTimers.current[id] = setTimeout(() => {
      setNotes(prev => {
        const fresh = prev.find(n => n.id === id)
        if (!fresh) return prev

        const fullUpdate = {
          title:      fresh.title,
          content:    fresh.content,
          checklist:  fresh.checklist,
          tables:     fresh.tables || [],
          tags:       fresh.tags,
          starred:    fresh.starred,
          reminder:   fresh.reminder,
          folder:     fresh.folder,
          updated_at: new Date().toISOString(),
        }

        saveNoteLocal({ ...fresh, ...fullUpdate }).catch(() => {})

        if (navigator.onLine) {
          supabase.from('notes').update(fullUpdate).eq('id', id)
            .then(({ error }) => {
              if (error) console.error('[useNotesCRUD] updateNote:', error)
            })
        } else {
          addToQueue({ type: 'update', noteId: id, data: fullUpdate }).catch(() => {})
        }

        return prev
      })
    }, 800)
  }, [setNotes])

  // ─── CREATE ────────────────────────────────────────────────────────────────
  const createNote = useCallback(async () => {
    const noteData = {
      user_id:    userId,
      title:      'Nova bilješka',
      content:    '',
      checklist:  [],
      tables:     [],
      tags:       [],
      starred:    false,
      folder:     FOLDER_VIEWS.includes(view) ? view : 'projekti',
      reminder:   null,
      updated_at: new Date().toISOString(),
    }

    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('notes').insert(noteData).select().single()

      if (error) {
        console.error('[useNotesCRUD] createNote:', error)
        return
      }

      await saveNoteLocal(data).catch(() => {})
      setNotes(prev => [data, ...prev])
      setActiveId(data.id)
    } else {
      const local = { ...noteData, id: 'local_' + Date.now() }
      await saveNoteLocal(local).catch(() => {})
      await addToQueue({ type: 'create', noteId: local.id, data: local }).catch(() => {})
      setNotes(prev => [local, ...prev])
      setActiveId(local.id)
    }
  }, [userId, view, setNotes, setActiveId])

  // ─── DELETE ────────────────────────────────────────────────────────────────
  const deleteNote = useCallback(async (id) => {
    await deleteNoteLocal(id).catch(() => {})

    setNotes(prev => {
      const rest = prev.filter(n => n.id !== id)
      // Ako je obrisana aktivna bilješka, odaberi sljedeću
      if (activeRef.current === id) {
        setActiveId(rest[0]?.id || null)
      }
      return rest
    })

    if (navigator.onLine) {
      await supabase.from('notes').delete().eq('id', id)
    } else {
      await addToQueue({ type: 'delete', noteId: id }).catch(() => {})
    }
  }, [setNotes, setActiveId, activeRef])

  // ─── TOGGLE STAR ───────────────────────────────────────────────────────────
  const toggleStar = useCallback((id) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === id)
      if (!note) return prev

      const starred = !note.starred
      const updated = { ...note, starred }

      saveNoteLocal(updated).catch(() => {})

      if (navigator.onLine) {
        supabase.from('notes').update({ starred }).eq('id', id)
          .then(({ error }) => {
            if (error) console.error('[useNotesCRUD] toggleStar:', error)
          })
      } else {
        addToQueue({ type: 'update', noteId: id, data: { starred } }).catch(() => {})
      }

      return prev.map(n => n.id === id ? updated : n)
    })
  }, [setNotes])

  // ─── SET REMINDER ──────────────────────────────────────────────────────────
  const setReminder = useCallback(async (id, reminder) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === id)
      if (!note) return prev
      const updated = { ...note, reminder }
      saveNoteLocal(updated).catch(() => {})
      return prev.map(n => n.id === id ? updated : n)
    })

    if (navigator.onLine) {
      const { error } = await supabase
        .from('notes').update({ reminder }).eq('id', id)
      if (error) console.error('[useNotesCRUD] setReminder:', error)
    } else {
      await addToQueue({ type: 'update', noteId: id, data: { reminder } }).catch(() => {})
    }
  }, [setNotes])

  return { updateNote, createNote, deleteNote, toggleStar, setReminder }
}
