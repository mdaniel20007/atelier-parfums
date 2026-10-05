'use client';
// Panel "Mi cuenta" (lateral). Iniciar sesión es opcional: sirve para guardar datos de entrega
// y ver el estado de los pedidos y encargos.
import BotonGoogle from '@/components/BotonGoogle';
import { PAGOS } from '@/lib/zonas';

const C = { tinto: '#3D0000', crema: '#F5E6E0', blanco: '#FBF4F0', dorado: '#A97C50', doradoTxt: '#7A532E', sec: '#6E3A34', borde: '#E2CBC1' };
const eyebrow = { fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: C.doradoTxt };
const money = (n) => 'L ' + Math.round(n || 0).toLocaleString('en-US');
const ESTADO_COLOR = {
  'Por confirmar': [C.tinto, C.crema], Confirmado: [C.crema, C.tinto], Enviado: [C.crema, C.tinto], Entregado: [C.blanco, C.doradoTxt], Cancelado: [C.blanco, C.sec],
  Nuevo: [C.tinto, C.crema], Cotizado: [C.crema, C.tinto], 'Pedido al proveedor': [C.crema, C.tinto], 'Listo para entregar': [C.crema, C.tinto],
};

function Estado({ e }) {
  const [bg, fg] = ESTADO_COLOR[e] || [C.blanco, C.sec];
  return <span style={{ padding: '4px 10px', borderRadius: 999, background: bg, color: fg, border: `1px solid ${bg === C.blanco ? C.borde : bg}`, fontSize: 11, letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{e}</span>;
}

export default function Cuenta({ estado, productos, onCerrar, onSalir, onEncargos }) {
  const { cliente, pedidos = [], encargos = [] } = estado || {};
  const nombreDe = (pid) => { const p = (productos || []).find((x) => x.id === pid); return p ? p.nombre : 'Perfume'; };

  return (
    <div data-screen-label="Mi cuenta" style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onCerrar} style={{ position: 'absolute', inset: 0, background: 'rgba(61,0,0,.42)' }} />
      <aside style={{ position: 'relative', width: 'min(440px,100%)', height: '100%', background: C.blanco, display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 60px rgba(61,0,0,.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 14px 16px 24px', borderBottom: `1px solid ${C.borde}` }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 300, color: C.tinto }}>Mi <em>cuenta</em></span>
          <button onClick={onCerrar} aria-label="Cerrar" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: C.tinto, cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {!cliente ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, textAlign: 'center', alignItems: 'center', paddingTop: 32 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.dorado} strokeWidth=".9"><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" /></svg>
              <p style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: C.tinto }}>Entra con <em>Google</em></p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: C.sec, maxWidth: '34ch' }}>
                Es opcional. Con tu cuenta guardamos tus datos de entrega y puedes ver el estado de tus pedidos y encargos.
              </p>
              <div style={{ width: '100%', maxWidth: 320 }}><BotonGoogle /></div>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: C.sec, maxWidth: '36ch' }}>
                Solo usamos tu nombre y correo para identificar tus pedidos. Puedes comprar sin iniciar sesión.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {cliente.foto ? <img src={cliente.foto} alt="" width="52" height="52" referrerPolicy="no-referrer" style={{ borderRadius: 999, border: `1px solid ${C.borde}` }} />
                  : <span style={{ width: 52, height: 52, borderRadius: 999, background: C.crema, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 24 }}>{(cliente.nombre || '?')[0]}</span>}
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: C.tinto }}>{cliente.nombre || 'Cliente'}</span>
                  <span style={{ fontSize: 13, color: C.sec, overflow: 'hidden', textOverflow: 'ellipsis' }}>{cliente.email}</span>
                </span>
              </div>

              <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={eyebrow}>Mis pedidos</span>
                {!pedidos.length ? <p style={{ margin: 0, fontSize: 14, color: C.sec }}>Todavía no has hecho pedidos con tu cuenta.</p> : null}
                {pedidos.map((o) => (
                  <article key={o.id} style={{ border: `1px solid ${C.borde}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22 }}>{o.id}</span>
                      <Estado e={o.estado} />
                    </div>
                    <span style={{ fontSize: 12.5, color: C.sec }}>{o.fecha}{o.zona ? ` · ${o.zona}` : ''}{o.pago ? ` · ${PAGOS[o.pago] || ''}` : ''}</span>
                    <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>{(o.items || []).map((it) => `${it.n} × ${nombreDe(it.pid)}`).join(', ')}</span>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{money(o.total)}</span>
                  </article>
                ))}
              </section>

              <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={eyebrow}>Mis encargos</span>
                {!encargos.length ? (
                  <p style={{ margin: 0, fontSize: 14, color: C.sec }}>
                    ¿Buscas un perfume que no está en el catálogo?{' '}
                    <button type="button" onClick={onEncargos} style={{ background: 'none', border: 'none', padding: 0, color: C.tinto, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>Encárgalo aquí</button>.
                  </p>
                ) : null}
                {encargos.map((e) => (
                  <article key={e.id} style={{ border: `1px solid ${C.borde}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22 }}>{e.id}</span>
                      <Estado e={e.estado} />
                    </div>
                    <span style={{ fontSize: 14 }}>{e.perfume}</span>
                    <span style={{ fontSize: 12.5, color: C.sec }}>{e.fecha}</span>
                  </article>
                ))}
              </section>
            </div>
          )}
        </div>

        {cliente ? (
          <div style={{ padding: '14px 24px 20px', borderTop: `1px solid ${C.borde}` }}>
            <button type="button" onClick={onSalir} className="dcp1" style={{ width: '100%', minHeight: 46, borderRadius: 999, border: `1px solid ${C.tinto}`, background: 'transparent', color: C.tinto, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
