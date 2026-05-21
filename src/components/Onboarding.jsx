import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const SLIDES = [
  {
    bg: '#EFF4FF',
    icon: '📝',
    iconBg: '#DBEAFE',
    titleKey: 'onb1Title',
    descKey: 'onb1Desc',
    features: [],
  },
  {
    bg: '#F0FDF4',
    icon: '✏️',
    iconBg: '#DCFCE7',
    titleKey: 'onb2Title',
    descKey: 'onb2Desc',
    features: [
      { icon: '📋', bg: '#EEF2FF', color: '#4F46E5', textKey: 'onb2f1', subKey: 'onb2f1s' },
      { icon: '☑️', bg: '#F0FDF4', color: '#16A34A', textKey: 'onb2f2', subKey: 'onb2f2s' },
    ],
  },
  {
    bg: '#FDF4FF',
    icon: '🔔',
    iconBg: '#F3E8FF',
    titleKey: 'onb3Title',
    descKey: 'onb3Desc',
    features: [
      { icon: '📷', bg: '#FDF4FF', color: '#9333EA', textKey: 'onb3f1', subKey: 'onb3f1s' },
      { icon: '📵', bg: '#FFF7ED', color: '#EA580C', textKey: 'onb3f2', subKey: 'onb3f2s' },
    ],
  },
  {
    bg: '#F0FDF4',
    icon: '🚀',
    iconBg: '#DCFCE7',
    titleKey: 'onb4Title',
    descKey: 'onb4Desc',
    features: [],
    isFinal: true,
  },
]

