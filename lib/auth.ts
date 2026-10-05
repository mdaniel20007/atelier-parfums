import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const COOKIE = 'atelier_admin';
const DIAS = 7;

function secreto() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET debe tener al menos 32 caracteres');
  return new TextEncoder().encode(s);
}

export async function crearSesion(email: string) {
  const token = await new SignJWT({ email })
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
    const { payload } = await jwtVerify(token, secreto());
    return typeof payload.email === 'string' ? payload.email : null;
  } catch {
    return null;
  }
}

export class HttpError extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}

// Para rutas que modifican datos: sesión válida + misma procedencia (protección CSRF).
export async function requireAdmin(req: Request) {
  const email = await adminActual();
  if (!email) throw new HttpError(401, 'Tu sesión expiró. Vuelve a iniciar sesión.');
  if (req.method !== 'GET') {
    const origin = req.headers.get('origin');
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (origin && host && new URL(origin).host !== host) throw new HttpError(403, 'Origen no permitido');
  }
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

// Límite simple por IP (por instancia). Frena abusos básicos en las rutas públicas.
const cubetas = new Map<string, { n: number; t: number }>();
export function limitar(req: Request, clave: string, max: number, ventanaMs: number) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  const k = clave + '|' + ip;
  const now = Date.now();
  const c = cubetas.get(k);
  if (!c || now - c.t > ventanaMs) { cubetas.set(k, { n: 1, t: now }); }
  else if (++c.n > max) throw new HttpError(429, 'Demasiadas solicitudes. Intenta en unos minutos.');
  if (cubetas.size > 5000) cubetas.clear();
}
