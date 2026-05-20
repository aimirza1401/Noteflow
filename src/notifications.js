// Notifications - browser push
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
  const delay = fireAt.getTime() - Date.now()
  if (delay <= 0) return
  const key = `notif_${note.id}`
  if (!window._nfTimers) window._nfTimers = {}
  if (window._nfTimers[key]) clearTimeout(window._nfTimers[key])
  window._nfTimers[key] = setTimeout(() => {
    if (Notification.permission !== 'granted') return
    const n = new Notification(`⏰ ${note.title}`, {
      body: note.content?.replace(/<[^>]*>/g, '').slice(0, 80) || 'NoteFlow podsjetnik',
      icon: '/favicon.svg',
      tag: key,
    })
    n.onclick = () => { window.focus(); n.close() }
  }, delay)
}

export function cancelNotification(noteId) {
  const key = `notif_${noteId}`
  if (window._nfTimers?.[key]) {
    clearTimeout(window._nfTimers[key])
    delete window._nfTimers[key]
  }
}

export function restoreNotifications(notes) {
  if (Notification.permission !== 'granted') return
  notes.forEach(note => { if (note.reminder) scheduleNotification(note) })
}
