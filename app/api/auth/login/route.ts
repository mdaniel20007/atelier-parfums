import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { manejar, limitar, contar, crearSesion, HttpError } from '@/lib/auth';
import { sql } from '@/lib/db';

// Hash real (de una contraseña al azar) para comparar aunque el correo no exista:
// así la respuesta tarda lo mismo y no revela qué correos son de administradores.
const HASH_FALSO = '$2a$12$6SmJ6N4kACDbpvS.9ZTU5.0cr.Wc33F.LNZe4Eyl5ELWzL3CIrBW6';
const VENTANA = 15 * 60_000;
const MAX_FALLOS_CUENTA = 6;

export const POST = manejar(async (req) => {
  await limitar(req, 'login', 8, VENTANA);
  const { email, password } = await req.json();
  const correo = String(email || '').toLowerCase().trim().slice(0, 120);
  const clave = String(password || '').slice(0, 200);

  // Bloqueo por cuenta: aunque el atacante cambie de IP, a los 6 intentos fallidos la cuenta se pausa 15 min.
  const fallos = await contar('login-cuenta|' + correo, VENTANA, 0);
  if (fallos >= MAX_FALLOS_CUENTA) throw new HttpError(429, 'Demasiados intentos fallidos. Espera 15 minutos.');

  const rows = await sql`select email, hash from admins where email = ${correo}`;
  const ok = await bcrypt.compare(clave, rows[0]?.hash || HASH_FALSO);
  if (!rows.length || !ok) {
    await contar('login-cuenta|' + correo, VENTANA, 1);
    throw new HttpError(401, 'Correo o contraseña incorrectos');
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(await crearSesion(correo, rows[0].hash));
  return res;
});
