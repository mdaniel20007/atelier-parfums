import { NextResponse } from 'next/server';
import { manejar, requireAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';
import { uno, ESTADOS_RESENA } from '@/lib/datos';

export const PATCH = manejar(async (req, { params }) => {
  await requireAdmin(req);
  const { id } = await params;
  const b = await req.json();
  const estado = uno(b.estado, ESTADOS_RESENA, 'estado');
  await sql`update resenas set estado = ${estado} where id = ${id}`;
  return NextResponse.json({ ok: true });
});

export const DELETE = manejar(async (req, { params }) => {
  await requireAdmin(req);
  const { id } = await params;
  await sql`delete from resenas where id = ${id}`;
  return NextResponse.json({ ok: true });
});
