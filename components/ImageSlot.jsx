'use client';
// Espacio de foto. Reemplaza el <image-slot> del prototipo.
// - Muestra la foto guardada para su id (o el src que se le pase) cubriendo su contenedor.
// - Sin foto, muestra el marcador del diseño.
// - Con `editable` (solo en el administrador), permite subir o quitar la foto.
import React from 'react';

const MAX_LADO = 1600;

async function reducir(file) {
  // Reduce la foto en el navegador (máx. 1600 px, WebP o JPEG) para que la subida sea rápida.
  if (!/^image\/(jpeg|png|webp|avif|heic|heif)$/.test(file.type) && !file.type.startsWith('image/')) throw new Error('El archivo no es una imagen');
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) {
    if (file.size <= 4 * 1024 * 1024 && /^image\/(jpeg|png|webp|avif)$/.test(file.type)) return file;
    throw new Error('No se pudo leer la imagen. Usa JPG, PNG o WebP.');
  }
  const k = Math.min(1, MAX_LADO / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close && bmp.close();
  const blob = (await new Promise((r) => c.toBlob(r, 'image/webp', 0.85))) || (await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.85)));
  if (!blob) throw new Error('No se pudo procesar la imagen');
  return new File([blob], 'foto.' + (blob.type === 'image/webp' ? 'webp' : 'jpg'), { type: blob.type });
}

export default class ImageSlot extends React.Component {
  state = { subiendo: false, error: '', drag: false };
  input = React.createRef();

  async subir(file) {
    if (!file) return;
    const D = window.AtelierDatos;
    this.setState({ subiendo: true, error: '' });
    try {
      const f = await reducir(file);
      const fd = new FormData();
      fd.append('slot', this.props.id);
      fd.append('file', f);
      const r = await fetch('/api/fotos', { method: 'POST', body: fd, credentials: 'same-origin' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'No se pudo subir la foto');
      D.setFoto(this.props.id, j.url);
    } catch (e) {
      this.setState({ error: e.message });
    } finally {
      this.setState({ subiendo: false });
    }
  }

  async quitar(e) {
    e.stopPropagation();
    const r = await fetch('/api/fotos?slot=' + encodeURIComponent(this.props.id), { method: 'DELETE', credentials: 'same-origin' });
    if (r.ok) window.AtelierDatos.setFoto(this.props.id, null);
  }

  render() {
    const { id, src, placeholder, editable } = this.props;
    const D = typeof window !== 'undefined' ? window.AtelierDatos : null;
    const url = src || (D && id && D.foto(id) ? D.foto(id).src : '');
    const { subiendo, error, drag } = this.state;
    const wrap = { position: 'absolute', inset: 0, overflow: 'hidden' };
    const editProps = editable ? {
      role: 'button', tabIndex: 0, 'aria-label': url ? 'Cambiar foto' : 'Subir foto',
      onClick: () => this.input.current && this.input.current.click(),
      onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.input.current.click(); } },
      onDragOver: (e) => { e.preventDefault(); this.setState({ drag: true }); },
      onDragLeave: () => this.setState({ drag: false }),
      onDrop: (e) => { e.preventDefault(); this.setState({ drag: false }); this.subir(e.dataTransfer.files[0]); },
      style: { ...wrap, cursor: 'pointer', outline: drag ? '2px solid #3D0000' : 'none', outlineOffset: -2 },
    } : { style: wrap };

    return (
      <div {...editProps}>
        {url ? (
          <img src={url} alt={placeholder && placeholder.trim() ? placeholder.replace(/^\[[^\]]*\]\s*/, '') : ''} loading="lazy" decoding="async"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, textAlign: 'center', color: 'inherit' }}>
            {/* En la tienda solo se muestra el nombre (sin marcadores tipo "[FOTO EDITORIAL]"); en el administrador, el marcador completo. */}
            {(editable ? placeholder && placeholder.trim() : /^\[FOTO\]\s*\S/.test(placeholder || '')) ? (
              <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', lineHeight: 1.5, opacity: 0.75, maxWidth: '90%' }}>{editable ? placeholder : placeholder.replace(/^\[FOTO\]\s*/, '')}</span>
            ) : null}
            {editable ? <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, opacity: 0.75, textDecoration: 'underline', textUnderlineOffset: 3 }}>Toca para subir</span> : null}
          </div>
        )}
        {editable ? (
          <>
            <input ref={this.input} type="file" accept="image/*" hidden onChange={(e) => { this.subir(e.target.files[0]); e.target.value = ''; }} />
            {subiendo ? <div style={{ position: 'absolute', inset: 0, background: 'rgba(251,244,240,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: '#3D0000' }}>Subiendo…</div> : null}
            {url && !subiendo ? (
              <button type="button" onClick={(e) => this.quitar(e)} aria-label="Quitar foto"
                style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 999, border: '1px solid #E2CBC1', background: '#FBF4F0', color: '#3D0000', fontSize: 15, lineHeight: 1, cursor: 'pointer' }}>×</button>
            ) : null}
            {error ? <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '6px 8px', background: '#3D0000', color: '#F5E6E0', fontSize: 11, lineHeight: 1.35 }}>{error}</div> : null}
          </>
        ) : null}
      </div>
    );
  }
}
