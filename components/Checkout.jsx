'use client';
// Carrito por pasos dentro de "Mi pedido": 1 Envío · 2 Pago · 3 Confirmar.
// El pedido se cierra por WhatsApp; aquí no se cobra nada.
import React, { useEffect, useMemo, useState } from 'react';
import { ZONAS, TEGUS, PAGOS, pagosPara, costoEnvio, esTegus } from '@/lib/zonas';

const C = { tinto: '#3D0000', hover: '#5A110C', crema: '#F5E6E0', blanco: '#FBF4F0', dorado: '#A97C50', doradoTxt: '#7A532E', sec: '#6E3A34', borde: '#E2CBC1' };
const eyebrow = { fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: C.doradoTxt };
const input = { width: '100%', height: 46, padding: '0 16px', border: `1px solid ${C.borde}`, borderRadius: 10, background: 'transparent', fontSize: 14.5, color: C.tinto, outline: 'none', fontFamily: 'inherit' };
const btnSolid = { minHeight: 52, borderRadius: 999, border: `1px solid ${C.tinto}`, background: C.tinto, color: C.crema, fontSize: 12.5, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '0 18px', fontFamily: 'inherit' };
const btnLine = { ...btnSolid, background: 'transparent', color: C.tinto };
const GUARDADO = 'atelier-envio';

const vacio = { nombre: '', telefono: '', modo: 'manual', direccion: '', ubicacion: '', notas: '', zona: '', pago: '' };

function Pasos({ paso }) {
  const items = ['Envío', 'Pago', 'Confirmar'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', position: 'relative', padding: '20px 0 6px' }}>
      <span style={{ position: 'absolute', left: '16.6%', right: '16.6%', top: 36, height: 1, background: C.borde }} />
      <span style={{ position: 'absolute', left: '16.6%', top: 36, height: 1, background: C.tinto, width: `${(paso - 1) * 33.3}%`, transition: 'width .35s' }} />
      {items.map((t, i) => {
        const n = i + 1, hecho = n < paso, actual = n === paso;
        return (
          <div key={t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
            <span style={{ width: 32, height: 32, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, transition: 'all .3s',
              background: hecho ? C.tinto : C.blanco, color: hecho ? C.crema : actual ? C.tinto : C.sec, border: `1px solid ${hecho || actual ? C.tinto : C.borde}` }}>
              {hecho ? '✓' : n}
            </span>
            <span style={{ fontSize: 10.5, letterSpacing: '.2em', textTransform: 'uppercase', color: actual ? C.tinto : C.sec }}>{t}</span>
          </div>
        );
      })}
    </div>
  );
}

function Campo({ label, req, children, error }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={eyebrow}>{label}{req ? <span style={{ color: C.dorado }}> *</span> : null}</span>
      {children}
      {error ? <span style={{ fontSize: 12, color: C.tinto }}>{error}</span> : null}
    </label>
  );
}

