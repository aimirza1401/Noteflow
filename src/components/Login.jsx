import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [isReg,    setIsReg]    = useState(false)
  const [msg,      setMsg]      = useState('')
  const [loading,  setLoading]  = useState(false)
  const [msgType,  setMsgType]  = useState('error')

  const handle = async () => {
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
      const { data, error } = isReg
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        // Prikaži greške na bosanskom
        const errMap = {
          'Invalid login credentials':    'Pogrešan email ili lozinka.',
          'Email not confirmed':          'Provjeri email i klikni link za potvrdu.',
          'User already registered':      'Nalog s ovim emailom već postoji.',
          'Password should be at least':  'Lozinka mora imati najmanje 6 znakova.',
          'Unable to validate email':     'Neispravan email format.',
          'network':                      'Problem s mrežom. Provjeri internet vezu.',
        }
        const key = Object.keys(errMap).find(k =>
          error.message?.toLowerCase().includes(k.toLowerCase()))
        setMsg(key ? errMap[key] : error.message)
        setMsgType('error')
      } else {
        if (isReg) {
          setMsg('Provjeri email i klikni link za potvrdu!')
          setMsgType('success')
        }
        // Ako je login uspješan, App.jsx će automatski preuzeti sesiju
      }
    } catch (e) {
      setMsg('Problem s vezom. Provjeri internet.')
      setMsgType('error')
    }

    setLoading(false)
  }

  const inputStyle = {
    padding: '12px 14px',
    border: '1px solid #e8e6e1',
    borderRadius: 10,
    fontSize: 15,
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    color: '#1a1916',
    background: '#fff',
    width: '100%',
    WebkitAppearance: 'none', // Safari fix
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: '#eff4ff', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>📝</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 500, color: '#1a1916' }}>NoteFlow</div>
            <div style={{ fontSize: 12, color: '#a8a59f' }}>
              {isReg ? 'Kreiraj nalog' : 'Prijavi se'}
            </div>
          </div>
        </div>

        <input
          style={inputStyle}
          placeholder="Email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          value={email}
          onChange={e => setEmail(e.target.value.trim())}
          onKeyDown={e => e.key === 'Enter' && handle()}
        />

        <input
          style={inputStyle}
          placeholder="Lozinka (min. 6 znakova)"
          type="password"
          autoComplete={isReg ? 'new-password' : 'current-password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
        />

        <button
          onClick={handle}
          disabled={loading}
          style={{
            padding: '13px', background: loading ? '#93aef5' : '#2563eb',
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 500,
            cursor: loading ? 'wait' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            WebkitAppearance: 'none',
          }}>
          {loading ? 'Učitavanje...' : isReg ? 'Registruj se' : 'Prijavi se'}
        </button>

        {msg && (
          <div style={{
            padding: '10px 12px', borderRadius: 8, fontSize: 13,
            textAlign: 'center',
            background: msgType === 'success' ? '#f0fdf4' : '#fef2f2',
            color: msgType === 'success' ? '#16a34a' : '#dc2626',
            border: `1px solid ${msgType === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}>{msg}</div>
        )}

        <button
          onClick={() => { setIsReg(v => !v); setMsg('') }}
          style={{
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
