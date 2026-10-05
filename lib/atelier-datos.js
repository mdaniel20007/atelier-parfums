// CAPA DE DATOS (navegador) — Atelier Parfums
// Misma interfaz que el prototipo (window.AtelierDatos), pero conectada a la API real.
// La tienda y el administrador siguen llamando load()/save()/track(); aquí save() compara
// con el último estado conocido y manda solo los cambios a la API, recurso por recurso.

const DEFAULTS = {
  productos: [],
  resenas: [],
  pedidos: [],
  encargos: [],
  ajustes: { wa: '', anuncio: 'Perfumes 100% originales · Pide por WhatsApp', direccion: '', horario: '', instagram: '', facebook: '', tiktok: '', pagos: '', envios: '', garantia: '', ofertas: '', cambios: '', envio_tegus: '', envio_nacional: '', envio_gratis: '', banco: '' },
};
const clone = (o) => JSON.parse(JSON.stringify(o));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const z = (n) => String(n).padStart(2, '0');
const hoy = () => { const d = new Date(); return z(d.getDate()) + '/' + z(d.getMonth() + 1) + '/' + d.getFullYear(); };
const ahora = () => { const d = new Date(); return hoy() + ' · ' + z(d.getHours()) + ':' + z(d.getMinutes()); };
const precioFinal = (p) => Math.round((Number(p.precio) || 0) * (1 - (Number(p.descuento) || 0) / 100));

let modo = 'tienda'; // 'tienda' | 'admin'
let db = clone(DEFAULTS);
let base = clone(DEFAULTS); // último estado confirmado por el servidor
let fotos = {};
let eventosCache = [];
let cola = Promise.resolve();

function emitir() { window.dispatchEvent(new CustomEvent('atelier-datos', { detail: load() })); }
function avisarError(msg) { window.dispatchEvent(new CustomEvent('atelier-error', { detail: msg })); }

function hydrate(data, m) {
  modo = m || 'tienda';
  const { fotos: f, ...resto } = data || {};
  db = Object.assign(clone(DEFAULTS), clone(resto));
  base = clone(db);
  fotos = f || {};
}

function load() { return clone(db); }

async function api(method, url, body) {
  const r = await fetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  if (r.status === 401 && modo === 'admin') { location.reload(); throw new Error('Sesión expirada'); }
  if (!r.ok) {
    let msg = 'No se pudo guardar. Revisa tu conexión e intenta de nuevo.';
    try { msg = (await r.json()).error || msg; } catch (e) {}
    throw new Error(msg);
  }
  return r.status === 204 ? null : r.json();
}

// Diferencias entre dos listas por id
function diff(prev, next) {
  const pm = new Map(prev.map((x) => [x.id, x]));
  const nm = new Map(next.map((x) => [x.id, x]));
  return {
    nuevos: next.filter((x) => !pm.has(x.id)),
    cambiados: next.filter((x) => pm.has(x.id) && !same(pm.get(x.id), x)),
    borrados: prev.filter((x) => !nm.has(x.id)),
  };
}

function operaciones(prev, next) {
  const ops = [];
  if (modo === 'tienda') {
    // La tienda solo crea reseñas (quedan pendientes) y registra pedidos.
    for (const r of diff(prev.resenas, next.resenas).nuevos)
      ops.push(() => api('POST', '/api/resenas', { pid: r.pid, nombre: r.nombre, estrellas: r.estrellas, titulo: r.titulo, texto: r.texto }));
    for (const p of diff(prev.pedidos, next.pedidos).nuevos)
      ops.push(() => api('POST', '/api/pedidos', { nombre: p.nombre, telefono: p.telefono, zona: p.zona, direccion: p.direccion, ubicacion: p.ubicacion, notas: p.notas, pago: p.pago, items: p.items.map((i) => ({ pid: i.pid, n: i.n })) }));
    return ops;
  }
  const dp = diff(prev.productos, next.productos);
  for (const p of [...dp.nuevos, ...dp.cambiados]) { const { fotos: _f, ...body } = p; ops.push(() => api('PUT', '/api/productos/' + encodeURIComponent(p.id), body)); }
  for (const p of dp.borrados) ops.push(() => api('DELETE', '/api/productos/' + encodeURIComponent(p.id)));
  const dr = diff(prev.resenas, next.resenas);
  for (const r of dr.cambiados) ops.push(() => api('PATCH', '/api/resenas/' + encodeURIComponent(r.id), { estado: r.estado }));
  for (const r of dr.borrados) ops.push(() => api('DELETE', '/api/resenas/' + encodeURIComponent(r.id)));
  const dd = diff(prev.pedidos, next.pedidos);
  for (const o of dd.cambiados) ops.push(() => api('PATCH', '/api/pedidos/' + encodeURIComponent(o.id), { estado: o.estado }));
  for (const o of dd.borrados) ops.push(() => api('DELETE', '/api/pedidos/' + encodeURIComponent(o.id)));
  const de = diff(prev.encargos || [], next.encargos || []);
  for (const e of de.cambiados) ops.push(() => api('PATCH', '/api/encargos/' + encodeURIComponent(e.id), { estado: e.estado }));
  for (const e of de.borrados) ops.push(() => api('DELETE', '/api/encargos/' + encodeURIComponent(e.id)));
  if (!same(prev.ajustes, next.ajustes)) ops.push(() => api('PATCH', '/api/ajustes', next.ajustes));
  return ops;
}

