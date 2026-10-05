'use client';
import { useState } from 'react';

const input = { width: '100%', minHeight: 46, padding: '0 16px', border: '1px solid #E2CBC1', borderRadius: 10, background: 'transparent', fontSize: 14.5, color: '#3D0000', outline: 'none' };
const label = { fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: '#7A532E' };

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setCargando(true); setError('');
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'No se pudo iniciar sesión');
      location.reload();
    } catch (err) { setError(err.message); setCargando(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5E6E0', padding: 16, fontFamily: 'Jost, sans-serif', color: '#3D0000' }}>
      <form onSubmit={entrar} style={{ width: 'min(420px,100%)', background: '#FBF4F0', border: '1px solid #E2CBC1', padding: 'clamp(24px,5vw,40px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingBottom: 18, borderBottom: '1px solid #E2CBC1' }}>
          <span style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 26, letterSpacing: '.14em', paddingLeft: '.14em', lineHeight: 1 }}>ATELIER</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 1, background: '#A97C50' }} />
            <span style={{ fontWeight: 300, fontSize: 9.5, letterSpacing: '.55em', paddingLeft: '.55em' }}>PARFUMS</span>
            <span style={{ width: 14, height: 1, background: '#A97C50' }} />
          </span>
          <span style={{ marginTop: 12, fontSize: 10.5, letterSpacing: '.26em', textTransform: 'uppercase', color: '#7A532E' }}>Panel de administración</span>
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={label}>Correo</span>
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={label}>Contraseña</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} style={input} />
        </label>
        {error ? <p role="alert" style={{ margin: 0, fontSize: 13, color: '#3D0000', background: '#F5E6E0', padding: '10px 14px', border: '1px solid #E2CBC1' }}>{error}</p> : null}
        <button type="submit" disabled={cargando} className="dcp4" style={{ minHeight: 48, borderRadius: 999, border: '1px solid #3D0000', background: '#3D0000', color: '#F5E6E0', fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer', opacity: cargando ? 0.7 : 1 }}>
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
