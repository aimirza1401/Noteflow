import { openDB } from 'idb'

let _db = null

async function getDB() {
  if (_db) return _db
  try {
    _db = await openDB('noteflow-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('queue')) {
          db.createObjectStore('queue', { keyPath: 'qid', autoIncrement: true })
        }
      },
    })
    return _db
  } catch (e) {
    console.warn('IndexedDB nedostupan:', e)
    return null
  }
}

// In-memory fallback ako IndexedDB nije dostupan
const mem = { notes: [], queue: [] }

export async function getAllNotesLocal() {
  try {
    const db = await getDB()
    if (!db) return [...mem.notes]
    return await db.getAll('notes')
  } catch (e) { return [...mem.notes] }
}

export async function saveNotesLocal(notes) {
  try {
    const db = await getDB()
    if (!db) { mem.notes = [...notes]; return }
    const tx = db.transaction('notes', 'readwrite')
    await Promise.all([...notes.map(n => tx.store.put(n)), tx.done])
  } catch (e) { mem.notes = [...notes] }
}

export async function saveNoteLocal(note) {
  try {
    const db = await getDB()
    if (!db) {
      const i = mem.notes.findIndex(n => n.id === note.id)
      i >= 0 ? mem.notes[i] = note : mem.notes.push(note)
      return
    }
    await db.put('notes', note)
  } catch (e) {
    const i = mem.notes.findIndex(n => n.id === note.id)
    i >= 0 ? mem.notes[i] = note : mem.notes.push(note)
  }
}

export async function deleteNoteLocal(id) {
  try {
    const db = await getDB()
    if (!db) { mem.notes = mem.notes.filter(n => n.id !== id); return }
    await db.delete('notes', id)
  } catch (e) { mem.notes = mem.notes.filter(n => n.id !== id) }
}

export async function addToQueue(action) {
  try {
    const db = await getDB()
    if (!db) { mem.queue.push({ ...action, qid: Date.now() }); return }
    await db.add('queue', { ...action, ts: Date.now() })
  } catch (e) { mem.queue.push({ ...action, qid: Date.now() }) }
}

export async function getQueue() {
  try {
    const db = await getDB()
    if (!db) return [...mem.queue]
    return await db.getAll('queue')
  } catch (e) { return [] }
}

export async function removeFromQueue(qid) {
  try {
    const db = await getDB()
    if (!db) { mem.queue = mem.queue.filter(i => i.qid !== qid); return }
    await db.delete('queue', qid)
  } catch (e) { mem.queue = mem.queue.filter(i => i.qid !== qid) }
}
