import { NextResponse } from 'next/server';
import { manejar, requireAdmin, HttpError } from '@/lib/auth';
import { sql } from '@/lib/db';
import { subirFoto, borrarFoto } from '@/lib/storage';

const SLOT_RE = /^(foto-[A-Za-z0-9_-]{1,40}-[1-4]|hero-editorial|categoria-[a-z]{1,30})$/;
const TIPOS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };

// Subir (o reemplazar) la foto de un espacio. El navegador la reduce antes de enviarla.
export const POST = manejar(async (req) => {
  await requireAdmin(req);
  const form = await req.formData();
  const slot = String(form.get('slot') || '');
  const file = form.get('file');
  if (!SLOT_RE.test(slot)) throw new HttpError(400, 'Espacio de foto no válido');
  if (!(file instanceof File)) throw new HttpError(400, 'Falta el archivo');
  const ext = TIPOS[file.type];
  if (!ext) throw new HttpError(400, 'Formato no permitido (usa JPG, PNG o WebP)');
  if (file.size > 4 * 1024 * 1024) throw new HttpError(400, 'La foto pesa más de 4 MB');
  const nombre = `${slot}-${Date.now().toString(36)}.${ext}`;
  const url = await subirFoto(nombre, await file.arrayBuffer(), file.type);
  const prev = await sql`select path from fotos where slot = ${slot}`;
  await sql`insert into fotos (slot, url, path) values (${slot}, ${url}, ${nombre})
    on conflict (slot) do update set url = excluded.url, path = excluded.path, actualizado_at = now()`;
  if (prev[0]?.path) await borrarFoto(prev[0].path);
  return NextResponse.json({ ok: true, slot, url });
});

export const DELETE = manejar(async (req) => {
  await requireAdmin(req);
  const slot = new URL(req.url).searchParams.get('slot') || '';
  if (!SLOT_RE.test(slot)) throw new HttpError(400, 'Espacio de foto no válido');
  const rows = await sql`delete from fotos where slot = ${slot} returning path`;
  if (rows[0]?.path) await borrarFoto(rows[0].path);
  return NextResponse.json({ ok: true });
});
