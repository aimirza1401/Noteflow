import { useCallback, useEffect, useRef, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { ScanText, X, Upload, Camera } from 'lucide-react';
import styles from './OCRCapture.module.css';

const LANGUAGES = [
  { code: 'bos', label: 'Bosanski' },
  { code: 'hrv', label: 'Hrvatski' },
  { code: 'srp', label: 'Srpski' },
  { code: 'eng', label: 'Engleski' },
];

export default function OCRCapture({ onInsert, onClose }) {
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const workerRef = useRef(null);

  const [imageUrl, setImageUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [lang, setLang] = useState('bos');
  const [text, setText] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => () => {
    workerRef.current?.terminate();
  }, []);

  const runOCR = useCallback(async (file, language) => {
    setLoading(true);
    setError('');
    setText('');
    setProgress(0);
    setStatus('Učitavanje OCR modela...');

    try {
      await workerRef.current?.terminate();
      const worker = await createWorker(language, 1, {
        logger: (m) => {
          if (m.status) setStatus(m.status);
          if (typeof m.progress === 'number') setProgress(Math.round(m.progress * 100));
        },
      });
      workerRef.current = worker;

      setStatus('Prepoznavanje teksta...');
      const { data: { text: recognized } } = await worker.recognize(file);
      setText(recognized.trim());
      setStatus('Gotovo');
    } catch {
      setError(
        language !== 'eng'
          ? `Prepoznavanje nije uspjelo (${language}). Pokušaj engleski ili drugu sliku.`
          : 'Prepoznavanje nije uspjelo. Provjeri da je slika čitljiva.'
      );
      setStatus('');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFile = useCallback((file) => {
    if (!file?.type.startsWith('image/')) {
      setError('Odaberi sliku (JPG, PNG, WEBP).');
      return;
    }
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setImageFile(file);
    setError('');
    runOCR(file, lang);
  }, [lang, runOCR]);

  const handleLangChange = (e) => {
    const next = e.target.value;
    setLang(next);
    if (imageFile) runOCR(imageFile, next);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setImageFile(null);
    setText('');
    setProgress(0);
    setStatus('');
    setError('');
  };

  const handleInsert = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onInsert(trimmed);
    onClose();
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <ScanText size={13} />
          Skeniraj tekst sa slike
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Zatvori">
          <X size={14} />
        </button>
      </div>

      <div className={styles.body}>
        {!imageUrl ? (
          <>
            <div
              className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <Upload size={22} className={styles.dropzoneIcon} />
              <span className={styles.dropzoneText}>Prevuci sliku ovdje ili klikni za odabir</span>
              <span className={styles.dropzoneHint}>JPG, PNG, WEBP</span>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={13} />
                Galerija
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => cameraRef.current?.click()}
              >
                <Camera size={13} />
                Kamera
              </button>
            </div>

            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className={styles.hiddenInput}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />
          </>
        ) : (
          <>
            <div className={styles.preview}>
              <img src={imageUrl} alt="Skenirana slika" className={styles.previewImg} />
              <div className={styles.previewMeta}>
                <div className={styles.langRow}>
                  <span className={styles.langLbl}>Jezik</span>
                  <select
                    className={styles.langSelect}
                    value={lang}
                    onChange={handleLangChange}
                    disabled={loading}
                  >
                    {LANGUAGES.map(({ code, label }) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                </div>
                {loading && (
                  <>
                    <div className={styles.progressWrap}>
                      <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>
                    <span className={styles.status}>{status} {progress > 0 && `${progress}%`}</span>
                  </>
                )}
                {!loading && status && <span className={styles.status}>{status}</span>}
              </div>
            </div>

            <textarea
              className={styles.result}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={loading ? 'Prepoznavanje...' : 'Prepoznati tekst...'}
              disabled={loading}
              aria-label="Prepoznati tekst"
            />

            <div className={styles.footer}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleInsert}
                disabled={loading || !text.trim()}
              >
                Umetni u bilješku
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={handleClear}>
                Nova slika
              </button>
            </div>
          </>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
