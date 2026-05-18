// Notification service – stvarne browser push notifikacije

export async function requestPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function scheduleNotification(note) {
  if (!note.reminder) return
  const { date, time } = note.reminder
  if (!date || !time) return

  const fireAt = new Date(`${date}T${time}:00`)
  const now = new Date()
  const delay = fireAt.getTime() - now.getTime()

  if (delay <= 0) return // prošlo je

  const key = `notif_${note.id}`

  // Obrisi stari timer ako postoji
  const oldTimer = window._nfTimers?.[key]
  if (oldTimer) clearTimeout(oldTimer)
  if (!window._nfTimers) window._nfTimers = {}

  window._nfTimers[key] = setTimeout(() => {
    if (Notification.permission !== 'granted') return
    const n = new Notification(`⏰ ${note.title}`, {
      body: note.content
        ? note.content.slice(0, 80)
        : 'NoteFlow podsjetnik',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: key,
    })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  }, delay)

  // Sačuvaj u localStorage da se obnovi pri refreshu
  const stored = JSON.parse(localStorage.getItem('nf_reminders') || '[]')
  const filtered = stored.filter(r => r.id !== note.id)
  filtered.push({ id: note.id, title: note.title, content: note.content, date, time })
  localStorage.setItem('nf_reminders', JSON.stringify(filtered))
}

export function cancelNotification(noteId) {
  const key = `notif_${noteId}`
  if (window._nfTimers?.[key]) {
    clearTimeout(window._nfTimers[key])
    delete window._nfTimers[key]
  }
  const stored = JSON.parse(localStorage.getItem('nf_reminders') || '[]')
  localStorage.setItem('nf_reminders', JSON.stringify(stored.filter(r => r.id !== noteId)))
}

export function restoreNotifications(notes) {
  if (Notification.permission !== 'granted') return
  notes.forEach(note => {
    if (note.reminder) scheduleNotification(note)
  })
}
