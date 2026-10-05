import { NextResponse } from 'next/server';
import { manejar } from '@/lib/auth';
import { datosTienda } from '@/lib/datos';

export const dynamic = 'force-dynamic';

// Público: catálogo, reseñas publicadas, ajustes y fotos.
export const GET = manejar(async () => {
  const d = await datosTienda();
  return NextResponse.json(d, { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' } });
});
