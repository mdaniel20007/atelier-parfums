import { NextResponse } from 'next/server';
import { manejar, limitar, HttpError } from '@/lib/auth';
import { clienteActual } from '@/lib/cliente';
import { sql } from '@/lib/db';
import { txt } from '@/lib/datos';

// Público: un cliente encarga un perfume que no está en el catálogo. Entra como "Nuevo".
export const POST = manejar(async (req) => {
  await limitar(req, 'encargo', 6, 10 * 60_000);
  const b = await req.json();
  const perfume = txt(b.perfume, 160, 'el perfume', true);
  const detalles = txt(b.detalles, 400, 'los detalles');
  const nombre = txt(b.nombre, 60, 'tu nombre', true);
  const telefono = txt(b.telefono, 20, 'el teléfono', true);
  if (telefono.replace(/\D/g, '').length < 8) throw new HttpError(400, 'Revisa el número de teléfono');
  const cli = await clienteActual();
  const [row] = await sql`insert into encargos (perfume, detalles, nombre, telefono, cliente_id)
    values (${perfume}, ${detalles}, ${nombre}, ${telefono}, ${cli?.id ?? null}) returning id`;
  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
});
