// Sesión del cliente en el navegador (inicio de sesión opcional con Google).
export const GOOGLE_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

let estado = { cargado: false, cliente: null, pedidos: [], encargos: [] };
const subs = new Set();
const emitir = () => subs.forEach((f) => f(estado));

export const getCliente = () => estado;
export function subscribeCliente(fn) { subs.add(fn); return () => subs.delete(fn); }

export async function refrescarCliente() {
  if (!GOOGLE_ID) { estado = { ...estado, cargado: true }; emitir(); return estado; }
  try {
    const r = await fetch('/api/cliente', { cache: 'no-store', credentials: 'same-origin' });
    const j = r.ok ? await r.json() : { cliente: null };
    estado = { cargado: true, cliente: j.cliente || null, pedidos: j.pedidos || [], encargos: j.encargos || [] };
  } catch (e) { estado = { ...estado, cargado: true }; }
  emitir();
  return estado;
}

export async function entrarConGoogle(credential) {
  const r = await fetch('/api/cliente/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential }), credentials: 'same-origin' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'No se pudo iniciar sesión');
  return refrescarCliente();
}

export async function salirCliente() {
  await fetch('/api/cliente/salir', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
  try { if (window.google && window.google.accounts) window.google.accounts.id.disableAutoSelect(); } catch (e) {}
  estado = { cargado: true, cliente: null, pedidos: [], encargos: [] };
  emitir();
}

// Carga el script de Google Identity Services una sola vez.
let cargaGis = null;
export function cargarGoogle() {
  if (!GOOGLE_ID) return Promise.reject(new Error('Google no configurado'));
  if (cargaGis) return cargaGis;
  cargaGis = new Promise((ok, mal) => {
    if (window.google && window.google.accounts) return ok(window.google);
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true;
    s.onload = () => ok(window.google);
    s.onerror = () => { cargaGis = null; mal(new Error('No se pudo cargar Google')); };
    document.head.appendChild(s);
  });
  return cargaGis;
}
