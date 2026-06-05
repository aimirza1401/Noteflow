import { useState } from 'react'
import { Plus, Trash2, X, Hash } from 'lucide-react'

const AGGREGATES = ['—', 'Sum', 'Avg', 'Min', 'Max', 'Count']

function calcAggregate(type, values) {
  const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n))
  if (type === 'Count') return values.filter(v => v.trim() !== '').length
  if (nums.length === 0) return '—'
  switch (type) {
    case 'Sum':  return nums.reduce((a, b) => a + b, 0).toLocaleString('bs-BA', { maximumFractionDigits: 4 })
    case 'Avg':  return (nums.reduce((a, b) => a + b, 0) / nums.length).toLocaleString('bs-BA', { maximumFractionDigits: 2 })
    case 'Min':  return Math.min(...nums).toLocaleString('bs-BA', { maximumFractionDigits: 4 })
    case 'Max':  return Math.max(...nums).toLocaleString('bs-BA', { maximumFractionDigits: 4 })
    default:     return '—'
  }
}

export default function TableEditor({ tables = [], onChange }) {
  const [editingTable, setEditingTable] = useState(null)

  const createTable = () => {
    const newTable = {
      id:         't' + Date.now(),
      title:      '',
      headers:    ['Kolona 1', 'Kolona 2', 'Kolona 3'],
      rows:       [['', '', ''], ['', '', '']],
      aggregates: ['—', '—', '—'],
    }
    const updated = [...tables, newTable]
    onChange(updated)
    setEditingTable(updated.length - 1)
  }

  const deleteTable = (idx) => {
    onChange(tables.filter((_, i) => i !== idx))
    if (editingTable === idx) setEditingTable(null)
  }

  const updateTable = (idx, updated) =>
    onChange(tables.map((t, i) => i === idx ? updated : t))

  const addColumn = (idx) => {
    const t = tables[idx]
    updateTable(idx, {
      ...t,
      headers:    [...t.headers, `Kolona ${t.headers.length + 1}`],
      rows:       t.rows.map(r => [...r, '']),
      aggregates: [...(t.aggregates || []), '—'],
    })
  }

  const deleteColumn = (tIdx, cIdx) => {
    const t = tables[tIdx]
    if (t.headers.length <= 1) return
    updateTable(tIdx, {
      ...t,
      headers:    t.headers.filter((_, i) => i !== cIdx),
      rows:       t.rows.map(r => r.filter((_, i) => i !== cIdx)),
      aggregates: (t.aggregates || []).filter((_, i) => i !== cIdx),
    })
  }

  const addRow = (idx) => {
    const t = tables[idx]
    updateTable(idx, {
      ...t,
      rows: [...t.rows, new Array(t.headers.length).fill('')],
    })
  }

  const deleteRow = (tIdx, rIdx) => {
    const t = tables[tIdx]
    if (t.rows.length <= 1) return
    updateTable(tIdx, { ...t, rows: t.rows.filter((_, i) => i !== rIdx) })
  }

  const updateCell = (tIdx, rIdx, cIdx, val) => {
    const t = tables[tIdx]
    const rows = t.rows.map((r, ri) =>
      ri === rIdx ? r.map((c, ci) => ci === cIdx ? val : c) : r)
    updateTable(tIdx, { ...t, rows })
  }

  const updateHeader = (tIdx, cIdx, val) => {
    const t = tables[tIdx]
    updateTable(tIdx, { ...t, headers: t.headers.map((h, i) => i === cIdx ? val : h) })
  }

  const updateTitle = (tIdx, val) =>
    updateTable(tIdx, { ...tables[tIdx], title: val })

  const updateAggregate = (tIdx, cIdx, val) => {
    const t = tables[tIdx]
    const aggregates = (t.aggregates || t.headers.map(() => '—'))
      .map((a, i) => i === cIdx ? val : a)
    updateTable(tIdx, { ...t, aggregates })
  }

  const hasAnyAggregate = (t) =>
    (t.aggregates || []).some(a => a && a !== '—')

  if (tables.length === 0) {
    return (
      <button onClick={createTable} style={{
        display:'flex', alignItems:'center', gap:8, padding:'9px 14px',
        borderRadius:10, border:'1.5px dashed var(--border)',
        background:'transparent', color:'var(--text-3)', fontSize:13,
        cursor:'pointer', width:'100%', fontFamily:"'DM Sans',sans-serif",
        transition:'all .15s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <Plus size={14} /> Dodaj tabelu
      </button>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {tables.map((table, tIdx) => {
        const aggregates = table.aggregates || table.headers.map(() => '—')
        const isEditing  = editingTable === tIdx

        return (
          <div key={table.id} style={{
            border:`1px solid ${isEditing ? 'var(--blue-bd)' : 'var(--border)'}`,
            borderRadius:10, overflow:'hidden',
            background: isEditing ? 'var(--blue-bg)' : 'var(--surface)',
            transition:'border-color .15s',
          }}>

            {/* Header bar */}
            <div style={{ display:'flex', alignItems:'center', gap:8,
              padding:'8px 12px', borderBottom:'1px solid var(--border)',
              background:'var(--bg)' }}>
              <span style={{ fontSize:13, marginRight:2 }}>🗃️</span>
              <input value={table.title} onChange={e => updateTitle(tIdx, e.target.value)}
                placeholder="Naziv tabele (opcionalno)"
                style={{ flex:1, border:'none', background:'transparent', fontSize:13,
                  fontWeight:500, color:'var(--text-1)', outline:'none',
                  fontFamily:"'DM Sans',sans-serif" }} />
              <span style={{ fontSize:11, color:'var(--text-3)' }}>
                {table.rows.length}r × {table.headers.length}k
              </span>
              <button onClick={() => setEditingTable(isEditing ? null : tIdx)} style={{
                padding:'3px 9px', borderRadius:6, fontSize:11,
                border:'1px solid var(--border)', background:'transparent',
                color:'var(--text-2)', cursor:'pointer',
                fontFamily:"'DM Sans',sans-serif" }}>
                {isEditing ? 'Zatvori' : 'Uredi'}
              </button>
              <button onClick={() => deleteTable(tIdx)} style={{
                background:'transparent', border:'none', color:'var(--text-3)',
                cursor:'pointer', display:'flex', alignItems:'center', padding:3, borderRadius:5 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                <Trash2 size={13} />
              </button>
            </div>

            {/* Table */}
            <div style={{ overflowX:'auto', padding: isEditing ? '12px' : '0' }}>
              <table style={{ borderCollapse:'collapse', width:'100%',
                fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>
                <thead>
                  <tr style={{ background:'var(--bg)' }}>
                    {table.headers.map((h, cIdx) => (
                      <th key={cIdx} style={{ padding:0,
                        border:'1px solid var(--border)', minWidth:100 }}>
                        <div style={{ display:'flex', alignItems:'center' }}>
                          <input value={h} onChange={e => updateHeader(tIdx, cIdx, e.target.value)}
                            readOnly={!isEditing}
                            style={{ width:'100%', padding:'8px 10px', border:'none',
                              background:'transparent', fontSize:12, fontWeight:600,
                              color:'var(--text-1)', outline:'none',
                              fontFamily:"'DM Sans',sans-serif",
                              cursor: isEditing ? 'text' : 'default' }} />
                          {isEditing && table.headers.length > 1 && (
                            <button onClick={() => deleteColumn(tIdx, cIdx)} style={{
                              background:'transparent', border:'none', color:'var(--text-3)',
                              cursor:'pointer', padding:'4px 6px', flexShrink:0,
                              display:'flex', alignItems:'center' }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                              <X size={11} />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    {isEditing && (
                      <th style={{ border:'1px solid var(--border)', padding:0, width:36 }}>
                        <button onClick={() => addColumn(tIdx)} style={{
                          width:'100%', height:'100%', padding:'8px', background:'transparent',
                          border:'none', color:'var(--blue)', cursor:'pointer',
                          display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Plus size={13} />
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, rIdx) => (
                    <tr key={rIdx} style={{
                      background: rIdx % 2 === 0 ? 'var(--surface)' : 'var(--bg)' }}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ border:'1px solid var(--border)', padding:0 }}>
                          <input value={cell}
                            onChange={e => updateCell(tIdx, rIdx, cIdx, e.target.value)}
                            readOnly={!isEditing}
                            style={{ width:'100%', padding:'7px 10px', border:'none',
                              background:'transparent', fontSize:13, color:'var(--text-2)',
                              outline:'none', fontFamily:"'DM Sans',sans-serif",
                              cursor: isEditing ? 'text' : 'default' }} />
                        </td>
                      ))}
                      {isEditing && (
                        <td style={{ border:'1px solid var(--border)', padding:0, width:36 }}>
                          <button onClick={() => deleteRow(tIdx, rIdx)}
                            disabled={table.rows.length <= 1}
                            style={{ width:'100%', padding:'7px 8px', background:'transparent',
                              border:'none', color:'var(--text-3)', cursor:'pointer',
                              display:'flex', alignItems:'center', justifyContent:'center' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                            <X size={11} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>

                {/* Aggregate row */}
                {(isEditing || hasAnyAggregate(table)) && (
                  <tfoot>
                    <tr style={{ background:'var(--bg)', borderTop:'2px solid var(--border-s)' }}>
                      {table.headers.map((_, cIdx) => {
                        const agg     = aggregates[cIdx] || '—'
                        const colVals = table.rows.map(r => r[cIdx] || '')
                        const result  = agg !== '—' ? calcAggregate(agg, colVals) : null

                        return (
                          <td key={cIdx} style={{ border:'1px solid var(--border)', padding:0 }}>
                            {isEditing ? (
                              <div style={{ display:'flex', flexDirection:'column', gap:2, padding:'6px 8px' }}>
                                {/* Aggregate selector */}
                                <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                                  {AGGREGATES.map(a => (
                                    <button key={a} onClick={() => updateAggregate(tIdx, cIdx, a)}
                                      style={{
                                        padding:'2px 6px', borderRadius:4, fontSize:10,
                                        border:`1px solid ${agg === a ? 'var(--blue)' : 'var(--border)'}`,
                                        background: agg === a ? 'var(--blue)' : 'transparent',
                                        color: agg === a ? '#fff' : 'var(--text-3)',
                                        cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                                        fontWeight: agg === a ? 600 : 400,
                                        transition:'all .1s',
                                      }}>
                                      {a}
                                    </button>
                                  ))}
                                </div>
                                {/* Rezultat */}
                                {result !== null && (
                                  <div style={{ display:'flex', alignItems:'center', gap:4,
                                    padding:'3px 0', borderTop:'1px solid var(--border)' }}>
                                    <Hash size={9} color="var(--blue)" />
                                    <span style={{ fontSize:12, fontWeight:600, color:'var(--blue)' }}>
                                      {result}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              // Read-only prikaz rezultata
                              agg !== '—' ? (
                                <div style={{ padding:'6px 10px', display:'flex',
                                  alignItems:'center', gap:5 }}>
                                  <span style={{ fontSize:10, color:'var(--text-3)',
                                    fontWeight:500, textTransform:'uppercase',
                                    letterSpacing:'.04em' }}>{agg}</span>
                                  <span style={{ fontSize:12, fontWeight:700,
                                    color:'var(--blue)' }}>
                                    {result}
                                  </span>
                                </div>
                              ) : (
                                <div style={{ padding:'6px 10px', fontSize:11,
                                  color:'var(--text-3)' }}>—</div>
                              )
                            )}
                          </td>
                        )
                      })}
                      {isEditing && (
                        <td style={{ border:'1px solid var(--border)' }} />
                      )}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Footer — dodaj red */}
            {isEditing && (
              <div style={{ display:'flex', gap:8, padding:'10px 12px',
                borderTop:'1px solid var(--border)', background:'var(--bg)' }}>
                <button onClick={() => addRow(tIdx)} style={{
                  display:'flex', alignItems:'center', gap:6, padding:'6px 12px',
                  borderRadius:8, border:'1px solid var(--border)', background:'transparent',
                  fontSize:12, color:'var(--text-2)', cursor:'pointer',
                  fontFamily:"'DM Sans',sans-serif" }}>
                  <Plus size={12} /> Dodaj red
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Nova tabela */}
      <button onClick={createTable} style={{
        display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
        borderRadius:10, border:'1.5px dashed var(--border)',
        background:'transparent', color:'var(--text-3)', fontSize:12,
        cursor:'pointer', fontFamily:"'DM Sans',sans-serif", alignSelf:'flex-start',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <Plus size={13} /> Nova tabela
      </button>
    </div>
  )
}
