import TiendaApp from '@/components/TiendaApp';
import { datosTienda } from '@/lib/datos';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const initial = await datosTienda();
  return (
    <>
      <TiendaApp initial={initial} />
      {/* Contenido para buscadores y vistas previas sin JavaScript */}
      <noscript>
        <h1>Atelier Parfums — Perfumes originales en Honduras</h1>
        <ul>{initial.productos.map((p: any) => <li key={p.id}>{p.marca} · {p.nombre} — L {p.precio}</li>)}</ul>
      </noscript>
    </>
  );
}
