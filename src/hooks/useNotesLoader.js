import { useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { restoreNotifications } from '../notifications'
import {
  getAllNotesLocal, saveNotesLocal,
  getQueue, removeFromQueue,
} from '../offlineDB'

/**
 * Odgovoran za:
 * - inicijalno učitavanje bilješki (local prvo, zatim Supabase)
 * - sinkronizaciju offline queue-a kad se veza uspostavi
 */
export function useNotesLoader(userId, store) {
  const { setNotes, setActiveId, activeRef, setLoading, setSyncing } = store

  // Obradi sve stavke koje su čekale u offline queue-u
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
      } catch (e) {
        console.warn('[useNotesLoader] sync item failed:', e)
      }
    }
    setSyncing(false)
  }, [setSyncing])

  // Slušaj online event — pokušaj sync čim se veza uspostavi
  useEffect(() => {
    const handler = () => syncQueue()
    window.addEventListener('online', handler)
    return () => window.removeEventListener('online', handler)
  }, [syncQueue])

  // Inicijalno učitavanje: local IndexedDB → Supabase
  useEffect(() => {
    if (!userId) return
    setLoading(true)

    const load = async () => {
      // Korak 1: Prikaži lokalne bilješke odmah da korisnik ne čeka
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
      } catch (e) {
        console.warn('[useNotesLoader] local load failed:', e)
      }

      // Korak 2: Dohvati svježe podatke s Supabasea
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('updated_at', { ascending: false })

        if (error) throw error

        const fetched = data || []
        await saveNotesLocal(fetched).catch(() => {})
        setNotes(fetched)

        // Postavi aktivan note samo ako još nije odabran
        if (fetched.length > 0 && !activeRef.current) {
          setActiveId(fetched[0].id)
        }

        restoreNotifications(fetched)
        await syncQueue()
      } catch (e) {
        console.warn('[useNotesLoader] supabase load failed:', e.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { syncQueue }
}