async function refrescar() {
  const url = modo === 'admin' ? '/api/admin/datos' : '/api/tienda';
  const r = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
  if (!r.ok) return;
  const data = await r.json();
  if (modo === 'tienda') data.pedidos = db.pedidos; // la tienda no lee pedidos
  hydrate(data, modo);
  emitir();
}

function save(next) {
  const prev = base;
  db = clone(next);
  base = clone(next);
  emitir();
  const ops = operaciones(prev, next);
  if (!ops.length) return;
  cola = cola.then(async () => {
    try {
      for (const op of ops) await op();
      if (modo === 'admin') await refrescar();
    } catch (e) {
      avisarError(e.message);
      await refrescar().catch(() => {});
    }
  });
}

function subscribe(fn) {
  const b = (e) => fn(e.detail);
  window.addEventListener('atelier-datos', b);
  return () => window.removeEventListener('atelier-datos', b);
}

function reset() { return load(); } // En producción no se borra nada desde aquí.

// ---- Fotos ----
function foto(slotId) { const u = fotos[slotId]; return u ? { src: u, credit: '', href: '' } : null; }
function setFoto(slotId, url) {
  if (url) fotos[slotId] = url; else delete fotos[slotId];
  emitir();
}

// ---- Analítica ----
function visitante() {
  try { let v = localStorage.getItem('atelier-vid'); if (!v) { v = 'u' + Math.random().toString(36).slice(2, 10); localStorage.setItem('atelier-vid', v); } return v; }
  catch (e) { return 'anon'; }
}
let pendientes = [];
let tFlush = null;
function flush() {
  clearTimeout(tFlush); tFlush = null;
  if (!pendientes.length) return;
  const body = JSON.stringify(pendientes);
  pendientes = [];
  try {
    if (navigator.sendBeacon && navigator.sendBeacon('/api/eventos', new Blob([body], { type: 'text/plain' }))) return;
  } catch (e) {}
  fetch('/api/eventos', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
}
function track(tipo, data) {
  if (modo !== 'tienda') return;
  pendientes.push(Object.assign({ t: Date.now(), tipo, vid: visitante(), dev: window.innerWidth < 860 ? 'mob' : 'desk' }, data || {}));
  // 'pedido' y 'whatsapp' abren otra app: se envían de inmediato.
  if (tipo === 'pedido' || tipo === 'whatsapp' || tipo === 'aviso' || pendientes.length >= 20) flush();
  else if (!tFlush) tFlush = setTimeout(flush, 2000);
}
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
}

async function cargarEventos() {
  try {
    const r = await fetch('/api/eventos?dias=62', { cache: 'no-store', credentials: 'same-origin' });
    if (r.ok) { eventosCache = await r.json(); window.dispatchEvent(new CustomEvent('atelier-eventos')); }
  } catch (e) {}
}
function eventos() { return eventosCache; }
function borrarEventos() {
  api('DELETE', '/api/eventos').then(() => { eventosCache = []; window.dispatchEvent(new CustomEvent('atelier-eventos')); }).catch((e) => avisarError(e.message));
}

const AtelierDatos = { KEY: 'atelier-parfums-datos', EKEY: 'atelier-parfums-eventos', DEFAULTS, hydrate, load, save, subscribe, reset, precioFinal, hoy, ahora, foto, setFoto, track, eventos, cargarEventos, borrarEventos, refrescar };
if (typeof window !== 'undefined') window.AtelierDatos = AtelierDatos;
export default AtelierDatos;
