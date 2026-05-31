import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import bs from './bs'
import hr from './hr'
import sr from './sr'
import en from './en'
import de from './de'
import fr from './fr'
import it from './it'
import tr from './tr'
import es from './es'
import pt from './pt'
import ar from './ar'
import ja from './ja'

const saved = (() => {
  try { return localStorage.getItem('nf_lang') || 'bs' } catch { return 'bs' }
})()

i18n
  .use(initReactI18next)
  .init({
    resources: { bs, hr, sr, en, de, fr, it, tr, es, pt, ar, ja },
    lng: saved,
    fallbackLng: 'bs',
    interpolation: { escapeValue: false },

    saveMissing: true,
    missingKeyHandler: (lngs, ns, key) => {
      console.warn(`[i18n] ⚠️ Nedostaje ključ: "${key}" za jezike: ${lngs.join(', ')}`)
    },
    parseMissingKeyHandler: (key) => {
      // Vraća ključ kao tekst umjesto praznine
      return key
    },
  })

export default i18n
