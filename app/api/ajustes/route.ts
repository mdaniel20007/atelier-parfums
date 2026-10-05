import { NextResponse } from 'next/server';
import { manejar, requireAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';
import { validarAjustes } from '@/lib/datos';

export const PATCH = manejar(async (req) => {
  await requireAdmin(req);
  const a = validarAjustes(await req.json());
  await sql`update ajustes set ${sql(a)} where id = 1`;
  return NextResponse.json({ ok: true });
});
