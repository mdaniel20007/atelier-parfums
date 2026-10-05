import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sql } from './db';

export const COOKIE = 'atelier_admin';
const DIAS = 7;

function secreto() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET debe tener al menos 32 caracteres');
  return new TextEncoder().encode(s);
}

// "v" ata la sesión a la contraseña actual: si se cambia la contraseña o se borra el usuario,
// todas sus sesiones abiertas dejan de servir al instante.
const versionDe = (hash: string) => hash.slice(-12);

export async function crearSesion(email: string, hash: string) {
  const token = await new SignJWT({ email, v: versionDe(hash) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DIAS}d`)
    .sign(secreto());
  return { name: COOKIE, value: token, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: DIAS * 86400 };
}

export async function adminActual(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secreto(), { algorithms: ['HS256'] });
    if (typeof payload.email !== 'string' || typeof payload.v !== 'string') return null;
    const [a] = await sql`select hash from admins where email = ${payload.email}`;
    if (!a || versionDe(a.hash) !== payload.v) return null;
    return payload.email;
  } catch {
    return null;
  }
}

export class HttpError extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}

// Protección CSRF: todo cambio debe venir de una página de este mismo sitio.
function mismoOrigen(req: Request) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const fuente = req.headers.get('origin') || req.headers.get('referer');
  if (!host || !fuente) return false;
  try { return new URL(fuente).host === host; } catch { return false; }
}

export async function requireAdmin(req: Request) {
  if (req.method !== 'GET' && !mismoOrigen(req)) throw new HttpError(403, 'Origen no permitido');
  const email = await adminActual();
  if (!email) throw new HttpError(401, 'Tu sesión expiró. Vuelve a iniciar sesión.');
  return email;
}

export function manejar(fn: (req: Request, ctx: any) => Promise<Response>) {
  return async (req: Request, ctx: any) => {
    try {
      return await fn(req, ctx);
    } catch (e: any) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message.charAt(0).toUpperCase() + e.message.slice(1) }, { status: e.status });
      console.error(e);
      return NextResponse.json({ error: 'Error del servidor. Intenta de nuevo.' }, { status: 500 });
    }
  };
}

// IP real del visitante. En Vercel, x-real-ip / x-vercel-forwarded-for los pone la plataforma
// (el visitante no los puede falsificar).
export function ipDe(req: Request) {
  return (req.headers.get('x-vercel-forwarded-for') || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '')
    .split(',')[0].trim() || 'local';
}

// Límite de solicitudes guardado en la base: funciona igual con muchas instancias del servidor.
export async function contar(clave: string, ventanaMs: number, sumar = 1) {
  const ventana = Math.floor(Date.now() / ventanaMs);
  const [r] = await sql`insert into limites (clave, ventana, n) values (${clave}, ${ventana}, ${sumar})
    on conflict (clave, ventana) do update set n = limites.n + ${sumar} returning n`;
  if (Math.random() < 0.02) sql`delete from limites where ventana < ${ventana - 2}`.catch(() => {});
  return r.n as number;
}

export async function limitar(req: Request, clave: string, max: number, ventanaMs: number) {
  const n = await contar(clave + '|' + ipDe(req), ventanaMs);
  if (n > max) throw new HttpError(429, 'Demasiadas solicitudes. Intenta en unos minutos.');
}
