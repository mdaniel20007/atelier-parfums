// Sesión de clientes (opcional) con "Iniciar sesión con Google".
// El navegador recibe un ID token de Google; aquí se verifica la firma con las llaves públicas de Google
// y se guarda una cookie firmada propia (atelier_cliente). No se guardan contraseñas.
import { SignJWT, jwtVerify, createRemoteJWKSet } from 'jose';
import { cookies } from 'next/headers';
import { sql } from './db';
import { HttpError } from './auth';

export const COOKIE_CLIENTE = 'atelier_cliente';
const DIAS = 60;
// GOOGLE_JWKS_URL solo se usa en pruebas automáticas; en producción no se define.
const GOOGLE_JWKS = createRemoteJWKSet(new URL(process.env.GOOGLE_JWKS_URL || 'https://www.googleapis.com/oauth2/v3/certs'));

function secreto() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET debe tener al menos 32 caracteres');
  return new TextEncoder().encode('cliente:' + s);
}

export async function verificarGoogle(credential: string) {
  const aud = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!aud) throw new HttpError(503, 'El inicio de sesión con Google no está configurado');
  try {
    const { payload } = await jwtVerify(credential, GOOGLE_JWKS, { issuer: ['https://accounts.google.com', 'accounts.google.com'], audience: aud, algorithms: ['RS256'] });
    if (!payload.sub || !payload.email || payload.email_verified === false) throw new Error('sin correo');
    return { id: String(payload.sub), email: String(payload.email), nombre: String(payload.name || ''), foto: String(payload.picture || '') };
  } catch {
    throw new HttpError(401, 'No se pudo verificar tu cuenta de Google. Intenta de nuevo.');
  }
}

export async function cookieCliente(id: string) {
  const token = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(id).setIssuedAt().setExpirationTime(`${DIAS}d`).sign(secreto());
  return { name: COOKIE_CLIENTE, value: token, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: DIAS * 86400 };
}

export async function clienteActual(): Promise<{ id: string; email: string; nombre: string; foto: string; telefono: string; zona: string; direccion: string } | null> {
  const token = (await cookies()).get(COOKIE_CLIENTE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secreto(), { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    const [c] = await sql`select id, email, nombre, foto, telefono, zona, direccion from clientes where id = ${payload.sub}`;
    return (c as any) || null;
  } catch {
    return null;
  }
}
