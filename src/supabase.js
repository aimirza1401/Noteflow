import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) throw new Error(
  'Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
)

export const supabase = createClient(url, key, {
  auth: {
    // Safari fix – koristi sessionStorage umjesto localStorage
    storage: {
      getItem: (key) => {
        try {
          return (
            window.localStorage.getItem(key) ||
            window.sessionStorage.getItem(key)
          )
        } catch { return null }
      },
      setItem: (key, value) => {
        try { window.localStorage.setItem(key, value) } catch {}
        try { window.sessionStorage.setItem(key, value) } catch {}
      },
      removeItem: (key) => {
        try { window.localStorage.removeItem(key) } catch {}
        try { window.sessionStorage.removeItem(key) } catch {}
      },
    },
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
