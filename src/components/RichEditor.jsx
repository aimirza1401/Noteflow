import { useEffect, useRef } from 'react'

const TOOLBAR = [
  { tag: 'bold',   label: 'B',  style: { fontWeight: 700 } },
  { tag: 'italic', label: 'I',  style: { fontStyle: 'italic' } },
  { sep: true },
  { tag: 'ul',     label: '≡'  },
  { tag: 'ol',     label: '1.' },
  { sep: true },
  { tag: 'h1',     label: 'H1', style: { fontWeight: 700, fontSize: 12 } },
  { tag: 'h2',     label: 'H2', style: { fontWeight: 700, fontSize: 12 } },
]

export default function RichEditor({ content, onChange, placeholder }) {
  const ref = useRef(null)

  // Postavi sadržaj samo kad se promijeni izvana (npr. OCR)
  useEffect(() => {
    if (!ref.current) return
    // Izvuci plain text iz HTML
    const div = document.createElement('div')
    div.innerHTML = content || ''
    const plain = div.innerText || div.textContent || ''
    if (ref.current.value !== plain) {
      ref.current.value = plain
    }
  }, [content])

  const handleChange = (e) => {
    // Čuvamo kao plain text, ali wrapped u <p> da ostane kompatibilno
    onChange(e.target.value)
  }

  return (
    <div>
      <textarea
        ref={ref}
        defaultValue={(() => {
          // Konvertuj HTML u plain text za prikaz
          const div = document.createElement('div')
          div.innerHTML = content || ''
          return div.innerText || div.textContent || ''
        })()}
        onChange={handleChange}
        placeholder={placeholder || 'Počni pisati...'}
        rows={6}
        style={{
          width: '100%',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '12px 14px',
          fontSize: 14,
          color: 'var(--text-2)',
          background: 'var(--surface)',
          outline: 'none',
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1.75,
          resize: 'vertical',
          boxSizing: 'border-box',
          WebkitAppearance: 'none',
        }}
      />
    </div>
  )
}
