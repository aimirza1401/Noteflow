import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

const THEMES = {
  light: {
    '--bg':        '#f7f6f3',
    '--surface':   '#ffffff',
    '--border':    '#e8e6e1',
    '--border-s':  '#d4d1cb',
    '--text-1':    '#1a1916',
    '--text-2':    '#6b6860',
    '--text-3':    '#a8a59f',
    '--blue':      '#2563eb',
    '--blue-bg':   '#eff4ff',
    '--blue-bd':   '#bfcdfd',
    '--green-bg':  '#f0fdf4',
    '--green':     '#16a34a',
    '--green-bd':  '#bbf7d0',
    '--amber-bg':  '#fffbeb',
    '--amber':     '#b45309',
    '--amber-bd':  '#fde68a',
    '--purple-bg': '#f5f3ff',
    '--purple':    '#6d28d9',
    '--purple-bd': '#ddd6fe',
    '--red':       '#dc2626',
    '--red-bg':    '#fef2f2',
    '--red-bd':    '#fecaca',
  },
  dark: {
    '--bg':        '#0f0f0f',
    '--surface':   '#1a1a1a',
    '--border':    '#2a2a2a',
    '--border-s':  '#3a3a3a',
    '--text-1':    '#f0ede8',
    '--text-2':    '#a8a59f',
    '--text-3':    '#6b6860',
    '--blue':      '#4f83f0',
    '--blue-bg':   '#1a2340',
    '--blue-bd':   '#2a3a6a',
    '--green-bg':  '#0f1f0f',
    '--green':     '#4ade80',
    '--green-bd':  '#1a3a1a',
    '--amber-bg':  '#1f1a0a',
    '--amber':     '#fbbf24',
    '--amber-bd':  '#3a2a0a',
    '--purple-bg': '#1a1430',
    '--purple':    '#a78bfa',
    '--purple-bd': '#2a2050',
    '--red':       '#f87171',
    '--red-bg':    '#2a0f0f',
    '--red-bd':    '#4a1f1f',
  },
  wc26: {
    // FIFA World Cup 2026 — stadion noć, zelena trava, bijelo
    '--bg':        '#0a1628',
    '--surface':   '#0d2137',
    '--border':    '#1a3a52',
    '--border-s':  '#245068',
    '--text-1':    '#f0f9f0',
    '--text-2':    '#a8d4a8',
    '--text-3':    '#5a8a5a',
    '--blue':      '#22c55e',
    '--blue-bg':   '#052a10',
    '--blue-bd':   '#15803d',
    '--green-bg':  '#052a10',
    '--green':     '#4ade80',
    '--green-bd':  '#166534',
    '--amber-bg':  '#1a1200',
    '--amber':     '#facc15',
    '--amber-bd':  '#854d0e',
    '--purple-bg': '#0f1a30',
    '--purple':    '#60a5fa',
    '--purple-bd': '#1e3a5f',
    '--red':       '#f87171',
    '--red-bg':    '#2d0a0a',
    '--red-bd':    '#7f1d1d',
  },
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem('nf_theme') || 'light' } catch { return 'light' }
  })

  const dark = theme === 'dark' || theme === 'wc26'

  const setTheme = (t) => {
    setThemeState(t)
    try { localStorage.setItem('nf_theme', t) } catch {}
  }

  // Backwards compat
  const setDark = (val) => {
    if (typeof val === 'function') {
      setTheme(val(dark) ? 'dark' : 'light')
    } else {
      setTheme(val ? 'dark' : 'light')
    }
  }

  useEffect(() => {
    const r = document.documentElement
    const vars = THEMES[theme] || THEMES.light
    Object.entries(vars).forEach(([k, v]) => r.style.setProperty(k, v))
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, dark, setDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
