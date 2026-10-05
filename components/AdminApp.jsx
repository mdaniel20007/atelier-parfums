'use client';
import { useEffect, useState } from 'react';
import AtelierDatos from '@/lib/atelier-datos';
import '@/lib/atelier-metricas';
import Administrador from '@/components/Administrador';
import Splash from '@/components/Splash';

export default function AdminApp({ initial }) {
  const [listo, setListo] = useState(false);
  useEffect(() => { AtelierDatos.hydrate(initial, 'admin'); setListo(true); }, [initial]);
  if (!listo) return <Splash />;
  return <Administrador />;
}
