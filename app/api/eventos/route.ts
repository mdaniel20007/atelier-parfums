import { NextResponse } from 'next/server';
import { manejar, requireAdmin, limitar } from '@/lib/auth';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
const TIPOS = new Set(['visita', 'clic', 'vista', 'whatsapp', 'agregar', 'pedido', 'aviso', 'busqueda', 'categoria']);
const corta = (v: unknown, n: number) => (typeof v === 'string' && v ? v.slice(0, n) : null);
const num = (v: unknown) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Math.round(Number(v)) : null);

// Público: recibe eventos anónimos de la tienda (se envían con navigator.sendBeacon, en lotes).
export const POST = manejar(async (req) => {
  await limitar(req, 'eventos', 120, 60_000);
  let body: any;
  try { body = JSON.parse(await req.text()); } catch { return new NextResponse(null, { status: 204 }); }
  const lista = (Array.isArray(body) ? body : [body]).slice(0, 50);
  const ahora = Date.now();
  const filas = lista
    .filter((e: any) => e && TIPOS.has(e.tipo) && typeof e.vid === 'string')
    .map((e: any) => ({
      t: Math.min(ahora, Math.max(ahora - 86_400_000, num(e.t) ?? ahora)),
      tipo: e.tipo,
      vid: e.vid.slice(0, 24),
      dev: e.dev === 'desk' ? 'desk' : 'mob',
      pid: corta(e.pid, 40),
      cat: corta(e.cat, 40),
      q: corta(e.q, 80),
      res: num(e.res),
      total: num(e.total),
      pids: Array.isArray(e.pids) ? e.pids.slice(0, 30).map((x: any) => String(x).slice(0, 40)) : null,
    }));
  if (filas.length) await sql`insert into eventos ${sql(filas)}`;
  return new NextResponse(null, { status: 204 });
});

// Administrador: eventos de los últimos N días para los tableros.
export const GET = manejar(async (req) => {
  await requireAdmin(req);
  const dias = Math.min(120, Math.max(1, Number(new URL(req.url).searchParams.get('dias')) || 62));
  const desde = Date.now() - dias * 86_400_000;
  // Retención: los eventos de más de 13 meses se borran solos.
  sql`delete from eventos where t < ${Date.now() - 400 * 86_400_000}`.catch(() => {});
  const rows = await sql`select t, tipo, vid, dev, pid, cat, q, res, total, pids from eventos where t >= ${desde} order by t limit 200000`;
  const evs = rows.map((r: any) => {
    const e: any = { t: Number(r.t), tipo: r.tipo, vid: r.vid, dev: r.dev };
    for (const k of ['pid', 'cat', 'q', 'res', 'total', 'pids']) if (r[k] != null) e[k] = r[k];
    return e;
  });
  return NextResponse.json(evs, { headers: { 'Cache-Control': 'no-store' } });
});

export const DELETE = manejar(async (req) => {
  await requireAdmin(req);
  await sql`truncate eventos`;
  return NextResponse.json({ ok: true });
});
