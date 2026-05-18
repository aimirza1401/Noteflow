import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('nf_theme') === 'dark')

  useEffect(() => {
    localStorage.setItem('nf_theme', dark ? 'dark' : 'light')
    const r = document.documentElement
    if (dark) {
      r.style.setProperty('--bg',        '#0f0f0f')
      r.style.setProperty('--surface',   '#1a1a1a')
      r.style.setProperty('--border',    '#2a2a2a')
      r.style.setProperty('--border-s',  '#3a3a3a')
      r.style.setProperty('--text-1',    '#f0ede8')
      r.style.setProperty('--text-2',    '#a8a59f')
      r.style.setProperty('--text-3',    '#6b6860')
      r.style.setProperty('--blue',      '#4f83f0')
      r.style.setProperty('--blue-bg',   '#1a2340')
      r.style.setProperty('--blue-bd',   '#2a3a6a')
      r.style.setProperty('--green-bg',  '#0f1f0f')
      r.style.setProperty('--green',     '#4ade80')
      r.style.setProperty('--green-bd',  '#1a3a1a')
      r.style.setProperty('--amber-bg',  '#1f1a0a')
      r.style.setProperty('--amber',     '#fbbf24')
      r.style.setProperty('--amber-bd',  '#3a2a0a')
      r.style.setProperty('--purple-bg', '#1a1430')
      r.style.setProperty('--purple',    '#a78bfa')
      r.style.setProperty('--purple-bd', '#2a2050')
      r.style.setProperty('--red',       '#f87171')
      r.style.setProperty('--red-bg',    '#2a0f0f')
      r.style.setProperty('--red-bd',    '#4a1f1f')
    } else {
      r.style.setProperty('--bg',        '#f7f6f3')
      r.style.setProperty('--surface',   '#ffffff')
      r.style.setProperty('--border',    '#e8e6e1')
      r.style.setProperty('--border-s',  '#d4d1cb')
      r.style.setProperty('--text-1',    '#1a1916')
      r.style.setProperty('--text-2',    '#6b6860')
      r.style.setProperty('--text-3',    '#a8a59f')
      r.style.setProperty('--blue',      '#2563eb')
      r.style.setProperty('--blue-bg',   '#eff4ff')
      r.style.setProperty('--blue-bd',   '#bfcdfd')
      r.style.setProperty('--green-bg',  '#f0fdf4')
      r.style.setProperty('--green',     '#16a34a')
      r.style.setProperty('--green-bd',  '#bbf7d0')
      r.style.setProperty('--amber-bg',  '#fffbeb')
      r.style.setProperty('--amber',     '#b45309')
      r.style.setProperty('--amber-bd',  '#fde68a')
      r.style.setProperty('--purple-bg', '#f5f3ff')
      r.style.setProperty('--purple',    '#6d28d9')
      r.style.setProperty('--purple-bd', '#ddd6fe')
      r.style.setProperty('--red',       '#dc2626')
      r.style.setProperty('--red-bg',    '#fef2f2')
      r.style.setProperty('--red-bd',    '#fecaca')
    }
  }, [dark])

  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