const TEXTS = {
  bs: {
    onb1Title: 'Dobrodošao u NoteFlow',
    onb1Desc:  'Tvoje bilješke, zadaci i podsjetnici – sve na jednom mjestu.',
    onb2Title: 'Pametne bilješke',
    onb2Desc:  'Piši, organiziraj i prati zadatke s lakoćom.',
    onb2f1: 'Bilješke s formatiranjem', onb2f1s: 'Tekst, liste, naslovi',
    onb2f2: 'Checklist zadaci',         onb2f2s: 'Prati napredak u realnom vremenu',
    onb3Title: 'Podsjetnici i extras',
    onb3Desc:  'Nikad ne zaboravi važne obaveze.',
    onb3f1: 'Slika u tekst (OCR)',  onb3f1s: 'Fotografiraj dokument, tekst se upiše sam',
    onb3f2: 'Radi offline',         onb3f2s: 'Bilješke dostupne i bez interneta',
    onb4Title: 'Spreman si!',
    onb4Desc:  'Kreiraj nalog i počni besplatno. Nema limita.',
    free1: 'Neograničene bilješke',
    free2: 'Sync na svim uređajima',
    free3: 'Podsjetnici i notifikacije',
    free4: 'Rad offline',
    start: 'Kreiraj nalog',
    login: 'Već imam nalog',
    next:  'Dalje →',
    begin: 'Počni →',
    skip:  'Preskoči',
  },
  hr: {
    onb1Title: 'Dobrodošao u NoteFlow',
    onb1Desc:  'Tvoje bilješke, zadaci i podsjetnici – sve na jednom mjestu.',
    onb2Title: 'Pametne bilješke',
    onb2Desc:  'Piši, organiziraj i prati zadatke s lakoćom.',
    onb2f1: 'Bilješke s formatiranjem', onb2f1s: 'Tekst, liste, naslovi',
    onb2f2: 'Checklist zadaci',         onb2f2s: 'Prati napredak u realnom vremenu',
    onb3Title: 'Podsjetnici i extras',
    onb3Desc:  'Nikad ne zaboravi važne obaveze.',
    onb3f1: 'Slika u tekst (OCR)',  onb3f1s: 'Fotografiraj dokument, tekst se upiše sam',
    onb3f2: 'Radi offline',         onb3f2s: 'Bilješke dostupne i bez interneta',
    onb4Title: 'Spreman si!',
    onb4Desc:  'Kreiraj račun i počni besplatno.',
    free1: 'Neograničene bilješke', free2: 'Sync na svim uređajima',
    free3: 'Podsjetnici',           free4: 'Rad offline',
    start: 'Kreiraj račun', login: 'Već imam račun',
    next: 'Dalje →', begin: 'Počni →', skip: 'Preskoči',
  },
  sr: {
    onb1Title: 'Dobrodošao u NoteFlow',
    onb1Desc:  'Tvoje beleške, zadaci i podsetnici – sve na jednom mestu.',
    onb2Title: 'Pametne beleške',
    onb2Desc:  'Piši, organizuj i prati zadatke.',
    onb2f1: 'Beleške s formatiranjem', onb2f1s: 'Tekst, liste, naslovi',
    onb2f2: 'Checklist zadaci',        onb2f2s: 'Prati napredak',
    onb3Title: 'Podsetnici i extras',
    onb3Desc:  'Nikad ne zaboravi važne obaveze.',
    onb3f1: 'Slika u tekst (OCR)', onb3f1s: 'Fotografiši dokument',
    onb3f2: 'Radi offline',        onb3f2s: 'Beleške bez interneta',
    onb4Title: 'Spreman si!',
    onb4Desc:  'Kreiraj nalog i počni besplatno.',
    free1: 'Neograničene beleške', free2: 'Sync na svim uređajima',
    free3: 'Podsetnici',           free4: 'Rad offline',
    start: 'Kreiraj nalog', login: 'Već imam nalog',
    next: 'Dalje →', begin: 'Počni →', skip: 'Preskoči',
  },
  en: {
    onb1Title: 'Welcome to NoteFlow',
    onb1Desc:  'Your notes, tasks and reminders – all in one place.',
    onb2Title: 'Smart notes',
    onb2Desc:  'Write, organize and track tasks with ease.',
    onb2f1: 'Rich text notes',    onb2f1s: 'Text, lists, headings',
    onb2f2: 'Checklist tasks',    onb2f2s: 'Track progress in real time',
    onb3Title: 'Reminders & more',
    onb3Desc:  'Never forget important tasks.',
    onb3f1: 'Image to text (OCR)', onb3f1s: 'Photograph a document, text is auto-filled',
    onb3f2: 'Works offline',       onb3f2s: 'Notes available without internet',
    onb4Title: "You're ready!",
    onb4Desc:  'Create an account and start for free. No limits.',
    free1: 'Unlimited notes',      free2: 'Sync across all devices',
    free3: 'Reminders & alerts',   free4: 'Offline access',
    start: 'Create account', login: 'I already have an account',
    next: 'Next →', begin: 'Get started →', skip: 'Skip',
  },
  de: {
    onb1Title: 'Willkommen bei NoteFlow',
    onb1Desc:  'Deine Notizen, Aufgaben und Erinnerungen – alles an einem Ort.',
    onb2Title: 'Smarte Notizen',
    onb2Desc:  'Schreibe, organisiere und verfolge Aufgaben.',
    onb2f1: 'Formatierte Notizen', onb2f1s: 'Text, Listen, Überschriften',
    onb2f2: 'Checklisten',         onb2f2s: 'Fortschritt in Echtzeit',
    onb3Title: 'Erinnerungen & mehr',
    onb3Desc:  'Vergiss nie wichtige Aufgaben.',
    onb3f1: 'Bild zu Text (OCR)', onb3f1s: 'Dokument fotografieren, Text wird erkannt',
    onb3f2: 'Offline nutzbar',    onb3f2s: 'Notizen ohne Internet verfügbar',
    onb4Title: 'Du bist bereit!',
    onb4Desc:  'Erstelle ein Konto und starte kostenlos.',
    free1: 'Unbegrenzte Notizen', free2: 'Sync auf allen Geräten',
    free3: 'Erinnerungen',        free4: 'Offline-Zugriff',
    start: 'Konto erstellen', login: 'Ich habe bereits ein Konto',
    next: 'Weiter →', begin: 'Loslegen →', skip: 'Überspringen',
  },
}

