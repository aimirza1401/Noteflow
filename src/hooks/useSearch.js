import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useSearch(userId) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState(null)  // null = nema pretrage, [] = nema rezultata
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q) => {
    if (!q.trim() || !userId) {
      setResults(null)
      return
    }
    setLoading(true)
    try {
      // Pokušaj full-text search (ako postoji fts kolona)
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .textSearch('fts', q, { type: 'websearch', config: 'simple' })
        .order('updated_at', { ascending: false })

      if (error) {
        // Fallback na ILIKE pretragu ako fts kolona ne postoji
        console.warn('FTS nije dostupan, koristim ILIKE fallback:', error.message)
        const { data: fallback } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
          .order('updated_at', { ascending: false })
        setResults(fallback || [])
      } else {
        setResults(data || [])
      }
    } catch (e) {
      console.error('Search error:', e)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!query.trim()) { setResults(null); return }
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  const clear = () => { setQuery(''); setResults(null) }

  return { query, setQuery, results, loading, clear }
}
