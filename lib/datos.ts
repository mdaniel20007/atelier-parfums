// Consultas y validación del lado del servidor. Traduce entre las filas de la base
// y el "contrato de datos" que usan la tienda y el administrador (ver README del handoff).
import { sql } from './db';
import { HttpError } from './auth';

const TZ = 'America/Tegucigalpa';
const z = (n: number) => String(n).padStart(2, '0');
function partes(d: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(d).map((x) => [x.type, x.value])
  );
  return p as Record<string, string>;
}
export const fechaCorta = (d: Date) => { const p = partes(d); return `${p.day}/${p.month}/${p.year}`; };
export const fechaHora = (d: Date) => { const p = partes(d); return `${p.day}/${p.month}/${p.year} · ${z(Number(p.hour) % 24)}:${p.minute}`; };

// ---------- mapeo ----------
export function productoDesdeFila(r: any, fotos: Record<string, string>) {
  return {
    id: r.id, marca: r.marca, nombre: r.nombre, conc: r.conc, ml: r.ml, genero: r.genero, linea: r.linea, fam: r.fam,
    precio: r.precio, descuento: r.descuento, estado: r.estado, nuevo: r.nuevo,
    s: r.s, c: r.c, f: r.f, desc: r.descr, temp: r.temp, mom: r.mom, dur: r.dur, est: r.est,
    fotos: [1, 2, 3, 4].map((i) => fotos[`foto-${r.id}-${i}`]).filter(Boolean),
  };
}
const resenaDesdeFila = (r: any) => ({
  id: r.id, pid: r.pid, nombre: r.nombre, estrellas: r.estrellas, titulo: r.titulo, texto: r.texto,
  fecha: fechaCorta(r.creado_at), estado: r.estado,
});
export const pedidoDesdeFila = (r: any) => ({
  id: r.id, fecha: fechaHora(r.creado_at), nombre: r.nombre, items: r.items, estado: r.estado,
  telefono: r.telefono || '', zona: r.zona || '', direccion: r.direccion || '', ubicacion: r.ubicacion || '',
  notas: r.notas || '', pago: r.pago || '', envio: r.envio, subtotal: r.subtotal, total: r.total,
});
const encargoDesdeFila = (r: any) => ({
  id: r.id, fecha: fechaHora(r.creado_at), perfume: r.perfume, detalles: r.detalles, nombre: r.nombre,
  telefono: r.telefono, estado: r.estado, conCuenta: !!r.cliente_id,
});
const ajustesDesdeFila = (r: any) => ({
  wa: r.wa, anuncio: r.anuncio, direccion: r.direccion, horario: r.horario, instagram: r.instagram, facebook: r.facebook, tiktok: r.tiktok,
  pagos: r.pagos ?? '', envios: r.envios ?? '',
  envio_tegus: r.envio_tegus ?? '', envio_nacional: r.envio_nacional ?? '', envio_gratis: r.envio_gratis ?? '', banco: r.banco ?? '', garantia: r.garantia ?? '', ofertas: r.ofertas ?? '', cambios: r.cambios ?? '',
});

async function fotosMapa() {
  const rows = await sql`select slot, url from fotos`;
  return Object.fromEntries(rows.map((r: any) => [r.slot, r.url])) as Record<string, string>;
}

// ---------- lecturas ----------
export async function datosTienda() {
  const [fotos, prods, res, aj] = await Promise.all([
    fotosMapa(),
    sql`select * from productos order by orden desc, creado_at desc`,
    sql`select * from resenas where estado = 'publicada' order by creado_at desc limit 500`,
    sql`select * from ajustes where id = 1`,
  ]);
  return {
    productos: prods.map((r: any) => productoDesdeFila(r, fotos)),
    resenas: res.map(resenaDesdeFila),
    pedidos: [],
    ajustes: ajustesDesdeFila(aj[0] || {}),
    fotos,
  };
}

export async function datosAdmin() {
  const [fotos, prods, res, peds, aj, encs] = await Promise.all([
    fotosMapa(),
    sql`select * from productos order by orden desc, creado_at desc`,
    sql`select * from resenas order by creado_at desc limit 2000`,
    sql`select * from pedidos order by creado_at desc limit 1000`,
    sql`select * from ajustes where id = 1`,
    sql`select * from encargos order by creado_at desc limit 1000`,
  ]);
  return {
    productos: prods.map((r: any) => productoDesdeFila(r, fotos)),
    resenas: res.map(resenaDesdeFila),
    pedidos: peds.map(pedidoDesdeFila),
    encargos: encs.map(encargoDesdeFila),
    ajustes: ajustesDesdeFila(aj[0] || {}),
    fotos,
  };
}

