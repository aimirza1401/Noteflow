import { useState } from 'react'
import { Bell, X, ChevronUp, ChevronDown } from 'lucide-react'
import styles from './ReminderPanel.module.css'

const DAYS = ['N','P','U','S','Č','Pe','Su']

function NumberPicker({ value, min, max, onChange, pad = 2 }) {
  const inc = () => onChange(value >= max ? min : value + 1)
  const dec = () => onChange(value <= min ? max : value - 1)

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
      <button onClick={inc} style={{ background:'transparent', border:'none',
        cursor:'pointer', color:'var(--blue)', padding:'4px 8px',
        borderRadius:6, display:'flex', alignItems:'center' }}>
        <ChevronUp size={18} />
      </button>
      <div style={{
        width:56, height:56, borderRadius:12,
        background:'var(--blue-bg)', border:'2px solid var(--blue)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:22, fontWeight:600, color:'var(--blue)',
        fontFamily:"'DM Sans',sans-serif",
        cursor:'default', userSelect:'none',
      }}>
        {String(value).padStart(pad, '0')}
      </div>
      <button onClick={dec} style={{ background:'transparent', border:'none',
        cursor:'pointer', color:'var(--blue)', padding:'4px 8px',
        borderRadius:6, display:'flex', alignItems:'center' }}>
        <ChevronDown size={18} />
      </button>
    </div>
  )
}

export default function ReminderPanel({ reminder, onSave, onClose }) {
  const now      = new Date()
  const today    = now.toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const initTime = reminder?.time || '09:00'
  const [hours,  setHours]  = useState(parseInt(initTime.split(':')[0]) || 9)
  const [mins,   setMins]   = useState(parseInt(initTime.split(':')[1]) || 0)
  const [date,   setDate]   = useState(reminder?.date   || tomorrow)
  const [repeat, setRepeat] = useState(reminder?.repeat || [])

  const quickDates = [
    { label:'Danas',     value: today    },
    { label:'Sutra',     value: tomorrow },
    { label:'Za tjedan', value: nextWeek },
  ]

  const toggleDay = d => setRepeat(prev =>
    prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
  )

  const timeStr = () =>
    `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}`

  const handleSave = () => {
    onSave({ date, time: timeStr(), repeat })
    onClose()
  }

  const handleRemove = () => { onSave(null); onClose() }

  const repeatLabel = () => {
    if (repeat.length === 0) return 'Bez ponavljanja'
    if (repeat.length === 5 && !repeat.includes('N') && !repeat.includes('Su'))
      return 'Radni dani (P–Pe)'
    return repeat.join(', ') + ' svake sedmice'
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Bell size={13} /> Postavi podsjetnik
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Zatvori">
          <X size={14} />
        </button>
      </div>

      <div className={styles.body}>

        {/* Datum */}
        <div className={styles.row}>
          <span className={styles.lbl}>Datum</span>
          <div style={{ display:'flex', flexDirection:'column', gap:6, flex:1 }}>
            <div className={styles.pills}>
              {quickDates.map(({ label, value }) => (
                <button key={value}
                  className={`${styles.pill} ${date === value ? styles.active : ''}`}
                  onClick={() => setDate(value)}>
                  {label}
                </button>
              ))}
            </div>
            <input type="date" value={date} min={today}
              onChange={e => setDate(e.target.value)}
              style={{
                padding:'8px 10px', border:'1px solid var(--border)',
                borderRadius:8, fontSize:13, color:'var(--text-1)',
                background:'var(--surface)', outline:'none',
                fontFamily:"'DM Sans',sans-serif", width:'100%',
                WebkitAppearance:'none', boxSizing:'border-box',
              }} />
          </div>
        </div>

        {/* Vrijeme – custom picker */}
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <span className={styles.lbl}>Vrijeme</span>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
            gap:8, padding:'8px 0' }}>
            <NumberPicker value={hours} min={0} max={23} onChange={setHours} />
            <div style={{ fontSize:28, fontWeight:600, color:'var(--blue)',
              marginBottom:2, userSelect:'none' }}>:</div>
            <NumberPicker value={mins} min={0} max={59} onChange={setMins} />
          </div>

          {/* Brzi izbor */}
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:2 }}>
            {[
              { h:7,  m:0,  l:'07:00' },
              { h:8,  m:0,  l:'08:00' },
              { h:9,  m:0,  l:'09:00' },
              { h:10, m:0,  l:'10:00' },
              { h:12, m:0,  l:'12:00' },
              { h:14, m:0,  l:'14:00' },
              { h:17, m:0,  l:'17:00' },
              { h:19, m:0,  l:'19:00' },
              { h:20, m:0,  l:'20:00' },
              { h:22, m:0,  l:'22:00' },
            ].map(({ h, m, l }) => (
              <button key={l}
                onClick={() => { setHours(h); setMins(m) }}
                className={`${styles.pill} ${hours === h && mins === m ? styles.active : ''}`}
                style={{ fontSize:11, padding:'3px 8px' }}>
                {l}
              </button>
            ))}
          </div>

          <div style={{ fontSize:11, color:'var(--text-3)', textAlign:'center', marginTop:2 }}>
            Odabrano: <strong style={{ color:'var(--blue)' }}>{timeStr()}</strong>
            {' · '}Koristi strelice ↑↓ za precizno podešavanje
          </div>
        </div>

        {/* Ponavljanje */}
        <div className={styles.row} style={{ alignItems:'flex-start' }}>
          <span className={styles.lbl} style={{ paddingTop:4 }}>Ponavljanje</span>
          <div>
            <div className={styles.days}>
              {DAYS.map(d => (
                <button key={d}
                  className={`${styles.day} ${repeat.includes(d) ? styles.dayOn : ''}`}
                  onClick={() => toggleDay(d)}>
                  {d}
                </button>
              ))}
            </div>
            <p className={styles.repeatHint}>{repeatLabel()}</p>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding:'8px 10px', background:'var(--blue-bg)',
          border:'1px solid var(--blue-bd)', borderRadius:8,
          fontSize:11, color:'var(--blue)', lineHeight:1.5 }}>
          💡 Browser traži dozvolu za notifikacije jednom – klikni "Dozvoli" i pamti se zauvijek.
        </div>

        <div className={styles.actions}>
          <button className={styles.saveBtn} onClick={handleSave}>
            Sačuvaj · {timeStr()}
          </button>
          {reminder && (
            <button className={styles.removeBtn} onClick={handleRemove}>Ukloni</button>
          )}
        </div>
      </div>
    </div>
  )
}
