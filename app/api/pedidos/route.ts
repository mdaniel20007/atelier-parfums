import { NextResponse } from 'next/server';
import { manejar, limitar, HttpError } from '@/lib/auth';
import { sql } from '@/lib/db';
import { txt } from '@/lib/datos';

// Público: registra el pedido que el cliente envía por WhatsApp.
// Los precios se recalculan aquí con los datos de la base (no se confía en el navegador).
export const POST = manejar(async (req) => {
  limitar(req, 'pedido', 10, 10 * 60_000);
  const b = await req.json();
  const nombre = txt(b.nombre, 60, 'el nombre') || '[Sin nombre]';
  const pedidos = Array.isArray(b.items) ? b.items.slice(0, 30) : [];
  const ids = [...new Set(pedidos.map((x: any) => String(x?.pid || '')))].filter(Boolean) as string[];
  if (!ids.length) throw new HttpError(400, 'El pedido está vacío');
  const prods = await sql`select id, precio, descuento from productos where id = any(${ids})`;
  const precio = new Map(prods.map((p: any) => [p.id, Math.round(p.precio * (1 - p.descuento / 100))]));
  const items = pedidos
    .map((x: any) => ({ pid: String(x.pid), n: Math.max(1, Math.min(50, Math.round(Number(x.n) || 1))) }))
    .filter((x: any) => precio.has(x.pid))
    .map((x: any) => ({ ...x, precio: precio.get(x.pid) }));
  if (!items.length) throw new HttpError(400, 'Los productos del pedido ya no existen');
  const total = items.reduce((a: number, x: any) => a + x.n * x.precio, 0);
  const [row] = await sql`insert into pedidos (nombre, items, total) values (${nombre}, ${sql.json(items)}, ${total}) returning id`;
  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
});
