import { NextResponse } from 'next/server';
import { manejar, requireAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';
import { validarProducto } from '@/lib/datos';
import { borrarFoto } from '@/lib/storage';

// Crear o actualizar un producto (upsert).
export const PUT = manejar(async (req, { params }) => {
  await requireAdmin(req);
  const { id } = await params;
  const p = validarProducto(id, await req.json());
  await sql`insert into productos ${sql({ ...p, orden: Date.now() })}
    on conflict (id) do update set
      marca = excluded.marca, nombre = excluded.nombre, conc = excluded.conc, ml = excluded.ml,
      genero = excluded.genero, linea = excluded.linea, fam = excluded.fam, precio = excluded.precio,
      descuento = excluded.descuento, estado = excluded.estado, nuevo = excluded.nuevo,
      s = excluded.s, c = excluded.c, f = excluded.f, descr = excluded.descr,
      temp = excluded.temp, mom = excluded.mom, dur = excluded.dur, est = excluded.est,
      actualizado_at = now()`;
  return NextResponse.json({ ok: true });
});

export const DELETE = manejar(async (req, { params }) => {
  await requireAdmin(req);
  const { id } = await params;
  const slots = [1, 2, 3, 4].map((i) => `foto-${id}-${i}`);
  const fotos = await sql`delete from fotos where slot = any(${slots}) returning path`;
  await sql`delete from productos where id = ${id}`;
  await Promise.all(fotos.map((f: any) => borrarFoto(f.path)));
  return NextResponse.json({ ok: true });
});
