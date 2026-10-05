'use client';
// Generado desde Tienda.dc.html con tools/convert-dc.mjs y luego ajustado a mano.
import React, { Fragment } from 'react';
import { DCLogic, arr } from '@/lib/dc';
import ImageSlot from '@/components/ImageSlot';
import TarjetaProducto from '@/components/TarjetaProducto';

export default class Tienda extends DCLogic {
  FAMS = [
    { k: 'frescos', n: 'Frescos y cítricos' },
    { k: 'florales', n: 'Florales' },
    { k: 'dulces', n: 'Dulces y avainillados' },
    { k: 'amaderados', n: 'Amaderados' },
    { k: 'orientales', n: 'Orientales y especiados' },
    { k: 'acuaticos', n: 'Acuáticos' }
  ];
  RANGOS = [
    { k: 'r1', n: 'Menos de L 1,000', top: 'Menos de', big: 'L 1,000', min: 0, max: 1000 },
    { k: 'r2', n: 'L 1,000–2,000', top: 'Entre', big: 'L 1,000–2,000', min: 1000, max: 2000 },
    { k: 'r3', n: 'L 2,000–3,000', top: 'Entre', big: 'L 2,000–3,000', min: 2000, max: 3000 },
    { k: 'r4', n: 'L 3,000–4,000', top: 'Entre', big: 'L 3,000–4,000', min: 3000, max: 4000.01 },
    { k: 'r5', n: 'Más de L 4,000', top: 'Más de', big: 'L 4,000', min: 4000.01, max: 1e9 }
  ];
  CATS = ['Hombre', 'Mujer', 'Árabes', 'De diseñador', 'Descuento'];
  CAT_SUB = { 'Hombre': 'Frescos, amaderados e intensos', 'Mujer': 'Florales, dulces y luminosos', 'Árabes': 'Intensos, dulces y de gran duración', 'De diseñador': 'Las casas más reconocidas del mundo', 'Descuento': 'Originales a precio especial' };
  // Preguntas frecuentes: las respuestas con datos del negocio salen de Ajustes (administrador).
  faqList(aj) {
    const t = (v, alt) => (v && String(v).trim()) || alt;
    const punto = (x) => /[.!?]$/.test(x) ? x : x + '.';
    return [
      { q: '¿Los perfumes son originales?', a: 'Sí. Todos nuestros perfumes son 100% originales, traídos de Estados Unidos en su empaque original.' + (t(aj.garantia, '') ? ' ' + punto(t(aj.garantia, '')) : '') },
      { q: '¿Cómo hago mi pedido?', a: 'Elige tus perfumes, toca “Agregar al pedido” y, desde Mi pedido, envíanos todo por WhatsApp en un solo mensaje. También puedes pedir un perfume directamente con “Pedir por WhatsApp”. Te confirmamos disponibilidad, total y envío.' },
      { q: '¿Qué métodos de pago aceptan?', a: punto(t(aj.pagos, 'Escríbenos por WhatsApp y te compartimos las formas de pago disponibles')) },
      { q: '¿Hacen envíos fuera de Tegucigalpa?', a: punto(t(aj.envios, 'Sí, hacemos envíos')) + ' Te confirmamos el costo exacto por WhatsApp antes de enviar.' },
      { q: '¿Cuánto dura un descuento?', a: 'Los precios con descuento aplican mientras haya existencias.' + (t(aj.ofertas, '') ? ' ' + punto(t(aj.ofertas, '')) : '') },
      { q: '¿Qué diferencia hay entre EDP, EDT y Parfum?', a: 'Es la concentración de esencia. El Parfum es el más concentrado y duradero; el Eau de Parfum (EDP) tiene buena intensidad y duración; el Eau de Toilette (EDT) es más ligero y fresco.' },
      { q: '¿Puedo cambiar un perfume?', a: punto(t(aj.cambios, 'Escríbenos por WhatsApp y revisamos tu caso')) }
    ];
  }
  emptyF() { return { cat: [], fam: [], marca: [], conc: [], rango: [] }; }
  emptyRf() { return { open: false, sent: false, pid: '', nombre: '', estrellas: 5, titulo: '', texto: '', error: '' }; }
  state = { w: typeof window !== 'undefined' ? window.innerWidth : 1280, db: null, page: 'inicio', pid: null, cart: [], cliente: '', drawer: false, filtersOpen: false, searchOpen: false, hq: '', q: '', sort: 'destacados', f: this.emptyF(), faq: 0, gal: 0, toast: null, toastPedido: true, showMsg: false, rf: this.emptyRf(), showTab: 'pedidos' };

