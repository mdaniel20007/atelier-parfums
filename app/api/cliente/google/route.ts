import { NextResponse } from 'next/server';
import { manejar, limitar } from '@/lib/auth';
import { verificarGoogle, cookieCliente } from '@/lib/cliente';
import { sql } from '@/lib/db';

// Recibe el "credential" (ID token) de Google, lo verifica y abre la sesión del cliente.
export const POST = manejar(async (req) => {
  limitar(req, 'cliente-login', 20, 10 * 60_000);
  const { credential } = await req.json();
  const g = await verificarGoogle(String(credential || ''));
  await sql`insert into clientes (id, email, nombre, foto) values (${g.id}, ${g.email}, ${g.nombre}, ${g.foto})
    on conflict (id) do update set email = excluded.email, nombre = excluded.nombre, foto = excluded.foto, visto_at = now()`;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(await cookieCliente(g.id));
  return res;
});
