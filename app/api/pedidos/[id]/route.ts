import { NextResponse } from 'next/server';
import { manejar, requireAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';
import { uno, ESTADOS_PEDIDO } from '@/lib/datos';

export const PATCH = manejar(async (req, { params }) => {
  await requireAdmin(req);
  const { id } = await params;
  const estado = uno((await req.json()).estado, ESTADOS_PEDIDO, 'estado');
  await sql`update pedidos set estado = ${estado} where id = ${id}`;
  return NextResponse.json({ ok: true });
});

export const DELETE = manejar(async (req, { params }) => {
  await requireAdmin(req);
  const { id } = await params;
  await sql`delete from pedidos where id = ${id}`;
  return NextResponse.json({ ok: true });
});