  componentDidMount() {
    this._r = () => this.setState({ w: window.innerWidth });
    window.addEventListener('resize', this._r);
    this.setupShow();
    const init = () => {
      if (window.AtelierDatos) {
        this.setState({ db: window.AtelierDatos.load() });
        this._u = window.AtelierDatos.subscribe(db => this.setState({ db }));
        // "Mi pedido" se guarda en el teléfono: si la página se recarga (p. ej. al volver de Instagram), no se pierde.
        try {
          const g = JSON.parse(localStorage.getItem('atelier-pedido') || 'null');
          const ids = new Set((window.AtelierDatos.load().productos || []).map(p => p.id));
          if (g && Array.isArray(g.cart)) this.setState({ cart: g.cart.filter(x => x && ids.has(x.id) && x.n > 0).map(x => ({ id: x.id, n: Math.min(50, Math.round(x.n)) })), cliente: typeof g.cliente === 'string' ? g.cliente.slice(0, 60) : '' });
        } catch (e) {}
        this.readHash();
        this._pop = () => {
          if (location.hash) this.readHash();
          else this.setState({ page: 'inicio', pid: null, drawer: false, filtersOpen: false, searchOpen: false, rf: this.emptyRf() });
          this.scrollTop();
        };
        window.addEventListener('popstate', this._pop);
        this._err = e => this.showToast(e.detail, false);
        window.addEventListener('atelier-error', this._err);
        try { if (!sessionStorage.getItem('atelier-visita')) { sessionStorage.setItem('atelier-visita', '1'); this.T('visita'); } } catch (e) {}
      } else this._i = setTimeout(init, 40);
    };
    init();
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this._r); clearTimeout(this._t); clearTimeout(this._i); if (this._u) this._u();
    window.removeEventListener('scroll', this._onScroll); window.removeEventListener('mousemove', this._onMove); window.removeEventListener('resize', this._onScroll);
    if (this._raf) cancelAnimationFrame(this._raf); window.removeEventListener('atelier-error', this._err); window.removeEventListener('popstate', this._pop);
  }
  componentDidUpdate(_pp, ps) {
    if (this._onScroll) this._onScroll();
    if (ps.cart !== this.state.cart || ps.cliente !== this.state.cliente) {
      try { localStorage.setItem('atelier-pedido', JSON.stringify({ cart: this.state.cart, cliente: this.state.cliente })); } catch (e) {}
    }
  }
  // Efecto Dock general: cada módulo [data-dock] se fija mientras el scroll vertical lo desplaza
  // hacia el lado; el panel en foco (o bajo el cursor) crece y empuja a sus vecinos.
  setupShow() {
    const tick = () => {
      let done = true;
      document.querySelectorAll('[data-dock]').forEach(el => { if (!this.layoutDock(el)) done = false; });
      this._raf = done ? null : requestAnimationFrame(tick);
    };
    this._onScroll = () => { if (!this._raf) this._raf = requestAnimationFrame(tick); };
    this._onMove = e => {
      document.querySelectorAll('[data-dock]').forEach(el => {
        const st = el._dk || (el._dk = {});
        const t = el.querySelector('[data-track]');
        if (!t || window.innerWidth < 700) { st.px = null; return; }
        const r = t.getBoundingClientRect();
        st.px = e.clientY >= r.top && e.clientY <= r.bottom && e.clientX >= r.left && e.clientX <= r.right ? e.clientX - r.left : null;
      });
      this._onScroll();
    };
    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', this._onScroll);
    window.addEventListener('mousemove', this._onMove, { passive: true });
    this._onScroll();
  }
  layoutDock(el) {
    const st = el._dk || (el._dk = {});
    const stage = el.querySelector('[data-stage]'), track = el.querySelector('[data-track]');
    if (!stage || !track) return true;
    const panels = Array.from(track.querySelectorAll('[data-panel]'));
    const n = panels.length;
    if (!n) return true;
    const hdr = document.querySelector('header');
    const hh = hdr ? hdr.offsetHeight : 0;
    const vh = window.innerHeight, avail = vh - hh;
    const W = track.clientWidth;
    const mob = W < 700;
    const rev = el.dataset.dock === 'resenas';
    const chrome = stage.offsetHeight - track.offsetHeight;
    const maxTH = rev ? (mob ? 380 : 400) : (mob ? 500 : 580);
    const TH = Math.round(Math.max(rev ? 340 : 300, Math.min(maxTH, avail - chrome - 12)));
    if (Math.abs(track.offsetHeight - TH) > 1) track.style.height = TH + 'px';
    const Hm = chrome + TH;
    const top = hh + Math.max(0, (avail - Hm) / 2);
    stage.style.top = top + 'px';
    const pad = mob ? 20 : Math.max(20, Math.min(80, W * 0.055));
    const Wb = rev ? (mob ? Math.min(W * 0.74, 300) : Math.max(260, Math.min(330, W * 0.22))) : (mob ? Math.min(W * 0.6, 250) : Math.max(210, Math.min(285, W * 0.18)));
    const Hb = TH * (rev ? 0.88 : 0.8);
    const dist = Math.max(0, n * Wb + 2 * pad - W);
    el.style.height = (Hm + dist) + 'px';
    const r = el.getBoundingClientRect();
    const p = dist > 1 ? Math.min(1, Math.max(0, (top - r.top) / dist)) : Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const A = reduce ? 0 : ({ Suave: 0.3, Media: 0.55, Fuerte: 0.85 }[this.props.magnificacion] ?? 0.55) * (mob ? 0.5 : 1) * (rev ? 0.6 : 1);
    const L = (a, b, k) => a + (b - a) * k;
    const tOff = dist > 1 ? p * dist : 0;
    st.off = st.off == null ? tOff : L(st.off, tOff, 0.18);
    st.amp = st.amp == null ? 0 : L(st.amp, A, 0.12);
    const pp = dist > 1 ? st.off / dist : p;
    const base0 = dist > 1 ? pad : (W - n * Wb) / 2;
    const tFx = st.px != null ? st.px + st.off : base0 + Wb / 2 + pp * (n - 1) * Wb;
    st.fx = st.fx == null ? tFx : L(st.fx, tFx, 0.2);
    const sigma = Wb * 1.05;
    const ws = [], hs = [];
    let extra = 0;
    for (let i = 0; i < n; i++) {
      const d = (base0 + i * Wb + Wb / 2 - st.fx) / sigma;
      const g = Math.exp(-d * d);
      ws[i] = Wb * (1 + st.amp * g);
      hs[i] = Math.min(TH, Hb * (1 + st.amp * 0.42 * g));
      extra += ws[i] - Wb;
    }
    let x = dist > 1 ? pad - st.off - pp * extra : (W - (n * Wb + extra)) / 2;
    panels.forEach((pn, i) => {
      pn.style.width = ws[i] + 'px';
      pn.style.height = hs[i] + 'px';
      pn.style.transform = 'translate3d(' + x + 'px,0,0)';
      x += ws[i];
    });
    const bar = el.querySelector('[data-progress]');
    if (bar) bar.style.width = (pp * 100) + '%';
    return Math.abs(st.off - tOff) < 0.3 && Math.abs(st.fx - tFx) < 0.3 && Math.abs(st.amp - A) < 0.002;
  }
  readHash() {
    const parts = decodeURIComponent(location.hash.slice(1)).split('&').filter(Boolean);
    if (!parts.length) return;
    const s = { f: this.emptyF() };
    parts.forEach(x => {
      const [k, v] = x.split('=');
      if (k === 'catalogo') s.page = 'catalogo';
      if (k === 'producto' && v) { s.page = 'producto'; s.pid = v; }
      if (k === 'cat' && v) { s.page = 'catalogo'; s.f.cat = [v]; }
      if (k === 'filtros') s.filtersOpen = true;
      if (k === 'resena') s.rf = { ...this.emptyRf(), open: true, pid: s.pid || '' };
      if (k === 'pedido') s.drawer = true;
    });
    this.setState(s);
  }
  get P() { return (this.state.db && this.state.db.productos) || []; }
  get R() { return ((this.state.db && this.state.db.resenas) || []).filter(r => r.estado === 'publicada'); }
  get AJ() { return (this.state.db && this.state.db.ajustes) || {}; }
  byId(id) { return this.P.find(p => p.id === id); }
  pf(p) { return window.AtelierDatos ? window.AtelierDatos.precioFinal(p) : p.precio; }
  money(n) { return 'L ' + Math.round(n).toLocaleString('en-US'); }
  fmt(n) { return this.props.precios === 'Marcadores' ? 'L [PRECIO]' : this.money(n); }
  fmtTotal(n) { return this.props.precios === 'Marcadores' ? 'L [TOTAL]' : this.money(n); }
  meta(p) { return `${p.conc} · ${p.ml} ml · ${p.genero}`; }
  waNum() { return String(this.AJ.wa || '').replace(/\D/g, ''); }
  wa(text) { window.open(`https://wa.me/${this.waNum()}?text=${encodeURIComponent(text)}`, '_blank'); }
  stars(n) { const r = Math.round(n); return '★'.repeat(r) + '☆'.repeat(5 - r); }
  dateKey(d) { const [dd, mm, yy] = String(d).split(' ')[0].split('/'); return `${yy}${mm}${dd}`; }
  scrollTop() { try { window.scrollTo(0, 0); } catch (e) {} }
  saveDb(fn) {
    const db = JSON.parse(JSON.stringify(this.state.db));
    fn(db);
    this.setState({ db });
    if (window.AtelierDatos) window.AtelierDatos.save(db);
  }

  go(page, extra) {
    this.setState({ page, drawer: false, filtersOpen: false, searchOpen: false, ...extra });
    this.scrollTop();
    const h = page === 'producto' ? `#producto=${extra.pid}` : page === 'catalogo' ? '#catalogo' : '';
    // Cada página nueva queda en el historial: el botón "atrás" del celular vuelve dentro de la tienda.
    try {
      const url = h || location.pathname + location.search;
      if ((location.hash || '') !== h) history.pushState(null, '', url); else history.replaceState(null, '', url);
    } catch (e) {}
  }
  goCatalog(partial) { this.go('catalogo', { f: { ...this.emptyF(), ...(partial || {}) }, q: (partial && partial.q) || '', sort: 'destacados' }); }
  T(tipo, data) { if (window.AtelierDatos && window.AtelierDatos.track) window.AtelierDatos.track(tipo, data); }
  openProduct(id) { this.T('vista', { pid: id }); this.go('producto', { pid: id, gal: 0 }); }
  showToast(msg, pedido) {
    this.setState({ toast: msg, toastPedido: pedido !== false });
    clearTimeout(this._t);
    this._t = setTimeout(() => this.setState({ toast: null }), 3400);
  }
  add(id) {
    const p = this.byId(id);
    this.setState(s => {
      const ex = s.cart.find(c => c.id === id);
      return { cart: ex ? s.cart.map(c => c.id === id ? { ...c, n: c.n + 1 } : c) : [...s.cart, { id, n: 1 }] };
    });
    this.showToast(`${p.nombre} se agregó a tu pedido`);
  }
  setQty(id, d) { this.setState(s => ({ cart: s.cart.map(c => c.id === id ? { ...c, n: c.n + d } : c).filter(c => c.n > 0) })); }

  ratingMap() {
    const m = {};
    this.R.forEach(r => { if (!r.pid) return; (m[r.pid] = m[r.pid] || []).push(r.estrellas); });
    return m;
  }
  vm(p, rm) {
    const agotado = p.estado === 'agotado';
    const st = agotado ? ['Agotado', '#E2CBC1', '#3D0000', '#E2CBC1']
      : p.nuevo ? ['Nuevo', '#3D0000', '#F5E6E0', '#3D0000']
      : p.estado === 'pocas' ? ['Pocas unidades', '#FBF4F0', '#7A532E', '#A97C50']
      : ['Disponible', '#F5E6E0', '#3D0000', '#E2CBC1'];
    const rs = (rm || {})[p.id] || [];
    const avg = rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : 0;
    const final = this.pf(p);
    const hasDescuento = (p.descuento || 0) > 0;
    return {
      ...p, meta: this.meta(p), precioTxt: this.fmt(final), precioAntes: this.fmt(p.precio),
      hasDescuento, descTxt: `−${p.descuento}%`,
      hasRating: rs.length > 0, stars: this.stars(avg), ratingCount: `(${rs.length})`, avgTxt: avg.toFixed(1), ratingN: rs.length,
      famLabel: ((this.FAMS.find(x => x.k === p.fam) || {}).n || ''), available: !agotado,
      foto1: (window.AtelierDatos && window.AtelierDatos.foto && window.AtelierDatos.foto('foto-' + p.id + '-1')) || { src: '', credit: '', href: '' },
      tagLabel: st[0], tagBg: st[1], tagColor: st[2], tagBorder: st[3], agotado,
      filt: agotado ? 'grayscale(1)' : 'none',
      onOrder: () => this.T('whatsapp', { pid: p.id }) || this.wa(`Hola, Atelier Parfums. Me interesa ${p.nombre} de ${p.marca} (${p.conc} · ${p.ml} ml) – ${this.fmt(final)}. ¿Está disponible?`),
      onAdd: () => { this.T('agregar', { pid: p.id }); this.add(p.id); },
      onOpen: () => { this.T('clic', { pid: p.id }); this.openProduct(p.id); },
      onNotify: () => this.T('aviso', { pid: p.id }) || this.wa(`Hola, Atelier Parfums. Me gustaría que me avisen cuando llegue ${p.nombre} de ${p.marca} (${p.conc} · ${p.ml} ml).`)
    };
  }
  matchCat(p, c) {
    if (c === 'Hombre') return p.genero === 'Hombre' || p.genero === 'Unisex';
    if (c === 'Mujer') return p.genero === 'Mujer' || p.genero === 'Unisex';
    if (c === 'Descuento') return (p.descuento || 0) > 0;
    return p.linea === c;
  }
  filtered() {
    const { f, q, sort } = this.state;
    const qq = q.trim().toLowerCase();
    let r = this.P.filter(p =>
      (!f.cat.length || f.cat.some(c => this.matchCat(p, c))) &&
      (!f.fam.length || f.fam.includes(p.fam)) &&
      (!f.marca.length || f.marca.includes(p.marca)) &&
      (!f.conc.length || f.conc.includes(p.conc)) &&
      (!f.rango.length || f.rango.some(k => { const g = this.RANGOS.find(x => x.k === k); const v = this.pf(p); return v >= g.min && v < g.max; })) &&
      (!qq || [p.nombre, p.marca, p.s, p.c, p.f].join(' ').toLowerCase().includes(qq))
    );
    if (sort === 'asc') r = [...r].sort((a, b) => this.pf(a) - this.pf(b));
    else if (sort === 'desc') r = [...r].sort((a, b) => this.pf(b) - this.pf(a));
    else r = [...r].sort((a, b) => (a.estado === 'agotado') - (b.estado === 'agotado'));
    return r;
  }
  toggleF(key, val) { this.setState(s => { const cur = s.f[key]; return { f: { ...s.f, [key]: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val] } }; }); }
  marcas() { return [...new Set(this.P.map(p => p.marca))]; }
  reviewVm(r) {
    const p = r.pid ? this.byId(r.pid) : null;
    return { titulo: r.titulo || '', texto: r.texto, nombre: r.nombre, fecha: r.fecha, stars: this.stars(r.estrellas), hasProd: !!p, noProd: !p, prodName: p ? `${p.marca} · ${p.nombre}` : '', open: () => p && this.openProduct(p.id) };
  }
  setRf(patch) { this.setState(s => ({ rf: { ...s.rf, ...patch } })); }
  submitReview() {
    const rf = this.state.rf;
    if (!rf.nombre.trim() || !rf.texto.trim()) { this.setRf({ error: 'Escribe tu nombre y tu reseña para enviarla.' }); return; }
    this.saveDb(db => {
      db.resenas.unshift({ id: 'r' + Date.now(), pid: rf.pid || null, nombre: rf.nombre.trim(), estrellas: rf.estrellas, titulo: rf.titulo.trim(), texto: rf.texto.trim(), fecha: window.AtelierDatos.hoy(), estado: 'pendiente' });
    });
    this.setRf({ sent: true, error: '' });
  }

  renderVals() {
    const s = this.state;
    const mobile = s.w < 860;
    const f = s.f;
    const rm = this.ratingMap();
    const V = p => this.vm(p, rm);
    const list = this.filtered();
    const aj = this.AJ;

    const label = (key, v) => key === 'fam' ? this.FAMS.find(x => x.k === v).n : key === 'rango' ? this.RANGOS.find(x => x.k === v).n : v;
    const opt = (key, val, lab) => {
      const checked = f[key].includes(val);
      return { label: lab, checked, boxBg: checked ? '#3D0000' : 'transparent', boxBorder: checked ? '#3D0000' : '#A97C50', toggle: () => this.toggleF(key, val) };
    };
    const groups = [
      { title: 'Categoría', options: this.CATS.map(c => opt('cat', c, c)) },
      { title: 'Familia olfativa', options: this.FAMS.map(x => opt('fam', x.k, x.n)) },
      { title: 'Marca', options: [...this.marcas()].sort().map(m => opt('marca', m, m)) },
      { title: 'Concentración', options: ['EDP', 'EDT', 'Parfum'].map(c => opt('conc', c, c)) },
      { title: 'Rango de precio', options: this.RANGOS.map(r => opt('rango', r.k, r.n)) }
    ];
    const chips = [];
    Object.keys(f).forEach(k => f[k].forEach(v => chips.push({ label: label(k, v), remove: () => this.toggleF(k, v) })));
    const nActive = chips.length;
    let catTitle = 'Catálogo';
    if (nActive === 1) { const k = Object.keys(f).find(k => f[k].length); catTitle = label(k, f[k][0]); }
    if (s.q.trim() && !nActive) catTitle = `“${s.q.trim()}”`;
    const plural = n => n === 1 ? '1 perfume' : `${n} perfumes`;

    const p0 = (s.page === 'producto' && this.byId(s.pid)) || this.P[0] || { id: 'x', marca: '', nombre: '', conc: '', ml: '', genero: '', precio: 0, s: '', c: '', f: '', temp: [], mom: [], dur: 1, est: 1, estado: 'disponible' };
    const prod = V(p0);
    const angles = ['[FOTO 1] Frasco', '[FOTO 2] Caja', '[FOTO 3] Detalle', '[FOTO 4] Ambiente'];
    const mains = angles.map((n, i) => ({ id: `foto-${p0.id}-${i + 1}`, ph: `${n} · ${p0.nombre}`, op: s.gal === i ? 1 : 0, pe: s.gal === i ? 'auto' : 'none' }));
    const thumbs = angles.map((n, i) => ({ id: `foto-${p0.id}-${i + 1}`, n: String(i + 1), aria: `Ver foto ${i + 1}`, border: s.gal === i ? '#3D0000' : 'transparent', select: () => this.setState({ gal: i }) }));
    const tiers = [
      { n: 'Salida', sub: 'Lo primero que percibes', notes: p0.s, line: '#E2CBC1' },
      { n: 'Corazón', sub: 'El alma del perfume', notes: p0.c, line: '#E2CBC1' },
      { n: 'Fondo', sub: 'Lo que permanece en la piel', notes: p0.f, line: 'transparent' }
    ];
    const chip = on => ({ border: on ? '#3D0000' : '#E2CBC1', bg: on ? '#3D0000' : 'transparent', color: on ? '#F5E6E0' : '#6E3A34' });
    const seasons = ['Primavera', 'Verano', 'Otoño', 'Invierno'].map(x => ({ label: x, ...chip((p0.temp || []).includes(x)) }));
    const moments = ['Día', 'Noche'].map(x => ({ label: x, ...chip((p0.mom || []).includes(x)) }));
    const segs = n => [1, 2, 3, 4, 5].map(i => ({ bg: i <= n ? '#3D0000' : '#E2CBC1' }));
    const meters = [
      { n: 'Duración', word: ['Suave', 'Moderada', 'Buena', 'Larga', 'Muy larga'][(p0.dur || 1) - 1], segs: segs(p0.dur) },
      { n: 'Estela', word: ['Íntima', 'Suave', 'Moderada', 'Notable', 'Intensa'][(p0.est || 1) - 1], segs: segs(p0.est) }
    ];
    const related = this.P.filter(p => p.id !== p0.id && (p.fam === p0.fam || p.genero === p0.genero)).slice(0, 4).map(V);
    const byDate = (a, b) => this.dateKey(b.fecha).localeCompare(this.dateKey(a.fecha));
    const prodReviews = this.R.filter(r => r.pid === p0.id).sort(byDate).map(r => this.reviewVm(r));

    const allR = this.R;
    const avgAll = allR.length ? allR.reduce((a, r) => a + r.estrellas, 0) / allR.length : 0;

    const cartRows = s.cart.map(c => ({ c, p: this.byId(c.id) })).filter(x => x.p);
    const count = cartRows.reduce((a, x) => a + x.c.n, 0);
    const total = cartRows.reduce((a, x) => a + x.c.n * this.pf(x.p), 0);
    const nombre = s.cliente.trim();
    const msgText = `Hola, Atelier Parfums.${nombre ? ` Soy ${nombre}.` : ''} Quiero hacer este pedido:\n\n${cartRows.map(x => `• ${x.c.n} × ${x.p.nombre} — ${x.p.marca} (${x.p.conc} · ${x.p.ml} ml) — ${this.fmt(this.pf(x.p) * x.c.n)}`).join('\n')}\n\nTotal estimado: ${this.fmtTotal(total)}\n\n¿Me confirman disponibilidad, forma de pago y envío? Gracias.`;

    const rf = s.rf;
    const wn = this.waNum();
    const waTxt = wn ? (wn.length === 11 && wn.startsWith('504') ? `+504 ${wn.slice(3, 7)}-${wn.slice(7)}` : '+' + wn) : '';
    const isCat = s.page === 'catalogo';
    const F = id => (window.AtelierDatos && window.AtelierDatos.foto && window.AtelierDatos.foto(id)) || { src: '', credit: '', href: '' };
    const X = arr => arr.map((x, i) => ({ ...x, x0: (i * 260) + 'px' }));
    const catSlot = c => 'categoria-' + c.toLowerCase().replace(/[^a-z]/g, '');
    return {
      mobile, desktop: !mobile,
      heroFoto: F('hero-editorial'),
      dockCats: X(this.CATS.map(c => { const k = this.P.filter(p => this.matchCat(p, c)).length; return { n: c, sub: this.CAT_SUB[c], slot: catSlot(c), ph: '[FOTO] ' + c, foto: F(catSlot(c)), count: k === 1 ? '1 perfume' : k + ' perfumes', go: () => { this.T('categoria', { cat: c }); this.goCatalog({ cat: [c] }); } }; })),
      dockNuevos: X(this.P.filter(p => p.nuevo && p.estado !== 'agotado').map(V)),
      dockOfertas: X(this.P.filter(p => p.descuento > 0).sort((a, b) => b.descuento - a.descuento).map(V)),
      dockArabes: X(this.P.filter(p => p.linea === 'Árabes').map(V)),
      hasDockNuevos: this.P.some(p => p.nuevo && p.estado !== 'agotado'), hasDockOfertas: this.P.some(p => p.descuento > 0), hasDockArabes: this.P.some(p => p.linea === 'Árabes'),
      dockResenas: X([...allR].sort(byDate).slice(0, 8).map(r => this.reviewVm(r))),
      txtFlex: mobile ? 'none' : '0 1 540px',
      famCols: s.w >= 1100 ? 6 : s.w >= 560 ? 3 : 2,
      heroInset: s.w < 1200 ? 'auto' : '0 0 0 42%',
      heroPos: s.w < 1200 ? 'relative' : 'absolute',
      heroImgW: s.w < 1200 ? '100%' : 'auto',
      heroAR: s.w < 1200 ? (s.w < 600 ? '4 / 5' : '16 / 10') : 'auto',
      heroDir: s.w < 1200 ? 'column' : 'row',
      heroAlign: s.w < 1200 ? 'stretch' : 'flex-end',
      heroMinH: s.w < 1200 ? '0' : 'clamp(560px,82vh,780px)',
      heroScrimDisp: s.w < 1200 ? 'none' : 'block',
      heroScrim: s.w < 1200 ? 'none' : 'linear-gradient(90deg, rgba(61,0,0,.35) 0%, rgba(61,0,0,0) 18%)',
      anuncio: aj.anuncio || 'Perfumes 100% originales · Pide por WhatsApp',
      aj: { direccion: aj.direccion || 'Tegucigalpa, Honduras', horario: aj.horario || 'Escríbenos por WhatsApp', instagram: aj.instagram || 'Instagram', facebook: aj.facebook || 'Facebook', tiktok: aj.tiktok || 'TikTok' },
      txtPagos: (aj.pagos && aj.pagos.trim()) || 'Escríbenos por WhatsApp y te compartimos las formas de pago disponibles.',
      txtEnvios: (aj.envios && aj.envios.trim()) || 'Entregas en Tegucigalpa y envíos al resto del país. Te confirmamos costo y tiempo por WhatsApp.',
      waTxt: 'WhatsApp ' + waTxt,
      redes: {
        instagram: aj.instagram ? 'https://instagram.com/' + aj.instagram.replace(/^@/, '').trim() : undefined,
        facebook: aj.facebook ? (/^https?:\/\//.test(aj.facebook) ? aj.facebook : 'https://facebook.com/' + aj.facebook.replace(/\s+/g, '')) : undefined,
        tiktok: aj.tiktok ? 'https://www.tiktok.com/@' + aj.tiktok.replace(/^@/, '').trim() : undefined
      },
      goFaq: i => { this.go('inicio', { faq: i }); setTimeout(() => { const el = document.getElementById('preguntas'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 80); },
      isHome: s.page === 'inicio', isCatalog: isCat, isProduct: s.page === 'producto',
      hq: s.hq,
      onHq: e => this.setState({ hq: e.target.value }),
      onHqKey: e => { if (e.key === 'Enter') { const qq = s.hq.trim().toLowerCase(); if (qq) this.T('busqueda', { q: qq, res: this.P.filter(p => [p.nombre, p.marca, p.s, p.c, p.f].join(' ').toLowerCase().includes(qq)).length }); this.goCatalog({ q: s.hq }); this.setState({ hq: '' }); } },
      toggleSearch: () => this.setState({ searchOpen: !s.searchOpen }),
      searchOpenMobile: mobile && s.searchOpen,
      goHome: () => this.go('inicio', {}),
      navCats: this.CATS.map(c => {
        const active = isCat && f.cat.length === 1 && f.cat[0] === c && nActive === 1;
        return { label: c, border: active ? '#A97C50' : 'transparent', go: () => { this.T('categoria', { cat: c }); this.goCatalog({ cat: [c] }); } };
      }),
      count,
      openDrawer: () => this.setState({ drawer: true, toast: null }),
      closeDrawer: () => this.setState({ drawer: false }),
      contactWA: () => { this.T('whatsapp', {}); this.wa('Hola, Atelier Parfums. Quisiera información sobre sus perfumes.'); },
      goCatalogAll: () => this.goCatalog({}),
      goNovedades: () => this.goCatalog({}),
      goOfertas: () => this.goCatalog({ cat: ['Descuento'] }),
      goArabes: () => this.goCatalog({ cat: ['Árabes'] }),

      categorias: this.CATS.map(c => ({ n: c, sub: this.CAT_SUB[c], slot: `categoria-${c.toLowerCase().replace(/[^a-z]/g, '')}`, ph: `[FOTO] ${c}`, go: () => this.goCatalog({ cat: [c] }) })),
      nuevos: this.P.filter(p => p.nuevo && p.estado !== 'agotado').slice(0, 4).map(V),
      ofertas: this.P.filter(p => p.descuento > 0).sort((a, b) => b.descuento - a.descuento).slice(0, 4).map(V),
      arabes: this.P.filter(p => p.linea === 'Árabes').slice(0, 4).map(V),
      rangos: this.RANGOS.map(r => ({ top: r.top, big: r.big, go: () => this.goCatalog({ rango: [r.k] }) })),
      marcas: this.marcas().map(m => ({ n: m, go: () => this.goCatalog({ marca: [m] }) })),
      faqs: this.faqList(aj).map((x, i) => ({ q: x.q, a: x.a, open: s.faq === i, rot: s.faq === i ? 'rotate(45deg)' : 'none', toggle: () => this.setState({ faq: s.faq === i ? -1 : i }) })),

      reviewsHome: [...allR].sort(byDate).slice(0, 8).map(r => this.reviewVm(r)),
      hasReviews: allR.length > 0,
      avgTxt: avgAll.toFixed(1), avgStars: this.stars(avgAll),
      reviewsCountLabel: allR.length === 1 ? 'Basado en 1 reseña' : `Basado en ${allR.length} reseñas`,
      openReviewGeneral: () => this.setState({ rf: { ...this.emptyRf(), open: true } }),
      openReviewProd: () => this.setState({ rf: { ...this.emptyRf(), open: true, pid: p0.id } }),

      catTitle, resultLabel: plural(list.length),
      q: s.q, onQ: e => this.setState({ q: e.target.value }),
      sort: s.sort, onSort: e => this.setState({ sort: e.target.value }),
      groups, chips, hasChips: nActive > 0,
      clearAll: () => this.setState({ f: this.emptyF(), q: '' }),
      results: list.map(V), noResults: !!s.db && list.length === 0,
      filterBtnLabel: nActive ? `Filtros (${nActive})` : 'Filtros',
      openFilters: () => this.setState({ filtersOpen: true }),
      closeFilters: () => this.setState({ filtersOpen: false }),
      filtersPanel: isCat && mobile && s.filtersOpen,
      seeResultsLabel: `Ver ${plural(list.length)}`,

      prod, mains, thumbs, tiers, seasons, moments, meters, related,
      prodAvailable: !prod.agotado, prodSoldOut: prod.agotado,
      prodGoCat: () => this.goCatalog({ cat: [p0.genero === 'Unisex' ? 'Mujer' : p0.genero] }),
      prodReviews, prodHasReviews: prodReviews.length > 0, prodNoReviews: prodReviews.length === 0,
      prodRatingLabel: prod.ratingN === 1 ? '1 reseña' : `${prod.ratingN} reseñas`,

      drawer: s.drawer,
      cliente: s.cliente, onCliente: e => this.setState({ cliente: e.target.value }),
      cartItems: cartRows.map(x => ({ marca: x.p.marca, nombre: x.p.nombre, meta: this.meta(x.p), n: x.c.n, slot: `foto-${x.p.id}-1`, sub: this.fmt(this.pf(x.p) * x.c.n), inc: () => this.setQty(x.p.id, 1), dec: () => this.setQty(x.p.id, -1), remove: () => this.setQty(x.p.id, -x.c.n) })),
      cartEmpty: cartRows.length === 0, cartHas: cartRows.length > 0,
      itemsLabel: count ? plural(count) : '',
      totalTxt: this.fmtTotal(total),
      msgText, showMsg: s.showMsg,
      msgToggleLabel: s.showMsg ? 'Ocultar mensaje' : 'Ver el mensaje que se enviará',
      toggleMsg: () => this.setState({ showMsg: !s.showMsg }),
      sendOrder: () => {
        this.T('pedido', { total, pids: cartRows.map(x => x.p.id) });
        this.wa(msgText);
        this.saveDb(db => {
          const n = (db.pedidos || []).reduce((m, x) => Math.max(m, parseInt(String(x.id).replace(/\D/g, ''), 10) || 0), 0) + 1;
          db.pedidos = [{ id: 'P-' + String(n).padStart(4, '0'), fecha: window.AtelierDatos.ahora(), nombre: nombre || '[Sin nombre]', items: cartRows.map(x => ({ pid: x.p.id, n: x.c.n, precio: this.pf(x.p) })), estado: 'Por confirmar' }, ...(db.pedidos || [])];
        });
        this.setState({ cart: [], drawer: false, showMsg: false });
        this.showToast('Pedido enviado. Te respondemos por WhatsApp.', false);
      },

      hasToast: !!s.toast && !s.drawer, toast: s.toast, toastPedido: s.toastPedido,
      showFloat: (this.props.botonFlotante ?? true) && !s.drawer && !s.filtersOpen && !rf.open,

      rfOpen: rf.open, rfSent: rf.sent, rfForm: !rf.sent,
      closeReview: () => this.setState({ rf: this.emptyRf() }),
      rfStars: [1, 2, 3, 4, 5].map(i => ({ color: i <= rf.estrellas ? '#A97C50' : '#E2CBC1', set: () => this.setRf({ estrellas: i }), aria: `${i} estrellas` })),
      rfStarsLabel: ['Mala', 'Regular', 'Buena', 'Muy buena', 'Excelente'][rf.estrellas - 1],
      rfProducts: [{ v: '', n: 'La tienda en general' }, ...this.P.map(p => ({ v: p.id, n: `${p.marca} · ${p.nombre}` }))],
      rfPid: rf.pid, onRfPid: e => this.setRf({ pid: e.target.value }),
      rfNombre: rf.nombre, onRfNombre: e => this.setRf({ nombre: e.target.value, error: '' }),
      rfTitulo: rf.titulo, onRfTitulo: e => this.setRf({ titulo: e.target.value }),
      rfTexto: rf.texto, onRfTexto: e => this.setRf({ texto: e.target.value, error: '' }),
      rfError: rf.error, rfHasError: !!rf.error,
      submitReview: () => this.submitReview()
    };
  }

  render() { return view({ ...this.props, ...this.renderVals() }); }
}

function view($v) {
  return (
  <>
    <div style={{ minHeight: "100vh", background: "#FBF4F0", fontFamily: "Jost, sans-serif", color: "#3D0000", fontWeight: "400" }}>
      <div style={{ background: "#3D0000", color: "#F5E6E0", fontSize: "11px", letterSpacing: ".24em", textTransform: "uppercase", textAlign: "center", padding: "10px 16px", lineHeight: "1.4" }}>
        {$v.anuncio}
      </div>
      <header style={{ position: "sticky", top: "0", zIndex: "40", background: "#FBF4F0", borderBottom: "1px solid #E2CBC1" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "12px", padding: "12px clamp(12px,5.5vw,80px)", maxWidth: "1440px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {$v.desktop ? (
              <>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", height: "44px", width: "min(280px,100%)", padding: "0 18px", border: "1px solid #E2CBC1", borderRadius: "999px", color: "#6E3A34" }}>
                  <svg width={"16"} height={"16"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.3"}>
                    <circle cx={"11"} cy={"11"} r={"6.5"} />
                    <path d={"M20 20l-4.2-4.2"} />
                  </svg>
                  {" "}
                  <input value={$v.hq ?? ""} onChange={$v.onHq} onKeyDown={$v.onHqKey} placeholder={"Buscar perfume o marca"} style={{ border: "none", outline: "none", background: "transparent", fontSize: "13px", color: "#3D0000", width: "100%", letterSpacing: ".02em" }} />
                </label>
              </>
            ) : null}
            {" "}
            {$v.mobile ? (
              <>
                <button onClick={$v.toggleSearch} aria-label={"Buscar"} style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: "#3D0000", cursor: "pointer" }}>
                  <svg width={"21"} height={"21"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.2"}>
                    <circle cx={"11"} cy={"11"} r={"6.5"} />
                    <path d={"M20 20l-4.2-4.2"} />
                  </svg>
                </button>
              </>
            ) : null}
          </div>
          <button onClick={$v.goHome} aria-label={"Atelier Parfums, inicio"} style={{ all: "unset", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "4px 0" }}>
            <span style={{ fontFamily: "'Cinzel Decorative', serif", fontWeight: "400", fontSize: "clamp(20px,2vw,28px)", letterSpacing: ".14em", lineHeight: "1", color: "#3D0000", paddingLeft: ".14em" }}>
              {"ATELIER"}
            </span>
            {" "}
            <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "#A97C50" }}>
              <span style={{ width: "clamp(10px,1.2vw,18px)", height: "1px", background: "#A97C50" }} />
              {" "}
              <span style={{ fontFamily: "Jost, sans-serif", fontWeight: "300", fontSize: "clamp(8.5px,.75vw,10.5px)", letterSpacing: ".55em", color: "#3D0000", paddingLeft: ".55em", lineHeight: "1" }}>
                {"PARFUMS"}
              </span>
              {" "}
              <span style={{ width: "clamp(10px,1.2vw,18px)", height: "1px", background: "#A97C50" }} />
            </span>
          </button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "clamp(0px,1vw,10px)" }}>
            <button onClick={$v.contactWA} aria-label={"Escríbenos por WhatsApp"} style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: "#3D0000", cursor: "pointer", borderRadius: "999px" }} className={"dcp1"}>
              <svg width={"21"} height={"21"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.2"} strokeLinejoin={"round"}>
                <path d={"M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"} />
                <path d={"M9.2 8.2c-.4.4-.6 1-.4 1.8.6 2.2 2.6 4.3 4.9 4.9.8.2 1.4 0 1.8-.4l.4-.6-1.8-1-.8.7c-1-.4-1.9-1.3-2.3-2.3l.7-.8-1-1.8z"} />
              </svg>
            </button>
            {" "}
            <button onClick={$v.openDrawer} aria-label={"Mi pedido"} style={{ height: "44px", minWidth: "44px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "none", border: "none", color: "#3D0000", cursor: "pointer", borderRadius: "999px", padding: "0 6px" }} className={"dcp1"}>
              <svg width={"21"} height={"21"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.2"} strokeLinejoin={"round"}>
                <path d={"M5.5 8h13l-1 12.5h-11L5.5 8z"} />
                <path d={"M9 10V6.5a3 3 0 0 1 6 0V10"} />
              </svg>
              {" "}
              {$v.desktop ? (
                <>
                  <span style={{ fontSize: "12px", letterSpacing: ".18em", textTransform: "uppercase" }}>
                    {"Mi pedido"}
                  </span>
                </>
              ) : null}
              {" "}
              <span style={{ minWidth: "20px", height: "20px", padding: "0 6px", borderRadius: "999px", background: "#3D0000", color: "#F5E6E0", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: "1" }}>
                {$v.count}
              </span>
            </button>
          </div>
        </div>
        {$v.searchOpenMobile ? (
          <>
            <div style={{ padding: "0 16px 12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", height: "44px", padding: "0 18px", border: "1px solid #E2CBC1", borderRadius: "999px", color: "#6E3A34" }}>
                <svg width={"16"} height={"16"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.3"}>
                  <circle cx={"11"} cy={"11"} r={"6.5"} />
                  <path d={"M20 20l-4.2-4.2"} />
                </svg>
                {" "}
                <input value={$v.hq ?? ""} onChange={$v.onHq} onKeyDown={$v.onHqKey} placeholder={"Buscar perfume o marca"} style={{ border: "none", outline: "none", background: "transparent", fontSize: "15px", color: "#3D0000", width: "100%" }} />
              </label>
            </div>
          </>
        ) : null}
        <nav style={{ display: "flex", gap: "clamp(22px,2.8vw,44px)", justifyContent: "safe center", overflowX: "auto", scrollbarWidth: "none", padding: "0 clamp(16px,5.5vw,80px)", borderTop: "1px solid #E2CBC1" }}>
          {arr($v.navCats).map((c, $index) => (
            <Fragment key={$index}>
              <button onClick={c?.go} style={{ flex: "none", minHeight: "44px", background: "none", border: "none", borderBottom: `1px solid ${c?.border ?? ""}`, marginBottom: "-1px", fontSize: "11.5px", letterSpacing: ".2em", textTransform: "uppercase", color: "#3D0000", cursor: "pointer", whiteSpace: "nowrap", padding: "0" }} className={"dcp2"}>
                {c?.label}
              </button>
            </Fragment>
          ))}
        </nav>
      </header>
      {$v.isHome ? (
        <>
          <main>
            <section data-screen-label={"Inicio · Hero"} style={{ position: "relative", background: "#3D0000", color: "#F5E6E0", minHeight: $v.heroMinH, display: "flex", flexDirection: $v.heroDir, alignItems: $v.heroAlign, overflow: "hidden" }}>
              <div style={{ position: $v.heroPos, inset: $v.heroInset, width: $v.heroImgW, aspectRatio: $v.heroAR, color: "#F5E6E0" }}>
                <ImageSlot id={"hero-editorial"} src={$v.heroFoto?.src} credit={$v.heroFoto?.credit} creditHref={$v.heroFoto?.href} shape={"rect"} placeholder={"[FOTO EDITORIAL] Frasco de perfume con luz cálida sobre fondo tinto"} />
              </div>
              <div style={{ position: "absolute", inset: $v.heroInset, display: $v.heroScrimDisp, pointerEvents: "none", background: $v.heroScrim }} />
              <div style={{ position: "relative", width: "100%", maxWidth: "1440px", margin: "0 auto", padding: "clamp(40px,6vw,96px) clamp(20px,5.5vw,80px)", pointerEvents: "none" }}>
                <div style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "clamp(18px,2.2vw,28px)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "11px", letterSpacing: ".3em", textTransform: "uppercase", color: "#F5E6E0" }}>
                    <span style={{ width: "32px", height: "1px", background: "#A97C50" }} />
                    {"Tegucigalpa · Honduras "}
                  </span>
                  <h1 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(42px,6.2vw,88px)", lineHeight: "1", letterSpacing: "-.01em", color: "#F5E6E0", textWrap: "balance" }}>
                    {"Perfumes "}
                    <em style={{ fontStyle: "italic", fontWeight: "300" }}>
                      {"originales"}
                    </em>
                    {", traídos de Estados Unidos a Honduras"}
                  </h1>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", pointerEvents: "auto" }}>
                    <button onClick={$v.goCatalogAll} style={{ minHeight: "48px", padding: "0 30px", borderRadius: "999px", border: "1px solid #F5E6E0", background: "#F5E6E0", color: "#3D0000", fontSize: "13px", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" }} className={"dcp3"}>
                      {"Ver catálogo"}
                    </button>
                    {" "}
                    <button onClick={$v.contactWA} style={{ minHeight: "48px", padding: "0 26px", borderRadius: "999px", border: "1px solid #F5E6E0", background: "transparent", color: "#F5E6E0", fontSize: "13px", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }} className={"dcp4"}>
                      <svg width={"17"} height={"17"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.3"} strokeLinejoin={"round"}>
                        <path d={"M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"} />
                        <path d={"M9.2 8.2c-.4.4-.6 1-.4 1.8.6 2.2 2.6 4.3 4.9 4.9.8.2 1.4 0 1.8-.4l.4-.6-1.8-1-.8.7c-1-.4-1.9-1.3-2.3-2.3l.7-.8-1-1.8z"} />
                      </svg>
                      {" Escríbenos por WhatsApp "}
                    </button>
                  </div>
                </div>
              </div>
            </section>
            <section data-screen-label={"Inicio · Categorías"} data-dock={"categorias"} style={{ position: "relative", background: "#FBF4F0" }}>
              <div data-stage={"1"} style={{ position: "sticky", top: "0", display: "flex", flexDirection: "column", overflow: "hidden", paddingTop: "clamp(28px,4vw,56px)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "12px 32px", padding: "0 clamp(20px,5.5vw,80px)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#7A532E" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#3D0000" }} />
                      {"Perfumería"}
                    </span>
                    <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(32px,3.6vw,50px)", lineHeight: "1.05", color: "#3D0000" }}>
                      {"Compra por "}
                      <em style={{ fontStyle: "italic" }}>
                        {"categoría"}
                      </em>
                    </h2>
                  </div>
                  <button onClick={$v.goCatalogAll} style={{ minHeight: "44px", background: "none", border: "none", padding: "0", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", letterSpacing: ".2em", textTransform: "uppercase", color: "#3D0000" }} className={"dcp2"}>
                    <span style={{ borderBottom: "1px solid #A97C50", paddingBottom: "4px" }}>
                      {"Ver catálogo"}
                    </span>
                    {" "}
                    <svg width={"16"} height={"16"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.2"}>
                      <path d={"M4 12h16M14 6l6 6-6 6"} />
                    </svg>
                  </button>
                </div>
                <div data-track={"1"} style={{ position: "relative", height: "460px", marginTop: "clamp(18px,2.6vw,32px)" }}>
                  {arr($v.dockCats).map((p, $index) => (
                    <Fragment key={$index}>
                      <article data-panel={"1"} style={{ position: "absolute", left: "0", bottom: "0", width: "260px", height: "80%", transform: `translateX(${p?.x0 ?? ""})`, display: "flex", flexDirection: "column", background: "#F5E6E0", borderRight: "1px solid #E2CBC1", willChange: "transform,width,height" }}>
                        <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span style={{ fontSize: "10.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#3D0000" }}>
                            {"Categoría"}
                          </span>
                          {" "}
                          <span style={{ fontSize: "10.5px", letterSpacing: ".2em", textTransform: "uppercase", color: "#6E3A34" }}>
                            {p?.count}
                          </span>
                        </div>
                        <div style={{ position: "relative", flex: "1", minHeight: "0", margin: "12px 16px", overflow: "hidden", background: "#FBF4F0", color: "#6E3A34" }}>
                          <ImageSlot id={p?.slot} src={p?.foto?.src} credit={p?.foto?.credit} creditHref={p?.foto?.href} shape={"rect"} placeholder={p?.ph} />
                        </div>
                        <button onClick={p?.go} style={{ all: "unset", cursor: "pointer", padding: "0 16px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", textAlign: "center", color: "#3D0000" }} className={"dcp2"}>
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", lineHeight: "1.1" }}>
                            {p?.n}
                          </span>
                          {" "}
                          <span style={{ fontSize: "12.5px", lineHeight: "1.45", color: "#6E3A34", maxWidth: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {p?.sub}
                          </span>
                        </button>
                      </article>
                    </Fragment>
                  ))}
                </div>
                <div style={{ position: "relative", height: "1px", background: "#E2CBC1", margin: "clamp(14px,2vw,22px) clamp(20px,5.5vw,80px) clamp(18px,2.6vw,32px)" }}>
                  <span data-progress={"1"} style={{ position: "absolute", left: "0", top: "-0.5px", height: "2px", width: "0%", background: "#3D0000" }} />
                </div>
              </div>
            </section>
            {$v.hasDockNuevos ? (
              <>
                <section data-screen-label={"Inicio · Recién llegados"} data-dock={"nuevos"} style={{ position: "relative", background: "#F5E6E0" }}>
                  <div data-stage={"1"} style={{ position: "sticky", top: "0", display: "flex", flexDirection: "column", overflow: "hidden", paddingTop: "clamp(28px,4vw,56px)" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "12px 32px", padding: "0 clamp(20px,5.5vw,80px)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#7A532E" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#3D0000" }} />
                          {"Novedades"}
                        </span>
                        <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(32px,3.6vw,50px)", lineHeight: "1.05", color: "#3D0000" }}>
                          {"Recién "}
                          <em style={{ fontStyle: "italic" }}>
                            {"llegados"}
                          </em>
                        </h2>
                      </div>
                      <button onClick={$v.goCatalogAll} style={{ minHeight: "44px", background: "none", border: "none", padding: "0", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", letterSpacing: ".2em", textTransform: "uppercase", color: "#3D0000" }} className={"dcp2"}>
                        <span style={{ borderBottom: "1px solid #A97C50", paddingBottom: "4px" }}>
                          {"Ver todo"}
                        </span>
                        {" "}
                        <svg width={"16"} height={"16"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.2"}>
                          <path d={"M4 12h16M14 6l6 6-6 6"} />
                        </svg>
                      </button>
                    </div>
                    <div data-track={"1"} style={{ position: "relative", height: "460px", marginTop: "clamp(18px,2.6vw,32px)" }}>
                      {arr($v.dockNuevos).map((p, $index) => (
                        <Fragment key={$index}>
                          <article data-panel={"1"} style={{ position: "absolute", left: "0", bottom: "0", width: "260px", height: "80%", transform: `translateX(${p?.x0 ?? ""})`, display: "flex", flexDirection: "column", background: "#FBF4F0", borderRight: "1px solid #E2CBC1", willChange: "transform,width,height" }}>
                            <div style={{ padding: "14px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "0" }}>
                                <span style={{ fontSize: "10.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#3D0000", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {p?.famLabel}
                                </span>
                                {" "}
                                <span style={{ fontSize: "10.5px", letterSpacing: ".2em", textTransform: "uppercase", color: "#6E3A34", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {p?.marca}
                                </span>
                              </div>
                              <span style={{ flex: "none", padding: "5px 8px", fontSize: "9.5px", letterSpacing: ".16em", textTransform: "uppercase", lineHeight: "1", background: p?.tagBg, color: p?.tagColor, border: `1px solid ${p?.tagBorder ?? ""}` }}>
                                {p?.tagLabel}
                              </span>
                            </div>
                            <div style={{ position: "relative", flex: "1", minHeight: "0", margin: "12px 16px", overflow: "hidden", background: "#F5E6E0", color: "#6E3A34", filter: p?.filt }}>
                              <ImageSlot id={`foto-${p?.id ?? ""}-1`} src={p?.foto1?.src} credit={p?.foto1?.credit} creditHref={p?.foto1?.href} shape={"rect"} placeholder={`[FOTO] ${p?.nombre ?? ""}`} />
                              {" "}
                              {p?.hasDescuento ? (
                                <>
                                  <span style={{ position: "absolute", top: "10px", right: "10px", padding: "6px 9px", borderRadius: "999px", background: "#3D0000", color: "#F5E6E0", fontSize: "11px", fontWeight: "500", letterSpacing: ".06em", lineHeight: "1", pointerEvents: "none" }}>
                                    {p?.descTxt}
                                  </span>
                                </>
                              ) : null}
                            </div>
                            <button onClick={p?.onOpen} style={{ all: "unset", cursor: "pointer", padding: "0 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", textAlign: "center", color: "#3D0000" }} className={"dcp2"}>
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "21px", lineHeight: "1.15", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                                {p?.nombre}
                              </span>
                              {" "}
                              <span style={{ display: "flex", gap: "8px", alignItems: "baseline", fontSize: "13.5px", letterSpacing: ".03em" }}>
                                <span style={{ color: "#3D0000", fontWeight: "500" }}>
                                  {p?.precioTxt}
                                </span>
                                {" "}
                                {p?.hasDescuento ? (
                                  <>
                                    <span style={{ fontSize: "12px", color: "#6E3A34", textDecoration: "line-through" }}>
                                      {p?.precioAntes}
                                    </span>
                                  </>
                                ) : null}
                              </span>
                            </button>
                            <div style={{ display: "flex", gap: "6px", padding: "10px 16px 16px" }}>
                              {p?.available ? (
                                <>
                                  <button onClick={p?.onOrder} style={{ flex: "1", minWidth: "0", minHeight: "44px", borderRadius: "999px", border: "1px solid #3D0000", background: "#3D0000", color: "#F5E6E0", fontSize: "11.5px", letterSpacing: ".04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer", padding: "0 12px" }} className={"dcp4"}>
                                    {"Pedir por WhatsApp"}
                                  </button>
                                  {" "}
                                  <button onClick={p?.onAdd} aria-label={"Agregar al pedido"} title={"Agregar al pedido"} style={{ flex: "none", width: "44px", height: "44px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} className={"dcp1"}>
                                    <svg width={"15"} height={"15"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"}>
                                      <path d={"M12 5v14M5 12h14"} />
                                    </svg>
                                  </button>
                                </>
                              ) : null}
                              {" "}
                              {p?.agotado ? (
                                <>
                                  <button onClick={p?.onNotify} style={{ flex: "1", minHeight: "44px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", fontSize: "11.5px", letterSpacing: ".04em", cursor: "pointer" }}>
                                    {"Avisarme cuando llegue"}
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </article>
                        </Fragment>
                      ))}
                    </div>
                    <div style={{ position: "relative", height: "1px", background: "#E2CBC1", margin: "clamp(14px,2vw,22px) clamp(20px,5.5vw,80px) clamp(18px,2.6vw,32px)" }}>
                      <span data-progress={"1"} style={{ position: "absolute", left: "0", top: "-0.5px", height: "2px", width: "0%", background: "#3D0000" }} />
                    </div>
                  </div>
                </section>
              </>
            ) : null}
            {" "}
            {$v.hasDockOfertas ? (
              <>
                <section data-screen-label={"Inicio · Ofertas"} data-dock={"ofertas"} style={{ position: "relative", background: "#FBF4F0" }}>
                  <div data-stage={"1"} style={{ position: "sticky", top: "0", display: "flex", flexDirection: "column", overflow: "hidden", paddingTop: "clamp(28px,4vw,56px)" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "12px 32px", padding: "0 clamp(20px,5.5vw,80px)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#7A532E" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#3D0000" }} />
                          {"Descuento"}
                        </span>
                        <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(32px,3.6vw,50px)", lineHeight: "1.05", color: "#3D0000" }}>
                          {"Ofertas en perfumes "}
                          <em style={{ fontStyle: "italic" }}>
                            {"originales"}
                          </em>
                        </h2>
                      </div>
                      <button onClick={$v.goOfertas} style={{ minHeight: "44px", background: "none", border: "none", padding: "0", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", letterSpacing: ".2em", textTransform: "uppercase", color: "#3D0000" }} className={"dcp2"}>
                        <span style={{ borderBottom: "1px solid #A97C50", paddingBottom: "4px" }}>
                          {"Ver ofertas"}
                        </span>
                        {" "}
                        <svg width={"16"} height={"16"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.2"}>
                          <path d={"M4 12h16M14 6l6 6-6 6"} />
                        </svg>
                      </button>
                    </div>
                    <div data-track={"1"} style={{ position: "relative", height: "460px", marginTop: "clamp(18px,2.6vw,32px)" }}>
                      {arr($v.dockOfertas).map((p, $index) => (
                        <Fragment key={$index}>
                          <article data-panel={"1"} style={{ position: "absolute", left: "0", bottom: "0", width: "260px", height: "80%", transform: `translateX(${p?.x0 ?? ""})`, display: "flex", flexDirection: "column", background: "#F5E6E0", borderRight: "1px solid #E2CBC1", willChange: "transform,width,height" }}>
                            <div style={{ padding: "14px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "0" }}>
                                <span style={{ fontSize: "10.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#3D0000", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {p?.famLabel}
                                </span>
                                {" "}
                                <span style={{ fontSize: "10.5px", letterSpacing: ".2em", textTransform: "uppercase", color: "#6E3A34", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {p?.marca}
                                </span>
                              </div>
                              <span style={{ flex: "none", padding: "5px 8px", fontSize: "9.5px", letterSpacing: ".16em", textTransform: "uppercase", lineHeight: "1", background: p?.tagBg, color: p?.tagColor, border: `1px solid ${p?.tagBorder ?? ""}` }}>
                                {p?.tagLabel}
                              </span>
                            </div>
                            <div style={{ position: "relative", flex: "1", minHeight: "0", margin: "12px 16px", overflow: "hidden", background: "#FBF4F0", color: "#6E3A34", filter: p?.filt }}>
                              <ImageSlot id={`foto-${p?.id ?? ""}-1`} src={p?.foto1?.src} credit={p?.foto1?.credit} creditHref={p?.foto1?.href} shape={"rect"} placeholder={`[FOTO] ${p?.nombre ?? ""}`} />
                              {" "}
                              {p?.hasDescuento ? (
                                <>
                                  <span style={{ position: "absolute", top: "10px", right: "10px", padding: "6px 9px", borderRadius: "999px", background: "#3D0000", color: "#F5E6E0", fontSize: "11px", fontWeight: "500", letterSpacing: ".06em", lineHeight: "1", pointerEvents: "none" }}>
                                    {p?.descTxt}
                                  </span>
                                </>
                              ) : null}
                            </div>
                            <button onClick={p?.onOpen} style={{ all: "unset", cursor: "pointer", padding: "0 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", textAlign: "center", color: "#3D0000" }} className={"dcp2"}>
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "21px", lineHeight: "1.15", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                                {p?.nombre}
                              </span>
                              {" "}
                              <span style={{ display: "flex", gap: "8px", alignItems: "baseline", fontSize: "13.5px", letterSpacing: ".03em" }}>
                                <span style={{ color: "#3D0000", fontWeight: "500" }}>
                                  {p?.precioTxt}
                                </span>
                                {" "}
                                {p?.hasDescuento ? (
                                  <>
                                    <span style={{ fontSize: "12px", color: "#6E3A34", textDecoration: "line-through" }}>
                                      {p?.precioAntes}
                                    </span>
                                  </>
                                ) : null}
                              </span>
                            </button>
                            <div style={{ display: "flex", gap: "6px", padding: "10px 16px 16px" }}>
                              {p?.available ? (
                                <>
                                  <button onClick={p?.onOrder} style={{ flex: "1", minWidth: "0", minHeight: "44px", borderRadius: "999px", border: "1px solid #3D0000", background: "#3D0000", color: "#F5E6E0", fontSize: "11.5px", letterSpacing: ".04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer", padding: "0 12px" }} className={"dcp4"}>
                                    {"Pedir por WhatsApp"}
                                  </button>
                                  {" "}
                                  <button onClick={p?.onAdd} aria-label={"Agregar al pedido"} title={"Agregar al pedido"} style={{ flex: "none", width: "44px", height: "44px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} className={"dcp1"}>
                                    <svg width={"15"} height={"15"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"}>
                                      <path d={"M12 5v14M5 12h14"} />
                                    </svg>
                                  </button>
                                </>
                              ) : null}
                              {" "}
                              {p?.agotado ? (
                                <>
                                  <button onClick={p?.onNotify} style={{ flex: "1", minHeight: "44px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", fontSize: "11.5px", letterSpacing: ".04em", cursor: "pointer" }}>
                                    {"Avisarme cuando llegue"}
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </article>
                        </Fragment>
                      ))}
                    </div>
                    <div style={{ position: "relative", height: "1px", background: "#E2CBC1", margin: "clamp(14px,2vw,22px) clamp(20px,5.5vw,80px) clamp(18px,2.6vw,32px)" }}>
                      <span data-progress={"1"} style={{ position: "absolute", left: "0", top: "-0.5px", height: "2px", width: "0%", background: "#3D0000" }} />
                    </div>
                  </div>
                </section>
              </>
            ) : null}
            {" "}
            {$v.hasDockArabes ? (
              <>
                <section data-screen-label={"Inicio · Árabes"} data-dock={"arabes"} style={{ position: "relative", background: "#F5E6E0" }}>
                  <div data-stage={"1"} style={{ position: "sticky", top: "0", display: "flex", flexDirection: "column", overflow: "hidden", paddingTop: "clamp(28px,4vw,56px)" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "12px 32px", padding: "0 clamp(20px,5.5vw,80px)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#7A532E" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#3D0000" }} />
                          {"Perfumería árabe"}
                        </span>
                        <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(32px,3.6vw,50px)", lineHeight: "1.05", color: "#3D0000" }}>
                          {"Intensos, dulces y "}
                          <em style={{ fontStyle: "italic" }}>
                            {"duraderos"}
                          </em>
                        </h2>
                      </div>
                      <button onClick={$v.goArabes} style={{ minHeight: "44px", background: "none", border: "none", padding: "0", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", letterSpacing: ".2em", textTransform: "uppercase", color: "#3D0000" }} className={"dcp2"}>
                        <span style={{ borderBottom: "1px solid #A97C50", paddingBottom: "4px" }}>
                          {"Ver árabes"}
                        </span>
                        {" "}
                        <svg width={"16"} height={"16"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.2"}>
                          <path d={"M4 12h16M14 6l6 6-6 6"} />
                        </svg>
                      </button>
                    </div>
                    <div data-track={"1"} style={{ position: "relative", height: "460px", marginTop: "clamp(18px,2.6vw,32px)" }}>
                      {arr($v.dockArabes).map((p, $index) => (
                        <Fragment key={$index}>
                          <article data-panel={"1"} style={{ position: "absolute", left: "0", bottom: "0", width: "260px", height: "80%", transform: `translateX(${p?.x0 ?? ""})`, display: "flex", flexDirection: "column", background: "#FBF4F0", borderRight: "1px solid #E2CBC1", willChange: "transform,width,height" }}>
                            <div style={{ padding: "14px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "0" }}>
                                <span style={{ fontSize: "10.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#3D0000", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {p?.famLabel}
                                </span>
                                {" "}
                                <span style={{ fontSize: "10.5px", letterSpacing: ".2em", textTransform: "uppercase", color: "#6E3A34", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {p?.marca}
                                </span>
                              </div>
                              <span style={{ flex: "none", padding: "5px 8px", fontSize: "9.5px", letterSpacing: ".16em", textTransform: "uppercase", lineHeight: "1", background: p?.tagBg, color: p?.tagColor, border: `1px solid ${p?.tagBorder ?? ""}` }}>
                                {p?.tagLabel}
                              </span>
                            </div>
                            <div style={{ position: "relative", flex: "1", minHeight: "0", margin: "12px 16px", overflow: "hidden", background: "#F5E6E0", color: "#6E3A34", filter: p?.filt }}>
                              <ImageSlot id={`foto-${p?.id ?? ""}-1`} src={p?.foto1?.src} credit={p?.foto1?.credit} creditHref={p?.foto1?.href} shape={"rect"} placeholder={`[FOTO] ${p?.nombre ?? ""}`} />
                              {" "}
                              {p?.hasDescuento ? (
                                <>
                                  <span style={{ position: "absolute", top: "10px", right: "10px", padding: "6px 9px", borderRadius: "999px", background: "#3D0000", color: "#F5E6E0", fontSize: "11px", fontWeight: "500", letterSpacing: ".06em", lineHeight: "1", pointerEvents: "none" }}>
                                    {p?.descTxt}
                                  </span>
                                </>
                              ) : null}
                            </div>
                            <button onClick={p?.onOpen} style={{ all: "unset", cursor: "pointer", padding: "0 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", textAlign: "center", color: "#3D0000" }} className={"dcp2"}>
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "21px", lineHeight: "1.15", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                                {p?.nombre}
                              </span>
                              {" "}
                              <span style={{ display: "flex", gap: "8px", alignItems: "baseline", fontSize: "13.5px", letterSpacing: ".03em" }}>
                                <span style={{ color: "#3D0000", fontWeight: "500" }}>
                                  {p?.precioTxt}
                                </span>
                                {" "}
                                {p?.hasDescuento ? (
                                  <>
                                    <span style={{ fontSize: "12px", color: "#6E3A34", textDecoration: "line-through" }}>
                                      {p?.precioAntes}
                                    </span>
                                  </>
                                ) : null}
                              </span>
                            </button>
                            <div style={{ display: "flex", gap: "6px", padding: "10px 16px 16px" }}>
                              {p?.available ? (
                                <>
                                  <button onClick={p?.onOrder} style={{ flex: "1", minWidth: "0", minHeight: "44px", borderRadius: "999px", border: "1px solid #3D0000", background: "#3D0000", color: "#F5E6E0", fontSize: "11.5px", letterSpacing: ".04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer", padding: "0 12px" }} className={"dcp4"}>
                                    {"Pedir por WhatsApp"}
                                  </button>
                                  {" "}
                                  <button onClick={p?.onAdd} aria-label={"Agregar al pedido"} title={"Agregar al pedido"} style={{ flex: "none", width: "44px", height: "44px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} className={"dcp1"}>
                                    <svg width={"15"} height={"15"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"}>
                                      <path d={"M12 5v14M5 12h14"} />
                                    </svg>
                                  </button>
                                </>
                              ) : null}
                              {" "}
                              {p?.agotado ? (
                                <>
                                  <button onClick={p?.onNotify} style={{ flex: "1", minHeight: "44px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", fontSize: "11.5px", letterSpacing: ".04em", cursor: "pointer" }}>
                                    {"Avisarme cuando llegue"}
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </article>
                        </Fragment>
                      ))}
                    </div>
                    <div style={{ position: "relative", height: "1px", background: "#E2CBC1", margin: "clamp(14px,2vw,22px) clamp(20px,5.5vw,80px) clamp(18px,2.6vw,32px)" }}>
                      <span data-progress={"1"} style={{ position: "absolute", left: "0", top: "-0.5px", height: "2px", width: "0%", background: "#3D0000" }} />
                    </div>
                  </div>
                </section>
              </>
            ) : null}
            <section data-screen-label={"Inicio · Presupuesto"} style={{ padding: "0 clamp(20px,5.5vw,80px) clamp(56px,8vw,112px)" }}>
              <div style={{ maxWidth: "1280px", margin: "0 auto", borderTop: "1px solid #E2CBC1", paddingTop: "clamp(48px,6vw,88px)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "clamp(28px,4vw,48px)" }}>
                  <span style={{ fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#7A532E" }}>
                    {"Por presupuesto"}
                  </span>
                  <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(34px,4vw,54px)", lineHeight: "1.05", color: "#3D0000" }}>
                    {"Encuentra tu perfume "}
                    <em style={{ fontStyle: "italic" }}>
                      {"por presupuesto"}
                    </em>
                  </h2>
                </div>
                <div style={{ display: "flex", gap: "clamp(10px,1.6vw,20px)", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", margin: "0 calc(clamp(20px,5.5vw,80px) * -1)", padding: "0 clamp(20px,5.5vw,80px)", scrollPaddingInline: "clamp(20px,5.5vw,80px)" }}>
                  {arr($v.rangos).map((r, $index) => (
                    <Fragment key={$index}>
                      <button onClick={r?.go} style={{ flex: "1 1 0", minWidth: "clamp(150px,15vw,240px)", scrollSnapAlign: "start", minHeight: "clamp(132px,12vw,172px)", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-start", gap: "18px", padding: "clamp(18px,2vw,26px)", background: "#FBF4F0", border: "1px solid #E2CBC1", cursor: "pointer", textAlign: "left", color: "#3D0000", transition: "background .25s, border-color .25s" }} className={"dcp5"}>
                        <span style={{ fontSize: "10.5px", letterSpacing: ".26em", textTransform: "uppercase", color: "#7A532E" }}>
                          {r?.top}
                        </span>
                        {" "}
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(26px,2.4vw,34px)", lineHeight: "1.05" }}>
                          {r?.big}
                        </span>
                        {" "}
                        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", letterSpacing: ".18em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                          {"Ver perfumes "}
                          <svg width={"13"} height={"13"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#A97C50"} strokeWidth={"1.3"}>
                            <path d={"M4 12h16M14 6l6 6-6 6"} />
                          </svg>
                        </span>
                      </button>
                    </Fragment>
                  ))}
                </div>
              </div>
            </section>
            {$v.hasReviews ? (
              <>
                <section data-screen-label={"Inicio · Reseñas"} data-dock={"resenas"} style={{ position: "relative", background: "#F5E6E0" }}>
                  <div data-stage={"1"} style={{ position: "sticky", top: "0", display: "flex", flexDirection: "column", overflow: "hidden", paddingTop: "clamp(28px,4vw,56px)" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "12px 32px", padding: "0 clamp(20px,5.5vw,80px)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#7A532E" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#3D0000" }} />
                          {"Reseñas"}
                        </span>
                        <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(32px,3.6vw,50px)", lineHeight: "1.05", color: "#3D0000" }}>
                          {"Lo que dicen nuestros "}
                          <em style={{ fontStyle: "italic" }}>
                            {"clientes"}
                          </em>
                        </h2>
                        {$v.hasReviews ? (
                          <>
                            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "4px" }}>
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "40px", lineHeight: "1", color: "#3D0000" }}>
                                {$v.avgTxt}
                              </span>
                              {" "}
                              <span style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <span style={{ color: "#A97C50", fontSize: "15px", letterSpacing: ".12em" }}>
                                  {$v.avgStars}
                                </span>
                                <span style={{ fontSize: "12.5px", color: "#6E3A34" }}>
                                  {$v.reviewsCountLabel}
                                </span>
                              </span>
                            </div>
                          </>
                        ) : null}
                      </div>
                      <button onClick={$v.openReviewGeneral} style={{ minHeight: "48px", padding: "0 26px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", fontSize: "12.5px", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" }} className={"dcp3"}>
                        {"Escribir una reseña"}
                      </button>
                    </div>
                    <div data-track={"1"} style={{ position: "relative", height: "460px", marginTop: "clamp(18px,2.6vw,32px)" }}>
                      {arr($v.dockResenas).map((p, $index) => (
                        <Fragment key={$index}>
                          <article data-panel={"1"} style={{ position: "absolute", left: "0", bottom: "0", width: "260px", height: "80%", transform: `translateX(${p?.x0 ?? ""})`, display: "flex", flexDirection: "column", background: "#FBF4F0", borderRight: "1px solid #E2CBC1", willChange: "transform,width,height", padding: "clamp(18px,2vw,26px)", gap: "12px" }}>
                            <span style={{ color: "#A97C50", fontSize: "15px", letterSpacing: ".12em" }}>
                              {p?.stars}
                            </span>
                            <h3 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "24px", lineHeight: "1.15", color: "#3D0000" }}>
                              {p?.titulo}
                            </h3>
                            <div style={{ flex: "1", minHeight: "0" }}>
                              <p style={{ margin: "0", display: "-webkit-box", "WebkitBoxOrient": "vertical", "WebkitLineClamp": "4", overflow: "hidden", fontSize: "14.5px", lineHeight: "1.65", color: "#6E3A34", textWrap: "pretty" }}>
                                {p?.texto}
                              </p>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingTop: "14px", borderTop: "1px solid #E2CBC1" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "baseline" }}>
                                <span style={{ fontSize: "13px", fontWeight: "500", color: "#3D0000" }}>
                                  {p?.nombre}
                                </span>
                                {" "}
                                <span style={{ fontSize: "12px", color: "#6E3A34" }}>
                                  {p?.fecha}
                                </span>
                              </div>
                              {p?.hasProd ? (
                                <>
                                  <button onClick={p?.open} style={{ all: "unset", cursor: "pointer", fontSize: "12px", color: "#7A532E", textDecoration: "underline", textDecorationColor: "#E2CBC1", textUnderlineOffset: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} className={"dcp6"}>
                                    {p?.prodName}
                                  </button>
                                </>
                              ) : null}
                              {" "}
                              {p?.noProd ? (
                                <>
                                  <span style={{ fontSize: "12px", color: "#7A532E" }}>
                                    {"Sobre la tienda"}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </article>
                        </Fragment>
                      ))}
                    </div>
                    <div style={{ position: "relative", height: "1px", background: "#E2CBC1", margin: "clamp(14px,2vw,22px) clamp(20px,5.5vw,80px) clamp(18px,2.6vw,32px)" }}>
                      <span data-progress={"1"} style={{ position: "absolute", left: "0", top: "-0.5px", height: "2px", width: "0%", background: "#3D0000" }} />
                    </div>
                  </div>
                </section>
              </>
            ) : null}
            <section data-screen-label={"Inicio · Marcas"} style={{ padding: "clamp(56px,8vw,112px) clamp(20px,5.5vw,80px) clamp(40px,5vw,72px)" }}>
              <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(24px,3vw,40px)", textAlign: "center" }}>
                <span style={{ fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#7A532E" }}>
                  {"Marcas"}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px clamp(22px,3vw,48px)" }}>
                  {arr($v.marcas).map((m, $index) => (
                    <Fragment key={$index}>
                      <button onClick={m?.go} style={{ minHeight: "44px", background: "none", border: "none", padding: "0", cursor: "pointer", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "clamp(21px,2.2vw,30px)", color: "#6E3A34", whiteSpace: "nowrap" }} className={"dcp6"}>
                        {m?.n}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </div>
            </section>
            <section data-screen-label={"Inicio · Por qué nosotros"} style={{ padding: "clamp(40px,5vw,72px) clamp(20px,5.5vw,80px) clamp(56px,8vw,112px)" }}>
              <div style={{ maxWidth: "1280px", margin: "0 auto", borderTop: "1px solid #E2CBC1", paddingTop: "clamp(48px,6vw,88px)" }}>
                <h2 style={{ margin: "0 0 clamp(32px,4vw,56px)", fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(34px,4vw,54px)", lineHeight: "1.05", color: "#3D0000", textAlign: "center" }}>
                  {"¿Por qué comprar "}
                  <em style={{ fontStyle: "italic" }}>
                    {"con nosotros?"}
                  </em>
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))", gap: "clamp(28px,4vw,48px) clamp(20px,3vw,40px)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <svg width={"34"} height={"34"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#A97C50"} strokeWidth={".9"} strokeLinejoin={"round"}>
                      <path d={"M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z"} />
                      <path d={"M9 12l2.2 2.2L15.5 10"} />
                    </svg>
                    <h3 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "clamp(20px,1.8vw,24px)", color: "#3D0000" }}>
                      {"Originales garantizados"}
                    </h3>
                    <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.65", color: "#6E3A34", textWrap: "pretty" }}>
                      {"Cada perfume es auténtico, traído de Estados Unidos en su empaque original."}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <svg width={"34"} height={"34"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#A97C50"} strokeWidth={".9"} strokeLinejoin={"round"}>
                      <path d={"M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"} />
                      <path d={"M9.2 8.2c-.4.4-.6 1-.4 1.8.6 2.2 2.6 4.3 4.9 4.9.8.2 1.4 0 1.8-.4l.4-.6-1.8-1-.8.7c-1-.4-1.9-1.3-2.3-2.3l.7-.8-1-1.8z"} />
                    </svg>
                    <h3 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "clamp(20px,1.8vw,24px)", color: "#3D0000" }}>
                      {"Pedido fácil por WhatsApp"}
                    </h3>
                    <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.65", color: "#6E3A34", textWrap: "pretty" }}>
                      {"Arma tu pedido aquí y envíalo en un solo mensaje. Te atendemos de forma personal."}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <svg width={"34"} height={"34"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#A97C50"} strokeWidth={".9"} strokeLinejoin={"round"}>
                      <rect x={"3"} y={"6"} width={"18"} height={"12.5"} rx={"1.5"} />
                      <path d={"M3 10h18M6.5 15h4"} />
                    </svg>
                    <h3 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "clamp(20px,1.8vw,24px)", color: "#3D0000" }}>
                      {"Métodos de pago"}
                    </h3>
                    <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.65", color: "#6E3A34", textWrap: "pretty" }}>
                      {$v.txtPagos}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <svg width={"34"} height={"34"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#A97C50"} strokeWidth={".9"} strokeLinejoin={"round"}>
                      <path d={"M2.5 6.5h11.5v10H2.5zM14 9.5h4l3.5 3.5v3.5H14"} />
                      <circle cx={"6.5"} cy={"17.5"} r={"1.6"} />
                      <circle cx={"17.5"} cy={"17.5"} r={"1.6"} />
                    </svg>
                    <h3 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "clamp(20px,1.8vw,24px)", color: "#3D0000" }}>
                      {"Envíos"}
                    </h3>
                    <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.65", color: "#6E3A34", textWrap: "pretty" }}>
                      {$v.txtEnvios}
                    </p>
                  </div>
                </div>
              </div>
            </section>
            <section data-screen-label={"Inicio · Cómo pedir"} style={{ background: "#F5E6E0", padding: "clamp(56px,8vw,112px) clamp(20px,5.5vw,80px)" }}>
              <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", textAlign: "center", marginBottom: "clamp(36px,5vw,64px)" }}>
                  <span style={{ fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#7A532E" }}>
                    {"Cómo pedir"}
                  </span>
                  <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(34px,4vw,54px)", lineHeight: "1.05", color: "#3D0000" }}>
                    {"Tres pasos, "}
                    <em style={{ fontStyle: "italic" }}>
                      {"un mensaje"}
                    </em>
                  </h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: "clamp(32px,4vw,56px)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", borderTop: "1px solid #A97C50", paddingTop: "24px" }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: "300", fontSize: "clamp(48px,5vw,64px)", lineHeight: ".9", color: "#7A532E" }}>
                      {"01"}
                    </span>
                    <h3 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "clamp(22px,2vw,26px)", color: "#3D0000" }}>
                      {"Elige tu perfume"}
                    </h3>
                    <p style={{ margin: "0", fontSize: "14.5px", lineHeight: "1.65", color: "#6E3A34", maxWidth: "36ch" }}>
                      {"Explora el catálogo por categoría, familia olfativa o presupuesto."}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", borderTop: "1px solid #A97C50", paddingTop: "24px" }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: "300", fontSize: "clamp(48px,5vw,64px)", lineHeight: ".9", color: "#7A532E" }}>
                      {"02"}
                    </span>
                    <h3 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "clamp(22px,2vw,26px)", color: "#3D0000" }}>
                      {"Agrégalo a tu pedido"}
                    </h3>
                    <p style={{ margin: "0", fontSize: "14.5px", lineHeight: "1.65", color: "#6E3A34", maxWidth: "36ch" }}>
                      {"Toca “Agregar al pedido” en cada perfume. Puedes ajustar cantidades en Mi pedido."}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", borderTop: "1px solid #A97C50", paddingTop: "24px" }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: "300", fontSize: "clamp(48px,5vw,64px)", lineHeight: ".9", color: "#7A532E" }}>
                      {"03"}
                    </span>
                    <h3 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "clamp(22px,2vw,26px)", color: "#3D0000" }}>
                      {"Envíalo por WhatsApp y confirmamos"}
                    </h3>
                    <p style={{ margin: "0", fontSize: "14.5px", lineHeight: "1.65", color: "#6E3A34", maxWidth: "36ch" }}>
                      {"Tu pedido nos llega en un solo mensaje. Te confirmamos disponibilidad, pago y envío."}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginTop: "clamp(40px,5vw,64px)" }}>
                  <button onClick={$v.goCatalogAll} style={{ minHeight: "48px", padding: "0 32px", borderRadius: "999px", border: "1px solid #3D0000", background: "#3D0000", color: "#F5E6E0", fontSize: "13px", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" }} className={"dcp4"}>
                    {"Empezar mi pedido"}
                  </button>
                </div>
              </div>
            </section>
            <section id="preguntas" data-screen-label={"Inicio · Preguntas frecuentes"} style={{ padding: "clamp(56px,8vw,112px) clamp(20px,5.5vw,80px)" }}>
              <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "clamp(28px,5vw,80px)" }}>
                <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: "16px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#7A532E" }}>
                    {"Ayuda"}
                  </span>
                  <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(34px,4vw,54px)", lineHeight: "1.05", color: "#3D0000" }}>
                    {"Preguntas "}
                    <em style={{ fontStyle: "italic" }}>
                      {"frecuentes"}
                    </em>
                  </h2>
                  <p style={{ margin: "0", fontSize: "14.5px", lineHeight: "1.65", color: "#6E3A34", maxWidth: "34ch" }}>
                    {"¿Tienes otra duda? Escríbenos y con gusto te ayudamos."}
                  </p>
                  <button onClick={$v.contactWA} style={{ minHeight: "44px", padding: "0 24px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", fontSize: "12.5px", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer", marginTop: "4px" }} className={"dcp1"}>
                    {"Escríbenos por WhatsApp"}
                  </button>
                </div>
                <div style={{ flex: "2 1 420px", borderTop: "1px solid #E2CBC1" }}>
                  {arr($v.faqs).map((q, $index) => (
                    <Fragment key={$index}>
                      <div style={{ borderBottom: "1px solid #E2CBC1" }}>
                        <button onClick={q?.toggle} style={{ width: "100%", minHeight: "68px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", background: "none", border: "none", padding: "16px 0", cursor: "pointer", textAlign: "left", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "clamp(20px,1.8vw,24px)", lineHeight: "1.2", color: "#3D0000" }}>
                          <span>
                            {q?.q}
                          </span>
                          {" "}
                          <svg width={"18"} height={"18"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#A97C50"} strokeWidth={"1.2"} style={{ flex: "none", transition: "transform .3s", transform: q?.rot }}>
                            <path d={"M12 4v16M4 12h16"} />
                          </svg>
                        </button>
                        {" "}
                        {q?.open ? (
                          <>
                            <p style={{ margin: "0", padding: "0 40px 24px 0", fontSize: "14.5px", lineHeight: "1.7", color: "#6E3A34", maxWidth: "64ch", textWrap: "pretty" }}>
                              {q?.a}
                            </p>
                          </>
                        ) : null}
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
            </section>
          </main>
        </>
      ) : null}
      {" "}
      {$v.isCatalog ? (
        <>
          <main data-screen-label={"Catálogo"} style={{ padding: "clamp(24px,3.5vw,48px) clamp(20px,5.5vw,80px) clamp(64px,8vw,112px)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "11px", letterSpacing: ".2em", textTransform: "uppercase", color: "#6E3A34" }}>
                <button onClick={$v.goHome} style={{ background: "none", border: "none", padding: "0", cursor: "pointer", fontSize: "11px", letterSpacing: ".2em", textTransform: "uppercase", color: "#6E3A34", minHeight: "32px" }} className={"dcp6"}>
                  {"Inicio"}
                </button>
                {" "}
                <span style={{ color: "#A97C50" }}>
                  {"/"}
                </span>
                <span style={{ color: "#3D0000" }}>
                  {"Catálogo"}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "12px 32px", margin: "12px 0 clamp(20px,3vw,32px)" }}>
                <h1 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(40px,5vw,68px)", lineHeight: "1", color: "#3D0000" }}>
                  {$v.catTitle}
                </h1>
                <span style={{ fontSize: "13px", color: "#6E3A34", letterSpacing: ".04em" }}>
                  {$v.resultLabel}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", padding: "14px 0", borderTop: "1px solid #E2CBC1", borderBottom: "1px solid #E2CBC1" }}>
                <label style={{ flex: "1 1 240px", display: "flex", alignItems: "center", gap: "10px", height: "44px", padding: "0 18px", border: "1px solid #E2CBC1", borderRadius: "999px", color: "#6E3A34", background: "#FBF4F0" }}>
                  <svg width={"16"} height={"16"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.3"}>
                    <circle cx={"11"} cy={"11"} r={"6.5"} />
                    <path d={"M20 20l-4.2-4.2"} />
                  </svg>
                  {" "}
                  <input value={$v.q ?? ""} onChange={$v.onQ} placeholder={"Buscar en el catálogo"} style={{ border: "none", outline: "none", background: "transparent", fontSize: "14px", color: "#3D0000", width: "100%" }} />
                </label>
                {" "}
                {$v.mobile ? (
                  <>
                    <button onClick={$v.openFilters} style={{ flex: "1 1 120px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", fontSize: "12px", letterSpacing: ".16em", textTransform: "uppercase", cursor: "pointer" }}>
                      <svg width={"16"} height={"16"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.3"}>
                        <path d={"M4 7h16M7 12h10M10 17h4"} />
                      </svg>
                      {$v.filterBtnLabel}
                      {" "}
                    </button>
                  </>
                ) : null}
                {" "}
                <label style={{ flex: "1 1 120px", maxWidth: "280px", position: "relative", display: "flex", alignItems: "center", height: "44px", border: "1px solid #E2CBC1", borderRadius: "999px", color: "#3D0000" }}>
                  <select value={$v.sort ?? ""} onChange={$v.onSort} aria-label={"Ordenar"} style={{ appearance: "none", "WebkitAppearance": "none", width: "100%", height: "100%", border: "none", background: "transparent", padding: "0 40px 0 18px", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", color: "#3D0000", cursor: "pointer", outline: "none" }}>
                    <option value={"destacados"}>
                      {"Destacados"}
                    </option>
                    <option value={"asc"}>
                      {"Precio: menor a mayor"}
                    </option>
                    <option value={"desc"}>
                      {"Precio: mayor a menor"}
                    </option>
                  </select>
                  {" "}
                  <svg width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.3"} style={{ position: "absolute", right: "16px", pointerEvents: "none" }}>
                    <path d={"M6 9l6 6 6-6"} />
                  </svg>
                </label>
              </div>
              {$v.hasChips ? (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", paddingTop: "14px" }}>
                    {arr($v.chips).map((ch, $index) => (
                      <Fragment key={$index}>
                        <button onClick={ch?.remove} style={{ height: "36px", display: "flex", alignItems: "center", gap: "8px", padding: "0 14px", borderRadius: "999px", border: "1px solid #E2CBC1", background: "#F5E6E0", color: "#3D0000", fontSize: "12px", cursor: "pointer" }} className={"dcp7"}>
                          {ch?.label}
                          <svg width={"12"} height={"12"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"}>
                            <path d={"M6 6l12 12M18 6L6 18"} />
                          </svg>
                        </button>
                      </Fragment>
                    ))}
                    {" "}
                    <button onClick={$v.clearAll} style={{ height: "36px", background: "none", border: "none", padding: "0 6px", fontSize: "12px", color: "#3D0000", textDecoration: "underline", textDecorationColor: "#A97C50", textUnderlineOffset: "4px", cursor: "pointer" }}>
                      {"Limpiar todo"}
                    </button>
                  </div>
                </>
              ) : null}
              <div style={{ display: "flex", gap: "clamp(32px,4vw,56px)", alignItems: "flex-start", marginTop: "clamp(20px,3vw,36px)" }}>
                {$v.desktop ? (
                  <>
                    <aside style={{ flex: "0 0 240px", position: "sticky", top: "150px", maxHeight: "calc(100vh - 170px)", overflowY: "auto", scrollbarWidth: "thin" }}>
                      {arr($v.groups).map((g, $index) => (
                        <Fragment key={$index}>
                          <div style={{ borderBottom: "1px solid #E2CBC1", padding: "18px 0", display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontSize: "11px", letterSpacing: ".26em", textTransform: "uppercase", color: "#7A532E", marginBottom: "8px" }}>
                              {g?.title}
                            </span>
                            {" "}
                            {arr(g?.options).map((o, $index) => (
                              <Fragment key={$index}>
                                <button onClick={o?.toggle} style={{ display: "flex", alignItems: "center", gap: "12px", minHeight: "34px", background: "none", border: "none", padding: "0", cursor: "pointer", textAlign: "left", fontSize: "14px", color: "#3D0000" }} className={"dcp2"}>
                                  <span style={{ width: "16px", height: "16px", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${o?.boxBorder ?? ""}`, background: o?.boxBg }}>
                                    {o?.checked ? (
                                      <>
                                        <svg width={"11"} height={"11"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#F5E6E0"} strokeWidth={"2.4"}>
                                          <path d={"M5 12.5l4.5 4.5L19 7.5"} />
                                        </svg>
                                      </>
                                    ) : null}
                                  </span>
                                  {" "}
                                  <span>
                                    {o?.label}
                                  </span>
                                </button>
                              </Fragment>
                            ))}
                          </div>
                        </Fragment>
                      ))}
                    </aside>
                  </>
                ) : null}
                <div style={{ flex: "1", minWidth: "0" }}>
                  {$v.noResults ? (
                    <>
                      <div style={{ padding: "clamp(48px,8vw,96px) 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", textAlign: "center" }}>
                        <p style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "30px", color: "#3D0000" }}>
                          {"No encontramos perfumes con "}
                          <em style={{ fontStyle: "italic" }}>
                            {"esos filtros"}
                          </em>
                        </p>
                        <p style={{ margin: "0", fontSize: "14px", color: "#6E3A34", maxWidth: "40ch" }}>
                          {"Prueba con otra búsqueda o escríbenos: si no lo tenemos, podemos traerlo."}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
                          <button onClick={$v.clearAll} style={{ minHeight: "44px", padding: "0 24px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", fontSize: "12.5px", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" }}>
                            {"Limpiar filtros"}
                          </button>
                          {" "}
                          <button onClick={$v.contactWA} style={{ minHeight: "44px", padding: "0 24px", borderRadius: "999px", border: "1px solid #3D0000", background: "#3D0000", color: "#F5E6E0", fontSize: "12.5px", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" }}>
                            {"Preguntar por WhatsApp"}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : null}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(clamp(150px,16vw,250px),1fr))", gap: "clamp(28px,3vw,44px) clamp(12px,1.8vw,24px)" }}>
                    {arr($v.results).map((p, $index) => (
                      <Fragment key={$index}>
                        <TarjetaProducto p={p} />
                      </Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </>
      ) : null}
      {" "}
      {$v.isProduct ? (
        <>
          <main data-screen-label={"Detalle de producto"}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(18px,2.5vw,32px) clamp(20px,5.5vw,80px) 0" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", fontSize: "11px", letterSpacing: ".2em", textTransform: "uppercase", color: "#6E3A34" }}>
                <button onClick={$v.goHome} style={{ background: "none", border: "none", padding: "0", cursor: "pointer", fontSize: "11px", letterSpacing: ".2em", textTransform: "uppercase", color: "#6E3A34", minHeight: "32px" }} className={"dcp6"}>
                  {"Inicio"}
                </button>
                {" "}
                <span style={{ color: "#A97C50" }}>
                  {"/"}
                </span>
                {" "}
                <button onClick={$v.prodGoCat} style={{ background: "none", border: "none", padding: "0", cursor: "pointer", fontSize: "11px", letterSpacing: ".2em", textTransform: "uppercase", color: "#6E3A34", minHeight: "32px" }} className={"dcp6"}>
                  {$v.prod?.genero}
                </button>
                {" "}
                <span style={{ color: "#A97C50" }}>
                  {"/"}
                </span>
                <span style={{ color: "#3D0000" }}>
                  {$v.prod?.nombre}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "clamp(28px,5vw,88px)", alignItems: "start", marginTop: "clamp(12px,2vw,24px)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "600px", justifySelf: "center" }}>
                  <div style={{ position: "relative", aspectRatio: "4 / 5", background: "#F5E6E0", overflow: "hidden", color: "#6E3A34" }}>
                    {arr($v.mains).map((m, $index) => (
                      <Fragment key={$index}>
                        <div style={{ position: "absolute", inset: "0", background: "#F5E6E0", opacity: m?.op, pointerEvents: m?.pe, transition: "opacity .4s", filter: $v.prod?.filt }}>
                          <ImageSlot id={m?.id} shape={"rect"} placeholder={m?.ph} />
                        </div>
                      </Fragment>
                    ))}
                    {" "}
                    <span style={{ position: "absolute", top: "16px", left: "16px", padding: "7px 12px", fontSize: "10.5px", letterSpacing: ".18em", textTransform: "uppercase", lineHeight: "1", background: $v.prod?.tagBg, color: $v.prod?.tagColor, border: `1px solid ${$v.prod?.tagBorder ?? ""}`, pointerEvents: "none" }}>
                      {$v.prod?.tagLabel}
                    </span>
                    {" "}
                    {$v.prod?.hasDescuento ? (
                      <>
                        <span style={{ position: "absolute", top: "16px", right: "16px", padding: "7px 11px", borderRadius: "999px", background: "#3D0000", color: "#F5E6E0", fontSize: "12px", fontWeight: "500", letterSpacing: ".06em", lineHeight: "1", pointerEvents: "none" }}>
                          {$v.prod?.descTxt}
                        </span>
                      </>
                    ) : null}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}>
                    {arr($v.thumbs).map((t, $index) => (
                      <Fragment key={$index}>
                        <div style={{ position: "relative", aspectRatio: "4 / 5", background: "#F5E6E0", outline: `1px solid ${t?.border ?? ""}`, outlineOffset: "2px", color: "#6E3A34", filter: $v.prod?.filt }}>
                          <ImageSlot id={t?.id} shape={"rect"} placeholder={t?.n} />
                          {" "}
                          <button onClick={t?.select} aria-label={t?.aria} style={{ position: "absolute", inset: "0", background: "transparent", border: "none", cursor: "pointer", zIndex: "3" }} />
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "clamp(28px,3vw,40px)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#7A532E" }}>
                      {$v.prod?.marca}
                    </span>
                    <h1 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(40px,4.6vw,62px)", lineHeight: "1", color: "#3D0000" }}>
                      {$v.prod?.nombre}
                    </h1>
                    <span style={{ fontSize: "13px", letterSpacing: ".06em", color: "#6E3A34" }}>
                      {$v.prod?.meta}
                    </span>
                    {" "}
                    {$v.prod?.hasRating ? (
                      <>
                        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6E3A34" }}>
                          <span style={{ color: "#A97C50", fontSize: "15px", letterSpacing: ".1em" }}>
                            {$v.prod?.stars}
                          </span>
                          {$v.prod?.avgTxt}
                          {" · "}
                          {$v.prodRatingLabel}
                        </span>
                      </>
                    ) : null}
                    {" "}
                    <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 14px", marginTop: "8px" }}>
                      <span style={{ fontSize: "22px", fontWeight: "400", letterSpacing: ".03em", color: "#3D0000" }}>
                        {$v.prod?.precioTxt}
                      </span>
                      {" "}
                      {$v.prod?.hasDescuento ? (
                        <>
                          <span style={{ fontSize: "16px", color: "#6E3A34", textDecoration: "line-through" }}>
                            {$v.prod?.precioAntes}
                          </span>
                          {" "}
                          <span style={{ padding: "5px 10px", borderRadius: "999px", background: "#3D0000", color: "#F5E6E0", fontSize: "11.5px", fontWeight: "500", letterSpacing: ".06em" }}>
                            {$v.prod?.descTxt}
                          </span>
                        </>
                      ) : null}
                    </span>
                    <p style={{ margin: "8px 0 0", fontSize: "15px", lineHeight: "1.75", color: "#6E3A34", maxWidth: "52ch", textWrap: "pretty" }}>
                      {$v.prod?.desc}
                    </p>
                    {$v.prodAvailable ? (
                      <>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "14px" }}>
                          <button onClick={$v.prod?.onOrder} style={{ flex: "1 1 220px", minHeight: "52px", borderRadius: "999px", border: "1px solid #3D0000", background: "#3D0000", color: "#F5E6E0", fontSize: "13px", letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }} className={"dcp4"}>
                            <svg width={"18"} height={"18"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.3"} strokeLinejoin={"round"}>
                              <path d={"M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"} />
                              <path d={"M9.2 8.2c-.4.4-.6 1-.4 1.8.6 2.2 2.6 4.3 4.9 4.9.8.2 1.4 0 1.8-.4l.4-.6-1.8-1-.8.7c-1-.4-1.9-1.3-2.3-2.3l.7-.8-1-1.8z"} />
                            </svg>
                            {" Pedir por WhatsApp "}
                          </button>
                          {" "}
                          <button onClick={$v.prod?.onAdd} style={{ flex: "1 1 180px", minHeight: "52px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", fontSize: "13px", letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer" }} className={"dcp1"}>
                            {"Agregar al pedido"}
                          </button>
                        </div>
                      </>
                    ) : null}
                    {" "}
                    {$v.prodSoldOut ? (
                      <>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginTop: "14px" }}>
                          <button disabled={true} style={{ flex: "1 1 220px", minHeight: "52px", borderRadius: "999px", border: "1px solid #E2CBC1", background: "#F5E6E0", color: "#6E3A34", fontSize: "13px", letterSpacing: ".12em", textTransform: "uppercase", cursor: "not-allowed" }}>
                            {"Agotado"}
                          </button>
                          {" "}
                          <button onClick={$v.prod?.onNotify} style={{ flex: "1 1 180px", minHeight: "52px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", fontSize: "13px", letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer" }} className={"dcp1"}>
                            {"Avisarme cuando llegue"}
                          </button>
                        </div>
                      </>
                    ) : null}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px", fontSize: "13px", color: "#6E3A34" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <svg width={"16"} height={"16"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#A97C50"} strokeWidth={"1.2"}>
                          <path d={"M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z"} />
                          <path d={"M9 12l2.2 2.2L15.5 10"} />
                        </svg>
                        {"Original garantizado, traído de Estados Unidos"}
                      </span>
                      {" "}
                      <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <svg width={"16"} height={"16"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#A97C50"} strokeWidth={"1.2"}>
                          <path d={"M2.5 6.5h11.5v10H2.5zM14 9.5h4l3.5 3.5v3.5H14"} />
                          <circle cx={"6.5"} cy={"17.5"} r={"1.6"} />
                          <circle cx={"17.5"} cy={"17.5"} r={"1.6"} />
                        </svg>
                        {"Pago y envío se confirman por WhatsApp"}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px", borderTop: "1px solid #E2CBC1", paddingTop: "clamp(24px,3vw,32px)" }}>
                    <span style={{ fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#7A532E" }}>
                      {"Pirámide olfativa"}
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "clamp(84px,8vw,112px) 1fr", gridAutoRows: "1fr", columnGap: "clamp(18px,2.4vw,32px)" }}>
                      <svg viewBox={"0 0 120 180"} preserveAspectRatio={"none"} fill={"none"} stroke={"#A97C50"} strokeWidth={"1"} style={{ gridRow: "1 / span 3", gridColumn: "1", width: "100%", height: "100%" }}>
                        <path d={"M60 2 L118 178 L2 178 Z"} vectorEffect={"non-scaling-stroke"} />
                        <path d={"M40.9 60 H79.1 M21.1 120 H98.9"} vectorEffect={"non-scaling-stroke"} />
                      </svg>
                      {" "}
                      {arr($v.tiers).map((t, $index) => (
                        <Fragment key={$index}>
                          <div style={{ gridColumn: "2", display: "flex", flexDirection: "column", justifyContent: "center", gap: "4px", padding: "14px 0", borderBottom: `1px solid ${t?.line ?? ""}` }}>
                            <span style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "22px", color: "#3D0000" }}>
                                {t?.n}
                              </span>
                              <span style={{ fontSize: "10.5px", letterSpacing: ".2em", textTransform: "uppercase", color: "#7A532E" }}>
                                {t?.sub}
                              </span>
                            </span>
                            {" "}
                            <span style={{ fontSize: "14px", lineHeight: "1.55", color: "#6E3A34" }}>
                              {t?.notes}
                            </span>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: "28px", borderTop: "1px solid #E2CBC1", paddingTop: "clamp(24px,3vw,32px)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      <span style={{ fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#7A532E" }}>
                        {"Temporada recomendada"}
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {arr($v.seasons).map((s, $index) => (
                          <Fragment key={$index}>
                            <span style={{ height: "34px", display: "flex", alignItems: "center", padding: "0 14px", borderRadius: "999px", fontSize: "12.5px", border: `1px solid ${s?.border ?? ""}`, background: s?.bg, color: s?.color }}>
                              {s?.label}
                            </span>
                          </Fragment>
                        ))}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {arr($v.moments).map((s, $index) => (
                          <Fragment key={$index}>
                            <span style={{ height: "34px", display: "flex", alignItems: "center", padding: "0 14px", borderRadius: "999px", fontSize: "12.5px", border: `1px solid ${s?.border ?? ""}`, background: s?.bg, color: s?.color }}>
                              {s?.label}
                            </span>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                      {arr($v.meters).map((mt, $index) => (
                        <Fragment key={$index}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
                              <span style={{ fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#7A532E" }}>
                                {mt?.n}
                              </span>
                              {" "}
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "19px", color: "#3D0000" }}>
                                {mt?.word}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: "4px" }}>
                              {arr(mt?.segs).map((sg, $index) => (
                                <Fragment key={$index}>
                                  <span style={{ flex: "1", height: "3px", background: sg?.bg }} />
                                </Fragment>
                              ))}
                            </div>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <section data-screen-label={"Detalle · Reseñas"} style={{ padding: "clamp(64px,8vw,112px) clamp(20px,5.5vw,80px) 0" }}>
              <div style={{ maxWidth: "1280px", margin: "0 auto", borderTop: "1px solid #E2CBC1", paddingTop: "clamp(40px,5vw,72px)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "16px 32px", marginBottom: "clamp(24px,3vw,36px)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(32px,3.6vw,48px)", lineHeight: "1.05", color: "#3D0000" }}>
                      {"Reseñas de "}
                      <em style={{ fontStyle: "italic" }}>
                        {"clientes"}
                      </em>
                    </h2>
                    {$v.prodHasReviews ? (
                      <>
                        <span style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#6E3A34" }}>
                          <span style={{ color: "#A97C50", fontSize: "16px", letterSpacing: ".12em" }}>
                            {$v.prod?.stars}
                          </span>
                          {$v.prod?.avgTxt}
                          {" · "}
                          {$v.prodRatingLabel}
                        </span>
                      </>
                    ) : null}
                  </div>
                  <button onClick={$v.openReviewProd} style={{ minHeight: "44px", padding: "0 24px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", fontSize: "12.5px", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" }} className={"dcp1"}>
                    {"Escribir una reseña"}
                  </button>
                </div>
                {$v.prodNoReviews ? (
                  <>
                    <p style={{ margin: "0", padding: "28px", background: "#F5E6E0", fontSize: "14.5px", lineHeight: "1.6", color: "#6E3A34" }}>
                      {"Aún no hay reseñas de este perfume. Si ya lo probaste, cuéntanos qué te pareció."}
                    </p>
                  </>
                ) : null}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))", gap: "clamp(14px,2vw,24px)" }}>
                  {arr($v.prodReviews).map((r, $index) => (
                    <Fragment key={$index}>
                      <article style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "clamp(22px,2.4vw,30px)", background: "#FBF4F0", border: "1px solid #E2CBC1" }}>
                        <span style={{ color: "#A97C50", fontSize: "15px", letterSpacing: ".12em" }}>
                          {r?.stars}
                        </span>
                        <h3 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "22px", lineHeight: "1.15", color: "#3D0000" }}>
                          {r?.titulo}
                        </h3>
                        <p style={{ margin: "0", flex: "1", fontSize: "14.5px", lineHeight: "1.65", color: "#6E3A34", textWrap: "pretty" }}>
                          {r?.texto}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingTop: "14px", borderTop: "1px solid #E2CBC1" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "baseline" }}>
                            <span style={{ fontSize: "13px", fontWeight: "500", color: "#3D0000" }}>
                              {r?.nombre}
                            </span>
                            {" "}
                            <span style={{ fontSize: "12px", color: "#6E3A34" }}>
                              {r?.fecha}
                            </span>
                          </div>
                          {r?.hasProd ? (
                            <>
                              <button onClick={r?.open} style={{ all: "unset", cursor: "pointer", fontSize: "12px", color: "#7A532E", textDecoration: "underline", textDecorationColor: "#E2CBC1", textUnderlineOffset: "4px" }} className={"dcp6"}>
                                {r?.prodName}
                              </button>
                            </>
                          ) : null}
                          {" "}
                          {r?.noProd ? (
                            <>
                              <span style={{ fontSize: "12px", color: "#7A532E" }}>
                                {"Sobre la tienda"}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </article>
                    </Fragment>
                  ))}
                </div>
              </div>
            </section>
            <section style={{ padding: "clamp(64px,8vw,112px) clamp(20px,5.5vw,80px)" }}>
              <div style={{ maxWidth: "1280px", margin: "0 auto", borderTop: "1px solid #E2CBC1", paddingTop: "clamp(40px,5vw,72px)" }}>
                <h2 style={{ margin: "0 0 clamp(28px,4vw,44px)", fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(32px,3.6vw,48px)", lineHeight: "1.05", color: "#3D0000" }}>
                  {"También te puede "}
                  <em style={{ fontStyle: "italic" }}>
                    {"gustar"}
                  </em>
                </h2>
                <div style={{ display: "flex", gap: "clamp(14px,2vw,24px)", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", margin: "0 calc(clamp(20px,5.5vw,80px) * -1)", padding: "0 clamp(20px,5.5vw,80px)", scrollPaddingInline: "clamp(20px,5.5vw,80px)" }}>
                  {arr($v.related).map((p, $index) => (
                    <Fragment key={$index}>
                      <div style={{ flex: "0 0 max(calc((100% - 3 * clamp(14px,2vw,24px)) / 4), min(240px, 68%))", scrollSnapAlign: "start" }}>
                        <TarjetaProducto p={p} />
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
            </section>
          </main>
        </>
      ) : null}
      <footer data-screen-label={"Footer"} style={{ background: "#3D0000", color: "#F5E6E0", padding: "clamp(56px,7vw,96px) clamp(20px,5.5vw,80px) 28px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: "40px clamp(24px,4vw,56px)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <span style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "26px", letterSpacing: ".14em", lineHeight: "1", color: "#F5E6E0", paddingLeft: ".14em" }}>
                  {"ATELIER"}
                </span>
                {" "}
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "14px", height: "1px", background: "#A97C50" }} />
                  <span style={{ fontWeight: "300", fontSize: "10px", letterSpacing: ".55em", paddingLeft: ".55em", color: "#F5E6E0" }}>
                    {"PARFUMS"}
                  </span>
                  <span style={{ width: "14px", height: "1px", background: "#A97C50" }} />
                </span>
              </div>
              <p style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "19px", lineHeight: "1.4", maxWidth: "26ch", color: "#F5E6E0" }}>
                {"Perfumes originales, traídos de Estados Unidos a Honduras."}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", lineHeight: "1.6" }}>
              <span style={{ fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#F5E6E0", paddingBottom: "10px", borderBottom: "1px solid #6E3A34", marginBottom: "4px" }}>
                {"Visítanos"}
              </span>
              {" "}
              <span>
                {"Tegucigalpa, Honduras"}
                <br />
                {$v.aj?.direccion}
              </span>
              {" "}
              <span>
                {"Horario: "}
                {$v.aj?.horario}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", lineHeight: "1.6" }}>
              <span style={{ fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#F5E6E0", paddingBottom: "10px", borderBottom: "1px solid #6E3A34", marginBottom: "10px" }}>
                {"Contacto"}
              </span>
              {" "}
              <button onClick={$v.contactWA} style={{ display: "flex", alignItems: "center", gap: "10px", minHeight: "36px", background: "none", border: "none", padding: "0", color: "#F5E6E0", fontSize: "14px", cursor: "pointer", textAlign: "left" }} className={"dcp8"}>
                <svg width={"17"} height={"17"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#A97C50"} strokeWidth={"1.2"} strokeLinejoin={"round"}>
                  <path d={"M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"} />
                  <path d={"M9.2 8.2c-.4.4-.6 1-.4 1.8.6 2.2 2.6 4.3 4.9 4.9.8.2 1.4 0 1.8-.4l.4-.6-1.8-1-.8.7c-1-.4-1.9-1.3-2.3-2.3l.7-.8-1-1.8z"} />
                </svg>
                {" "}
                {$v.waTxt}
                {" "}
              </button>
              {" "}
              <a href={$v.redes?.instagram} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "10px", minHeight: "36px", color: "#F5E6E0" }} className={"dcp8"}>
                <svg width={"17"} height={"17"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#A97C50"} strokeWidth={"1.2"}>
                  <rect x={"3.5"} y={"3.5"} width={"17"} height={"17"} rx={"5"} />
                  <circle cx={"12"} cy={"12"} r={"4"} />
                  <circle cx={"17.2"} cy={"6.8"} r={".6"} />
                </svg>
                {" Instagram · "}
                {$v.aj?.instagram}
                {" "}
              </a>
              {" "}
              <a href={$v.redes?.facebook} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "10px", minHeight: "36px", color: "#F5E6E0" }} className={"dcp8"}>
                <svg width={"17"} height={"17"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#A97C50"} strokeWidth={"1.2"} strokeLinejoin={"round"}>
                  <path d={"M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.5L17 11h-3V9a.5.5 0 0 1 .5-.5z"} />
                </svg>
                {" Facebook · "}
                {$v.aj?.facebook}
                {" "}
              </a>
              {" "}
              <a href={$v.redes?.tiktok} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "10px", minHeight: "36px", color: "#F5E6E0" }} className={"dcp8"}>
                <svg width={"17"} height={"17"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#A97C50"} strokeWidth={"1.2"} strokeLinecap={"round"}>
                  <path d={"M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"} />
                  <path d={"M14 4c.5 2.5 2.3 4 5 4"} />
                </svg>
                {" TikTok · "}
                {$v.aj?.tiktok}
                {" "}
              </a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px" }}>
              <span style={{ fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#F5E6E0", paddingBottom: "10px", borderBottom: "1px solid #6E3A34", marginBottom: "10px" }}>
                {"Ayuda"}
              </span>
              {" "}
              <a href={"#preguntas"} onClick={(e) => { e.preventDefault(); $v.goFaq(0); }} style={{ minHeight: "36px", display: "flex", alignItems: "center", color: "#F5E6E0" }} className={"dcp8"}>
                {"Preguntas frecuentes"}
              </a>
              {" "}
              <a href={"#preguntas"} onClick={(e) => { e.preventDefault(); $v.goFaq(3); }} style={{ minHeight: "36px", display: "flex", alignItems: "center", color: "#F5E6E0" }} className={"dcp8"}>
                {"Política de envíos"}
              </a>
              {" "}
              <a href={"#preguntas"} onClick={(e) => { e.preventDefault(); $v.goFaq(6); }} style={{ minHeight: "36px", display: "flex", alignItems: "center", color: "#F5E6E0" }} className={"dcp8"}>
                {"Política de cambios"}
              </a>
            </div>
          </div>
          <div style={{ marginTop: "clamp(48px,6vw,72px)", paddingTop: "22px", borderTop: "1px solid #6E3A34", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "10px", fontSize: "11px", letterSpacing: ".18em", textTransform: "uppercase", color: "#E2CBC1" }}>
            <span>
              {"© 2026 Atelier Parfums"}
            </span>
            {" "}
            <span>
              {"Perfumes 100% originales · Tegucigalpa"}
            </span>
          </div>
        </div>
      </footer>
      {$v.showFloat ? (
        <>
          <button onClick={$v.contactWA} aria-label={"Escríbenos por WhatsApp"} style={{ position: "fixed", right: "clamp(16px,2vw,28px)", bottom: "clamp(16px,2vw,28px)", zIndex: "50", width: "58px", height: "58px", borderRadius: "999px", background: "#3D0000", color: "#F5E6E0", border: "1px solid #A97C50", boxShadow: "0 10px 30px rgba(61,0,0,.28)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} className={"dcp4"}>
            <svg width={"26"} height={"26"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.25"} strokeLinejoin={"round"}>
              <path d={"M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"} />
              <path d={"M9.2 8.2c-.4.4-.6 1-.4 1.8.6 2.2 2.6 4.3 4.9 4.9.8.2 1.4 0 1.8-.4l.4-.6-1.8-1-.8.7c-1-.4-1.9-1.3-2.3-2.3l.7-.8-1-1.8z"} />
            </svg>
          </button>
        </>
      ) : null}
      {" "}
      {$v.hasToast ? (
        <>
          <div style={{ position: "fixed", left: "50%", bottom: "96px", transform: "translateX(-50%)", zIndex: "70", display: "flex", alignItems: "center", gap: "16px", padding: "10px 10px 10px 22px", borderRadius: "999px", background: "#3D0000", color: "#F5E6E0", fontSize: "13px", boxShadow: "0 10px 30px rgba(61,0,0,.25)", width: "max-content", maxWidth: "calc(100vw - 32px)" }}>
            <span>
              {$v.toast}
            </span>
            {" "}
            {$v.toastPedido ? (
              <>
                <button onClick={$v.openDrawer} style={{ minHeight: "36px", padding: "0 16px", borderRadius: "999px", border: "1px solid #F5E6E0", background: "transparent", color: "#F5E6E0", fontSize: "11.5px", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap" }}>
                  {"Ver pedido"}
                </button>
              </>
            ) : null}
          </div>
        </>
      ) : null}
      {" "}
      {$v.filtersPanel ? (
        <>
          <div style={{ position: "fixed", inset: "0", zIndex: "80", display: "flex" }}>
            <div onClick={$v.closeFilters} style={{ position: "absolute", inset: "0", background: "rgba(61,0,0,.42)" }} />
            <aside style={{ position: "relative", width: "min(360px,88%)", height: "100%", background: "#FBF4F0", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px 14px 22px", borderBottom: "1px solid #E2CBC1" }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: "300", color: "#3D0000" }}>
                  {"Filtros"}
                </span>
                {" "}
                <button onClick={$v.closeFilters} aria-label={"Cerrar"} style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: "#3D0000", cursor: "pointer" }}>
                  <svg width={"20"} height={"20"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.2"}>
                    <path d={"M6 6l12 12M18 6L6 18"} />
                  </svg>
                </button>
              </div>
              <div style={{ flex: "1", overflowY: "auto", padding: "0 22px" }}>
                {arr($v.groups).map((g, $index) => (
                  <Fragment key={$index}>
                    <div style={{ borderBottom: "1px solid #E2CBC1", padding: "18px 0", display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "11px", letterSpacing: ".26em", textTransform: "uppercase", color: "#7A532E", marginBottom: "6px" }}>
                        {g?.title}
                      </span>
                      {" "}
                      {arr(g?.options).map((o, $index) => (
                        <Fragment key={$index}>
                          <button onClick={o?.toggle} style={{ display: "flex", alignItems: "center", gap: "14px", minHeight: "44px", background: "none", border: "none", padding: "0", cursor: "pointer", textAlign: "left", fontSize: "15px", color: "#3D0000" }}>
                            <span style={{ width: "18px", height: "18px", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${o?.boxBorder ?? ""}`, background: o?.boxBg }}>
                              {o?.checked ? (
                                <>
                                  <svg width={"12"} height={"12"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#F5E6E0"} strokeWidth={"2.4"}>
                                    <path d={"M5 12.5l4.5 4.5L19 7.5"} />
                                  </svg>
                                </>
                              ) : null}
                            </span>
                            {" "}
                            <span>
                              {o?.label}
                            </span>
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </Fragment>
                ))}
              </div>
              <div style={{ display: "flex", gap: "10px", padding: "14px 22px", borderTop: "1px solid #E2CBC1" }}>
                <button onClick={$v.clearAll} style={{ flex: "1", minHeight: "48px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", fontSize: "12px", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" }}>
                  {"Limpiar"}
                </button>
                {" "}
                <button onClick={$v.closeFilters} style={{ flex: "1.6", minHeight: "48px", borderRadius: "999px", border: "1px solid #3D0000", background: "#3D0000", color: "#F5E6E0", fontSize: "12px", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" }}>
                  {$v.seeResultsLabel}
                </button>
              </div>
            </aside>
          </div>
        </>
      ) : null}
      {" "}
      {$v.rfOpen ? (
        <>
          <div data-screen-label={"Escribir reseña"} style={{ position: "fixed", inset: "0", zIndex: "95", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <div onClick={$v.closeReview} style={{ position: "absolute", inset: "0", background: "rgba(61,0,0,.42)" }} />
            <div style={{ position: "relative", width: "min(540px,100%)", maxHeight: "calc(100vh - 32px)", overflowY: "auto", background: "#FBF4F0", padding: "clamp(22px,4vw,36px)", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 30px 80px rgba(61,0,0,.25)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                    {"Tu opinión"}
                  </span>
                  {" "}
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(30px,4vw,38px)", lineHeight: "1", color: "#3D0000" }}>
                    {"Escribe tu "}
                    <em style={{ fontStyle: "italic" }}>
                      {"reseña"}
                    </em>
                  </span>
                </div>
                <button onClick={$v.closeReview} aria-label={"Cerrar"} style={{ width: "44px", height: "44px", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: "#3D0000", cursor: "pointer", margin: "-8px -10px 0 0" }}>
                  <svg width={"20"} height={"20"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.2"}>
                    <path d={"M6 6l12 12M18 6L6 18"} />
                  </svg>
                </button>
              </div>
              {$v.rfSent ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "flex-start", padding: "8px 0" }}>
                    <p style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", color: "#3D0000" }}>
                      {"Gracias por "}
                      <em style={{ fontStyle: "italic" }}>
                        {"tu reseña"}
                      </em>
                    </p>
                    <p style={{ margin: "0", fontSize: "14.5px", lineHeight: "1.65", color: "#6E3A34" }}>
                      {"La publicaremos en cuanto la revisemos. Tu opinión ayuda a otros clientes a elegir su perfume."}
                    </p>
                    <button onClick={$v.closeReview} style={{ minHeight: "48px", padding: "0 28px", borderRadius: "999px", border: "1px solid #3D0000", background: "#3D0000", color: "#F5E6E0", fontSize: "12.5px", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer", marginTop: "6px" }}>
                      {"Cerrar"}
                    </button>
                  </div>
                </>
              ) : null}
              {" "}
              {$v.rfForm ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                        {"Calificación"}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                        {arr($v.rfStars).map((st, $index) => (
                          <Fragment key={$index}>
                            <button onClick={st?.set} aria-label={st?.aria} style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", fontSize: "28px", lineHeight: "1", color: st?.color, padding: "0" }}>
                              {"★"}
                            </button>
                          </Fragment>
                        ))}
                        {" "}
                        <span style={{ marginLeft: "10px", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "19px", color: "#3D0000" }}>
                          {$v.rfStarsLabel}
                        </span>
                      </div>
                    </div>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                        {"¿Sobre qué es tu reseña?"}
                      </span>
                      {" "}
                      <select value={$v.rfPid ?? ""} onChange={$v.onRfPid} style={{ width: "100%", minHeight: "46px", padding: "0 16px", border: "1px solid #E2CBC1", borderRadius: "10px", background: "transparent", fontSize: "14.5px", color: "#3D0000", outline: "none", cursor: "pointer" }}>
                        {arr($v.rfProducts).map((o, $index) => (
                          <Fragment key={$index}>
                            <option value={o?.v ?? ""}>
                              {o?.n}
                            </option>
                          </Fragment>
                        ))}
                      </select>
                    </label>
                    {" "}
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                        {"Tu nombre"}
                      </span>
                      {" "}
                      <input value={$v.rfNombre ?? ""} onChange={$v.onRfNombre} placeholder={"Ej. María F."} style={{ width: "100%", minHeight: "46px", padding: "0 16px", border: "1px solid #E2CBC1", borderRadius: "10px", background: "transparent", fontSize: "14.5px", color: "#3D0000", outline: "none" }} />
                    </label>
                    {" "}
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                        {"Título (opcional)"}
                      </span>
                      {" "}
                      <input value={$v.rfTitulo ?? ""} onChange={$v.onRfTitulo} placeholder={"Resume tu experiencia"} style={{ width: "100%", minHeight: "46px", padding: "0 16px", border: "1px solid #E2CBC1", borderRadius: "10px", background: "transparent", fontSize: "14.5px", color: "#3D0000", outline: "none" }} />
                    </label>
                    {" "}
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                        {"Tu reseña"}
                      </span>
                      {" "}
                      <textarea value={$v.rfTexto ?? ""} onChange={$v.onRfTexto} rows={"4"} placeholder={"¿Qué te pareció el perfume, la duración y la atención?"} style={{ width: "100%", minHeight: "46px", padding: "0 16px", border: "1px solid #E2CBC1", borderRadius: "10px", background: "transparent", fontSize: "14.5px", color: "#3D0000", outline: "none", padding: "12px 16px", lineHeight: "1.55", resize: "vertical", fontFamily: "Jost, sans-serif" }} />
                    </label>
                    {" "}
                    {$v.rfHasError ? (
                      <>
                        <p style={{ margin: "0", fontSize: "13px", color: "#3D0000", padding: "10px 14px", background: "#F5E6E0", border: "1px solid #E2CBC1" }}>
                          {$v.rfError}
                        </p>
                      </>
                    ) : null}
                    {" "}
                    <button onClick={$v.submitReview} style={{ minHeight: "52px", borderRadius: "999px", border: "1px solid #3D0000", background: "#3D0000", color: "#F5E6E0", fontSize: "13px", letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer" }} className={"dcp4"}>
                      {"Enviar reseña"}
                    </button>
                    <p style={{ margin: "0", fontSize: "12.5px", lineHeight: "1.55", color: "#6E3A34" }}>
                      {"Tu reseña se publicará después de que la revisemos."}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
      {" "}
      {$v.drawer ? (
        <>
          <div data-screen-label={"Mi pedido"} style={{ position: "fixed", inset: "0", zIndex: "90", display: "flex", justifyContent: "flex-end" }}>
            <div onClick={$v.closeDrawer} style={{ position: "absolute", inset: "0", background: "rgba(61,0,0,.42)" }} />
            <aside style={{ position: "relative", width: "min(440px,100%)", height: "100%", background: "#FBF4F0", display: "flex", flexDirection: "column", boxShadow: "-20px 0 60px rgba(61,0,0,.18)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 14px 16px 24px", borderBottom: "1px solid #E2CBC1" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "30px", fontWeight: "300", color: "#3D0000" }}>
                    {"Mi "}
                    <em style={{ fontStyle: "italic" }}>
                      {"pedido"}
                    </em>
                  </span>
                  {" "}
                  <span style={{ fontSize: "12px", letterSpacing: ".06em", color: "#6E3A34" }}>
                    {$v.itemsLabel}
                  </span>
                </div>
                <button onClick={$v.closeDrawer} aria-label={"Cerrar"} style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: "#3D0000", cursor: "pointer" }}>
                  <svg width={"20"} height={"20"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.2"}>
                    <path d={"M6 6l12 12M18 6L6 18"} />
                  </svg>
                </button>
              </div>
              <div style={{ flex: "1", overflowY: "auto", padding: "0 24px" }}>
                {$v.cartEmpty ? (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "14px", padding: "72px 8px" }}>
                      <svg width={"40"} height={"40"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#A97C50"} strokeWidth={".9"} strokeLinejoin={"round"}>
                        <path d={"M5.5 8h13l-1 12.5h-11L5.5 8z"} />
                        <path d={"M9 10V6.5a3 3 0 0 1 6 0V10"} />
                      </svg>
                      <p style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: "300", color: "#3D0000" }}>
                        {"Tu pedido está "}
                        <em style={{ fontStyle: "italic" }}>
                          {"vacío"}
                        </em>
                      </p>
                      <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#6E3A34", maxWidth: "30ch" }}>
                        {"Agrega los perfumes que te gusten y envíanos todo en un solo mensaje."}
                      </p>
                      <button onClick={$v.goCatalogAll} style={{ minHeight: "44px", padding: "0 24px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", fontSize: "12px", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer", marginTop: "6px" }}>
                        {"Ver catálogo"}
                      </button>
                    </div>
                  </>
                ) : null}
                {" "}
                {arr($v.cartItems).map((it, $index) => (
                  <Fragment key={$index}>
                    <div style={{ display: "grid", gridTemplateColumns: "76px 1fr", gap: "16px", padding: "20px 0", borderBottom: "1px solid #E2CBC1" }}>
                      <div style={{ position: "relative", aspectRatio: "4 / 5", background: "#F5E6E0", color: "#6E3A34" }}>
                        <ImageSlot id={it?.slot} shape={"rect"} placeholder={"[FOTO]"} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "0" }}>
                        <span style={{ fontSize: "10.5px", letterSpacing: ".24em", textTransform: "uppercase", color: "#7A532E" }}>
                          {it?.marca}
                        </span>
                        {" "}
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "21px", lineHeight: "1.15", color: "#3D0000" }}>
                          {it?.nombre}
                        </span>
                        {" "}
                        <span style={{ fontSize: "12px", color: "#6E3A34" }}>
                          {it?.meta}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginTop: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", height: "44px", border: "1px solid #E2CBC1", borderRadius: "999px" }}>
                            <button onClick={it?.dec} aria-label={"Quitar uno"} style={{ width: "44px", height: "42px", background: "none", border: "none", color: "#3D0000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.4"}>
                                <path d={"M5 12h14"} />
                              </svg>
                            </button>
                            {" "}
                            <span style={{ minWidth: "20px", textAlign: "center", fontSize: "14px" }}>
                              {it?.n}
                            </span>
                            {" "}
                            <button onClick={it?.inc} aria-label={"Agregar uno"} style={{ width: "44px", height: "42px", background: "none", border: "none", color: "#3D0000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.4"}>
                                <path d={"M12 5v14M5 12h14"} />
                              </svg>
                            </button>
                          </div>
                          <span style={{ fontSize: "15px", fontWeight: "500", whiteSpace: "nowrap" }}>
                            {it?.sub}
                          </span>
                        </div>
                        <button onClick={it?.remove} style={{ alignSelf: "flex-start", minHeight: "32px", background: "none", border: "none", padding: "0", fontSize: "12px", color: "#6E3A34", textDecoration: "underline", textDecorationColor: "#E2CBC1", textUnderlineOffset: "4px", cursor: "pointer" }} className={"dcp6"}>
                          {"Quitar"}
                        </button>
                      </div>
                    </div>
                  </Fragment>
                ))}
              </div>
              {$v.cartHas ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "18px 24px 22px", borderTop: "1px solid #E2CBC1", background: "#FBF4F0" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                        {"Tu nombre (opcional)"}
                      </span>
                      {" "}
                      <input value={$v.cliente ?? ""} onChange={$v.onCliente} placeholder={"Para saludarte por tu nombre"} style={{ height: "44px", padding: "0 16px", border: "1px solid #E2CBC1", borderRadius: "10px", background: "transparent", fontSize: "14px", color: "#3D0000", outline: "none" }} />
                    </label>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: "11px", letterSpacing: ".26em", textTransform: "uppercase", color: "#7A532E" }}>
                        {"Total estimado"}
                      </span>
                      {" "}
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "30px", color: "#3D0000" }}>
                        {$v.totalTxt}
                      </span>
                    </div>
                    <p style={{ margin: "0", fontSize: "12.5px", lineHeight: "1.55", color: "#6E3A34" }}>
                      {"El envío y la forma de pago se confirman por WhatsApp. No se realiza ningún cobro en este sitio."}
                    </p>
                    <button onClick={$v.toggleMsg} style={{ alignSelf: "flex-start", minHeight: "32px", background: "none", border: "none", padding: "0", fontSize: "12px", color: "#3D0000", textDecoration: "underline", textDecorationColor: "#A97C50", textUnderlineOffset: "4px", cursor: "pointer" }}>
                      {$v.msgToggleLabel}
                    </button>
                    {" "}
                    {$v.showMsg ? (
                      <>
                        <pre style={{ margin: "0", maxHeight: "180px", overflow: "auto", padding: "14px 16px", background: "#F5E6E0", fontFamily: "Jost, sans-serif", fontSize: "12.5px", lineHeight: "1.6", color: "#3D0000", whiteSpace: "pre-wrap" }}>
                          {$v.msgText}
                        </pre>
                      </>
                    ) : null}
                    {" "}
                    <button onClick={$v.sendOrder} style={{ minHeight: "52px", borderRadius: "999px", border: "1px solid #3D0000", background: "#3D0000", color: "#F5E6E0", fontSize: "13px", letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }} className={"dcp4"}>
                      <svg width={"18"} height={"18"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.3"} strokeLinejoin={"round"}>
                        <path d={"M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"} />
                        <path d={"M9.2 8.2c-.4.4-.6 1-.4 1.8.6 2.2 2.6 4.3 4.9 4.9.8.2 1.4 0 1.8-.4l.4-.6-1.8-1-.8.7c-1-.4-1.9-1.3-2.3-2.3l.7-.8-1-1.8z"} />
                      </svg>
                      {" Enviar pedido por WhatsApp "}
                    </button>
                    {" "}
                    <button onClick={$v.closeDrawer} style={{ minHeight: "44px", background: "none", border: "none", fontSize: "12px", letterSpacing: ".14em", textTransform: "uppercase", color: "#3D0000", cursor: "pointer" }}>
                      {"Seguir viendo perfumes"}
                    </button>
                  </div>
                </>
              ) : null}
            </aside>
          </div>
        </>
      ) : null}
    </div>
  </>
  );
}
