'use client';
// Pestaña "Encargos" del panel: perfumes que los clientes pidieron y no están en el catálogo.
import { useState } from 'react';

const C = { tinto: '#3D0000', crema: '#F5E6E0', blanco: '#FBF4F0', dorado: '#A97C50', doradoTxt: '#7A532E', sec: '#6E3A34', borde: '#E2CBC1' };
export const ESTADOS_ENCARGO = ['Nuevo', 'Cotizado', 'Pedido al proveedor', 'Listo para entregar', 'Entregado', 'Cancelado'];
const ABIERTOS = ['Nuevo', 'Cotizado', 'Pedido al proveedor', 'Listo para entregar'];
const COLOR = { Nuevo: [C.tinto, C.crema, C.tinto], Cotizado: [C.crema, C.tinto, C.dorado], 'Pedido al proveedor': [C.crema, C.tinto, C.dorado], 'Listo para entregar': [C.crema, C.tinto, C.tinto], Entregado: [C.blanco, C.doradoTxt, C.borde], Cancelado: [C.blanco, C.sec, C.borde] };

export default function AdminEncargos({ encargos, onEstado, onEliminar }) {
  const [filtro, setFiltro] = useState('abiertos');
  const [borrar, setBorrar] = useState(null);
  const lista = (encargos || []).filter((e) => (filtro === 'abiertos' ? ABIERTOS.includes(e.estado) : filtro === 'cerrados' ? !ABIERTOS.includes(e.estado) : true));
  const n = (f) => (encargos || []).filter((e) => (f === 'abiertos' ? ABIERTOS.includes(e.estado) : f === 'cerrados' ? !ABIERTOS.includes(e.estado) : true)).length;
  const chip = (k, t) => (
    <button key={k} type="button" onClick={() => setFiltro(k)} style={{ minHeight: 40, padding: '0 16px', borderRadius: 999, border: `1px solid ${filtro === k ? C.tinto : C.borde}`, background: filtro === k ? C.tinto : C.blanco, color: filtro === k ? C.crema : C.tinto, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>
      {t} ({n(k)})
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: C.sec, maxWidth: '70ch' }}>
        Perfumes que los clientes pidieron desde “Encargos”. Cotiza por WhatsApp y ve actualizando el estado; si el cliente tiene cuenta, lo ve en “Mi cuenta”.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{chip('abiertos', 'En proceso')}{chip('cerrados', 'Cerrados')}{chip('todos', 'Todos')}</div>
      {!lista.length ? <p style={{ margin: 0, padding: 28, background: C.blanco, border: `1px solid ${C.borde}`, fontSize: 14, color: C.sec }}>No hay encargos en esta lista.</p> : null}
      {lista.map((e) => {
        const [bg, fg, bd] = COLOR[e.estado] || COLOR.Nuevo;
        const tel = String(e.telefono || '').replace(/\D/g, '');
        const wa = 'https://wa.me/' + (tel.length === 8 ? '504' + tel : tel) + '?text=' + encodeURIComponent(`Hola ${e.nombre}, te escribimos de Atelier Parfums por tu encargo ${e.id}: ${e.perfume}.`);
        return (
          <article key={e.id} style={{ background: C.blanco, border: `1px solid ${C.borde}`, padding: 'clamp(16px,2.2vw,24px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: '16px 28px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, lineHeight: 1 }}>{e.id}</span>
              <span style={{ fontSize: 13, color: C.sec }}>{e.fecha}</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{e.nombre}{e.conCuenta ? <span style={{ fontWeight: 400, fontSize: 12, color: C.doradoTxt }}> · con cuenta</span> : null}</span>
              <a href={wa} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13.5, color: C.tinto, textDecoration: 'underline', textDecorationColor: C.dorado, textUnderlineOffset: 4 }}>WhatsApp {e.telefono}</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: C.doradoTxt }}>Perfume</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, lineHeight: 1.2 }}>{e.perfume}</span>
              {e.detalles ? <span style={{ fontSize: 13.5, lineHeight: 1.55, color: C.sec }}>{e.detalles}</span> : null}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 44, borderRadius: 999, border: `1px solid ${bd}`, background: bg, color: fg }}>
                <select value={e.estado} onChange={(ev) => onEstado(e.id, ev.target.value)} aria-label="Estado del encargo" style={{ appearance: 'none', WebkitAppearance: 'none', width: '100%', height: '100%', border: 'none', background: 'transparent', padding: '0 40px 0 18px', fontSize: 12.5, letterSpacing: '.06em', color: 'inherit', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                  {ESTADOS_ENCARGO.map((x) => <option key={x} value={x} style={{ color: C.tinto }}>{x}</option>)}
                </select>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" style={{ position: 'absolute', right: 16, pointerEvents: 'none' }}><path d="M6 9l6 6 6-6" /></svg>
              </label>
              {borrar === e.id ? (
                <span style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12.5 }}>
                  ¿Eliminar?
                  <button type="button" onClick={() => { onEliminar(e.id); setBorrar(null); }} style={{ background: 'none', border: 'none', color: C.tinto, textDecoration: 'underline', cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit' }}>Sí</button>
                  <button type="button" onClick={() => setBorrar(null)} style={{ background: 'none', border: 'none', color: C.sec, textDecoration: 'underline', cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit' }}>No</button>
                </span>
              ) : (
                <button type="button" onClick={() => setBorrar(e.id)} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, color: C.sec, textDecoration: 'underline', textDecorationColor: C.borde, textUnderlineOffset: 4, cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit' }}>Eliminar registro</button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
