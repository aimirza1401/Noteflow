import { useState, useRef } from 'react'

/**
 * Centralni state koji dijele svi notes hookovi.
 * Koristi se kao jedini izvor istine (single source of truth).
 */
export function useNotesStore() {
  const [notes,    setNotes]    = useState([])
  const [activeId, setActiveId] = useState(null)
  const [view,     setView]     = useState('sve')
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [syncing,  setSyncing]  = useState(false)

  // Ref koji prati activeId bez rerenderinga — koristi se u async callbackovima
  const activeRef = useRef(null)

  return {
    notes,    setNotes,
    activeId, setActiveId, activeRef,
    view,     setView,
    search,   setSearch,
    loading,  setLoading,
    syncing,  setSyncing,
  }
}
