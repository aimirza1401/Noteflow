import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'bs', label: 'Bosanski',  flag: '🇧🇦' },
  { code: 'hr', label: 'Hrvatski',  flag: '🇭🇷' },
  { code: 'sr', label: 'Srpski',    flag: '🇷🇸' },
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch',   flag: '🇩🇪' },
]

export default function LanguagePicker({ onDone }) {
  const { i18n, t } = useTranslation()
  const [selected, setSelected] = useState(i18n.language || 'bs')

  const handleContinue = () => {
    i18n.changeLanguage(selected)
    localStorage.setItem('nf_lang', selected)
    localStorage.setItem('nf_lang_chosen', '1')
    onDone()
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif",
      padding: 24,
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 20,
        padding: '36px 28px', width: '100%', maxWidth: 360,
        border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--blue-bg)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 12px',
          }}>📝</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-1)' }}>NoteFlow</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
            {t('chooseLanguage')}
          </div>
        </div>

        {/* Language list */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LANGUAGES.map(({ code, label, flag }) => (
            <button key={code} onClick={() => setSelected(code)} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 16px', border: `2px solid ${selected === code ? 'var(--blue)' : 'var(--border)'}`,
              borderRadius: 12, background: selected === code ? 'var(--blue-bg)' : 'transparent',
              cursor: 'pointer', transition: 'all .15s', fontFamily: "'DM Sans', sans-serif",
            }}>
              <span style={{ fontSize: 24 }}>{flag}</span>
              <span style={{
                fontSize: 15, fontWeight: selected === code ? 500 : 400,
                color: selected === code ? 'var(--blue)' : 'var(--text-1)',
              }}>{label}</span>
              {selected === code && (
                <span style={{ marginLeft: 'auto', color: 'var(--blue)', fontSize: 18 }}>✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Continue button */}
        <button onClick={handleContinue} style={{
          width: '100%', padding: '13px', background: 'var(--blue)',
          color: '#fff', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 500, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {t('continueBtn')} →
        </button>
      </div>
    </div>
  )
}
