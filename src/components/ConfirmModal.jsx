export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      zIndex: 300, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
      fontFamily: "'DM Sans', sans-serif",
    }} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16,
        padding: '24px 20px', width: '100%', maxWidth: 320,
        border: '1px solid var(--border)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 24,
          background: 'var(--red-bg)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 22,
        }}>🗑️</div>

        <h3 style={{
          fontSize: 16, fontWeight: 500, color: 'var(--text-1)',
          textAlign: 'center', margin: '0 0 8px',
        }}>{title}</h3>

        <p style={{
          fontSize: 13, color: 'var(--text-2)', textAlign: 'center',
          margin: '0 0 20px', lineHeight: 1.5,
        }}>{message}</p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '11px', background: 'transparent',
            border: '1px solid var(--border)', borderRadius: 10,
            fontSize: 14, color: 'var(--text-2)', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>Odustani</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '11px', background: 'var(--red)',
            border: 'none', borderRadius: 10, fontSize: 14,
            fontWeight: 500, color: '#fff', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>Obriši</button>
        </div>
      </div>
    </div>
  )
}
