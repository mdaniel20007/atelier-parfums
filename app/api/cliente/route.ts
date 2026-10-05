import { NextResponse } from 'next/server';
import { manejar } from '@/lib/auth';
import { clienteActual } from '@/lib/cliente';
import { pedidoDesdeFila, fechaHora } from '@/lib/datos';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Perfil del cliente con sesión, sus pedidos y sus encargos. Sin sesión: { cliente: null }.
export const GET = manejar(async () => {
  const c = await clienteActual();
  if (!c) return NextResponse.json({ cliente: null }, { headers: { 'Cache-Control': 'no-store' } });
  const [peds, encs] = await Promise.all([
    sql`select * from pedidos where cliente_id = ${c.id} order by creado_at desc limit 50`,
    sql`select id, perfume, detalles, estado, creado_at from encargos where cliente_id = ${c.id} order by creado_at desc limit 50`,
  ]);
  return NextResponse.json({
    cliente: c,
    pedidos: peds.map(pedidoDesdeFila),
    encargos: encs.map((e: any) => ({ id: e.id, perfume: e.perfume, detalles: e.detalles, estado: e.estado, fecha: fechaHora(e.creado_at) })),
  }, { headers: { 'Cache-Control': 'no-store' } });
});
