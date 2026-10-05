// Pantalla de carga con el logo (mientras arranca la tienda en el navegador).
export default function Splash({ texto }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#FBF4F0', color: '#3D0000' }}>
      <span style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 30, letterSpacing: '.14em', paddingLeft: '.14em', lineHeight: 1 }}>ATELIER</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 16, height: 1, background: '#A97C50' }} />
        <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 300, fontSize: 10, letterSpacing: '.55em', paddingLeft: '.55em' }}>PARFUMS</span>
        <span style={{ width: 16, height: 1, background: '#A97C50' }} />
      </span>
      {texto ? <span style={{ marginTop: 18, fontFamily: 'Jost, sans-serif', fontSize: 13, color: '#6E3A34' }}>{texto}</span> : null}
    </div>
  );
}
