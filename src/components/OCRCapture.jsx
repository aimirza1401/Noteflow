import { useState, useRef, useCallback, useMemo } from 'react'
import {
  Camera,
  Upload,
  X,
  FileText,
  Loader,
  CheckCircle,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Languages,
  Wand2,
} from 'lucide-react'
import styles from './OCRCapture.module.css'

const VISION_KEY = import.meta.env.VITE_GOOGLE_VISION_KEY

const LANGUAGE_OPTIONS = [
  { value: 'bs', label: 'Bosanski', google: 'bs', tesseract: 'bos' },
  { value: 'hr', label: 'Hrvatski', google: 'hr', tesseract: 'hrv' },
  { value: 'sr', label: 'Srpski', google: 'sr', tesseract: 'srp' },
  { value: 'en', label: 'English', google: 'en', tesseract: 'eng' },
  { value: 'de', label: 'Deutsch', google: 'de', tesseract: 'deu' },
  { value: 'fr', label: 'Français', google: 'fr', tesseract: 'fra' },
  { value: 'it', label: 'Italiano', google: 'it', tesseract: 'ita' },
  { value: 'es', label: 'Español', google: 'es', tesseract: 'spa' },
  { value: 'tr', label: 'Türkçe', google: 'tr', tesseract: 'tur' },
  { value: 'pt', label: 'Português', google: 'pt', tesseract: 'por' },
  { value: 'ar', label: 'العربية', google: 'ar', tesseract: 'ara' },
  { value: 'ja', label: '日本語', google: 'ja', tesseract: 'jpn' },
]

const DEFAULT_LANGUAGES = ['bs', 'hr', 'sr', 'en', 'de']
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']
const MAX_FILE_SIZE = 10 * 1024 * 1024

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

function getSelectedLanguages(languageValues) {
  return LANGUAGE_OPTIONS.filter(lang => languageValues.includes(lang.value))
}

function getGoogleLanguageHints(languageValues) {
  const hints = getSelectedLanguages(languageValues).map(lang => lang.google)
  return [...new Set(hints)]
}

function getTesseractLanguages(languageValues) {
  const langs = getSelectedLanguages(languageValues).map(lang => lang.tesseract).filter(Boolean)
  return [...new Set(langs)].join('+') || 'eng'
}

function cleanOCRText(value) {
  return String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function googleVisionOCR(base64Image, languageValues) {
  const imageData = base64Image.split(',')[1]

  if (!imageData) {
    throw new Error('Slika nije ispravno učitana.')
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${VISION_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageData },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
            imageContext: {
              languageHints: getGoogleLanguageHints(languageValues),
            },
          },
        ],
      }),
    }
  )

  const data = await response.json()

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Google Vision OCR nije uspio.')
  }

  const annotation = data.responses?.[0]?.fullTextAnnotation
  return cleanOCRText(annotation?.text || '')
}

async function tesseractFallback(base64Image, languageValues, onProgress) {
  const { createWorker } = await import('tesseract.js')
  const tesseractLanguages = getTesseractLanguages(languageValues)

  const worker = await createWorker(tesseractLanguages, 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress(Math.round((m.progress || 0) * 100))
      }
    },
  })

  try {
    await worker.setParameters({
      preserve_interword_spaces: '1',
    })

    const { data } = await worker.recognize(base64Image)
    return cleanOCRText(data.text)
  } finally {
    await worker.terminate()
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Greška pri čitanju fajla.'))
    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Greška pri učitavanju slike.'))
    img.src = dataUrl
  })
}

async function preprocessImage(dataUrl) {
  const img = await loadImage(dataUrl)

  // OCR bolje radi kada je dokument dovoljno velik, ali ne ogroman.
  // Za fotografije sa mobitela normalizujemo širinu na oko 1800 px.
  const maxWidth = 1800
  const scale = Math.min(1, maxWidth / img.width)
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)

  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels = imageData.data

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]

    let gray = r * 0.299 + g * 0.587 + b * 0.114

    // Blago posvjetljenje + pojačan kontrast: pomaže kod papira sa sjenama.
    gray = (gray - 128) * 1.45 + 138
    gray = Math.max(0, Math.min(255, gray))

    // Mekani prag: tamna slova jače zatamnimo, pozadinu posvijetlimo.
    if (gray < 95) gray *= 0.7
    if (gray > 205) gray = 255

    pixels[i] = gray
    pixels[i + 1] = gray
    pixels[i + 2] = gray
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.95)
}

