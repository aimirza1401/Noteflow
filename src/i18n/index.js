import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import bs from './bs'
import hr from './hr'
import sr from './sr'
import en from './en'
import de from './de'

const saved = localStorage.getItem('nf_lang') || 'bs'

i18n
  .use(initReactI18next)
  .init({
    resources: { bs, hr, sr, en, de },
    lng: saved,
    fallbackLng: 'bs',
    interpolation: { escapeValue: false },
  })

export default i18n
