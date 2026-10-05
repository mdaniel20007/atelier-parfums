// Almacenamiento de fotos. En producción usa Supabase Storage (bucket público).
// Sin SUPABASE_URL (solo en desarrollo local) guarda los archivos en la carpeta .uploads.
import fs from 'node:fs/promises';
import path from 'node:path';

export const DIR_LOCAL = path.join(process.cwd(), '.uploads');
const BUCKET = process.env.SUPABASE_BUCKET || 'fotos';
const base = () => (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const usarSupabase = () => !!(base() && key());

export async function subirFoto(nombre: string, datos: ArrayBuffer, tipo: string) {
  if (usarSupabase()) {
    const r = await fetch(`${base()}/storage/v1/object/${BUCKET}/${nombre}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key()}`, apikey: key(), 'Content-Type': tipo, 'x-upsert': 'true', 'Cache-Control': 'max-age=31536000' },
      body: datos,
    });
    if (!r.ok) throw new Error('Supabase Storage: ' + r.status + ' ' + (await r.text()));
    return `${base()}/storage/v1/object/public/${BUCKET}/${nombre}`;
  }
  if (process.env.VERCEL) throw new Error('Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para subir fotos en producción');
  await fs.mkdir(DIR_LOCAL, { recursive: true });
  await fs.writeFile(path.join(DIR_LOCAL, nombre), Buffer.from(datos));
  return `/api/fotos/local/${nombre}`;
}

export async function borrarFoto(nombre: string) {
  if (!nombre) return;
  try {
    if (usarSupabase()) {
      await fetch(`${base()}/storage/v1/object/${BUCKET}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${key()}`, apikey: key(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefixes: [nombre] }),
      });
    } else if (!process.env.VERCEL) {
      await fs.unlink(path.join(DIR_LOCAL, nombre));
    }
  } catch { /* si no existe, no pasa nada */ }
}
