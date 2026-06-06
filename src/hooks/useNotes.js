import { useEffect } from 'react'
import { useNotesStore }     from './useNotesStore'
import { useNotesLoader }    from './useNotesLoader'
import { useNotesFilter }    from './useNotesFilter'
import { useNotesCRUD }      from './useNotesCRUD'
import { useNotesChecklist } from './useNotesChecklist'

/**
 * Glavni hook — spaja sve manje hookove u jedan.
 * API prema komponentama ostaje potpuno isti kao prije,
 * ali je logika sada podijeljena na zasebne odgovornosti:
 *
 *   useNotesStore     → dijeljeni state (notes, activeId, view, search...)
 *   useNotesLoader    → učitavanje + offline sync queue
 *   useNotesFilter    → filtriranje, pretraga, counts za badge
 *   useNotesCRUD      → create / update / delete / star / reminder
 *   useNotesChecklist → checklist operacije
 */
export function useNotes(userId) {
  // 1. Centralni state
  const store = useNotesStore()
  const { activeId, setActiveId, activeRef, view, setView, search, setSearch,
          loading, syncing, notes } = store

  // Sinhroniziraj activeRef s activeId (bez rerenderinga)
  useEffect(() => {
    activeRef.current = activeId
  }, [activeId, activeRef])

  // 2. Učitavanje i sync
  useNotesLoader(userId, store)

  // 3. Filtriranje i pretraga
  const { filteredNotes, activeNote, counts } = useNotesFilter(store)

  // 4. CRUD operacije
  const { updateNote, createNote, deleteNote, toggleStar, setReminder } =
    useNotesCRUD(userId, store)

  // 5. Checklist operacije
  const { toggleCheckItem, addCheckItem, deleteCheckItem } =
    useNotesChecklist(store)

  return {
    // State
    notes,
    filteredNotes,
    activeNote,
    activeId,    setActiveId,
    view,        setView,
    search,      setSearch,
    loading,
    syncing,
    counts,

    // CRUD
    updateNote,
    createNote,
    deleteNote,
    toggleStar,
    setReminder,

    // Checklist
    toggleCheckItem,
    addCheckItem,
    deleteCheckItem,
  }
}
