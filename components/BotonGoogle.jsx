'use client';
// Botón oficial "Continuar con Google". Al terminar, abre la sesión del cliente.
import { useEffect, useRef, useState } from 'react';
import { GOOGLE_ID, cargarGoogle, entrarConGoogle } from '@/lib/cliente-client';

export default function BotonGoogle({ onListo }) {
  const ref = useRef(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let vivo = true;
    cargarGoogle().then((google) => {
      if (!vivo || !ref.current) return;
      google.accounts.id.initialize({
        client_id: GOOGLE_ID,
        callback: async (resp) => {
          setError('');
          try { await entrarConGoogle(resp.credential); onListo && onListo(); }
          catch (e) { setError(e.message); }
        },
        ux_mode: 'popup',
      });
      google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', locale: 'es', width: Math.min(320, ref.current.offsetWidth || 320) });
    }).catch(() => setError('No se pudo cargar el inicio de sesión de Google. Revisa tu conexión.'));
    return () => { vivo = false; };
  }, [onListo]);
  if (!GOOGLE_ID) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
      <div ref={ref} style={{ minHeight: 44, display: 'flex', justifyContent: 'center' }} />
      {error ? <span style={{ fontSize: 12.5, color: '#3D0000', textAlign: 'center' }}>{error}</span> : null}
    </div>
  );
}
