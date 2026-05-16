import { useState, useRef, useCallback } from 'react'

import { createWorker } from 'tesseract.js'

import {
  Camera,
  Upload,
  X,
  FileText,
  Loader,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = e => resolve(e.target.result)

    reader.onerror = () =>
      reject(new Error('Greška pri čitanju fajla'))

    reader.readAsDataURL(file)
  })
}

function cleanText(raw) {
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .trim()
}

// ─────────────────────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────────────────────

function StatusBadge({ status, progress }) {
  const config = {
    idle: {
      bg: '#f7f6f3',
      color: '#a8a59f',
      text: 'Spreman',
      Icon: FileText
    },

    loading: {
      bg: '#eff4ff',
      color: '#2563eb',
      text: `OCR... ${progress}%`,
      Icon: Loader
    },

    success: {
      bg: '#f0fdf4',
      color: '#16a34a',
      text: 'Tekst pronađen',
      Icon: CheckCircle
    },

    error: {
      bg: '#fef2f2',
      color: '#dc2626',
      text: 'Greška',
      Icon: AlertCircle
    },

    notext: {
      bg: '#fffbeb',
      color: '#b45309',
      text: 'Tekst nije nađen',
      Icon: AlertCircle
    }
  }[status] || {}

  if (status === 'idle') return null

  const { bg, color, text, Icon } = config

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        background: bg,
        borderRadius: 20,
        width: 'fit-content'
      }}
    >
      <Icon
        size={13}
        color={color}
        className={status === 'loading' ? 'spin' : ''}
      />

      <span
        style={{
          fontSize: 12,
          color,
          fontWeight: 500
        }}
      >
        {text}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function OCRCapture({
  onSave,
  onClose
}) {
  // ─────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────

  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  // ─────────────────────────────────────────────────────────
  // Refs
  // ─────────────────────────────────────────────────────────

  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  // ─────────────────────────────────────────────────────────
  // Handle file
  // ─────────────────────────────────────────────────────────

  const handleFile = useCallback(async file => {
    if (!file) return

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp'
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Podržani formati: JPG, PNG, WEBP, GIF, BMP')
      setStatus('error')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Maksimalna veličina slike je 10MB')
      setStatus('error')
      return
    }

    setFile(file)

    setError('')
    setText('')
    setProgress(0)
    setStatus('idle')

    const imageURL = await readFileAsDataURL(file)

    setPreview(imageURL)

    // Automatski naslov

    const name = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]/g, ' ')

    setTitle(
      name.length > 0
        ? name
        : 'Bilješka sa slike'
    )
  }, [])

  // ─────────────────────────────────────────────────────────
  // Drag & Drop
  // ─────────────────────────────────────────────────────────

  const onInputChange = event => {
    handleFile(event.target.files?.[0])
  }

  const onDrop = event => {
    event.preventDefault()

    setDragOver(false)

    handleFile(event.dataTransfer.files?.[0])
  }

  const onDragOver = event => {
    event.preventDefault()
    setDragOver(true)
  }

  const onDragLeave = () => {
    setDragOver(false)
  }

  // ─────────────────────────────────────────────────────────
  // OCR
  // ─────────────────────────────────────────────────────────

  const runOCR = useCallback(async () => {
    if (!preview) return

    setStatus('loading')
    setProgress(0)
    setText('')

    try {
      const worker = await createWorker(
        'bos+eng+deu',
        1,
        {
          logger: message => {
            if (
              message.status ===
              'recognizing text'
            ) {
              setProgress(
                Math.round(
                  message.progress * 100
                )
              )
            }
          }
        }
      )

      const { data } =
        await worker.recognize(preview)

      await worker.terminate()

      const cleanedText = cleanText(data.text)

      if (!cleanedText) {
        setStatus('notext')
        setText('')
      } else {
        setText(cleanedText)
        setStatus('success')
      }
    } catch (err) {
      console.error(err)

      setError(
        'OCR nije uspio. Pokušaj s jasnijom slikom.'
      )

      setStatus('error')
    }
  }, [preview])

  // ─────────────────────────────────────────────────────────
  // Save
  // ─────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!text.trim()) return

    onSave({
      title:
        title.trim() ||
        'Bilješka sa slike',

      content: text.trim()
    })

    onClose()
  }

  // ─────────────────────────────────────────────────────────
  // Clear
  // ─────────────────────────────────────────────────────────

  const handleClear = () => {
    setPreview(null)
    setFile(null)
    setText('')
    setTitle('')
    setStatus('idle')
    setError('')
    setProgress(0)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <>
      {/* Spinner animation */}

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

      {/* Overlay */}

      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,.45)',
          zIndex: 200,

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',

          padding: 16,

          fontFamily: "'DM Sans', sans-serif"
        }}
        onClick={event =>
          event.target === event.currentTarget &&
          onClose()
        }
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 16,

            width: '100%',
            maxWidth: 520,

            maxHeight: '90vh',
            overflow: 'auto',

            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',

              padding: '16px 20px',

              borderBottom:
                '1px solid #e8e6e1'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,

                  background: '#eff4ff',

                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Camera
                  size={16}
                  color="#2563eb"
                />
              </div>

              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#1a1916'
                  }}
                >
                  OCR – Slika u tekst
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: '#a8a59f'
                  }}
                >
                  Bosanski · Engleski · Njemački
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a8a59f',
                cursor: 'pointer',

                padding: 4,
                borderRadius: 6,

                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}

          <div
            style={{
              padding: 20,

              display: 'flex',
              flexDirection: 'column',

              gap: 16
            }}
          >
            {/* Drop zone */}

            {!preview ? (
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
              >
                Drop zona ovdje...
              </div>
            ) : (
              <div>
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: 220,
                    objectFit: 'contain'
                  }}
                />
              </div>
            )}

            {/* OCR dugme */}

            {preview &&
              status !== 'loading' && (
                <button onClick={runOCR}>
                  <Sparkles size={13} />
                  Čitaj tekst
                </button>
              )}

            {/* Progress */}

            {status === 'loading' && (
              <div>
                OCR u toku...
                {progress}%
              </div>
            )}

            {/* OCR rezultat */}

            {status === 'success' && (
              <textarea
                value={text}
                onChange={event =>
                  setText(event.target.value)
                }
                rows={8}
              />
            )}
          </div>

          {/* Footer */}

          <div
            style={{
              padding: '12px 20px',

              borderTop:
                '1px solid #e8e6e1',

              display: 'flex',
              gap: 8,

              justifyContent: 'flex-end'
            }}
          >
            <button onClick={onClose}>
              Odustani
            </button>

            <button
              onClick={handleSave}
              disabled={!text.trim()}
            >
              <FileText size={13} />
              Sačuvaj bilješku
            </button>
          </div>
        </div>
      </div>
    </>
  )
}