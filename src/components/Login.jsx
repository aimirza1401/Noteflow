import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [isReg,    setIsReg]    = useState(false)
  const [msg,      setMsg]      = useState('')
  const [msgType,  setMsgType]  = useState('error')
  const [loading,  setLoading]  = useState(false)
  const [gLoading, setGLoading] = useState(false)

  const handleGoogle = async () => {
    setGLoading(true)
    setMsg('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) {
        setMsg('Google login nije uspio: ' + error.message)
        setMsgType('error')
        setGLoading(false)
      }
      // Ako nema greške, browser redirect na Google – loading ostaje
    } catch (e) {
      setMsg('Greška pri Google prijavi.')
      setMsgType('error')
      setGLoading(false)
    }
  }

  const handleEmail = async () => {
    if (!email || !password) {
      setMsg('Upiši email i lozinku.')
      setMsgType('error')
      return
    }
    if (password.length < 6) {
      setMsg('Lozinka mora imati najmanje 6 znakova.')
      setMsgType('error')
      return
    }
    setLoading(true)
    setMsg('')
    try {
      const { error } = isReg
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        const errMap = {
          'Invalid login credentials':   'Pogrešan email ili lozinka.',
          'Email not confirmed':         'Provjeri email i klikni link za potvrdu.',
          'User already registered':     'Nalog s ovim emailom već postoji.',
          'Password should be at least': 'Lozinka mora imati najmanje 6 znakova.',
        }
        const key = Object.keys(errMap).find(k =>
          error.message?.toLowerCase().includes(k.toLowerCase()))
        setMsg(key ? errMap[key] : error.message)
        setMsgType('error')
      } else if (isReg) {
        setMsg('Provjeri email i klikni link za potvrdu!')
        setMsgType('success')
      }
    } catch {
      setMsg('Problem s vezom. Provjeri internet.')
      setMsgType('error')
    }
    setLoading(false)
  }

  const inp = {
    padding: '12px 14px',
    border: '1px solid #e8e6e1',
    borderRadius: 10,
    fontSize: 15,
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    color: '#1a1916',
    background: '#fff',
    width: '100%',
    WebkitAppearance: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: '#f7f6f3', fontFamily: "'DM Sans', sans-serif",
      padding: 20,
    }}>
      <div style={{
        background: '#fff', border: '1px solid #e8e6e1',
        borderRadius: 20, padding: '32px 24px',
        width: '100%', maxWidth: 360,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'#eff4ff',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>📝</div>
          <div>
            <div style={{ fontSize:17, fontWeight:500, color:'#1a1916' }}>NoteFlow</div>
            <div style={{ fontSize:12, color:'#a8a59f' }}>
              {isReg ? 'Kreiraj nalog' : 'Dobrodošao nazad'}
            </div>
          </div>
        </div>

        {/* Google dugme */}
        <button onClick={handleGoogle} disabled={gLoading} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: '12px 14px',
          background: gLoading ? '#f5f5f5' : '#fff',
          border: '1px solid #e8e6e1', borderRadius: 10,
          fontSize: 14, fontWeight: 500, color: '#1a1916',
          cursor: gLoading ? 'wait' : 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          width: '100%', transition: 'background .1s',
        }}>
          {!gLoading ? (
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.4z"/>
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.8 2.2-7.9 2.2-6.1 0-11.2-4.1-13.1-9.6H2.7v6.2C6.6 42.6 14.8 48 24 48z"/>
              <path fill="#FBBC05" d="M10.9 28.8c-.5-1.4-.8-2.9-.8-4.8s.3-3.3.8-4.8v-6.2H2.7C1 16.6 0 20.2 0 24s1 7.4 2.7 10.2l8.2-5.4z"/>
              <path fill="#EA4335" d="M24 9.6c3.4 0 6.5 1.2 8.9 3.5l6.6-6.6C35.9 2.5 30.5 0 24 0 14.8 0 6.6 5.4 2.7 13.8l8.2 6.2C12.8 13.7 17.9 9.6 24 9.6z"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a59f" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
          )}
          {gLoading ? 'Preusmjeravam na Google...' : 'Nastavi s Google računom'}
        </button>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1, height:1, background:'#e8e6e1' }} />
          <span style={{ fontSize:12, color:'#a8a59f' }}>ili</span>
          <div style={{ flex:1, height:1, background:'#e8e6e1' }} />
        </div>

        {/* Email/password forma */}
        <input style={inp} placeholder="Email" type="email"
          autoComplete="email" autoCapitalize="none" autoCorrect="off"
          value={email} onChange={e => setEmail(e.target.value.trim())}
          onKeyDown={e => e.key === 'Enter' && handleEmail()} />

        <input style={inp} placeholder="Lozinka (min. 6 znakova)"
          type="password"
          autoComplete={isReg ? 'new-password' : 'current-password'}
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleEmail()} />

        <button onClick={handleEmail} disabled={loading} style={{
          padding: '13px', background: loading ? '#93aef5' : '#2563eb',
          color: '#fff', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 500,
          cursor: loading ? 'wait' : 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          width: '100%', WebkitAppearance: 'none',
        }}>
          {loading ? 'Učitavanje...' : isReg ? 'Registruj se' : 'Prijavi se'}
        </button>

        {msg && (
          <div style={{
            padding: '10px 12px', borderRadius: 8, fontSize: 13,
            textAlign: 'center',
            background: msgType === 'success' ? '#f0fdf4' : '#fef2f2',
            color:      msgType === 'success' ? '#16a34a' : '#dc2626',
            border: `1px solid ${msgType === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}>{msg}</div>
        )}

        <button onClick={() => { setIsReg(v => !v); setMsg('') }} style={{
          background: 'none', border: 'none', fontSize: 13,
          color: '#2563eb', cursor: 'pointer', textAlign: 'center',
          fontFamily: "'DM Sans', sans-serif", padding: '4px',
        }}>
          {isReg ? 'Već imaš nalog? Prijavi se' : 'Nemaš nalog? Registruj se'}
        </button>
      </div>
    </div>
  )
}
