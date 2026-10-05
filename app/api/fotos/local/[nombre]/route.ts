import fs from 'node:fs/promises';
import path from 'node:path';
import { DIR_LOCAL } from '@/lib/storage';

// Solo para desarrollo local (sin Supabase Storage).
const TIPOS: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' };
export async function GET(_req: Request, { params }: { params: Promise<{ nombre: string }> }) {
  if (process.env.VERCEL || process.env.SUPABASE_URL) return new Response(null, { status: 404 });
  const { nombre } = await params;
  if (!/^[A-Za-z0-9_.-]+$/.test(nombre)) return new Response(null, { status: 404 });
  try {
    const buf = await fs.readFile(path.join(DIR_LOCAL, nombre));
    return new Response(buf, { headers: { 'Content-Type': TIPOS[nombre.split('.').pop() || ''] || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable' } });
  } catch {
    return new Response(null, { status: 404 });
  }
}
