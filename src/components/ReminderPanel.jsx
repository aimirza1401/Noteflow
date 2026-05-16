import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import styles from './ReminderPanel.module.css';

const DAYS = ['N','P','U','S','Č','Pe','Su'];
const TIMES = ['07:00','08:00','09:00','10:00','12:00','14:00','17:00','20:00'];

export default function ReminderPanel({ reminder, onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [date, setDate] = useState(reminder?.date || tomorrow);
  const [time, setTime] = useState(reminder?.time || '09:00');
  const [repeat, setRepeat] = useState(reminder?.repeat || []);

  const quickDates = [
    { label: 'Danas', value: today },
    { label: 'Sutra', value: tomorrow },
    { label: 'Za tjedan', value: nextWeek },
  ];

  const toggleDay = (d) => setRepeat(prev =>
    prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
  );

  const handleSave = () => {
    onSave({ date, time, repeat });
    onClose();
  };

  const handleRemove = () => {
    onSave(null);
    onClose();
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Bell size={13} />
          Postavi podsjetnik
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Zatvori">
          <X size={14} />
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.row}>
          <span className={styles.lbl}>Datum</span>
          <div className={styles.pills}>
            {quickDates.map(({ label, value }) => (
              <button
                key={value}
                className={`${styles.pill} ${date === value ? styles.active : ''}`}
                onClick={() => setDate(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.row}>
          <span className={styles.lbl}>Vrijeme</span>
          <div className={styles.timeGrid}>
            {TIMES.map(t => (
              <button
                key={t}
                className={`${styles.pill} ${time === t ? styles.active : ''}`}
                onClick={() => setTime(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.row} style={{ alignItems: 'flex-start' }}>
          <span className={styles.lbl} style={{ paddingTop: 4 }}>Ponavljanje</span>
          <div>
            <div className={styles.days}>
              {DAYS.map(d => (
                <button
                  key={d}
                  className={`${styles.day} ${repeat.includes(d) ? styles.dayOn : ''}`}
                  onClick={() => toggleDay(d)}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className={styles.repeatHint}>
              {repeat.length === 0 ? 'Bez ponavljanja' :
               repeat.length === 5 && !repeat.includes('N') && !repeat.includes('Su')
               ? 'Radni dani' : `${repeat.join(', ')} svake sedmice`}
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.saveBtn} onClick={handleSave}>
            Sačuvaj podsjetnik
          </button>
          {reminder && (
            <button className={styles.removeBtn} onClick={handleRemove}>
              Ukloni
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