export default function Checkout({ items, subtotal, ajustes, fmt, onBack, onConfirm, cliente, loginOn, onLogin }) {
  const [paso, setPaso] = useState(1);
  const [d, setD] = useState(vacio);
  const [err, setErr] = useState({});
  const [gps, setGps] = useState('');

  // Recuerda los datos de entrega del cliente para su próxima compra (solo en su teléfono).
  useEffect(() => {
    try { const g = JSON.parse(localStorage.getItem(GUARDADO) || 'null'); if (g) setD({ ...vacio, ...g, pago: '' }); } catch (e) {}
  }, []);
  useEffect(() => {
    try { const { pago, ...resto } = d; localStorage.setItem(GUARDADO, JSON.stringify(resto)); } catch (e) {}
  }, [d]);
  // Con sesión iniciada: completa lo que falte con los datos de la cuenta.
  useEffect(() => {
    if (!cliente) return;
    setD((x) => ({
      ...x,
      nombre: x.nombre || cliente.nombre || '',
      telefono: x.telefono || cliente.telefono || '',
      zona: x.zona || cliente.zona || '',
      direccion: x.direccion || cliente.direccion || '',
    }));
  }, [cliente]);

  const set = (k) => (e) => setD((x) => ({ ...x, [k]: e.target.value }));
  const envio = useMemo(() => costoEnvio(ajustes, d.zona, subtotal), [ajustes, d.zona, subtotal]);
  const total = subtotal + (envio || 0);
  const envioTxt = !d.zona ? '—' : envio === null ? 'Por confirmar' : envio === 0 ? 'Gratis' : fmt(envio);
  const opciones = pagosPara(d.zona);
  const pago = opciones.includes(d.pago) ? d.pago : opciones.length === 1 ? opciones[0] : '';

  function usarGps() {
    if (!navigator.geolocation) { setGps('Tu navegador no permite compartir ubicación. Escribe la dirección.'); return; }
    setGps('Buscando tu ubicación…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: la, longitude: lo } = pos.coords;
        setD((x) => ({ ...x, ubicacion: `https://maps.google.com/?q=${la.toFixed(6)},${lo.toFixed(6)}` }));
        setGps('');
      },
      () => setGps('No pudimos obtener tu ubicación. Revisa el permiso o escribe la dirección.'),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function validarEnvio() {
    const e = {};
    if (!d.nombre.trim()) e.nombre = 'Escribe tu nombre';
    if (d.telefono.replace(/\D/g, '').length < 8) e.telefono = 'Escribe un número de 8 dígitos';
    if (d.modo === 'gps' ? !d.ubicacion && !d.direccion.trim() : !d.direccion.trim()) e.direccion = d.modo === 'gps' ? 'Comparte tu ubicación o escribe la dirección' : 'Escribe la dirección de entrega';
    if (!d.zona) e.zona = 'Selecciona dónde entregamos';
    setErr(e);
    return !Object.keys(e).length;
  }

  const siguiente = () => {
    if (paso === 1 && !validarEnvio()) return;
    if (paso === 2 && !pago) { setErr({ pago: 'Elige cómo vas a pagar' }); return; }
    setErr({});
    setPaso(paso + 1);
  };
  const atras = () => (paso === 1 ? onBack() : setPaso(paso - 1));
  const confirmar = () => onConfirm({
    nombre: d.nombre.trim(), telefono: d.telefono.trim(), zona: d.zona, pago,
    direccion: d.direccion.trim(), ubicacion: d.modo === 'gps' ? d.ubicacion : '', notas: d.notas.trim(),
  }, { envio, total });

  const linea = (a, b, fuerte) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontSize: fuerte ? 15 : 14, fontWeight: fuerte ? 500 : 400, color: fuerte ? C.tinto : C.sec }}>
      <span>{a}</span><span style={{ whiteSpace: 'nowrap', color: C.tinto }}>{b}</span>
    </div>
  );

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
        <Pasos paso={paso} />

        {paso === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 18 }}>
            {loginOn && !cliente ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', border: `1px solid ${C.borde}`, fontSize: 13, color: C.sec }}>
                <span>¿Compras seguido? Guarda tus datos con tu cuenta de Google.</span>
                <button type="button" onClick={onLogin} style={{ background: 'none', border: 'none', padding: 0, color: C.tinto, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>Iniciar sesión</button>
              </div>
            ) : null}
            {cliente ? (
              <div style={{ padding: '10px 14px', background: C.crema, fontSize: 13, color: C.sec }}>Comprando como <strong style={{ fontWeight: 500, color: C.tinto }}>{cliente.email}</strong></div>
            ) : null}
            <Campo label="Nombre completo" req error={err.nombre}>
              <input value={d.nombre} onChange={set('nombre')} autoComplete="name" placeholder="Ej. María Fernanda López" style={input} />
            </Campo>
            <Campo label="Teléfono / WhatsApp" req error={err.telefono}>
              <input value={d.telefono} onChange={set('telefono')} type="tel" inputMode="tel" autoComplete="tel" placeholder="9999-9999" style={input} />
            </Campo>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={eyebrow}>Dirección de entrega <span style={{ color: C.dorado }}>*</span></span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: `1px solid ${C.borde}`, borderRadius: 999, padding: 3 }}>
                {[['manual', 'Escribirla'], ['gps', 'Usar mi ubicación']].map(([k, t]) => (
                  <button key={k} type="button" onClick={() => { setD((x) => ({ ...x, modo: k })); if (k === 'gps' && !d.ubicacion) usarGps(); }}
                    style={{ height: 38, borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'inherit', transition: 'all .25s',
                      background: d.modo === k ? C.tinto : 'transparent', color: d.modo === k ? C.crema : C.tinto }}>{t}</button>
                ))}
              </div>
              {d.modo === 'gps' ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 14px', background: C.crema, fontSize: 13, color: C.sec }}>
                  <span>{gps || (d.ubicacion ? 'Ubicación lista. La verás en el mensaje.' : 'Toca para compartir tu ubicación.')}</span>
                  {d.ubicacion ? <a href={d.ubicacion} target="_blank" rel="noopener noreferrer" style={{ color: C.tinto, textDecoration: 'underline', textUnderlineOffset: 3, whiteSpace: 'nowrap' }}>Ver mapa</a>
                    : <button type="button" onClick={usarGps} style={{ background: 'none', border: 'none', color: C.tinto, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Compartir</button>}
                </div>
              ) : null}
              <input value={d.direccion} onChange={set('direccion')} autoComplete="street-address"
                placeholder={d.modo === 'gps' ? 'Punto de referencia (opcional)' : 'Colonia, calle, casa y punto de referencia'} style={input} />
              {err.direccion ? <span style={{ fontSize: 12, color: C.tinto }}>{err.direccion}</span> : null}
            </div>

            <Campo label="¿Dónde entregamos?" req error={err.zona}>
              <div style={{ position: 'relative' }}>
                <select value={d.zona} onChange={set('zona')} style={{ ...input, appearance: 'none', WebkitAppearance: 'none', paddingRight: 40, cursor: 'pointer' }}>
                  <option value="">Selecciona tu departamento</option>
                  {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.tinto} strokeWidth="1.3" style={{ position: 'absolute', right: 16, top: 16, pointerEvents: 'none' }}><path d="M6 9l6 6 6-6" /></svg>
              </div>
            </Campo>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: C.crema, fontSize: 13.5, color: C.sec }}>
              <span>Costo de envío</span><span style={{ color: C.tinto, fontWeight: 500 }}>{envioTxt}</span>
            </div>

            <Campo label="Notas (opcional)">
              <textarea value={d.notas} onChange={set('notas')} rows={3} maxLength={400} placeholder="Horario para recibir, quién recibe, etc."
                style={{ ...input, height: 'auto', padding: '12px 16px', lineHeight: 1.5, resize: 'vertical' }} />
            </Campo>
          </div>
        ) : null}

        {paso === 2 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 22 }}>
            <span style={eyebrow}>¿Cómo vas a pagar?</span>
            {Object.keys(PAGOS).map((k) => {
              const ok = opciones.includes(k), sel = pago === k;
              return (
                <button key={k} type="button" disabled={!ok} onClick={() => setD((x) => ({ ...x, pago: k }))}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 14, textAlign: 'left', padding: '18px 18px', border: `1px solid ${sel ? C.tinto : C.borde}`, background: sel ? C.crema : C.blanco,
                    cursor: ok ? 'pointer' : 'not-allowed', opacity: ok ? 1 : 0.5, fontFamily: 'inherit', color: C.tinto, transition: 'all .25s' }}>
                  <span style={{ width: 18, height: 18, marginTop: 2, borderRadius: 999, border: `1px solid ${C.tinto}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    {sel ? <span style={{ width: 10, height: 10, borderRadius: 999, background: C.tinto }} /> : null}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, lineHeight: 1.1 }}>{PAGOS[k]}</span>
                    <span style={{ fontSize: 12.5, lineHeight: 1.5, color: C.sec }}>
                      {k === 'efectivo' ? (ok ? 'Pagas al recibir tu pedido.' : `Solo disponible para entregas en ${TEGUS}.`) : 'Te compartimos los datos de la cuenta al confirmar.'}
                    </span>
                  </span>
                </button>
              );
            })}
            {err.pago ? <span style={{ fontSize: 12, color: C.tinto }}>{err.pago}</span> : null}
          </div>
        ) : null}

        {paso === 3 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 22 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 18, border: `1px solid ${C.borde}` }}>
              <span style={eyebrow}>Enviar a</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22 }}>{d.nombre}</span>
              <span style={{ fontSize: 13.5, color: C.sec }}>{d.telefono}</span>
              {d.direccion ? <span style={{ fontSize: 13.5, color: C.sec }}>{d.direccion}</span> : null}
              {d.modo === 'gps' && d.ubicacion ? <a href={d.ubicacion} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13.5, color: C.tinto, textDecoration: 'underline', textUnderlineOffset: 3 }}>Ubicación en el mapa</a> : null}
              <span style={{ fontSize: 13.5, color: C.tinto }}>{d.zona}</span>
              {d.notas ? <span style={{ fontSize: 13, color: C.sec, fontStyle: 'italic' }}>“{d.notas}”</span> : null}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 18, border: `1px solid ${C.borde}` }}>
              <span style={eyebrow}>Método de pago</span>
              <span style={{ fontSize: 14.5 }}>{PAGOS[pago]}</span>
              {pago === 'transferencia' && ajustes.banco ? (
                <span style={{ fontSize: 13, lineHeight: 1.6, color: C.sec, whiteSpace: 'pre-line', marginTop: 4 }}>{ajustes.banco}</span>
              ) : null}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((it, i) => linea(`${it.n} × ${it.nombre}`, fmt(it.precio * it.n)))}
              <span style={{ height: 1, background: C.borde, margin: '4px 0' }} />
              {linea('Subtotal', fmt(subtotal))}
              {linea(`Envío (${d.zona})`, envioTxt)}
              <span style={{ height: 1, background: C.borde, margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={eyebrow}>Total a pagar</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32 }}>{fmt(total)}{envio === null ? <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, color: C.sec }}> + envío</span> : null}</span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: C.sec }}>
              Al confirmar se abre WhatsApp con tu pedido listo para enviar. Te confirmamos disponibilidad y entrega por ahí. No se realiza ningún cobro en este sitio.
            </p>
          </div>
        ) : null}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, padding: '16px 24px 22px', borderTop: `1px solid ${C.borde}`, background: C.blanco }}>
        <button type="button" onClick={atras} style={btnLine} className="dcp1">Atrás</button>
        {paso < 3 ? (
          <button type="button" onClick={siguiente} style={btnSolid} className="dcp4">{paso === 1 ? 'Siguiente: pago' : 'Siguiente: resumen'}</button>
        ) : (
          <button type="button" onClick={confirmar} style={btnSolid} className="dcp4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" /><path d="M9.2 8.2c-.4.4-.6 1-.4 1.8.6 2.2 2.6 4.3 4.9 4.9.8.2 1.4 0 1.8-.4l.4-.6-1.8-1-.8.7c-1-.4-1.9-1.3-2.3-2.3l.7-.8-1-1.8z" /></svg>
            Confirmar pedido
          </button>
        )}
      </div>
    </>
  );
}