export default function OCRCapture({ onSave, onClose }) {
  const [preview, setPreview] = useState(null)
  const [processedPreview, setProcessedPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [engine, setEngine] = useState(VISION_KEY ? 'google' : 'tesseract')
  const [languageValues, setLanguageValues] = useState(DEFAULT_LANGUAGES)
  const [showProcessed, setShowProcessed] = useState(false)

  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const selectedLanguageLabels = useMemo(() => {
    return getSelectedLanguages(languageValues).map(lang => lang.label).join(', ')
  }, [languageValues])

  const handleFile = useCallback(async selectedFile => {
    if (!selectedFile) return

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Podržani formati su JPG, PNG, WEBP, GIF i BMP.')
      setStatus('error')
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('Slika je prevelika. Maksimalna veličina je 10 MB.')
      setStatus('error')
      return
    }

    try {
      setFile(selectedFile)
      setError('')
      setText('')
      setProgress(0)
      setStatus('idle')
      setProcessedPreview(null)
      setShowProcessed(false)

      const url = await readFileAsDataURL(selectedFile)
      setPreview(url)

      const name = selectedFile.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
      setTitle(name || 'Bilješka sa slike')
    } catch (err) {
      console.error(err)
      setError('Slika nije mogla biti učitana.')
      setStatus('error')
    }
  }, [])

  const onInputChange = e => handleFile(e.target.files?.[0])
  const onDrop = e => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }
  const onDragOver = e => {
    e.preventDefault()
    setDragOver(true)
  }
  const onDragLeave = () => setDragOver(false)

  const toggleLanguage = value => {
    setLanguageValues(current => {
      if (current.includes(value)) {
        const next = current.filter(item => item !== value)
        return next.length ? next : current
      }
      return [...current, value]
    })
  }

  const runOCR = useCallback(async () => {
    if (!preview) return

    setStatus('loading')
    setProgress(0)
    setText('')
    setError('')
    setShowProcessed(false)

    let preparedImage = null

    try {
      preparedImage = await preprocessImage(preview)
      setProcessedPreview(preparedImage)

      let result = ''
      if (VISION_KEY && engine === 'google') {
        result = await googleVisionOCR(preparedImage, languageValues)
      } else {
        result = await tesseractFallback(preparedImage, languageValues, setProgress)
      }

      if (!result.trim()) {
        setStatus('notext')
        return
      }

      setText(result)
      setStatus('success')
    } catch (err) {
      console.error('OCR error:', err)

      if (VISION_KEY && engine === 'google') {
        try {
          setError('Google Vision nije uspio. Pokušavam Tesseract fallback...')
          const fallbackImage = preparedImage || (await preprocessImage(preview))
          setProcessedPreview(fallbackImage)
          const result = await tesseractFallback(fallbackImage, languageValues, setProgress)

          if (result.trim()) {
            setText(result)
            setStatus('success')
            setError('')
          } else {
            setStatus('notext')
          }
        } catch (fallbackErr) {
          console.error('Tesseract fallback error:', fallbackErr)
          setError('OCR nije uspio. Pokušaj s jasnijom slikom, boljim svjetlom ili ravnijim uglom.')
          setStatus('error')
        }
      } else {
        setError('OCR nije uspio. Pokušaj s jasnijom slikom, boljim svjetlom ili ravnijim uglom.')
        setStatus('error')
      }
    }
  }, [preview, engine, languageValues])

  const handleSave = () => {
    if (!text.trim()) return
    onSave({ title: title.trim() || 'Bilješka sa slike', content: text.trim() })
    onClose()
  }

  const handleClear = () => {
    setPreview(null)
    setProcessedPreview(null)
    setFile(null)
    setText('')
    setTitle('')
    setStatus('idle')
    setError('')
    setProgress(0)
    setShowProcessed(false)

    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const displayedImage = showProcessed && processedPreview ? processedPreview : preview

  return (
    <div
      className={styles.overlay}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBox}>
              <Camera size={16} />
            </div>
            <div>
              <div className={styles.title}>OCR – Slika u tekst</div>
              <div className={styles.subtitle}>
                {VISION_KEY ? 'Google Vision AI + Tesseract fallback' : 'Tesseract.js lokalni OCR'}
              </div>
            </div>
          </div>

          <button className={styles.iconBtn} onClick={onClose} aria-label="Zatvori">
            <X size={18} />
          </button>
        </header>

        <main className={styles.body}>
          <section className={styles.tipBox}>
            <AlertCircle size={15} />
            <span>
              Za najbolji rezultat slikaj papir ravno odozgo, bez sjene, tako da tekst zauzme većinu slike.
            </span>
          </section>

          {VISION_KEY && (
            <section className={styles.segmented}>
              <button
                type="button"
                onClick={() => setEngine('google')}
                className={cx(styles.segmentBtn, engine === 'google' && styles.segmentBtnActive)}
              >
                <Sparkles size={13} /> Google Vision
              </button>
              <button
                type="button"
                onClick={() => setEngine('tesseract')}
                className={cx(styles.segmentBtn, engine === 'tesseract' && styles.segmentBtnActive)}
              >
                <FileText size={13} /> Tesseract
              </button>
            </section>
          )}

          <section className={styles.languagePanel}>
            <div className={styles.sectionLabel}>
              <Languages size={13} /> Jezici za OCR
            </div>
            <div className={styles.langGrid}>
              {LANGUAGE_OPTIONS.map(lang => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => toggleLanguage(lang.value)}
                  className={cx(
                    styles.langChip,
                    languageValues.includes(lang.value) && styles.langChipActive
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <div className={styles.langHint}>Odabrano: {selectedLanguageLabels}</div>
          </section>

          {!preview ? (
            <section
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cx(styles.dropzone, dragOver && styles.dropzoneActive)}
            >
              <Upload size={30} />
              <div className={styles.dropTitle}>Prevuci sliku ovdje</div>
              <div className={styles.dropHint}>JPG, PNG, WEBP, GIF, BMP · max 10 MB</div>

              <div className={styles.dropActions}>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                  className={styles.primarySmallBtn}
                >
                  <Upload size={13} /> Odaberi fajl
                </button>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    cameraInputRef.current?.click()
                  }}
                  className={styles.secondarySmallBtn}
                >
                  <Camera size={13} /> Kamera
                </button>
              </div>
            </section>
          ) : (
            <section className={styles.previewCard}>
              <img src={displayedImage} alt="Pregled slike" className={styles.previewImg} />

              <button className={styles.clearBtn} onClick={handleClear} aria-label="Ukloni sliku">
                <X size={14} />
              </button>

              <div className={styles.previewFooter}>
                <span>{file?.name} · {file ? `${(file.size / 1024).toFixed(0)} KB` : ''}</span>
                {processedPreview && (
                  <button
                    type="button"
                    onClick={() => setShowProcessed(value => !value)}
                    className={styles.previewToggle}
                  >
                    {showProcessed ? 'Original' : 'Obrađena slika'}
                  </button>
                )}
              </div>
            </section>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onInputChange}
            className={styles.hiddenInput}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onInputChange}
            className={styles.hiddenInput}
          />

          <section className={styles.statusRow}>
            {status === 'loading' && (
              <div className={styles.loadingPill}>
                <Loader size={13} className={styles.spin} />
                <span>
                  {engine === 'google'
                    ? 'Pripremam sliku i čitam tekst...'
                    : `Tesseract čita tekst... ${progress}%`}
                </span>
              </div>
            )}

            {status === 'success' && (
              <div className={styles.successPill}>
                <CheckCircle size={13} />
                <span>Tekst pronađen</span>
              </div>
            )}

            {preview && status !== 'loading' && (
              <button type="button" onClick={runOCR} className={styles.ocrBtn}>
                {status === 'success' ? <RotateCcw size={13} /> : <Wand2 size={13} />}
                {status === 'success' ? 'Ponovi OCR' : 'Čitaj tekst'}
              </button>
            )}
          </section>

          {status === 'loading' && engine === 'tesseract' && (
            <div className={styles.progressWrap}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          )}

          {(status === 'error' || error) && (
            <div className={styles.errorBox}>
              <AlertCircle size={14} />
              <span>{error || 'Greška pri OCR-u.'}</span>
            </div>
          )}

          {status === 'notext' && (
            <div className={styles.warningBox}>
              <AlertCircle size={14} />
              <span>Tekst nije prepoznat. Pokušaj s jasnijom, ravnijom ili svjetlijom slikom.</span>
            </div>
          )}

          {status === 'success' && (
            <section className={styles.resultPanel}>
              <label className={styles.fieldLabel}>Naslov bilješke</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Upiši naslov..."
                className={styles.input}
              />

              <div className={styles.resultHeader}>
                <label className={styles.fieldLabel}>Prepoznati tekst</label>
                <span>{text.length} znakova · {text.split(/\s+/).filter(Boolean).length} riječi</span>
              </div>

              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={9}
                className={styles.textarea}
              />
            </section>
          )}
        </main>

        <footer className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>
            Odustani
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!text.trim()}
            className={styles.saveBtn}
          >
            <FileText size={13} /> Sačuvaj bilješku
          </button>
        </footer>
      </div>
    </div>
  )
}
