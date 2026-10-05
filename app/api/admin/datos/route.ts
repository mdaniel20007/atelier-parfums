import { NextResponse } from 'next/server';
import { manejar, requireAdmin } from '@/lib/auth';
import { datosAdmin } from '@/lib/datos';

export const dynamic = 'force-dynamic';

export const GET = manejar(async (req) => {
  await requireAdmin(req);
  return NextResponse.json(await datosAdmin(), { headers: { 'Cache-Control': 'no-store' } });
});
