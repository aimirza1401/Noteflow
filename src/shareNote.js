import { supabase } from './supabase'

// Kreira javni link za bilješku (čuva u shared_notes tabeli)
export async function createShareLink(note) {
  const shareId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

  const { error } = await supabase
    .from('shared_notes')
    .upsert({
      share_id:   shareId,
      note_id:    note.id,
      title:      note.title,
      content:    note.content,
      checklist:  note.checklist,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dana
    })

  if (error) throw error
  return `${window.location.origin}/share/${shareId}`
}

// Dohvata javno dijeljenu bilješku
export async function getSharedNote(shareId) {
  const { data, error } = await supabase
    .from('shared_notes')
    .select('*')
    .eq('share_id', shareId)
    .single()

  if (error) throw error
  return data
}

// Briše share link
export async function deleteShareLink(noteId) {
  await supabase.from('shared_notes').delete().eq('note_id', noteId)
}
