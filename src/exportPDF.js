import jsPDF from 'jspdf'

function htmlToPlain(html) {
  if (!html) return ''
  if (!html.includes('<')) return html
  const div = document.createElement('div')
  div.innerHTML = html
  return div.innerText || div.textContent || ''
}

export async function exportNoteToPDF(note) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const margin   = 20
  const pageW    = 210
  const contentW = pageW - margin * 2
  let y          = margin

  // ── Header ───────────────────────────────────────────────────────────────
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageW, 14, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('NoteFlow', margin, 9)
  doc.text(new Date().toLocaleDateString('bs-BA'), pageW - margin, 9, { align: 'right' })

  y = 26

  // ── Naslov ───────────────────────────────────────────────────────────────
  doc.setTextColor(26, 25, 22)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(note.title || 'Bilješka', contentW)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 8 + 4

  // ── Meta ─────────────────────────────────────────────────────────────────
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(168, 165, 159)
  const meta = [
    note.folder && `Folder: ${note.folder}`,
    note.updated_at && `Zadnja izmjena: ${new Date(note.updated_at).toLocaleString('bs-BA')}`,
    note.reminder && `Podsjetnik: ${note.reminder.date} u ${note.reminder.time}`,
  ].filter(Boolean).join('   ·   ')
  if (meta) { doc.text(meta, margin, y); y += 6 }

  // Linija
  doc.setDrawColor(232, 230, 225)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // ── Sadržaj ──────────────────────────────────────────────────────────────
  const content = htmlToPlain(note.content)
  if (content.trim()) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 104, 96)
    const lines = doc.splitTextToSize(content, contentW)
    lines.forEach(line => {
      if (y > 270) { doc.addPage(); y = margin }
      doc.text(line, margin, y)
      y += 6
    })
    y += 4
  }

  // ── Checklist ────────────────────────────────────────────────────────────
  const checklist = note.checklist || []
  if (checklist.length > 0) {
    if (y > 260) { doc.addPage(); y = margin }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 25, 22)
    doc.text('Zadaci', margin, y)
    y += 7

    // Progress bar
    const done  = checklist.filter(c => c.done).length
    const pct   = Math.round((done / checklist.length) * 100)
    doc.setFillColor(232, 230, 225)
    doc.roundedRect(margin, y, contentW, 4, 2, 2, 'F')
    if (pct > 0) {
      doc.setFillColor(37, 99, 235)
      doc.roundedRect(margin, y, contentW * pct / 100, 4, 2, 2, 'F')
    }
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(168, 165, 159)
    doc.text(`${done}/${checklist.length} završeno`, pageW - margin, y + 3, { align: 'right' })
    y += 10

    doc.setFontSize(11)
    checklist.forEach(item => {
      if (y > 270) { doc.addPage(); y = margin }
      doc.setTextColor(item.done ? 168 : 26, item.done ? 165 : 25, item.done ? 159 : 22)
      doc.text(item.done ? '☑' : '☐', margin, y)
      const itemLines = doc.splitTextToSize(item.text, contentW - 10)
      doc.text(itemLines, margin + 8, y)
      y += itemLines.length * 6 + 2
    })
  }

  // ── Tagovi ───────────────────────────────────────────────────────────────
  const tags = note.tags || []
  if (tags.length > 0) {
    y += 4
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(168, 165, 159)
    doc.text('Tagovi: ' + tags.join(', '), margin, y)
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  doc.setFontSize(8)
  doc.setTextColor(168, 165, 159)
  doc.text('Generirano u NoteFlow', margin, 290)
  doc.text('noteflow.app', pageW - margin, 290, { align: 'right' })

  // Sačuvaj
  const fileName = (note.title || 'biljeska')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 50) + '.pdf'

  doc.save(fileName)
}

export async function exportAllNotes(notes) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin   = 20
  const pageW    = 210
  const contentW = pageW - margin * 2

  notes.forEach((note, idx) => {
    if (idx > 0) doc.addPage()

    // Header
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, pageW, 14, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text('NoteFlow', margin, 9)
    doc.text(`${idx + 1}/${notes.length}`, pageW - margin, 9, { align: 'right' })

    let y = 26

    // Naslov
    doc.setTextColor(26, 25, 22)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(note.title || 'Bilješka', contentW)
    doc.text(titleLines, margin, y)
    y += titleLines.length * 7 + 6

    // Sadržaj
    const content = htmlToPlain(note.content)
    if (content.trim()) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 104, 96)
      const lines = doc.splitTextToSize(content, contentW)
      lines.slice(0, 20).forEach(line => {
        if (y > 270) return
        doc.text(line, margin, y)
        y += 6
      })
    }

    // Checklist summary
    const checklist = note.checklist || []
    if (checklist.length > 0) {
      const done = checklist.filter(c => c.done).length
      doc.setFontSize(10)
      doc.setTextColor(37, 99, 235)
      doc.text(`Zadaci: ${done}/${checklist.length}`, margin, 285)
    }
  })

  doc.save('noteflow-sve-biljeske.pdf')
}
