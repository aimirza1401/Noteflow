import { useCallback } from 'react'
import { supabase } from '../supabase'
import { saveNoteLocal, addToQueue } from '../offlineDB'

/**
 * Odgovoran za sve operacije na checklistama:
 * - toggle stavke (done/undone)
 * - dodavanje nove stavke
 * - brisanje stavke
 *
 * Sve operacije rade optimistic update + persist lokalno + sync s Supabaseom.
 */
export function useNotesChecklist(store) {
  const { setNotes } = store

  // Pomoćna funkcija koja primjenjuje promjenu checkliste i radi persist
  const applyChecklistChange = useCallback((noteId, getNewChecklist) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === noteId)
      if (!note) return prev

      const checklist = getNewChecklist(note.checklist || [])
      const updated   = { ...note, checklist, updated_at: new Date().toISOString() }

      saveNoteLocal(updated).catch(() => {})

      if (navigator.onLine) {
        supabase.from('notes')
          .update({ checklist, updated_at: updated.updated_at })
          .eq('id', noteId)
          .then(({ error }) => {
            if (error) console.error('[useNotesChecklist]', error)
          })
      } else {
        addToQueue({ type: 'update', noteId, data: { checklist } }).catch(() => {})
      }

      return prev.map(n => n.id === noteId ? updated : n)
    })
  }, [setNotes])

  const toggleCheckItem = useCallback((noteId, itemId) => {
    applyChecklistChange(noteId, checklist =>
      checklist.map(c => c.id === itemId ? { ...c, done: !c.done } : c)
    )
  }, [applyChecklistChange])

  const addCheckItem = useCallback((noteId, text) => {
    const newItem = { id: 'c' + Date.now(), text, done: false }
    applyChecklistChange(noteId, checklist => [...checklist, newItem])
  }, [applyChecklistChange])

  const deleteCheckItem = useCallback((noteId, itemId) => {
    applyChecklistChange(noteId, checklist =>
      checklist.filter(c => c.id !== itemId)
    )
  }, [applyChecklistChange])

  return { toggleCheckItem, addCheckItem, deleteCheckItem }
}
