import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TiendaApp from '@/components/TiendaApp';
import { datosTienda } from '@/lib/datos';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string }> };

const precio = (p: any) => 'L ' + Math.round(p.precio * (1 - p.descuento / 100)).toLocaleString('en-US');

// Enlace para compartir un perfume (WhatsApp, Instagram, Facebook): muestra foto, nombre y precio en la vista previa.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const d = await datosTienda();
  const p = d.productos.find((x: any) => x.id === id);
  if (!p) return { title: 'Atelier Parfums' };
  const title = `${p.nombre} — ${p.marca} · ${precio(p)} | Atelier Parfums`;
  const description = (p.desc || `${p.conc} · ${p.ml} ml · ${p.genero}. Perfume 100% original. Pide por WhatsApp.`).slice(0, 200);
  return {
    title,
    description,
    alternates: { canonical: `/p/${id}` },
    openGraph: { title, description, type: 'website', locale: 'es_HN', images: p.fotos[0] ? [{ url: p.fotos[0] }] : undefined },
    twitter: { card: p.fotos[0] ? 'summary_large_image' : 'summary', title, description },
  };
}

export default async function ProductoPage({ params }: Props) {
  const { id } = await params;
  const initial = await datosTienda();
  const p: any = initial.productos.find((x: any) => x.id === id);
  if (!p) notFound();
  return (
    <>
      <TiendaApp initial={initial} pid={id} />
      <noscript>
        <h1>{p.marca} · {p.nombre}</h1>
        <p>{p.conc} · {p.ml} ml · {p.genero} — {precio(p)}</p>
        <p>{p.desc}</p>
      </noscript>
    </>
  );
}
