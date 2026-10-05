import { NextResponse } from 'next/server';
import { manejar, limitar } from '@/lib/auth';
import { sql } from '@/lib/db';
import { validarResena } from '@/lib/datos';

// Público: la reseña siempre entra como "pendiente" hasta que el administrador la aprueba.
export const POST = manejar(async (req) => {
  await limitar(req, 'resena', 5, 10 * 60_000);
  const r = validarResena(await req.json());
  if (r.pid) {
    const ex = await sql`select 1 from productos where id = ${r.pid}`;
    if (!ex.length) r.pid = null;
  }
  const [row] = await sql`insert into resenas (pid, nombre, estrellas, titulo, texto)
    values (${r.pid}, ${r.nombre}, ${r.estrellas}, ${r.titulo}, ${r.texto}) returning id`;
  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
});
