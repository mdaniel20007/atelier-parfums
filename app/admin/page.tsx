import type { Metadata } from 'next';
import AdminApp from '@/components/AdminApp';
import Login from '@/components/Login';
import { adminActual } from '@/lib/auth';
import { datosAdmin } from '@/lib/datos';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Administración — Atelier Parfums', robots: { index: false, follow: false } };

export default async function AdminPage() {
  const email = await adminActual();
  if (!email) return <Login />;
  const initial = await datosAdmin();
  return <AdminApp initial={initial} />;
}