export default function Onboarding({ onDone, lang = 'bs' }) {
  const [current, setCurrent] = useState(0)
  const t = TEXTS[lang] || TEXTS.bs
  const slide = SLIDES[current]
  const isLast = current === SLIDES.length - 1
  const isFirst = current === 0

  const finish = () => {
    try { localStorage.setItem('nf_onboarding_done', '1') } catch {}
    onDone()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: slide.bg, fontFamily: "'DM Sans', sans-serif",
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '48px 24px 40px',
      transition: 'background .4s ease',
    }}>
      {/* Skip */}
      {!isFirst && !isLast && (
        <button onClick={finish} style={{
          position: 'absolute', top: 20, right: 20,
          background: 'transparent', border: 'none',
          fontSize: 13, color: '#a8a59f', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}>{t.skip}</button>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        width: '100%', maxWidth: 340, textAlign: 'center' }}>

        {/* Icon */}
        <div style={{
          width: 96, height: 96, borderRadius: 28,
          background: slide.iconBg, fontSize: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 8,
        }}>{slide.icon}</div>

        <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1a1916',
          margin: 0, lineHeight: 1.3 }}>
          {t[slide.titleKey]}
        </h1>

        <p style={{ fontSize: 15, color: '#6b6860', margin: 0,
          lineHeight: 1.6, maxWidth: 280 }}>
          {t[slide.descKey]}
        </p>

        {/* Feature rows */}
        {slide.features.length > 0 && (
          <div style={{ width: '100%', display: 'flex',
            flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {slide.features.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#fff', borderRadius: 14, padding: '12px 14px',
                border: '1px solid rgba(0,0,0,.06)', textAlign: 'left',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12,
                  background: f.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1916' }}>
                    {t[f.textKey]}
                  </div>
                  <div style={{ fontSize: 12, color: '#a8a59f', marginTop: 2 }}>
                    {t[f.subKey]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Final slide free features */}
        {slide.isFinal && (
          <div style={{ width: '100%', background: '#fff', borderRadius: 16,
            padding: '16px', border: '1px solid rgba(0,0,0,.06)', textAlign: 'left' }}>
            <div style={{ fontSize: 11, color: '#a8a59f', marginBottom: 10,
              textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 500 }}>
              ✅ Besplatno uključeno
            </div>
            {[t.free1, t.free2, t.free3, t.free4].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center',
                gap: 10, padding: '6px 0', fontSize: 14, color: '#1a1916' }}>
                <span style={{ color: '#16a34a', fontSize: 16 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div style={{ width: '100%', maxWidth: 340,
        display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)} style={{
              height: 6, borderRadius: 3, cursor: 'pointer',
              background: i === current ? '#2563eb' : '#d4d1cb',
              width: i === current ? 20 : 6,
              transition: 'all .3s',
            }} />
          ))}
        </div>

        {isLast ? (
          <>
            <button onClick={finish} style={{
              width: '100%', padding: '14px', background: '#2563eb',
              color: '#fff', border: 'none', borderRadius: 14,
              fontSize: 15, fontWeight: 500, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>{t.start}</button>
            <button onClick={finish} style={{
              background: 'none', border: 'none', fontSize: 13,
              color: '#6b6860', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>{t.login}</button>
          </>
        ) : (
          <button onClick={() => setCurrent(c => c + 1)} style={{
            width: '100%', padding: '14px', background: '#2563eb',
            color: '#fff', border: 'none', borderRadius: 14,
            fontSize: 15, fontWeight: 500, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>{isFirst ? t.begin : t.next}</button>
        )}
      </div>
    </div>
  )
}
