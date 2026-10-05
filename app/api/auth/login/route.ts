import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { manejar, limitar, crearSesion, HttpError } from '@/lib/auth';
import { sql } from '@/lib/db';

export const POST = manejar(async (req) => {
  limitar(req, 'login', 8, 15 * 60_000);
  const { email, password } = await req.json();
  const correo = String(email || '').toLowerCase().trim();
  const rows = await sql`select email, hash from admins where email = ${correo}`;
  // Se compara siempre (aunque el correo no exista) para no revelar qué correos existen.
  const ok = await bcrypt.compare(String(password || ''), rows[0]?.hash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');
  if (!rows.length || !ok) throw new HttpError(401, 'Correo o contraseña incorrectos');
  const res = NextResponse.json({ ok: true });
  res.cookies.set(await crearSesion(correo));
  return res;
});