// ---------- validación ----------
const txt = (v: unknown, max: number, campo: string, req = false) => {
  const s = typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
  if (req && !s) throw new HttpError(400, `Falta ${campo}`);
  if (s.length > max) throw new HttpError(400, `${campo} es demasiado largo`);
  return s;
};
const uno = <T extends string>(v: unknown, ops: readonly T[], campo: string): T => {
  if (!ops.includes(v as T)) throw new HttpError(400, `Valor no válido en ${campo}`);
  return v as T;
};
const entero = (v: unknown, min: number, max: number, campo: string) => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < min || n > max) throw new HttpError(400, `Valor no válido en ${campo}`);
  return n;
};
const lista = <T extends string>(v: unknown, ops: readonly T[]) => (Array.isArray(v) ? ops.filter((o) => v.includes(o)) : []);
export const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

export function validarProducto(id: string, b: any) {
  if (!ID_RE.test(id)) throw new HttpError(400, 'Identificador no válido');
  return {
    id,
    marca: txt(b.marca, 80, 'la marca', true),
    nombre: txt(b.nombre, 120, 'el nombre', true),
    conc: uno(b.conc, ['EDP', 'EDT', 'Parfum'] as const, 'concentración'),
    ml: txt(b.ml, 10, 'el tamaño') || '100',
    genero: uno(b.genero, ['Mujer', 'Hombre', 'Unisex'] as const, 'género'),
    linea: uno(b.linea, ['Árabes', 'De diseñador'] as const, 'categoría'),
    fam: uno(b.fam, ['frescos', 'florales', 'dulces', 'amaderados', 'orientales', 'acuaticos'] as const, 'familia'),
    precio: entero(b.precio, 1, 10_000_000, 'el precio'),
    descuento: entero(b.descuento ?? 0, 0, 90, 'el descuento'),
    estado: uno(b.estado, ['disponible', 'pocas', 'agotado'] as const, 'disponibilidad'),
    nuevo: !!b.nuevo,
    s: txt(b.s, 400, 'notas de salida'),
    c: txt(b.c, 400, 'notas de corazón'),
    f: txt(b.f, 400, 'notas de fondo'),
    descr: txt(b.desc, 3000, 'la descripción'),
    temp: lista(b.temp, ['Primavera', 'Verano', 'Otoño', 'Invierno'] as const),
    mom: lista(b.mom, ['Día', 'Noche'] as const),
    dur: entero(b.dur ?? 3, 1, 5, 'duración'),
    est: entero(b.est ?? 3, 1, 5, 'estela'),
  };
}

export function validarResena(b: any) {
  return {
    pid: b.pid ? txt(b.pid, 40, 'el producto') : null,
    nombre: txt(b.nombre, 60, 'tu nombre', true),
    estrellas: entero(b.estrellas, 1, 5, 'las estrellas'),
    titulo: txt(b.titulo, 120, 'el título'),
    texto: txt(b.texto, 2000, 'la reseña', true),
  };
}

export function validarAjustes(b: any) {
  return {
    wa: txt(b.wa, 30, 'el WhatsApp'),
    anuncio: txt(b.anuncio, 160, 'el anuncio'),
    direccion: txt(b.direccion, 200, 'la dirección'),
    horario: txt(b.horario, 120, 'el horario'),
    instagram: txt(b.instagram, 80, 'Instagram'),
    facebook: txt(b.facebook, 80, 'Facebook'),
    tiktok: txt(b.tiktok, 80, 'TikTok'),
    pagos: txt(b.pagos, 600, 'Métodos de pago'),
    envios: txt(b.envios, 600, 'Envíos'),
    garantia: txt(b.garantia, 600, 'Garantía'),
    ofertas: txt(b.ofertas, 600, 'Condiciones de las ofertas'),
    cambios: txt(b.cambios, 600, 'Política de cambios'),
    envio_tegus: monto(b.envio_tegus, 'Envío en Tegucigalpa'),
    envio_nacional: monto(b.envio_nacional, 'Envío al resto del país'),
    envio_gratis: monto(b.envio_gratis, 'Envío gratis desde'),
    banco: txt(b.banco, 800, 'Datos bancarios'),
  };
}

// Monto en lempiras como texto ('' = sin definir / por confirmar)
function monto(v: unknown, campo: string) {
  const s = v == null ? '' : String(v).replace(/[^\d.]/g, '').trim();
  if (!s) return '';
  const n = Math.round(Number(s));
  if (!Number.isFinite(n) || n < 0 || n > 100000) throw new HttpError(400, `Valor no válido en ${campo}`);
  return String(n);
}

export const ESTADOS_PEDIDO = ['Por confirmar', 'Confirmado', 'Enviado', 'Entregado', 'Cancelado'] as const;
export const ESTADOS_ENCARGO = ['Nuevo', 'Cotizado', 'Pedido al proveedor', 'Listo para entregar', 'Entregado', 'Cancelado'] as const;
export const ESTADOS_RESENA = ['pendiente', 'publicada', 'oculta'] as const;
export { txt, uno, entero };
