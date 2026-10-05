import { NextResponse } from 'next/server';
import { manejar, limitar, HttpError } from '@/lib/auth';
import { sql } from '@/lib/db';
import { txt } from '@/lib/datos';
import { clienteActual } from '@/lib/cliente';
// @ts-ignore — módulo JS compartido con la tienda
import { ZONAS, pagosPara, costoEnvio } from '@/lib/zonas';

// Público: registra el pedido que el cliente envía por WhatsApp desde el carrito.
// Los precios y el envío se recalculan aquí con los datos de la base (no se confía en el navegador).
export const POST = manejar(async (req) => {
  limitar(req, 'pedido', 10, 10 * 60_000);
  const b = await req.json();

  const nombre = txt(b.nombre, 60, 'el nombre', true);
  const telefono = txt(b.telefono, 20, 'el teléfono', true);
  if (telefono.replace(/\D/g, '').length < 8) throw new HttpError(400, 'Revisa el número de teléfono');
  const zona = txt(b.zona, 60, 'el departamento', true);
  if (!ZONAS.includes(zona)) throw new HttpError(400, 'Selecciona un departamento válido');
  const direccion = txt(b.direccion, 300, 'la dirección');
  const ubicacion = txt(b.ubicacion, 120, 'la ubicación');
  if (ubicacion && !/^https:\/\/maps\.google\.com\/\?q=-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(ubicacion)) throw new HttpError(400, 'Ubicación no válida');
  if (!direccion && !ubicacion) throw new HttpError(400, 'Falta la dirección de entrega');
  const notas = txt(b.notas, 400, 'las notas');
  const pago = String(b.pago || '');
  if (!pagosPara(zona).includes(pago)) throw new HttpError(400, 'El pago en efectivo solo está disponible en Tegucigalpa');

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

  const subtotal = items.reduce((a: number, x: any) => a + x.n * x.precio, 0);
  const [aj] = await sql`select envio_tegus, envio_nacional, envio_gratis from ajustes where id = 1`;
  const envio = costoEnvio(aj || {}, zona, subtotal); // null = por confirmar
  const total = subtotal + (envio || 0);

  const cli = await clienteActual();
  const [row] = await sql`insert into pedidos ${sql({
    nombre, items: sql.json(items) as any, subtotal, envio, total,
    telefono, zona, direccion, ubicacion, notas, pago, cliente_id: cli?.id ?? null,
  })} returning id`;
  // Con sesión: se guardan sus datos de entrega para la próxima compra.
  if (cli) await sql`update clientes set telefono = ${telefono}, zona = ${zona}, direccion = ${direccion} where id = ${cli.id}`;
  return NextResponse.json({ ok: true, id: row.id, subtotal, envio, total }, { status: 201 });
});
