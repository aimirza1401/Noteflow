import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isReg, setIsReg]       = useState(false)
  const [msg, setMsg]           = useState('')
  const [loading, setLoading]   = useState(false)

  const handle = async () => {
    if (!email || !password) { setMsg('Upiši email i lozinku.'); return }
    setLoading(true); setMsg('')
    const { error } = isReg
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setMsg(error.message)
    else if (isReg) setMsg('Provjeri email i klikni link za potvrdu!')
  }

  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', height:'100vh', gap:14,
      background:'#f7f6f3', fontFamily:"'DM Sans', sans-serif"
    }}>
      <div style={{
        background:'#fff', border:'1px solid #e8e6e1', borderRadius:14,
        padding:'32px 28px', width:320, display:'flex',
        flexDirection:'column', gap:12
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <div style={{
            width:32, height:32, borderRadius:9, background:'#eff4ff',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:16
          }}>📝</div>
          <div>
            <div style={{ fontSize:15, fontWeight:500, color:'#1a1916' }}>NoteFlow</div>
            <div style={{ fontSize:11, color:'#a8a59f' }}>Minimalistički notes</div>
          </div>
        </div>

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
          style={{
            padding:'9px 12px', border:'1px solid #e8e6e1',
            borderRadius:8, fontSize:13, outline:'none',
            fontFamily:"'DM Sans', sans-serif", color:'#1a1916'
          }}
        />
        <input
          placeholder="Lozinka"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
          style={{
            padding:'9px 12px', border:'1px solid #e8e6e1',
            borderRadius:8, fontSize:13, outline:'none',
            fontFamily:"'DM Sans', sans-serif", color:'#1a1916'
          }}
        />

        <button
          onClick={handle}
          disabled={loading}
          style={{
            padding:'10px', background: loading ? '#93aef5' : '#2563eb',
            color:'#fff', border:'none', borderRadius:8,
            fontSize:13, fontWeight:500, cursor: loading ? 'wait' : 'pointer',
            fontFamily:"'DM Sans', sans-serif"
          }}
        >
          {loading ? 'Učitavanje...' : isReg ? 'Registruj se' : 'Prijavi se'}
        </button>

        {msg && (
          <p style={{
            fontSize:12, textAlign:'center',
            color: msg.includes('Provjeri') ? '#16a34a' : '#dc2626',
            margin:0
          }}>{msg}</p>
        )}

        <button
          onClick={() => { setIsReg(v => !v); setMsg('') }}
          style={{
            background:'none', border:'none', fontSize:12,
            color:'#2563eb', cursor:'pointer', textAlign:'center',
            fontFamily:"'DM Sans', sans-serif"
          }}
        >
          {isReg ? 'Već imaš nalog? Prijavi se' : 'Nemaš nalog? Registruj se'}
        </button>
      </div>
    </div>
  )
}
