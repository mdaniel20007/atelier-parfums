'use client';
import { useEffect, useState } from 'react';
import AtelierDatos from '@/lib/atelier-datos';
import Tienda from '@/components/Tienda';
import Splash from '@/components/Splash';

// pid: cuando se entra por /p/<id> (enlace compartido), abre directo ese perfume.
/** @param {{ initial: any, pid?: string }} props */
export default function TiendaApp({ initial, pid }) {
  const [listo, setListo] = useState(false);
  useEffect(() => {
    if (pid && !location.hash) {
      try {
        history.replaceState(null, '', '/');
        history.pushState(null, '', '/#producto=' + encodeURIComponent(pid));
      } catch (e) {}
    }
    AtelierDatos.hydrate(initial, 'tienda');
    setListo(true);
  }, [initial, pid]);
  if (!listo) return <Splash />;
  return <Tienda magnificacion="Media" precios="Ejemplo" botonFlotante={true} />;
}
