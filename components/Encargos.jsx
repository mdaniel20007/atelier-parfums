'use client';
// Página "Encargos": el cliente pide un perfume que no está en el catálogo.
// Se abre WhatsApp con el mensaje listo y el encargo queda registrado en el panel.
import { useEffect, useState } from 'react';

const C = { tinto: '#3D0000', crema: '#F5E6E0', blanco: '#FBF4F0', dorado: '#A97C50', doradoTxt: '#7A532E', sec: '#6E3A34', borde: '#E2CBC1' };
const eyebrow = { fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: C.doradoTxt };
const input = { width: '100%', height: 48, padding: '0 16px', border: `1px solid ${C.borde}`, borderRadius: 10, background: 'transparent', fontSize: 15, color: C.tinto, outline: 'none', fontFamily: 'inherit' };
const PASOS = [
  ['01', 'Dinos qué perfume buscas', 'Marca, nombre y, si lo sabes, el tamaño o la concentración.'],
  ['02', 'Te cotizamos por WhatsApp', 'Te confirmamos precio, anticipo y tiempo de entrega.'],
  ['03', 'Lo traemos de Estados Unidos', 'Original y sellado. Te avisamos en cuanto llega.'],
];

export default function Encargos({ waNum, inicial, cliente, onEnviado, onIrCuenta, loginOn }) {
  const [d, setD] = useState({ perfume: inicial || '', detalles: '', nombre: '', telefono: '' });
  const [err, setErr] = useState({});
  const [enviado, setEnviado] = useState(null);

  useEffect(() => { if (inicial) setD((x) => ({ ...x, perfume: inicial })); }, [inicial]);
  useEffect(() => {
    let g = null;
    try { g = JSON.parse(localStorage.getItem('atelier-envio') || 'null'); } catch (e) {}
    setD((x) => ({
      ...x,
      nombre: x.nombre || (cliente && cliente.nombre) || (g && g.nombre) || '',
      telefono: x.telefono || (cliente && cliente.telefono) || (g && g.telefono) || '',
    }));
  }, [cliente]);

  const set = (k) => (e) => setD((x) => ({ ...x, [k]: e.target.value }));

  function enviar(e) {
    e.preventDefault();
    const er = {};
    if (!d.perfume.trim()) er.perfume = 'Escribe el perfume que buscas';
    if (!d.nombre.trim()) er.nombre = 'Escribe tu nombre';
    if (d.telefono.replace(/\D/g, '').length < 8) er.telefono = 'Escribe un número de 8 dígitos';
    setErr(er);
    if (Object.keys(er).length) return;
    const datos = { perfume: d.perfume.trim(), detalles: d.detalles.trim(), nombre: d.nombre.trim(), telefono: d.telefono.trim() };
    const texto = [
      `Hola, Atelier Parfums. Soy ${datos.nombre}. Quiero encargar este perfume:`,
      '',
      `• ${datos.perfume}`,
      datos.detalles ? `Detalles: ${datos.detalles}` : null,
      `Teléfono: ${datos.telefono}`,
      '',
      '¿Me pueden cotizar precio y tiempo de entrega? Gracias.',
    ].filter((l) => l !== null).join('\n');
    // WhatsApp se abre primero (en el mismo toque) para que el celular no lo bloquee.
    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(texto)}`, '_blank');
    fetch('/api/encargos', { method: 'POST', keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) })
      .then((r) => r.json()).then((j) => setEnviado(j.id || true)).catch(() => setEnviado(true));
    setEnviado(true);
    onEnviado && onEnviado(datos);
  }

  return (
    <main data-screen-label="Encargos" style={{ padding: 'clamp(24px,3.5vw,48px) clamp(20px,5.5vw,80px) clamp(64px,8vw,112px)', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', gap: 'clamp(32px,5vw,80px)', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 14, ...eyebrow }}>
            <span style={{ width: 32, height: 1, background: C.dorado }} />Encargos
          </span>
          <h1 style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 'clamp(40px,5vw,68px)', lineHeight: 1, color: C.tinto }}>
            ¿No lo encuentras? <em style={{ fontStyle: 'italic' }}>Lo traemos</em> por ti
          </h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: C.sec, maxWidth: '48ch' }}>
            Si el perfume que buscas no está en el catálogo, encárgalo aquí. Lo conseguimos original en Estados Unidos y te lo traemos a Honduras.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 8 }}>
            {PASOS.map(([n, t, p]) => (
              <div key={n} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 12, padding: '18px 0', borderTop: `1px solid ${C.borde}` }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 40, lineHeight: 0.9, color: C.doradoTxt }}>{n}</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: C.tinto }}>{t}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.6, color: C.sec }}>{p}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.blanco, border: `1px solid ${C.borde}`, padding: 'clamp(22px,3.5vw,40px)' }}>
          {enviado ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, padding: '36px 0' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.dorado} strokeWidth=".9"><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.6 2.5L16 9.5" /></svg>
              <p style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 300, color: C.tinto }}>Encargo <em>enviado</em></p>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: C.sec, maxWidth: '36ch' }}>
                {typeof enviado === 'string' ? `Tu número de encargo es ${enviado}. ` : ''}Te escribimos por WhatsApp con el precio y el tiempo de entrega.
              </p>
              <button type="button" onClick={() => { setEnviado(null); setD((x) => ({ ...x, perfume: '', detalles: '' })); }}
                style={{ minHeight: 44, padding: '0 24px', borderRadius: 999, border: `1px solid ${C.tinto}`, background: 'transparent', color: C.tinto, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', marginTop: 6 }} className="dcp1">
                Encargar otro perfume
              </button>
            </div>
          ) : (
            <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 18 }} noValidate>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 300, color: C.tinto }}>Haz tu <em>encargo</em></span>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={eyebrow}>Perfume que buscas <span style={{ color: C.dorado }}>*</span></span>
                <input value={d.perfume} onChange={set('perfume')} placeholder="Ej. Valentino Born in Roma Intense" style={input} maxLength={160} />
                {err.perfume ? <span style={{ fontSize: 12, color: C.tinto }}>{err.perfume}</span> : null}
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={eyebrow}>Detalles (opcional)</span>
                <textarea value={d.detalles} onChange={set('detalles')} rows={3} maxLength={400} placeholder="Tamaño (100 ml), EDP o EDT, presupuesto, para cuándo lo necesitas…"
                  style={{ ...input, height: 'auto', padding: '12px 16px', lineHeight: 1.5, resize: 'vertical' }} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,200px),1fr))', gap: 18 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={eyebrow}>Tu nombre <span style={{ color: C.dorado }}>*</span></span>
                  <input value={d.nombre} onChange={set('nombre')} autoComplete="name" style={input} maxLength={60} />
                  {err.nombre ? <span style={{ fontSize: 12, color: C.tinto }}>{err.nombre}</span> : null}
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={eyebrow}>WhatsApp <span style={{ color: C.dorado }}>*</span></span>
                  <input value={d.telefono} onChange={set('telefono')} type="tel" inputMode="tel" autoComplete="tel" placeholder="9999-9999" style={input} maxLength={20} />
                  {err.telefono ? <span style={{ fontSize: 12, color: C.tinto }}>{err.telefono}</span> : null}
                </label>
              </div>
              <button type="submit" className="dcp4" style={{ minHeight: 52, borderRadius: 999, border: `1px solid ${C.tinto}`, background: C.tinto, color: C.crema, fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'inherit', marginTop: 4 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" /><path d="M9.2 8.2c-.4.4-.6 1-.4 1.8.6 2.2 2.6 4.3 4.9 4.9.8.2 1.4 0 1.8-.4l.4-.6-1.8-1-.8.7c-1-.4-1.9-1.3-2.3-2.3l.7-.8-1-1.8z" /></svg>
                Enviar encargo por WhatsApp
              </button>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: C.sec }}>
                Encargar no te compromete a comprar: primero te enviamos la cotización.
                {loginOn && !cliente ? <> <button type="button" onClick={onIrCuenta} style={{ background: 'none', border: 'none', padding: 0, color: C.tinto, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit' }}>Inicia sesión</button> para ver el estado de tus encargos.</> : null}
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
