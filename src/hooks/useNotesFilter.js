import { useMemo } from 'react'

const FOLDER_VIEWS = ['posao', 'projekti', 'licno']

/**
 * Odgovoran za:
 * - filtriranje bilješki prema aktivnom viewu (sve, danas, zadaci...)
 * - pretragu po naslovu i sadržaju
 * - pronalazak aktivne bilješke
 *
 * Koristi useMemo da izbjegne nepotrebne ponovne kalkulacije.
 */
export function useNotesFilter(store) {
  const { notes, activeId, view, search } = store

  const today = new Date().toISOString().split('T')[0]

  const filteredNotes = useMemo(() => {
    const q = search.toLowerCase().trim()

    return notes.filter(n => {
      // Provjera pretrage
      const matchesSearch = !q ||
        n.title?.toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q)

      if (!matchesSearch) return false

      // Provjera aktivnog viewa/foldera
      if (view === 'danas')     return n.reminder?.date === today
      if (view === 'zadaci')    return n.checklist?.length > 0
      if (view === 'zvjezdice') return n.starred
      if (FOLDER_VIEWS.includes(view)) return n.folder === view

      return true // view === 'sve'
    })
  }, [notes, view, search, today])

  const activeNote = useMemo(
    () => notes.find(n => n.id === activeId) || null,
    [notes, activeId]
  )

  // Brojevi za badge u sidebaru
  const counts = useMemo(() => ({
    sve:       notes.length,
    danas:     notes.filter(n => n.reminder?.date === today).length,
    zadaci:    notes.filter(n => n.checklist?.length > 0).length,
    zvjezdice: notes.filter(n => n.starred).length,
    posao:     notes.filter(n => n.folder === 'posao').length,
    projekti:  notes.filter(n => n.folder === 'projekti').length,
    licno:     notes.filter(n => n.folder === 'licno').length,
  }), [notes, today])

  return { filteredNotes, activeNote, counts }
}
