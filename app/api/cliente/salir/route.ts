import { NextResponse } from 'next/server';
import { COOKIE_CLIENTE } from '@/lib/cliente';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: COOKIE_CLIENTE, value: '', path: '/', maxAge: 0 });
  return res;
}
