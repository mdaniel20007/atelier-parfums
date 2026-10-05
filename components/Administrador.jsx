'use client';
// Generado desde Administrador.dc.html con tools/convert-dc.mjs y luego ajustado a mano.
import React, { Fragment } from 'react';
import { DCLogic, arr } from '@/lib/dc';
import ImageSlot from '@/components/ImageSlot';
import AdminEncargos from '@/components/AdminEncargos';

export default class Administrador extends DCLogic {
  CATS = ['Todos', 'Hombre', 'Mujer', 'Árabes', 'De diseñador', 'Descuento'];
  FAMS = [['frescos', 'Frescos y cítricos'], ['florales', 'Florales'], ['dulces', 'Dulces y avainillados'], ['amaderados', 'Amaderados'], ['orientales', 'Orientales y especiados'], ['acuaticos', 'Acuáticos']];
  ORDER_ST = {
    'Por confirmar': ['#3D0000', '#F5E6E0', '#3D0000'],
    'Confirmado': ['#F5E6E0', '#3D0000', '#3D0000'],
    'Enviado': ['#FBF4F0', '#7A532E', '#A97C50'],
    'Entregado': ['#E2CBC1', '#3D0000', '#E2CBC1'],
    'Cancelado': ['transparent', '#6E3A34', '#E2CBC1']
  };
  state = { w: typeof window !== 'undefined' ? window.innerWidth : 1280, db: null, tab: 'resumen', mTab: 'general', mDays: 30, mSrc: null, mMetric: 'clics', mSort: 'clics', clearConfirm: false, q: '', cat: 'Todos', edit: null, isNew: false, confirmDel: false, revTab: 'pendiente', aj: null, toast: null };

  componentDidMount() {
    this._r = () => this.setState({ w: window.innerWidth });
    window.addEventListener('resize', this._r);
    const init = () => {
      if (window.AtelierDatos) {
        const db = window.AtelierDatos.load();
        this.setState({ db, aj: { ...db.ajustes } });
        this._u = window.AtelierDatos.subscribe(d => this.setState({ db: d }));
        this._ev = () => { this._mKey = null; this.forceUpdate(); };
        this._evS = e => { if (e.key === window.AtelierDatos.EKEY) this._ev(); };
        window.addEventListener('atelier-eventos', this._ev);
        window.addEventListener('storage', this._evS);
        this.readHash(db);
        window.AtelierDatos.cargarEventos();
        this._err = e => this.showToast(e.detail);
        window.addEventListener('atelier-error', this._err);
      } else this._i = setTimeout(init, 40);
    };
    init();
  }
  componentWillUnmount() { window.removeEventListener('resize', this._r); clearTimeout(this._t); clearTimeout(this._i); if (this._u) this._u(); window.removeEventListener('atelier-eventos', this._ev); window.removeEventListener('storage', this._evS); window.removeEventListener('atelier-error', this._err); }
  readHash(db) {
    const parts = decodeURIComponent(location.hash.slice(1)).split('&').filter(Boolean);
    parts.forEach(x => {
      const [k, v] = x.split('=');
      if (['resumen', 'metricas', 'pedidos', 'encargos', 'productos', 'resenas', 'ajustes'].includes(k)) this.setState({ tab: k, ...(k === 'metricas' && v ? { mTab: v } : {}) });
      if (k === 'editar' && v) { const p = db.productos.find(p => p.id === v); if (p) this.setState({ tab: 'productos', edit: JSON.parse(JSON.stringify(p)), isNew: false }); }
    });
  }
  get P() { return (this.state.db && this.state.db.productos) || []; }
  pf(p) { return Math.round((Number(p.precio) || 0) * (1 - (Number(p.descuento) || 0) / 100)); }
  money(n) { return 'L ' + Math.round(n).toLocaleString('en-US'); }
  stars(n) { const r = Math.round(n); return '★'.repeat(r) + '☆'.repeat(5 - r); }
  save(fn, msg) {
    const db = JSON.parse(JSON.stringify(this.state.db));
    fn(db);
    this.setState({ db });
    window.AtelierDatos.save(db);
    if (msg) this.showToast(msg);
  }
  showToast(m) { this.setState({ toast: m }); clearTimeout(this._t); this._t = setTimeout(() => this.setState({ toast: null }), 2600); }
  matchCat(p, c) {
    if (c === 'Todos') return true;
    if (c === 'Hombre') return p.genero === 'Hombre' || p.genero === 'Unisex';
    if (c === 'Mujer') return p.genero === 'Mujer' || p.genero === 'Unisex';
    if (c === 'Descuento') return (p.descuento || 0) > 0;
    return p.linea === c;
  }
  tag(p) {
    if (p.estado === 'agotado') return ['Agotado', '#E2CBC1', '#3D0000', '#E2CBC1'];
    if (p.estado === 'pocas') return ['Pocas unidades', '#FBF4F0', '#7A532E', '#A97C50'];
    return ['Disponible', '#F5E6E0', '#3D0000', '#E2CBC1'];
  }
  setEstado(id, estado) { this.save(db => { const p = db.productos.find(x => x.id === id); if (p) p.estado = estado; }, 'Estado actualizado'); }
  openEdit(p) { this.setState({ edit: JSON.parse(JSON.stringify(p)), isNew: false, confirmDel: false }); }
  setE(patch) { this.setState(s => ({ edit: { ...s.edit, ...patch } })); }
  orderVm(o) {
    const st = this.ORDER_ST[o.estado] || this.ORDER_ST['Por confirmar'];
    const lines = (o.items || []).map(it => { const p = this.P.find(x => x.id === it.pid); return { txt: `${it.n} × ${p ? p.marca + ' · ' + p.nombre : it.pid}`, sub: this.money(it.precio * it.n) }; });
    const sub = (o.items || []).reduce((a, it) => a + it.precio * it.n, 0);
    const total = o.total != null ? o.total : sub + (o.envio || 0);
    const PAGO = { efectivo: 'Efectivo contra entrega', transferencia: 'Transferencia bancaria' };
    const tel = String(o.telefono || '').replace(/\D/g, '');
    return {
      id: o.id, fecha: o.fecha, nombre: o.nombre, estado: o.estado, ejemplo: !!o.ejemplo, lines, totalTxt: this.money(total),
      envioTxt: o.zona ? (o.envio == null ? 'Por confirmar' : o.envio === 0 ? 'Gratis' : this.money(o.envio)) : '',
      zona: o.zona || '', telefono: o.telefono || '', direccion: o.direccion || '', ubicacion: o.ubicacion || '', notas: o.notas || '',
      pago: PAGO[o.pago] || '', waLink: tel ? 'https://wa.me/' + (tel.length === 8 ? '504' + tel : tel) : '',
      resumen: lines.map(l => l.txt).join(', '),
      stBg: st[0], stColor: st[1], stBorder: st[2],
      setEstado: e => { const v = e.target.value; this.save(db => { const x = db.pedidos.find(y => y.id === o.id); if (x) x.estado = v; }, `${o.id}: ${v}`); },
      remove: () => this.save(db => { db.pedidos = db.pedidos.filter(y => y.id !== o.id); }, 'Registro eliminado')
    };
  }
  revVm(r) {
    const p = r.pid ? this.P.find(x => x.id === r.pid) : null;
    const setSt = (estado, msg) => this.save(db => { const x = db.resenas.find(y => y.id === r.id); if (x) x.estado = estado; }, msg);
    return {
      ...r, titulo: r.titulo || 'Sin título', stars: this.stars(r.estrellas), prodName: p ? `${p.marca} · ${p.nombre}` : 'La tienda en general', ejemplo: !!r.ejemplo,
      canApprove: r.estado !== 'publicada', canHide: r.estado !== 'oculta',
      approveLabel: r.estado === 'oculta' ? 'Publicar' : 'Aprobar',
      approve: () => setSt('publicada', 'Reseña publicada en la tienda'),
      hide: () => setSt('oculta', 'Reseña ocultada'),
      remove: () => this.save(db => { db.resenas = db.resenas.filter(y => y.id !== r.id); }, 'Reseña eliminada')
    };
  }

  renderVals() {
    const s = this.state;
    const db = s.db || { productos: [], resenas: [], pedidos: [], ajustes: {} };
    const mobile = s.w < 860;
    const pend = db.resenas.filter(r => r.estado === 'pendiente');
    const porConfirmar = (db.pedidos || []).filter(o => o.estado === 'Por confirmar');
    const encNuevos = (db.encargos || []).filter(e => e.estado === 'Nuevo');
    const goTab = t => () => { this.setState({ tab: t }); try { history.replaceState(null, '', '#' + t); window.scrollTo(0, 0); } catch (e) {} };
    const TABS = [['resumen', 'Resumen', 0], ['metricas', 'Métricas', 0], ['pedidos', 'Pedidos', porConfirmar.length], ['encargos', 'Encargos', encNuevos.length], ['productos', 'Productos', 0], ['resenas', 'Reseñas', pend.length], ['ajustes', 'Ajustes', 0]];
    const titles = { resumen: ['Panel', 'Resumen'], metricas: ['Tableros', 'Métricas'], pedidos: ['Ventas por WhatsApp', 'Pedidos'], encargos: ['Perfumes por traer', 'Encargos'], productos: ['Catálogo', 'Productos'], resenas: ['Clientes', 'Reseñas'], ajustes: ['Tienda', 'Ajustes'] };

    // ---- Métricas ----
    const MX = window.AtelierMetricas;
    const realEv = window.AtelierDatos && window.AtelierDatos.eventos ? window.AtelierDatos.eventos() : [];
    const useSample = false; // Sin datos de ejemplo: solo eventos reales
    const mCats = ['Hombre', 'Mujer', 'Árabes', 'De diseñador', 'Descuento'];
    const mKey = (useSample ? 'S' : 'R' + realEv.length) + '|' + s.mDays + '|' + this.P.map(p => p.id + p.estado).join(',');
    if (MX && s.db && this.P.length && this._mKey !== mKey) {
      const evs = useSample ? MX.sample(this.P) : realEv;
      const mc = (p, c) => this.matchCat(p, c);
      this._mKey = mKey;
      this._m = MX.aggregate(evs, this.P, s.mDays, mCats, mc);
      this._m30 = s.mDays === 30 ? this._m : MX.aggregate(evs, this.P, 30, mCats, mc);
    }
    const m = this._m, m30 = this._m30;
    const nf = n => Math.round(n).toLocaleString('en-US');
    const pc = (a, b) => b ? Math.round(a / b * 100) : 0;
    const dl = (c, p) => { if (!p) return { delta: c ? 'Sin datos del periodo anterior' : '—', dColor: '#6E3A34' }; const d = (c - p) / p * 100; return { delta: (d >= 0 ? '↑ ' : '↓ ') + Math.abs(d).toFixed(0) + '% vs. periodo anterior', dColor: d >= 0 ? '#3D0000' : '#7A532E' }; };
    const chipV = on => ({ border: on ? '#3D0000' : '#E2CBC1', bg: on ? '#3D0000' : 'transparent', color: on ? '#F5E6E0' : '#6E3A34' });
    const pById = id => this.P.find(p => p.id === id) || { nombre: id, marca: '' };
    const dayLbl = t => new Date(t).toLocaleDateString('es-HN', { day: 'numeric', month: 'short' }).replace('.', '');
    const METRICS = [['visitas', 'Visitas'], ['clics', 'Clics'], ['wa', 'WhatsApp'], ['pedidos', 'Pedidos']];
    const bars = (rows, key, color, lblFn) => { const mx = Math.max(1, ...rows.map(r => r[key])); return rows.map((r, i) => ({ h: (r[key] / mx * 100) + '%', color, tip: lblFn(r, i, true) + ' · ' + nf(r[key]), lbl: lblFn(r, i, false) })); };
    const step = s.mDays <= 7 ? 1 : 5;
    const dLbl = (r, i, full) => full || i % step === 0 || i === (m ? m.daily.length - 1 : 0) ? (s.mDays <= 7 ? new Date(r.t).toLocaleDateString('es-HN', { weekday: 'short', day: 'numeric' }).replace('.', '') : dayLbl(r.t)) : '';
    const hb = (rows, color) => { const mx = Math.max(1, ...rows.map(r => r.v)); return rows.map(r => ({ ...r, w: (r.v / mx * 100) + '%', color: r.color || color })); };
    const prodStats = m ? m.prod.map(x => { const p = pById(x.pid); return { ...x, nombre: p.nombre, marca: p.marca, slot: 'foto-' + x.pid + '-1', intent: x.personas ? x.intencion / x.personas : 0 }; }) : [];
    const withP = prodStats.filter(x => x.personas > 0);
    const medianP = withP.length ? withP.map(x => x.personas).sort((a, b) => a - b)[Math.floor(withP.length / 2)] : 0;
    const insight = x => ({ marca: x.marca, nombre: x.nombre, personasTxt: nf(x.personas) + ' personas lo abrieron', intentTxt: Math.round(x.intent * 100) + '%' });
    const SORTS = [['clics', 'Clics'], ['personas', 'Personas'], ['wa', 'WhatsApp'], ['agregar', 'Agregados']];
    const sorted = [...prodStats].sort((a, b) => b[s.mSort] - a[s.mSort]);
    const mxSort = Math.max(1, ...sorted.map(x => x[s.mSort]));
    const sortName = { clics: 'clics', personas: 'personas', wa: 'a WhatsApp', agregar: 'agregados' }[s.mSort];
    const k = m ? m.kpi : {}, kp = m ? m.prev : {};
    const pedCount = {};
    if (m) prodStats.forEach(x => { if (x.pedidos) pedCount[x.pid] = x.pedidos; });
    const dow = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const devTot = m ? (m.dev.mob + m.dev.desk) : 0;
    const clicsMap = {};
    if (m30) m30.prod.forEach(x => { clicsMap[x.pid] = x; });
    const metricas = !m ? {} : {
      mKpis: [
        { label: 'Visitas', value: nf(k.visitas), ...dl(k.visitas, kp.visitas) },
        { label: 'Personas', value: nf(k.personas), ...dl(k.personas, kp.personas) },
        { label: 'Clics en publicaciones', value: nf(k.clics), ...dl(k.clics, kp.clics) },
        { label: 'Clics a WhatsApp', value: nf(k.wa), ...dl(k.wa, kp.wa) },
        { label: 'Agregados al pedido', value: nf(k.agregar), ...dl(k.agregar, kp.agregar) },
        { label: 'Pedidos enviados', value: nf(k.pedidos), ...dl(k.pedidos, kp.pedidos) },
        { label: 'Conversión', value: k.conv.toFixed(1) + '%', delta: 'Pedidos ÷ visitas', dColor: '#6E3A34' }
      ],
      mMetrics: METRICS.map(([key, l]) => ({ label: l, ...chipV(s.mMetric === key), go: () => this.setState({ mMetric: key }) })),
      dailyTitle: (METRICS.find(x => x[0] === s.mMetric) || [0, ''])[1] + ' por día, últimos ' + s.mDays + ' días',
      dailyBars: bars(m.daily, s.mMetric, '#3D0000', dLbl),
      barGap: s.mDays <= 7 ? '10px' : '3px',
      funnel: hb([
        { label: 'Visitantes', v: m.funnel[0] },
        { label: 'Hicieron clic en un perfume', v: m.funnel[1] },
        { label: 'Agregaron al pedido', v: m.funnel[2] },
        { label: 'Enviaron pedido por WhatsApp', v: m.funnel[3] }
      ].map(r => ({ ...r, val: nf(r.v), sub: pc(r.v, m.funnel[0]) + '% de los visitantes' })), '#3D0000'),
      devMobW: (devTot ? m.dev.mob / devTot * 100 : 0) + '%',
      devMob: pc(m.dev.mob, devTot) + '%', devDesk: pc(m.dev.desk, devTot) + '%',
      weekBars: hb([1, 2, 3, 4, 5, 6, 0].map(i => ({ label: dow[i], v: m.semana[i], val: nf(m.semana[i]) })), '#A97C50'),
      lowIntent: withP.filter(x => x.personas >= medianP).sort((a, b) => a.intent - b.intent).slice(0, 3).map(insight),
      highIntent: withP.filter(x => x.personas >= Math.max(3, medianP / 2)).sort((a, b) => b.intent - a.intent).slice(0, 3).map(insight),
      mSorts: SORTS.map(([key, l]) => ({ label: l, ...chipV(s.mSort === key), go: () => this.setState({ mSort: key }) })),
      prodRows: sorted.map((x, i) => ({ rank: i + 1, slot: x.slot, nombre: x.nombre, marca: x.marca, w: (x[s.mSort] / mxSort * 100) + '%', mainTxt: nf(x[s.mSort]) + ' ' + sortName, detail: nf(x.clics) + ' clics · ' + nf(x.personas) + ' personas · ' + nf(x.vistas) + ' vistas · ' + nf(x.wa) + ' WhatsApp · ' + nf(x.agregar) + ' agregados · ' + Math.round(x.intent * 100) + '% con intención' })),
      catBars: hb(m.cats.map(c => ({ label: c.cat, v: c.clics, val: nf(c.clics) + ' clics', sub: nf(c.nav) + ' veces desde el menú' })), '#3D0000'),
      busqRows: m.busq.slice(0, 10).map(b => ({ q: b.q, n: nf(b.n), noRes: !b.res })),
      noBusq: !m.busq.length,
      missingBars: hb(m.busq.filter(b => !b.res).slice(0, 6).map(b => ({ label: '“' + b.q + '”', v: b.n, val: nf(b.n) + ' búsquedas' })), '#A97C50'),
      noMissing: !m.busq.some(b => !b.res),
      pKpis: [
        { label: 'Pedidos enviados', value: nf(k.pedidos), ...dl(k.pedidos, kp.pedidos) },
        { label: 'Total estimado', value: 'L ' + nf(k.ingresos), ...dl(k.ingresos, kp.ingresos) },
        { label: 'Ticket promedio', value: 'L ' + nf(k.pedidos ? k.ingresos / k.pedidos : 0), ...dl(k.pedidos ? k.ingresos / k.pedidos : 0, kp.pedidos ? kp.ingresos / kp.pedidos : 0) },
        { label: 'Perfumes por pedido', value: (k.pedidos ? k.articulos / k.pedidos : 0).toFixed(1), delta: 'Promedio', dColor: '#6E3A34' }
      ],
      pedidoBars: bars(m.daily, 'pedidos', '#3D0000', dLbl),
      hourBars: bars(m.horas.map((v, i) => ({ v, i })), 'v', '#A97C50', (r, i, full) => full ? (i + ':00') : (i % 3 === 0 ? String(i) : '')),
      topPedidos: hb(Object.keys(pedCount).sort((a, b) => pedCount[b] - pedCount[a]).slice(0, 6).map(id => ({ label: pById(id).nombre, v: pedCount[id], val: nf(pedCount[id]) + (pedCount[id] === 1 ? ' pedido' : ' pedidos') })), '#3D0000'),
      noPedidos: !Object.keys(pedCount).length
    };
    const rows = this.P.filter(p => this.matchCat(p, s.cat) && (!s.q.trim() || (p.nombre + ' ' + p.marca).toLowerCase().includes(s.q.trim().toLowerCase()))).map(p => {
      const t = this.tag(p);
      const hasDesc = (p.descuento || 0) > 0;
      return {
        ...p, slot: `foto-${p.id}-1`, meta: `${p.conc} · ${p.ml} ml`, cat: `${p.genero} · ${p.linea}`,
        precioTxt: this.money(p.precio), finalTxt: this.money(this.pf(p)), hasDesc,
        descLabel: hasDesc ? `−${p.descuento}%` : '—', descColor: hasDesc ? '#3D0000' : '#6E3A34',
        tagLabel: t[0], tagBg: t[1], tagColor: t[2], tagBorder: t[3], filt: p.estado === 'agotado' ? 'grayscale(1)' : 'none',
        clics: clicsMap[p.id] ? nf(clicsMap[p.id].clics) : '0', personasTxt: (clicsMap[p.id] ? nf(clicsMap[p.id].personas) : '0') + ' personas',
        clicsTxt: (clicsMap[p.id] ? nf(clicsMap[p.id].clics) : '0') + ' clics · ' + (clicsMap[p.id] ? nf(clicsMap[p.id].personas) : '0') + ' personas (30 d)',
        setEstado: e => this.setEstado(p.id, e.target.value), edit: () => this.openEdit(p)
      };
    });

    const e = s.edit;
    const sel = (label, key, opts) => ({ label, value: e ? String(e[key] ?? '') : '', options: opts.map(o => Array.isArray(o) ? { v: o[0], n: o[1] } : { v: o, n: o }), set: ev => this.setE({ [key]: ev.target.value }) });
    const txt = (label, key, type, ph) => ({ label, type: type || 'text', ph: ph || '', value: e ? String(e[key] ?? '') : '', set: ev => this.setE({ [key]: type === 'number' ? (ev.target.value === '' ? '' : Number(ev.target.value)) : ev.target.value }) });
    const chipOn = on => ({ border: on ? '#3D0000' : '#E2CBC1', bg: on ? '#3D0000' : 'transparent', color: on ? '#F5E6E0' : '#6E3A34' });
    const togArr = (key, v) => () => { const a = (e[key] || []); this.setE({ [key]: a.includes(v) ? a.filter(x => x !== v) : [...a, v] }); };
    const scale = (label, key, words) => ({ label, word: e ? words[(e[key] || 1) - 1] : '', steps: [1, 2, 3, 4, 5].map(i => ({ bg: e && i <= e[key] ? '#3D0000' : '#E2CBC1', aria: `${label} ${i}`, set: () => this.setE({ [key]: i }) })) });

    const aj = s.aj || {};
    const ajF = (label, key, ph, hint, type) => ({ label, ph, hint, type: type || 'text', value: aj[key] || '', set: ev => this.setState({ aj: { ...aj, [key]: ev.target.value } }) });

    const revList = db.resenas.filter(r => r.estado === s.revTab);
    const counts = { pendiente: pend.length, publicada: db.resenas.filter(r => r.estado === 'publicada').length, oculta: db.resenas.filter(r => r.estado === 'oculta').length };
    const lowStock = this.P.filter(p => p.estado !== 'disponible').map(p => { const t = this.tag(p); return { ...p, tagLabel: t[0], tagBg: t[1], tagColor: t[2], tagBorder: t[3], edit: () => { this.setState({ tab: 'productos' }); this.openEdit(p); } }; });

    return {
      ...metricas,
      isMetricas: s.tab === 'metricas',
      mTabs: [['general', 'General'], ['productos', 'Productos'], ['categorias', 'Categorías y búsquedas'], ['pedidos', 'Pedidos']].map(([key, l]) => ({ label: l, ...chipV(s.mTab === key), go: () => this.setState({ mTab: key }) })),
      mRanges: [[7, '7 días'], [30, '30 días']].map(([d, l]) => ({ label: l, ...chipV(s.mDays === d), go: () => this.setState({ mDays: d }) })),
      mSrcs: [].map(([key, l]) => ({ label: l, ...chipV((useSample ? 'ejemplo' : 'reales') === key), go: () => this.setState({ mSrc: key }) })),
      mIsSample: useSample, mIsReal: !useSample, mSrcName: useSample ? 'datos de ejemplo' : 'datos reales',
      mRealLabel: realEv.length ? nf(realEv.length) + ' eventos registrados.' : 'Aún no hay eventos registrados.',
      clearLabel: s.clearConfirm ? '¿Seguro? Toca de nuevo para borrar' : 'Borrar eventos',
      clearEventos: () => { if (!s.clearConfirm) { this.setState({ clearConfirm: true }); return; } window.AtelierDatos.borrarEventos(); this.setState({ clearConfirm: false }); this.showToast('Eventos borrados'); },
      mGeneral: s.mTab === 'general', mProductos: s.mTab === 'productos', mCategorias: s.mTab === 'categorias', mPedidos: s.mTab === 'pedidos',
      mobile, desktop: !mobile, tableMode: s.w >= 1200, cardMode: s.w < 1200, shellDir: mobile ? 'column' : 'row',
      tabs: TABS.map(([k, l, b]) => ({ label: l, badge: b, hasBadge: b > 0, bg: s.tab === k ? '#F5E6E0' : 'transparent', color: s.tab === k ? '#3D0000' : '#F5E6E0', go: goTab(k) })),
      eyebrow: titles[s.tab][0], title: titles[s.tab][1],
      isResumen: s.tab === 'resumen', isPedidos: s.tab === 'pedidos', isEncargos: s.tab === 'encargos',
      encargosList: db.encargos || [],
      encEstado: (id, v) => this.save(db => { const x = (db.encargos || []).find(y => y.id === id); if (x) x.estado = v; }, `${id}: ${v}`),
      encEliminar: id => this.save(db => { db.encargos = (db.encargos || []).filter(y => y.id !== id); }, 'Encargo eliminado'), isProductos: s.tab === 'productos', isResenas: s.tab === 'resenas', isAjustes: s.tab === 'ajustes',
      goPedidos: goTab('pedidos'), goResenas: goTab('resenas'),
      resetData: () => { const d = window.AtelierDatos.reset(); this.setState({ db: d, aj: { ...d.ajustes }, edit: null }); this.showToast('Datos de ejemplo restablecidos'); },

      stats: [
        { n: this.P.length, label: 'Productos en catálogo', go: goTab('productos') },
        { n: porConfirmar.length, label: 'Pedidos por confirmar', go: goTab('pedidos') },
        { n: pend.length, label: 'Reseñas por aprobar', go: goTab('resenas') },
        { n: encNuevos.length, label: 'Encargos nuevos', go: goTab('encargos') },
        { n: this.P.filter(p => p.descuento > 0).length, label: 'Con descuento', go: () => this.setState({ tab: 'productos', cat: 'Descuento' }) },
        { n: this.P.filter(p => p.estado === 'pocas').length, label: 'Pocas unidades', go: goTab('productos') },
        { n: this.P.filter(p => p.estado === 'agotado').length, label: 'Agotados', go: goTab('productos') }
      ],
      recentOrders: (db.pedidos || []).slice(0, 3).map(o => this.orderVm(o)),
      pendingReviews: pend.slice(0, 3).map(r => this.revVm(r)), noPending: pend.length === 0,
      lowStock,

      orders: (db.pedidos || []).map(o => this.orderVm(o)), noOrders: !(db.pedidos || []).length,

      q: s.q, onQ: ev => this.setState({ q: ev.target.value }),
      catChips: this.CATS.map(c => ({ label: c, ...chipOn(s.cat === c), go: () => this.setState({ cat: c }) })),
      rows, rowsLabel: rows.length === 1 ? '1 producto' : `${rows.length} productos`,
      newProduct: () => this.setState({ isNew: true, confirmDel: false, edit: { id: 'p' + Date.now().toString(36), marca: '', nombre: '', conc: 'EDP', ml: '100', genero: 'Mujer', linea: 'De diseñador', fam: 'florales', precio: '', descuento: 0, estado: 'disponible', nuevo: true, s: '', c: '', f: '', desc: '', temp: [], mom: [], dur: 3, est: 3 } }),

      revTabs: [['pendiente', 'Pendientes'], ['publicada', 'Publicadas'], ['oculta', 'Ocultas']].map(([k, l]) => ({ label: `${l} (${counts[k]})`, ...chipOn(s.revTab === k), go: () => this.setState({ revTab: k }) })),
      revs: revList.map(r => this.revVm(r)), noRevs: revList.length === 0,

      ajFields: [
        ajF('Número de WhatsApp', 'wa', '504 9999-9999', 'Con código de país (504). Se usa en todos los botones de WhatsApp.'),
        ajF('Barra de anuncio', 'anuncio', 'Perfumes 100% originales · Pide por WhatsApp', 'Texto de la franja superior.'),
        ajF('Dirección', 'direccion', 'Colonia, calle, referencia', 'Se muestra en el pie de página.'),
        ajF('Horario', 'horario', 'Lunes a sábado, 9:00 a.m. – 6:00 p.m.', ''),
        ajF('Instagram', 'instagram', '@usuario', ''),
        ajF('Facebook', 'facebook', 'Nombre de la página', ''),
        ajF('TikTok', 'tiktok', '@usuario', ''),
        ajF('Envío en Tegucigalpa (L)', 'envio_tegus', '80', 'Tegucigalpa y Comayagüela. Vacío = "por confirmar"; 0 = gratis.', 'number'),
        ajF('Envío al resto del país (L)', 'envio_nacional', '150', 'Los demás departamentos. Vacío = "por confirmar".', 'number'),
        ajF('Envío gratis desde (L)', 'envio_gratis', '3000', 'Opcional. Si el pedido llega a este monto, el envío es gratis.', 'number')
      ],
      ajTextos: [
        ajF('Datos bancarios (para transferencias)', 'banco', 'BAC Credomatic · Cuenta de ahorro 123456789 · A nombre de ...', 'Se muestran al cliente cuando elige transferencia en el carrito.'),
        ajF('Métodos de pago', 'pagos', 'Transferencia bancaria, depósito o efectivo contra entrega en Tegucigalpa.', 'Aparece en "¿Por qué comprar con nosotros?" y en preguntas frecuentes.'),
        ajF('Envíos', 'envios', 'Entregas en Tegucigalpa el mismo día. Envíos a todo el país por Cargo Expreso (2–3 días).', 'Cobertura, costo, empresa y tiempo de entrega.'),
        ajF('Garantía de originalidad', 'garantia', 'Compramos directamente a distribuidores autorizados en EE. UU.', 'Se agrega a la respuesta "¿Los perfumes son originales?".'),
        ajF('Condiciones de las ofertas', 'ofertas', 'Válidas hasta agotar existencias.', ''),
        ajF('Política de cambios', 'cambios', 'Aceptamos cambios dentro de 3 días si el perfume está sellado.', '')
      ],
      saveAjustes: () => this.save(d => { d.ajustes = { ...d.ajustes, ...aj }; }, 'Ajustes guardados. Ya se ven en la tienda.'),

      editing: !!e,
      editEyebrow: s.isNew ? 'Nuevo producto' : 'Editar producto',
      editTitle: e ? (e.nombre || 'Sin nombre') : '',
      editPhotos: e ? [1, 2, 3, 4].map(i => ({ id: `foto-${e.id}-${i}`, n: `[FOTO ${i}]` })) : [],
      textFields: e ? [txt('Marca', 'marca', 'text', 'Ej. Lattafa'), txt('Nombre', 'nombre', 'text', 'Ej. Khamrah'), txt('Tamaño (ml)', 'ml', 'text', '100'), txt('Precio normal (L)', 'precio', 'number', '2450'), txt('Descuento (%)', 'descuento', 'number', '0')] : [],
      selectFields: e ? [
        sel('Categoría', 'linea', ['Árabes', 'De diseñador']),
        sel('Género', 'genero', ['Mujer', 'Hombre', 'Unisex']),
        sel('Concentración', 'conc', ['EDP', 'EDT', 'Parfum']),
        sel('Familia olfativa', 'fam', this.FAMS),
        sel('Disponibilidad', 'estado', [['disponible', 'Disponible'], ['pocas', 'Pocas unidades'], ['agotado', 'Agotado']])
      ] : [],
      editFinal: e ? this.money(this.pf(e)) : '',
      editPriceHint: e && Number(e.descuento) > 0 ? `${this.money(Number(e.precio) || 0)} con ${e.descuento}% de descuento` : 'Sin descuento',
      nuevoTrack: e && e.nuevo ? '#3D0000' : '#E2CBC1', nuevoKnob: e && e.nuevo ? '23px' : '3px',
      toggleNuevo: () => this.setE({ nuevo: !e.nuevo }),
      editDesc: e ? e.desc || '' : '', onDesc: ev => this.setE({ desc: ev.target.value }),
      noteFields: e ? [['Salida', 's'], ['Corazón', 'c'], ['Fondo', 'f']].map(([l, k]) => ({ label: l, value: e[k] || '', set: ev => this.setE({ [k]: ev.target.value }) })) : [],
      editChips: e ? [...['Primavera', 'Verano', 'Otoño', 'Invierno'].map(v => ({ label: v, ...chipOn((e.temp || []).includes(v)), toggle: togArr('temp', v) })), ...['Día', 'Noche'].map(v => ({ label: v, ...chipOn((e.mom || []).includes(v)), toggle: togArr('mom', v) }))] : [],
      editScales: e ? [scale('Duración', 'dur', ['Suave', 'Moderada', 'Buena', 'Larga', 'Muy larga']), scale('Estela', 'est', ['Íntima', 'Suave', 'Moderada', 'Notable', 'Intensa'])] : [],
      canDelete: !!e && !s.isNew,
      deleteLabel: s.confirmDel ? '¿Seguro? Toca de nuevo para eliminar' : 'Eliminar producto',
      deleteProduct: () => {
        if (!s.confirmDel) { this.setState({ confirmDel: true }); return; }
        this.save(d => { d.productos = d.productos.filter(p => p.id !== e.id); }, 'Producto eliminado');
        this.setState({ edit: null, confirmDel: false });
      },
      closeEdit: () => this.setState({ edit: null, confirmDel: false }),
      saveEdit: () => {
        if (!String(e.nombre).trim() || !String(e.marca).trim() || !(Number(e.precio) > 0)) { this.showToast('Completa marca, nombre y precio'); return; }
        const clean = { ...e, precio: Number(e.precio), descuento: Math.max(0, Math.min(90, Number(e.descuento) || 0)) };
        this.save(d => {
          const i = d.productos.findIndex(p => p.id === clean.id);
          if (i >= 0) d.productos[i] = clean; else d.productos.unshift(clean);
        }, s.isNew ? 'Producto agregado a la tienda' : 'Cambios guardados');
        this.setState({ edit: null, isNew: false });
      },

      tiendaFotos: [{ id: 'hero-editorial', n: 'Foto principal (inicio)' }, ...['Hombre', 'Mujer', 'Árabes', 'De diseñador', 'Descuento'].map(c => ({ id: 'categoria-' + c.toLowerCase().replace(/[^a-z]/g, ''), n: 'Categoría: ' + c }))],
      logout: async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {} location.href = '/admin'; },
      hasToast: !!s.toast, toast: s.toast
    };
  }

  render() { return view({ ...this.props, ...this.renderVals() }); }
}

function view($v) {
  return (
  <>
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: $v.shellDir, background: "#F5E6E0", fontFamily: "Jost, sans-serif", color: "#3D0000" }}>
      {$v.desktop ? (
        <>
          <aside style={{ flex: "0 0 248px", position: "sticky", top: "0", height: "100vh", background: "#3D0000", color: "#F5E6E0", display: "flex", flexDirection: "column", padding: "28px 18px 22px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", paddingBottom: "22px", borderBottom: "1px solid #6E3A34" }}>
              <span style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "24px", letterSpacing: ".14em", lineHeight: "1", paddingLeft: ".14em" }}>
                {"ATELIER"}
              </span>
              {" "}
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "1px", background: "#A97C50" }} />
                <span style={{ fontWeight: "300", fontSize: "9.5px", letterSpacing: ".55em", paddingLeft: ".55em" }}>
                  {"PARFUMS"}
                </span>
                <span style={{ width: "12px", height: "1px", background: "#A97C50" }} />
              </span>
              {" "}
              <span style={{ marginTop: "12px", fontSize: "10.5px", letterSpacing: ".26em", textTransform: "uppercase", color: "#E2CBC1" }}>
                {"Panel de administración"}
              </span>
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "18px 0", flex: "1" }}>
              {arr($v.tabs).map((t, $index) => (
                <Fragment key={$index}>
                  <button onClick={t?.go} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", minHeight: "46px", padding: "0 14px", border: "none", borderRadius: "999px", background: t?.bg, color: t?.color, fontSize: "13px", letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer", textAlign: "left" }} className={"dcp9"}>
                    <span>
                      {t?.label}
                    </span>
                    {" "}
                    {t?.hasBadge ? (
                      <>
                        <span style={{ minWidth: "22px", height: "22px", padding: "0 7px", borderRadius: "999px", background: "#A97C50", color: "#3D0000", fontSize: "11px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: "0" }}>
                          {t?.badge}
                        </span>
                      </>
                    ) : null}
                  </button>
                </Fragment>
              ))}
            </nav>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <a href={"/"} target={"_blank"} style={{ minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", borderRadius: "999px", border: "1px solid #F5E6E0", color: "#F5E6E0", fontSize: "12px", letterSpacing: ".14em", textTransform: "uppercase" }} className={"dcp9"}>
                {"Ver tienda "}
                <svg width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.3"}>
                  <path d={"M7 17L17 7M9 7h8v8"} />
                </svg>
              </a>
              <button onClick={$v.logout} style={{ minHeight: "40px", background: "none", border: "none", color: "#E2CBC1", fontSize: "11.5px", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" }} className={"dcp10"}>
                {"Cerrar sesión"}
              </button>
            </div>
          </aside>
        </>
      ) : null}
      {" "}
      {$v.mobile ? (
        <>
          <div style={{ position: "sticky", top: "0", zIndex: "30", background: "#3D0000", color: "#F5E6E0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "12px 16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "18px", letterSpacing: ".14em", lineHeight: "1" }}>
                  {"ATELIER"}
                </span>
                {" "}
                <span style={{ fontSize: "9.5px", letterSpacing: ".26em", textTransform: "uppercase", color: "#E2CBC1" }}>
                  {"Administración"}
                </span>
              </div>
              <a href={"/"} target={"_blank"} style={{ minHeight: "40px", display: "flex", alignItems: "center", padding: "0 16px", borderRadius: "999px", border: "1px solid #F5E6E0", color: "#F5E6E0", fontSize: "11px", letterSpacing: ".14em", textTransform: "uppercase" }} className={"dcp10"}>
                {"Ver tienda"}
              </a>
            </div>
            <nav style={{ display: "flex", gap: "6px", overflowX: "auto", scrollbarWidth: "none", padding: "0 12px 12px" }}>
              {arr($v.tabs).map((t, $index) => (
                <Fragment key={$index}>
                  <button onClick={t?.go} style={{ flex: "none", display: "flex", alignItems: "center", gap: "8px", minHeight: "40px", padding: "0 14px", border: "1px solid #6E3A34", borderRadius: "999px", background: t?.bg, color: t?.color, fontSize: "11.5px", letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap" }}>
                    {" "}
                    {t?.label}
                    {" "}
                    {t?.hasBadge ? (
                      <>
                        <span style={{ minWidth: "20px", height: "20px", padding: "0 6px", borderRadius: "999px", background: "#A97C50", color: "#3D0000", fontSize: "10.5px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {t?.badge}
                        </span>
                      </>
                    ) : null}
                  </button>
                </Fragment>
              ))}
            </nav>
          </div>
        </>
      ) : null}
      <main style={{ flex: "1", minWidth: "0", padding: "clamp(20px,3.5vw,48px) clamp(16px,3.5vw,56px) 80px" }}>
        <div style={{ maxWidth: "1180px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(20px,2.6vw,32px)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "14px 24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#7A532E" }}>
                {$v.eyebrow}
              </span>
              <h1 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "clamp(34px,4vw,52px)", lineHeight: "1", color: "#3D0000" }}>
                {$v.title}
              </h1>
            </div>
            {$v.isProductos ? (
              <>
                <button onClick={$v.newProduct} style={{ minHeight: "46px", display: "flex", alignItems: "center", gap: "10px", padding: "0 24px", borderRadius: "999px", border: "1px solid #3D0000", background: "#3D0000", color: "#F5E6E0", fontSize: "12.5px", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" }} className={"dcp4"}>
                  <svg width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"}>
                    <path d={"M12 5v14M5 12h14"} />
                  </svg>
                  {"Agregar producto "}
                </button>
              </>
            ) : null}
          </div>
          {$v.isResumen ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "clamp(20px,2.6vw,32px)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,160px),1fr))", gap: "clamp(10px,1.4vw,16px)" }}>
                  {arr($v.stats).map((st, $index) => (
                    <Fragment key={$index}>
                      <button onClick={st?.go} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "10px", padding: "20px 22px", background: "#FBF4F0", border: "1px solid #E2CBC1", cursor: "pointer", textAlign: "left", color: "#3D0000" }} className={"dcp7"}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "44px", lineHeight: "1" }}>
                          {st?.n}
                        </span>
                        {" "}
                        <span style={{ fontSize: "12px", letterSpacing: ".06em", color: "#6E3A34", lineHeight: "1.4" }}>
                          {st?.label}
                        </span>
                      </button>
                    </Fragment>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "clamp(14px,2vw,24px)", alignItems: "start" }}>
                  <section style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(18px,2.4vw,28px)", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", paddingBottom: "12px" }}>
                      <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "26px" }}>
                        {"Pedidos recientes"}
                      </h2>
                      <button onClick={$v.goPedidos} style={{ minHeight: "36px", background: "none", border: "none", fontSize: "11.5px", letterSpacing: ".18em", textTransform: "uppercase", color: "#3D0000", cursor: "pointer", borderBottom: "1px solid #A97C50", padding: "0" }}>
                        {"Ver todos"}
                      </button>
                    </div>
                    {arr($v.recentOrders).map((o, $index) => (
                      <Fragment key={$index}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "14px 0", borderTop: "1px solid #E2CBC1" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "0" }}>
                            <span style={{ fontSize: "14px", fontWeight: "500" }}>
                              {o?.id}
                              {" · "}
                              {o?.nombre}
                            </span>
                            {" "}
                            <span style={{ fontSize: "12.5px", color: "#6E3A34", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {o?.resumen}
                            </span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flex: "none" }}>
                            <span style={{ fontSize: "14px", fontWeight: "500" }}>
                              {o?.totalTxt}
                            </span>
                            {" "}
                            <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "11px", letterSpacing: ".04em", background: o?.stBg, color: o?.stColor, border: `1px solid ${o?.stBorder ?? ""}` }}>
                              {o?.estado}
                            </span>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </section>
                  <section style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(18px,2.4vw,28px)", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", paddingBottom: "12px" }}>
                      <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "26px" }}>
                        {"Reseñas por aprobar"}
                      </h2>
                      <button onClick={$v.goResenas} style={{ minHeight: "36px", background: "none", border: "none", fontSize: "11.5px", letterSpacing: ".18em", textTransform: "uppercase", color: "#3D0000", cursor: "pointer", borderBottom: "1px solid #A97C50", padding: "0" }}>
                        {"Ver todas"}
                      </button>
                    </div>
                    {$v.noPending ? (
                      <>
                        <p style={{ margin: "0", padding: "14px 0", borderTop: "1px solid #E2CBC1", fontSize: "14px", color: "#6E3A34" }}>
                          {"No hay reseñas pendientes."}
                        </p>
                      </>
                    ) : null}
                    {" "}
                    {arr($v.pendingReviews).map((r, $index) => (
                      <Fragment key={$index}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "14px 0", borderTop: "1px solid #E2CBC1" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
                            <span style={{ color: "#A97C50", letterSpacing: ".1em" }}>
                              {r?.stars}
                            </span>
                            {" "}
                            <span style={{ fontSize: "12px", color: "#6E3A34" }}>
                              {r?.fecha}
                            </span>
                          </div>
                          <span style={{ fontSize: "14px", lineHeight: "1.55", color: "#3D0000" }}>
                            {"“"}
                            {r?.texto}
                            {"”"}
                          </span>
                          {" "}
                          <span style={{ fontSize: "12.5px", color: "#6E3A34" }}>
                            {r?.nombre}
                            {" · "}
                            {r?.prodName}
                          </span>
                          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                            <button onClick={r?.approve} style={{ minHeight: "40px", padding: "0 18px", borderRadius: "999px", border: "1px solid #3D0000", background: "#3D0000", color: "#F5E6E0", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>
                              {"Aprobar"}
                            </button>
                            {" "}
                            <button onClick={r?.hide} style={{ minHeight: "40px", padding: "0 18px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>
                              {"Ocultar"}
                            </button>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </section>
                  <section style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(18px,2.4vw,28px)", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <h2 style={{ margin: "0 0 12px", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "26px" }}>
                      {"Inventario por revisar"}
                    </h2>
                    {arr($v.lowStock).map((p, $index) => (
                      <Fragment key={$index}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "12px 0", borderTop: "1px solid #E2CBC1" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "0" }}>
                            <span style={{ fontSize: "10.5px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                              {p?.marca}
                            </span>
                            {" "}
                            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px" }}>
                              {p?.nombre}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "none" }}>
                            <span style={{ padding: "4px 10px", fontSize: "10.5px", letterSpacing: ".14em", textTransform: "uppercase", background: p?.tagBg, color: p?.tagColor, border: `1px solid ${p?.tagBorder ?? ""}` }}>
                              {p?.tagLabel}
                            </span>
                            {" "}
                            <button onClick={p?.edit} style={{ minHeight: "36px", background: "none", border: "none", fontSize: "12px", color: "#3D0000", cursor: "pointer", textDecoration: "underline", textDecorationColor: "#A97C50", textUnderlineOffset: "4px" }}>
                              {"Editar"}
                            </button>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </section>
                </div>
              </div>
            </>
          ) : null}
          {" "}
          {$v.isMetricas ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "clamp(16px,2.2vw,24px)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: "6px", overflowX: "auto", scrollbarWidth: "none", maxWidth: "100%" }}>
                    {arr($v.mTabs).map((t, $index) => (
                      <Fragment key={$index}>
                        <button onClick={t?.go} style={{ flex: "none", minHeight: "40px", padding: "0 16px", borderRadius: "999px", border: `1px solid ${t?.border ?? ""}`, background: t?.bg, color: t?.color, fontSize: "12px", letterSpacing: ".06em", cursor: "pointer", whiteSpace: "nowrap" }}>
                          {t?.label}
                        </button>
                      </Fragment>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {arr($v.mRanges).map((g, $index) => (
                      <Fragment key={$index}>
                        <button onClick={g?.go} style={{ flex: "none", minHeight: "40px", padding: "0 16px", borderRadius: "999px", border: `1px solid ${g?.border ?? ""}`, background: g?.bg, color: g?.color, fontSize: "12px", letterSpacing: ".06em", cursor: "pointer", whiteSpace: "nowrap" }}>
                          {g?.label}
                        </button>
                      </Fragment>
                    ))}
                    {" "}
                    {arr($v.mSrcs).map((o, $index) => (
                      <Fragment key={$index}>
                        <button onClick={o?.go} style={{ flex: "none", minHeight: "40px", padding: "0 16px", borderRadius: "999px", border: `1px solid ${o?.border ?? ""}`, background: o?.bg, color: o?.color, fontSize: "12px", letterSpacing: ".06em", cursor: "pointer", whiteSpace: "nowrap" }}>
                          {o?.label}
                        </button>
                      </Fragment>
                    ))}
                  </div>
                </div>
                {$v.mIsSample ? (
                  <>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px 20px", padding: "14px 18px", background: "#3D0000", color: "#F5E6E0" }}>
                      <span style={{ fontSize: "13.5px", lineHeight: "1.5" }}>
                        {"Estás viendo "}
                        <strong style={{ fontWeight: "500" }}>
                          {"datos de ejemplo"}
                        </strong>
                        {" para conocer los tableros. No son cifras reales de la tienda."}
                      </span>
                      {" "}
                      <span style={{ fontSize: "12.5px", color: "#E2CBC1" }}>
                        {$v.mRealLabel}
                      </span>
                    </div>
                  </>
                ) : null}
                {" "}
                {$v.mIsReal ? (
                  <>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px 20px", padding: "14px 18px", background: "#FBF4F0", border: "1px solid #E2CBC1" }}>
                      <span style={{ fontSize: "13.5px", lineHeight: "1.5", color: "#3D0000" }}>
                        {"Eventos registrados en la tienda. "}
                        {$v.mRealLabel}
                      </span>
                      {" "}
                      <button onClick={$v.clearEventos} style={{ minHeight: "36px", background: "none", border: "none", padding: "0", fontSize: "12px", color: "#6E3A34", cursor: "pointer", textDecoration: "underline", textDecorationColor: "#E2CBC1", textUnderlineOffset: "4px" }}>
                        {$v.clearLabel}
                      </button>
                    </div>
                  </>
                ) : null}
                {" "}
                {$v.mGeneral ? (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(14px,2vw,22px)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,170px),1fr))", gap: "clamp(10px,1.4vw,14px)" }}>
                        {arr($v.mKpis).map((k, $index) => (
                          <Fragment key={$index}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "18px 20px", background: "#FBF4F0", border: "1px solid #E2CBC1", minWidth: "0" }}>
                              <span style={{ fontSize: "10.5px", letterSpacing: ".2em", textTransform: "uppercase", color: "#7A532E" }}>
                                {k?.label}
                              </span>
                              {" "}
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "40px", lineHeight: "1", color: "#3D0000" }}>
                                {k?.value}
                              </span>
                              {" "}
                              <span style={{ fontSize: "12px", color: k?.dColor }}>
                                {k?.delta}
                              </span>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                      <section style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(18px,2.4vw,28px)", display: "flex", flexDirection: "column", gap: "16px", minWidth: "0" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "10px 20px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "26px", lineHeight: "1.1" }}>
                              {"Actividad diaria"}
                            </h2>
                            <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.5", color: "#6E3A34" }}>
                              {$v.dailyTitle}
                            </p>
                          </div>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {arr($v.mMetrics).map((m, $index) => (
                              <Fragment key={$index}>
                                <button onClick={m?.go} style={{ flex: "none", minHeight: "40px", padding: "0 16px", borderRadius: "999px", border: `1px solid ${m?.border ?? ""}`, background: m?.bg, color: m?.color, fontSize: "12px", letterSpacing: ".06em", cursor: "pointer", whiteSpace: "nowrap" }}>
                                  {m?.label}
                                </button>
                              </Fragment>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "flex-end", gap: $v.barGap, height: "200px", borderBottom: "1px solid #E2CBC1" }}>
                            {arr($v.dailyBars).map((b, $index) => (
                              <Fragment key={$index}>
                                <div title={b?.tip} style={{ flex: "1", minWidth: "0", height: "100%", display: "flex", alignItems: "flex-end" }}>
                                  <div style={{ width: "100%", height: b?.h, minHeight: "2px", background: b?.color, transition: "height .4s" }} />
                                </div>
                              </Fragment>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: $v.barGap }}>
                            {arr($v.dailyBars).map((b, $index) => (
                              <Fragment key={$index}>
                                <span style={{ flex: "1", minWidth: "0", fontSize: "10.5px", color: "#6E3A34", textAlign: "center", whiteSpace: "nowrap", overflow: "visible" }}>
                                  {b?.lbl}
                                </span>
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      </section>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "clamp(14px,2vw,22px)", alignItems: "start" }}>
                        <section style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(18px,2.4vw,28px)", display: "flex", flexDirection: "column", gap: "16px", minWidth: "0" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "26px", lineHeight: "1.1" }}>
                              {"Embudo de compra"}
                            </h2>
                            <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.5", color: "#6E3A34" }}>
                              {"Personas únicas en cada paso, del total de visitantes."}
                            </p>
                          </div>
                          {arr($v.funnel).map((r, $index) => (
                            <Fragment key={$index}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13.5px" }}>
                                  <span>
                                    {r?.label}
                                  </span>
                                  <span style={{ fontWeight: "500", whiteSpace: "nowrap" }}>
                                    {r?.val}
                                  </span>
                                </div>
                                <div style={{ height: "6px", background: "#F5E6E0" }}>
                                  <div style={{ height: "100%", width: r?.w, background: r?.color, transition: "width .4s" }} />
                                </div>
                                <span style={{ fontSize: "12px", color: "#6E3A34" }}>
                                  {r?.sub}
                                </span>
                              </div>
                            </Fragment>
                          ))}
                        </section>
                        <section style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(18px,2.4vw,28px)", display: "flex", flexDirection: "column", gap: "16px", minWidth: "0" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "26px", lineHeight: "1.1" }}>
                              {"Desde dónde nos visitan"}
                            </h2>
                            <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.5", color: "#6E3A34" }}>
                              {"Visitas por tipo de dispositivo."}
                            </p>
                          </div>
                          <div style={{ display: "flex", height: "14px", background: "#F5E6E0" }}>
                            <div style={{ height: "100%", width: $v.devMobW, background: "#3D0000" }} />
                            <div style={{ height: "100%", flex: "1", background: "#A97C50" }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px" }}>
                              <span style={{ width: "10px", height: "10px", background: "#3D0000" }} />
                              {"Celular · "}
                              <strong style={{ fontWeight: "500" }}>
                                {$v.devMob}
                              </strong>
                            </span>
                            {" "}
                            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px" }}>
                              <span style={{ width: "10px", height: "10px", background: "#A97C50" }} />
                              {"Computadora · "}
                              <strong style={{ fontWeight: "500" }}>
                                {$v.devDesk}
                              </strong>
                            </span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "12px", borderTop: "1px solid #E2CBC1" }}>
                            <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "26px", lineHeight: "1.1", fontSize: "22px" }}>
                              {"Días con más visitas"}
                            </h2>
                          </div>
                          {arr($v.weekBars).map((r, $index) => (
                            <Fragment key={$index}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13.5px" }}>
                                  <span>
                                    {r?.label}
                                  </span>
                                  <span style={{ fontWeight: "500", whiteSpace: "nowrap" }}>
                                    {r?.val}
                                  </span>
                                </div>
                                <div style={{ height: "6px", background: "#F5E6E0" }}>
                                  <div style={{ height: "100%", width: r?.w, background: r?.color, transition: "width .4s" }} />
                                </div>
                              </div>
                            </Fragment>
                          ))}
                        </section>
                      </div>
                    </div>
                  </>
                ) : null}
                {" "}
                {$v.mProductos ? (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(14px,2vw,22px)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "clamp(14px,2vw,22px)" }}>
                        <section style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(18px,2.4vw,28px)", display: "flex", flexDirection: "column", gap: "16px", minWidth: "0" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "26px", lineHeight: "1.1" }}>
                              {"Mucho interés, poca intención"}
                            </h2>
                            <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.5", color: "#6E3A34" }}>
                              {"Muchas personas los abren, pero pocas piden o agregan. Revisa precio, fotos o descripción."}
                            </p>
                          </div>
                          {arr($v.lowIntent).map((r, $index) => (
                            <Fragment key={$index}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", paddingTop: "12px", borderTop: "1px solid #E2CBC1" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "0" }}>
                                  <span style={{ fontSize: "10px", letterSpacing: ".2em", textTransform: "uppercase", color: "#7A532E" }}>
                                    {r?.marca}
                                  </span>
                                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px" }}>
                                    {r?.nombre}
                                  </span>
                                </div>
                                <span style={{ textAlign: "right", fontSize: "12.5px", color: "#6E3A34", flex: "none" }}>
                                  {r?.personasTxt}
                                  <br />
                                  <strong style={{ fontWeight: "500", color: "#3D0000" }}>
                                    {r?.intentTxt}
                                    {" con intención"}
                                  </strong>
                                </span>
                              </div>
                            </Fragment>
                          ))}
                        </section>
                        <section style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(18px,2.4vw,28px)", display: "flex", flexDirection: "column", gap: "16px", minWidth: "0" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "26px", lineHeight: "1.1" }}>
                              {"Los que mejor convierten"}
                            </h2>
                            <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.5", color: "#6E3A34" }}>
                              {"Mayor porcentaje de personas que piden por WhatsApp o agregan al pedido."}
                            </p>
                          </div>
                          {arr($v.highIntent).map((r, $index) => (
                            <Fragment key={$index}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", paddingTop: "12px", borderTop: "1px solid #E2CBC1" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "0" }}>
                                  <span style={{ fontSize: "10px", letterSpacing: ".2em", textTransform: "uppercase", color: "#7A532E" }}>
                                    {r?.marca}
                                  </span>
                                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px" }}>
                                    {r?.nombre}
                                  </span>
                                </div>
                                <span style={{ textAlign: "right", fontSize: "12.5px", color: "#6E3A34", flex: "none" }}>
                                  {r?.personasTxt}
                                  <br />
                                  <strong style={{ fontWeight: "500", color: "#3D0000" }}>
                                    {r?.intentTxt}
                                    {" con intención"}
                                  </strong>
                                </span>
                              </div>
                            </Fragment>
                          ))}
                        </section>
                      </div>
                      <section style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(18px,2.4vw,28px)", display: "flex", flexDirection: "column", gap: "16px", minWidth: "0" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "10px 20px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "26px", lineHeight: "1.1" }}>
                              {"Clics por publicación"}
                            </h2>
                            <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.5", color: "#6E3A34" }}>
                              {"Cuántas personas abren cada perfume y qué hacen después."}
                            </p>
                          </div>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {arr($v.mSorts).map((o, $index) => (
                              <Fragment key={$index}>
                                <button onClick={o?.go} style={{ flex: "none", minHeight: "40px", padding: "0 16px", borderRadius: "999px", border: `1px solid ${o?.border ?? ""}`, background: o?.bg, color: o?.color, fontSize: "12px", letterSpacing: ".06em", cursor: "pointer", whiteSpace: "nowrap" }}>
                                  {o?.label}
                                </button>
                              </Fragment>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          {arr($v.prodRows).map((r, $index) => (
                            <Fragment key={$index}>
                              <div style={{ display: "grid", gridTemplateColumns: "28px minmax(0,1fr)", gap: "14px", alignItems: "center", padding: "14px 0", borderTop: "1px solid #E2CBC1" }}>
                                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "20px", color: "#7A532E", textAlign: "right" }}>
                                  {r?.rank}
                                </span>
                                <div style={{ display: "flex", flexDirection: "column", gap: "7px", minWidth: "0" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
                                    <span style={{ display: "flex", alignItems: "baseline", gap: "10px", minWidth: "0" }}>
                                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", lineHeight: "1.1" }}>
                                        {r?.nombre}
                                      </span>
                                      <span style={{ fontSize: "10px", letterSpacing: ".2em", textTransform: "uppercase", color: "#7A532E", whiteSpace: "nowrap" }}>
                                        {r?.marca}
                                      </span>
                                    </span>
                                    {" "}
                                    <span style={{ fontSize: "14px", fontWeight: "500", whiteSpace: "nowrap" }}>
                                      {r?.mainTxt}
                                    </span>
                                  </div>
                                  <div style={{ height: "6px", background: "#F5E6E0" }}>
                                    <div style={{ height: "100%", width: r?.w, background: "#3D0000", transition: "width .4s" }} />
                                  </div>
                                  <span style={{ fontSize: "12px", lineHeight: "1.5", color: "#6E3A34" }}>
                                    {r?.detail}
                                  </span>
                                </div>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                      </section>
                    </div>
                  </>
                ) : null}
                {" "}
                {$v.mCategorias ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "clamp(14px,2vw,22px)", alignItems: "start" }}>
                      <section style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(18px,2.4vw,28px)", display: "flex", flexDirection: "column", gap: "16px", minWidth: "0" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "26px", lineHeight: "1.1" }}>
                            {"Interés por categoría"}
                          </h2>
                          <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.5", color: "#6E3A34" }}>
                            {"Clics en perfumes de cada categoría y veces que se abrió desde el menú."}
                          </p>
                        </div>
                        {arr($v.catBars).map((r, $index) => (
                          <Fragment key={$index}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13.5px" }}>
                                <span>
                                  {r?.label}
                                </span>
                                <span style={{ fontWeight: "500", whiteSpace: "nowrap" }}>
                                  {r?.val}
                                </span>
                              </div>
                              <div style={{ height: "6px", background: "#F5E6E0" }}>
                                <div style={{ height: "100%", width: r?.w, background: r?.color, transition: "width .4s" }} />
                              </div>
                              <span style={{ fontSize: "12px", color: "#6E3A34" }}>
                                {r?.sub}
                              </span>
                            </div>
                          </Fragment>
                        ))}
                      </section>
                      <section style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(18px,2.4vw,28px)", display: "flex", flexDirection: "column", gap: "16px", minWidth: "0" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "26px", lineHeight: "1.1" }}>
                            {"Lo más buscado"}
                          </h2>
                          <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.5", color: "#6E3A34" }}>
                            {"Palabras que escriben en el buscador."}
                          </p>
                        </div>
                        {$v.noBusq ? (
                          <>
                            <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.5", color: "#6E3A34" }}>
                              {"Todavía no hay búsquedas en este periodo."}
                            </p>
                          </>
                        ) : null}
                        {" "}
                        {arr($v.busqRows).map((r, $index) => (
                          <Fragment key={$index}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", paddingTop: "10px", borderTop: "1px solid #E2CBC1" }}>
                              <span style={{ fontSize: "14px" }}>
                                {"“"}
                                {r?.q}
                                {"”"}
                              </span>
                              {" "}
                              <span style={{ display: "flex", alignItems: "center", gap: "10px", flex: "none" }}>
                                {r?.noRes ? (
                                  <>
                                    <span style={{ padding: "4px 9px", borderRadius: "999px", fontSize: "10.5px", letterSpacing: ".06em", background: "#3D0000", color: "#F5E6E0" }}>
                                      {"Sin resultados"}
                                    </span>
                                  </>
                                ) : null}
                                {" "}
                                <span style={{ fontSize: "13.5px", fontWeight: "500" }}>
                                  {r?.n}
                                </span>
                              </span>
                            </div>
                          </Fragment>
                        ))}
                      </section>
                      <section style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(18px,2.4vw,28px)", display: "flex", flexDirection: "column", gap: "16px", minWidth: "0" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "26px", lineHeight: "1.1" }}>
                            {"Lo buscan y no lo tenemos"}
                          </h2>
                          <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.5", color: "#6E3A34" }}>
                            {"Búsquedas sin resultados: ideas para tu próximo pedido a Estados Unidos."}
                          </p>
                        </div>
                        {$v.noMissing ? (
                          <>
                            <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.5", color: "#6E3A34" }}>
                              {"No hay búsquedas sin resultados en este periodo."}
                            </p>
                          </>
                        ) : null}
                        {" "}
                        {arr($v.missingBars).map((r, $index) => (
                          <Fragment key={$index}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13.5px" }}>
                                <span>
                                  {r?.label}
                                </span>
                                <span style={{ fontWeight: "500", whiteSpace: "nowrap" }}>
                                  {r?.val}
                                </span>
                              </div>
                              <div style={{ height: "6px", background: "#F5E6E0" }}>
                                <div style={{ height: "100%", width: r?.w, background: r?.color, transition: "width .4s" }} />
                              </div>
                            </div>
                          </Fragment>
                        ))}
                      </section>
                    </div>
                  </>
                ) : null}
                {" "}
                {$v.mPedidos ? (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(14px,2vw,22px)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,190px),1fr))", gap: "clamp(10px,1.4vw,14px)" }}>
                        {arr($v.pKpis).map((k, $index) => (
                          <Fragment key={$index}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "18px 20px", background: "#FBF4F0", border: "1px solid #E2CBC1", minWidth: "0" }}>
                              <span style={{ fontSize: "10.5px", letterSpacing: ".2em", textTransform: "uppercase", color: "#7A532E" }}>
                                {k?.label}
                              </span>
                              {" "}
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "38px", lineHeight: "1", color: "#3D0000", whiteSpace: "nowrap" }}>
                                {k?.value}
                              </span>
                              {" "}
                              <span style={{ fontSize: "12px", color: k?.dColor }}>
                                {k?.delta}
                              </span>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                      <p style={{ margin: "0", fontSize: "12.5px", color: "#6E3A34" }}>
                        {"Totales estimados con los precios del sitio. La venta final se confirma por WhatsApp."}
                      </p>
                      <section style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(18px,2.4vw,28px)", display: "flex", flexDirection: "column", gap: "16px", minWidth: "0" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "26px", lineHeight: "1.1" }}>
                            {"Pedidos por día"}
                          </h2>
                          <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.5", color: "#6E3A34" }}>
                            {"Pedidos enviados desde “Mi pedido”."}
                          </p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "flex-end", gap: $v.barGap, height: "200px", borderBottom: "1px solid #E2CBC1" }}>
                            {arr($v.pedidoBars).map((b, $index) => (
                              <Fragment key={$index}>
                                <div title={b?.tip} style={{ flex: "1", minWidth: "0", height: "100%", display: "flex", alignItems: "flex-end" }}>
                                  <div style={{ width: "100%", height: b?.h, minHeight: "2px", background: b?.color, transition: "height .4s" }} />
                                </div>
                              </Fragment>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: $v.barGap }}>
                            {arr($v.pedidoBars).map((b, $index) => (
                              <Fragment key={$index}>
                                <span style={{ flex: "1", minWidth: "0", fontSize: "10.5px", color: "#6E3A34", textAlign: "center", whiteSpace: "nowrap", overflow: "visible" }}>
                                  {b?.lbl}
                                </span>
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      </section>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "clamp(14px,2vw,22px)", alignItems: "start" }}>
                        <section style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(18px,2.4vw,28px)", display: "flex", flexDirection: "column", gap: "16px", minWidth: "0" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "26px", lineHeight: "1.1" }}>
                              {"Horas con más visitas"}
                            </h2>
                            <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.5", color: "#6E3A34" }}>
                              {"Buen momento para publicar en Instagram y responder rápido."}
                            </p>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: $v.barGap, height: "200px", borderBottom: "1px solid #E2CBC1" }}>
                              {arr($v.hourBars).map((b, $index) => (
                                <Fragment key={$index}>
                                  <div title={b?.tip} style={{ flex: "1", minWidth: "0", height: "100%", display: "flex", alignItems: "flex-end" }}>
                                    <div style={{ width: "100%", height: b?.h, minHeight: "2px", background: b?.color, transition: "height .4s" }} />
                                  </div>
                                </Fragment>
                              ))}
                            </div>
                            <div style={{ display: "flex", gap: $v.barGap }}>
                              {arr($v.hourBars).map((b, $index) => (
                                <Fragment key={$index}>
                                  <span style={{ flex: "1", minWidth: "0", fontSize: "10.5px", color: "#6E3A34", textAlign: "center", whiteSpace: "nowrap", overflow: "visible" }}>
                                    {b?.lbl}
                                  </span>
                                </Fragment>
                              ))}
                            </div>
                          </div>
                        </section>
                        <section style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(18px,2.4vw,28px)", display: "flex", flexDirection: "column", gap: "16px", minWidth: "0" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <h2 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "26px", lineHeight: "1.1" }}>
                              {"Lo que más se pide"}
                            </h2>
                            <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.5", color: "#6E3A34" }}>
                              {"Perfumes incluidos en pedidos enviados."}
                            </p>
                          </div>
                          {$v.noPedidos ? (
                            <>
                              <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.5", color: "#6E3A34" }}>
                                {"Todavía no hay pedidos en este periodo."}
                              </p>
                            </>
                          ) : null}
                          {" "}
                          {arr($v.topPedidos).map((r, $index) => (
                            <Fragment key={$index}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13.5px" }}>
                                  <span>
                                    {r?.label}
                                  </span>
                                  <span style={{ fontWeight: "500", whiteSpace: "nowrap" }}>
                                    {r?.val}
                                  </span>
                                </div>
                                <div style={{ height: "6px", background: "#F5E6E0" }}>
                                  <div style={{ height: "100%", width: r?.w, background: r?.color, transition: "width .4s" }} />
                                </div>
                              </div>
                            </Fragment>
                          ))}
                        </section>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </>
          ) : null}
          {" "}
          {$v.isPedidos ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#6E3A34", maxWidth: "70ch" }}>
                  {"Cada vez que un cliente toca “Enviar pedido por WhatsApp”, el pedido queda registrado aquí. Confirma los detalles en el chat y actualiza el estado."}
                </p>
                {$v.noOrders ? (
                  <>
                    <p style={{ margin: "0", padding: "28px", background: "#FBF4F0", border: "1px solid #E2CBC1", fontSize: "14px", color: "#6E3A34" }}>
                      {"Todavía no hay pedidos registrados."}
                    </p>
                  </>
                ) : null}
                {" "}
                {arr($v.orders).map((o, $index) => (
                  <Fragment key={$index}>
                    <article style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(16px,2.2vw,24px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: "16px 28px", alignItems: "start" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", lineHeight: "1" }}>
                            {o?.id}
                          </span>
                          {" "}
                          {o?.ejemplo ? (
                            <>
                              <span style={{ padding: "3px 8px", fontSize: "10px", letterSpacing: ".18em", textTransform: "uppercase", border: "1px solid #A97C50", color: "#7A532E" }}>
                                {"Ejemplo"}
                              </span>
                            </>
                          ) : null}
                        </span>
                        {" "}
                        <span style={{ fontSize: "13px", color: "#6E3A34" }}>
                          {o?.fecha}
                        </span>
                        {" "}
                        <span style={{ fontSize: "14px", fontWeight: "500" }}>
                          {o?.nombre}
                        </span>
                        {o?.telefono ? (
                          <a href={o?.waLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13.5px", color: "#3D0000", textDecoration: "underline", textDecorationColor: "#A97C50", textUnderlineOffset: "4px" }}>
                            {"WhatsApp " + o?.telefono}
                          </a>
                        ) : null}
                        {o?.zona ? (
                          <span style={{ fontSize: "13px", lineHeight: "1.5", color: "#6E3A34" }}>
                            <strong style={{ fontWeight: "500", color: "#3D0000" }}>{o?.zona}</strong>
                            {o?.direccion ? " · " + o?.direccion : ""}
                          </span>
                        ) : null}
                        {o?.ubicacion ? (
                          <a href={o?.ubicacion} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#3D0000", textDecoration: "underline", textUnderlineOffset: "4px" }}>
                            {"Ver ubicación en el mapa"}
                          </a>
                        ) : null}
                        {o?.pago ? (
                          <span style={{ alignSelf: "flex-start", marginTop: "2px", padding: "4px 10px", fontSize: "10.5px", letterSpacing: ".16em", textTransform: "uppercase", border: "1px solid #A97C50", color: "#7A532E" }}>
                            {o?.pago}
                          </span>
                        ) : null}
                        {o?.notas ? (
                          <span style={{ fontSize: "12.5px", fontStyle: "italic", color: "#6E3A34" }}>
                            {"“" + o?.notas + "”"}
                          </span>
                        ) : null}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {arr(o?.lines).map((l, $index) => (
                          <Fragment key={$index}>
                            <span style={{ display: "flex", justifyContent: "space-between", gap: "14px", fontSize: "13.5px", lineHeight: "1.45" }}>
                              <span>
                                {l?.txt}
                              </span>
                              <span style={{ whiteSpace: "nowrap", color: "#6E3A34" }}>
                                {l?.sub}
                              </span>
                            </span>
                          </Fragment>
                        ))}
                        {" "}
                        {o?.envioTxt ? (
                          <span style={{ display: "flex", justifyContent: "space-between", gap: "14px", fontSize: "13.5px", lineHeight: "1.45" }}>
                            <span>
                              {"Envío"}
                            </span>
                            <span style={{ whiteSpace: "nowrap", color: "#6E3A34" }}>
                              {o?.envioTxt}
                            </span>
                          </span>
                        ) : null}
                        <span style={{ display: "flex", justifyContent: "space-between", gap: "14px", paddingTop: "8px", marginTop: "4px", borderTop: "1px solid #E2CBC1", fontSize: "14px", fontWeight: "500" }}>
                          <span>
                            {"Total"}
                          </span>
                          <span>
                            {o?.totalTxt}
                          </span>
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "stretch" }}>
                        <label style={{ position: "relative", display: "flex", alignItems: "center", height: "44px", borderRadius: "999px", border: `1px solid ${o?.stBorder ?? ""}`, background: o?.stBg, color: o?.stColor }}>
                          <select value={o?.estado ?? ""} onChange={o?.setEstado} aria-label={"Estado del pedido"} style={{ appearance: "none", "WebkitAppearance": "none", width: "100%", height: "100%", border: "none", background: "transparent", padding: "0 40px 0 18px", fontSize: "12.5px", letterSpacing: ".08em", color: "inherit", cursor: "pointer", outline: "none" }}>
                            <option value={"Por confirmar"}>
                              {"Por confirmar"}
                            </option>
                            <option value={"Confirmado"}>
                              {"Confirmado"}
                            </option>
                            <option value={"Enviado"}>
                              {"Enviado"}
                            </option>
                            <option value={"Entregado"}>
                              {"Entregado"}
                            </option>
                            <option value={"Cancelado"}>
                              {"Cancelado"}
                            </option>
                          </select>
                          {" "}
                          <svg width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.4"} style={{ position: "absolute", right: "16px", pointerEvents: "none" }}>
                            <path d={"M6 9l6 6 6-6"} />
                          </svg>
                        </label>
                        {" "}
                        <button onClick={o?.remove} style={{ minHeight: "36px", background: "none", border: "none", fontSize: "12px", color: "#6E3A34", cursor: "pointer", textDecoration: "underline", textDecorationColor: "#E2CBC1", textUnderlineOffset: "4px" }} className={"dcp6"}>
                          {"Eliminar registro"}
                        </button>
                      </div>
                    </article>
                  </Fragment>
                ))}
              </div>
            </>
          ) : null}
          {" "}
          {$v.isProductos ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  <label style={{ flex: "1 1 260px", display: "flex", alignItems: "center", gap: "10px", height: "44px", padding: "0 18px", border: "1px solid #E2CBC1", borderRadius: "999px", background: "#FBF4F0", color: "#6E3A34" }}>
                    <svg width={"16"} height={"16"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.3"}>
                      <circle cx={"11"} cy={"11"} r={"6.5"} />
                      <path d={"M20 20l-4.2-4.2"} />
                    </svg>
                    {" "}
                    <input value={$v.q ?? ""} onChange={$v.onQ} placeholder={"Buscar por nombre o marca"} style={{ border: "none", outline: "none", background: "transparent", fontSize: "14px", color: "#3D0000", width: "100%" }} />
                  </label>
                  <div style={{ display: "flex", gap: "6px", overflowX: "auto", scrollbarWidth: "none", flex: "1 1 auto" }}>
                    {arr($v.catChips).map((c, $index) => (
                      <Fragment key={$index}>
                        <button onClick={c?.go} style={{ flex: "none", minHeight: "44px", padding: "0 16px", borderRadius: "999px", border: `1px solid ${c?.border ?? ""}`, background: c?.bg, color: c?.color, fontSize: "12px", letterSpacing: ".06em", cursor: "pointer", whiteSpace: "nowrap" }}>
                          {c?.label}
                        </button>
                      </Fragment>
                    ))}
                  </div>
                </div>
                {$v.tableMode ? (
                  <>
                    <div style={{ background: "#FBF4F0", border: "1px solid #E2CBC1" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "minmax(200px,2.4fr) 1.2fr .8fr .6fr .8fr .9fr 1.2fr 70px", gap: "14px", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #E2CBC1", fontSize: "10.5px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                        <span>
                          {"Producto"}
                        </span>
                        <span>
                          {"Categoría"}
                        </span>
                        <span>
                          {"Precio"}
                        </span>
                        <span>
                          {"Desc."}
                        </span>
                        <span>
                          {"Final"}
                        </span>
                        <span>
                          {"Clics 30 d"}
                        </span>
                        <span>
                          {"Estado"}
                        </span>
                        <span />
                      </div>
                      {arr($v.rows).map((p, $index) => (
                        <Fragment key={$index}>
                          <div style={{ display: "grid", gridTemplateColumns: "minmax(200px,2.4fr) 1.2fr .8fr .6fr .8fr .9fr 1.2fr 70px", gap: "14px", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #E2CBC1", fontSize: "13.5px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: "0" }}>
                              <div style={{ position: "relative", width: "44px", aspectRatio: "4 / 5", flex: "none", background: "#F5E6E0", color: "#6E3A34", filter: p?.filt }}>
                                <ImageSlot id={p?.slot} shape={"rect"} placeholder={" "} />
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "0" }}>
                                <span style={{ fontSize: "10px", letterSpacing: ".2em", textTransform: "uppercase", color: "#7A532E" }}>
                                  {p?.marca}
                                </span>
                                {" "}
                                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "19px", lineHeight: "1.1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {p?.nombre}
                                </span>
                                {" "}
                                <span style={{ fontSize: "11.5px", color: "#6E3A34" }}>
                                  {p?.meta}
                                </span>
                              </div>
                            </div>
                            <span style={{ color: "#6E3A34", lineHeight: "1.4" }}>
                              {p?.cat}
                            </span>
                            {" "}
                            <span style={{ whiteSpace: "nowrap" }}>
                              {p?.precioTxt}
                            </span>
                            {" "}
                            <span style={{ color: p?.descColor }}>
                              {p?.descLabel}
                            </span>
                            {" "}
                            <span style={{ fontWeight: "500", whiteSpace: "nowrap" }}>
                              {p?.finalTxt}
                            </span>
                            {" "}
                            <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ fontWeight: "500" }}>
                                {p?.clics}
                              </span>
                              <span style={{ fontSize: "11.5px", color: "#6E3A34", whiteSpace: "nowrap" }}>
                                {p?.personasTxt}
                              </span>
                            </span>
                            {" "}
                            <label style={{ position: "relative", display: "flex", alignItems: "center", height: "36px", borderRadius: "999px", border: `1px solid ${p?.tagBorder ?? ""}`, background: p?.tagBg, color: p?.tagColor }}>
                              <select value={p?.estado ?? ""} onChange={p?.setEstado} aria-label={"Estado"} style={{ appearance: "none", "WebkitAppearance": "none", width: "100%", height: "100%", border: "none", background: "transparent", padding: "0 30px 0 14px", fontSize: "12px", color: "inherit", cursor: "pointer", outline: "none" }}>
                                <option value={"disponible"}>
                                  {"Disponible"}
                                </option>
                                <option value={"pocas"}>
                                  {"Pocas unidades"}
                                </option>
                                <option value={"agotado"}>
                                  {"Agotado"}
                                </option>
                              </select>
                              {" "}
                              <svg width={"12"} height={"12"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"} style={{ position: "absolute", right: "12px", pointerEvents: "none" }}>
                                <path d={"M6 9l6 6 6-6"} />
                              </svg>
                            </label>
                            {" "}
                            <button onClick={p?.edit} style={{ minHeight: "36px", background: "none", border: "none", fontSize: "12.5px", color: "#3D0000", cursor: "pointer", textDecoration: "underline", textDecorationColor: "#A97C50", textUnderlineOffset: "4px", justifySelf: "end" }}>
                              {"Editar"}
                            </button>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </>
                ) : null}
                {" "}
                {$v.cardMode ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,320px),1fr))", gap: "10px" }}>
                      {arr($v.rows).map((p, $index) => (
                        <Fragment key={$index}>
                          <div style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: "14px", padding: "14px", background: "#FBF4F0", border: "1px solid #E2CBC1" }}>
                            <div style={{ position: "relative", aspectRatio: "4 / 5", background: "#F5E6E0", color: "#6E3A34", filter: p?.filt }}>
                              <ImageSlot id={p?.slot} shape={"rect"} placeholder={" "} />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "0" }}>
                              <span style={{ fontSize: "10px", letterSpacing: ".2em", textTransform: "uppercase", color: "#7A532E" }}>
                                {p?.marca}
                              </span>
                              {" "}
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", lineHeight: "1.1" }}>
                                {p?.nombre}
                              </span>
                              {" "}
                              <span style={{ fontSize: "12px", color: "#6E3A34" }}>
                                {p?.cat}
                              </span>
                              {" "}
                              <span style={{ fontSize: "12px", color: "#3D0000" }}>
                                {p?.clicsTxt}
                              </span>
                              {" "}
                              <span style={{ display: "flex", gap: "10px", alignItems: "baseline", fontSize: "14px", fontWeight: "500" }}>
                                {p?.finalTxt}
                                {p?.hasDesc ? (
                                  <>
                                    <span style={{ fontWeight: "400", fontSize: "12px", color: "#6E3A34" }}>
                                      {p?.descLabel}
                                      {" · antes "}
                                      {p?.precioTxt}
                                    </span>
                                  </>
                                ) : null}
                              </span>
                              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "6px" }}>
                                <label style={{ position: "relative", flex: "1", display: "flex", alignItems: "center", height: "40px", borderRadius: "999px", border: `1px solid ${p?.tagBorder ?? ""}`, background: p?.tagBg, color: p?.tagColor }}>
                                  <select value={p?.estado ?? ""} onChange={p?.setEstado} aria-label={"Estado"} style={{ appearance: "none", "WebkitAppearance": "none", width: "100%", height: "100%", border: "none", background: "transparent", padding: "0 30px 0 14px", fontSize: "12.5px", color: "inherit", cursor: "pointer", outline: "none" }}>
                                    <option value={"disponible"}>
                                      {"Disponible"}
                                    </option>
                                    <option value={"pocas"}>
                                      {"Pocas unidades"}
                                    </option>
                                    <option value={"agotado"}>
                                      {"Agotado"}
                                    </option>
                                  </select>
                                  {" "}
                                  <svg width={"12"} height={"12"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"} style={{ position: "absolute", right: "12px", pointerEvents: "none" }}>
                                    <path d={"M6 9l6 6 6-6"} />
                                  </svg>
                                </label>
                                {" "}
                                <button onClick={p?.edit} style={{ minHeight: "40px", padding: "0 16px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", fontSize: "12px", cursor: "pointer" }}>
                                  {"Editar"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </>
                ) : null}
                {" "}
                <span style={{ fontSize: "12.5px", color: "#6E3A34" }}>
                  {$v.rowsLabel}
                  {" · Clics de los últimos 30 días ("}
                  {$v.mSrcName}
                  {")"}
                </span>
              </div>
            </>
          ) : null}
          {" "}
          {$v.isEncargos ? (
            <AdminEncargos encargos={$v.encargosList} onEstado={$v.encEstado} onEliminar={$v.encEliminar} />
          ) : null}
          {$v.isResenas ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {arr($v.revTabs).map((t, $index) => (
                    <Fragment key={$index}>
                      <button onClick={t?.go} style={{ minHeight: "44px", padding: "0 18px", borderRadius: "999px", border: `1px solid ${t?.border ?? ""}`, background: t?.bg, color: t?.color, fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>
                        {t?.label}
                      </button>
                    </Fragment>
                  ))}
                </div>
                {$v.noRevs ? (
                  <>
                    <p style={{ margin: "0", padding: "28px", background: "#FBF4F0", border: "1px solid #E2CBC1", fontSize: "14px", color: "#6E3A34" }}>
                      {"No hay reseñas en esta lista."}
                    </p>
                  </>
                ) : null}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,340px),1fr))", gap: "clamp(10px,1.6vw,18px)" }}>
                  {arr($v.revs).map((r, $index) => (
                    <Fragment key={$index}>
                      <article style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "22px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                          <span style={{ color: "#A97C50", fontSize: "15px", letterSpacing: ".1em" }}>
                            {r?.stars}
                          </span>
                          {" "}
                          <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            {r?.ejemplo ? (
                              <>
                                <span style={{ padding: "3px 8px", fontSize: "10px", letterSpacing: ".18em", textTransform: "uppercase", border: "1px solid #A97C50", color: "#7A532E" }}>
                                  {"Ejemplo"}
                                </span>
                              </>
                            ) : null}
                            {" "}
                            <span style={{ fontSize: "12px", color: "#6E3A34" }}>
                              {r?.fecha}
                            </span>
                          </span>
                        </div>
                        <h3 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "22px", lineHeight: "1.15" }}>
                          {r?.titulo}
                        </h3>
                        <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#6E3A34", flex: "1" }}>
                          {r?.texto}
                        </p>
                        <span style={{ fontSize: "12.5px", color: "#3D0000" }}>
                          <strong style={{ fontWeight: "500" }}>
                            {r?.nombre}
                          </strong>
                          {" · "}
                          {r?.prodName}
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", paddingTop: "12px", borderTop: "1px solid #E2CBC1" }}>
                          {r?.canApprove ? (
                            <>
                              <button onClick={r?.approve} style={{ minHeight: "40px", padding: "0 18px", borderRadius: "999px", border: "1px solid #3D0000", background: "#3D0000", color: "#F5E6E0", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>
                                {r?.approveLabel}
                              </button>
                            </>
                          ) : null}
                          {" "}
                          {r?.canHide ? (
                            <>
                              <button onClick={r?.hide} style={{ minHeight: "40px", padding: "0 18px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>
                                {"Ocultar"}
                              </button>
                            </>
                          ) : null}
                          {" "}
                          <button onClick={r?.remove} style={{ minHeight: "40px", padding: "0 12px", background: "none", border: "none", color: "#6E3A34", fontSize: "12px", cursor: "pointer", textDecoration: "underline", textDecorationColor: "#E2CBC1", textUnderlineOffset: "4px", marginLeft: "auto" }}>
                            {"Eliminar"}
                          </button>
                        </div>
                      </article>
                    </Fragment>
                  ))}
                </div>
              </div>
            </>
          ) : null}
          {" "}
          {$v.isAjustes ? (
            <>
              <div style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(20px,3vw,36px)", display: "flex", flexDirection: "column", gap: "22px", maxWidth: "760px" }}>
                <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#6E3A34" }}>
                  {"Estos datos se muestran en la tienda: barra de anuncio, botones de WhatsApp, pie de página, envíos, pagos y preguntas frecuentes."}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: "18px" }}>
                  {arr($v.ajFields).map((fd, $index) => (
                    <Fragment key={$index}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                          {fd?.label}
                        </span>
                        {" "}
                        <input value={fd?.value ?? ""} onChange={fd?.set} type={fd?.type} min={0} placeholder={fd?.ph} style={{ width: "100%", minHeight: "46px", padding: "0 16px", border: "1px solid #E2CBC1", borderRadius: "10px", background: "transparent", fontSize: "14.5px", color: "#3D0000", outline: "none" }} />
                        {" "}
                        <span style={{ fontSize: "12px", color: "#6E3A34" }}>
                          {fd?.hint}
                        </span>
                      </label>
                    </Fragment>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "18px", paddingTop: "8px", borderTop: "1px solid #E2CBC1" }}>
                  <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E", paddingTop: "14px" }}>
                    {"Textos de la tienda"}
                  </span>
                  {arr($v.ajTextos).map((fd, $index) => (
                    <Fragment key={$index}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                          {fd?.label}
                        </span>
                        <textarea value={fd?.value ?? ""} onChange={fd?.set} placeholder={fd?.ph} rows={2} maxLength={600} style={{ width: "100%", minHeight: "70px", padding: "12px 16px", border: "1px solid #E2CBC1", borderRadius: "10px", background: "transparent", fontSize: "14.5px", lineHeight: "1.55", color: "#3D0000", outline: "none", resize: "vertical", fontFamily: "inherit" }} />
                        {fd?.hint ? (
                          <span style={{ fontSize: "12px", color: "#6E3A34" }}>
                            {fd?.hint}
                          </span>
                        ) : null}
                      </label>
                    </Fragment>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button onClick={$v.saveAjustes} style={{ minHeight: "48px", padding: "0 28px", borderRadius: "999px", border: "1px solid #3D0000", background: "#3D0000", color: "#F5E6E0", fontSize: "12.5px", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" }} className={"dcp4"}>
                    {"Guardar cambios"}
                  </button>
                </div>
              </div>
              <div style={{ background: "#FBF4F0", border: "1px solid #E2CBC1", padding: "clamp(20px,3vw,36px)", display: "flex", flexDirection: "column", gap: "18px", maxWidth: "760px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                    {"Fotos de la tienda"}
                  </span>
                  <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#6E3A34" }}>
                    {"La foto principal del inicio y la de cada categoría. Toca un recuadro para subir o cambiar la foto."}
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: "12px" }}>
                  {arr($v.tiendaFotos).map((ph, $index) => (
                    <Fragment key={ph.id}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "0" }}>
                        <div style={{ position: "relative", aspectRatio: "4 / 5", background: "#F5E6E0", color: "#6E3A34", overflow: "hidden" }}>
                          <ImageSlot id={ph.id} shape={"rect"} placeholder={" "} editable />
                        </div>
                        <span style={{ fontSize: "12px", color: "#6E3A34" }}>
                          {ph.n}
                        </span>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
              {$v.mobile ? (
                <button onClick={$v.logout} style={{ alignSelf: "flex-start", minHeight: "44px", padding: "0 6px", background: "none", border: "none", color: "#6E3A34", fontSize: "12.5px", cursor: "pointer", textDecoration: "underline", textDecorationColor: "#E2CBC1", textUnderlineOffset: "4px" }}>
                  {"Cerrar sesión"}
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </main>
      {$v.editing ? (
        <>
          <div data-screen-label={"Editar producto"} style={{ position: "fixed", inset: "0", zIndex: "80", display: "flex", justifyContent: "flex-end" }}>
            <div onClick={$v.closeEdit} style={{ position: "absolute", inset: "0", background: "rgba(61,0,0,.42)" }} />
            <aside style={{ position: "relative", width: "min(620px,100%)", height: "100%", background: "#FBF4F0", display: "flex", flexDirection: "column", boxShadow: "-20px 0 60px rgba(61,0,0,.18)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "16px 14px 16px 24px", borderBottom: "1px solid #E2CBC1" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "11px", letterSpacing: ".24em", textTransform: "uppercase", color: "#7A532E" }}>
                    {$v.editEyebrow}
                  </span>
                  {" "}
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: "300", fontSize: "30px", lineHeight: "1" }}>
                    {$v.editTitle}
                  </span>
                </div>
                <button onClick={$v.closeEdit} aria-label={"Cerrar"} style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: "#3D0000", cursor: "pointer" }}>
                  <svg width={"20"} height={"20"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.2"}>
                    <path d={"M6 6l12 12M18 6L6 18"} />
                  </svg>
                </button>
              </div>
              <div style={{ flex: "1", overflowY: "auto", padding: "22px 24px 28px", display: "flex", flexDirection: "column", gap: "26px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                    {"Fotos (toca o arrastra la imagen a cada recuadro)"}
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "10px" }}>
                    {arr($v.editPhotos).map((ph, $index) => (
                      <Fragment key={$index}>
                        <div style={{ position: "relative", minWidth: "0", aspectRatio: "4 / 5", background: "#F5E6E0", color: "#6E3A34", overflow: "hidden" }}>
                          <ImageSlot id={ph?.id} shape={"rect"} placeholder={ph?.n} editable />
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: "16px", minWidth: "0" }}>
                  {arr($v.textFields).map((fd, $index) => (
                    <Fragment key={$index}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                          {fd?.label}
                        </span>
                        {" "}
                        <input value={fd?.value ?? ""} onChange={fd?.set} type={fd?.type} placeholder={fd?.ph} style={{ width: "100%", minHeight: "46px", padding: "0 16px", border: "1px solid #E2CBC1", borderRadius: "10px", background: "transparent", fontSize: "14.5px", color: "#3D0000", outline: "none" }} />
                      </label>
                    </Fragment>
                  ))}
                  {" "}
                  {arr($v.selectFields).map((fd, $index) => (
                    <Fragment key={$index}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                          {fd?.label}
                        </span>
                        {" "}
                        <span style={{ position: "relative", display: "flex", alignItems: "center" }}>
                          <select value={fd?.value ?? ""} onChange={fd?.set} style={{ appearance: "none", "WebkitAppearance": "none", width: "100%", minHeight: "46px", padding: "0 40px 0 16px", border: "1px solid #E2CBC1", borderRadius: "10px", background: "transparent", fontSize: "14.5px", color: "#3D0000", outline: "none", cursor: "pointer" }}>
                            {arr(fd?.options).map((o, $index) => (
                              <Fragment key={$index}>
                                <option value={o?.v ?? ""}>
                                  {o?.n}
                                </option>
                              </Fragment>
                            ))}
                          </select>
                          {" "}
                          <svg width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.4"} style={{ position: "absolute", right: "16px", pointerEvents: "none" }}>
                            <path d={"M6 9l6 6 6-6"} />
                          </svg>
                        </span>
                      </label>
                    </Fragment>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "16px 18px", background: "#F5E6E0" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>
                      {"Precio final en la tienda"}
                    </span>
                    {" "}
                    <span style={{ fontSize: "12.5px", color: "#6E3A34" }}>
                      {$v.editPriceHint}
                    </span>
                  </div>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "30px" }}>
                    {$v.editFinal}
                  </span>
                </div>
                <button onClick={$v.toggleNuevo} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", minHeight: "52px", padding: "0 4px", background: "none", border: "none", borderBottom: "1px solid #E2CBC1", cursor: "pointer", textAlign: "left", color: "#3D0000" }}>
                  <span style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>
                      {"Marcar como nuevo"}
                    </span>
                    <span style={{ fontSize: "12.5px", color: "#6E3A34" }}>
                      {"Aparece en “Recién llegados” con la etiqueta Nuevo."}
                    </span>
                  </span>
                  {" "}
                  <span style={{ width: "46px", height: "26px", borderRadius: "999px", background: $v.nuevoTrack, position: "relative", flex: "none", transition: "background .2s" }}>
                    <span style={{ position: "absolute", top: "3px", left: $v.nuevoKnob, width: "20px", height: "20px", borderRadius: "999px", background: "#FBF4F0", transition: "left .2s" }} />
                  </span>
                </button>
                {" "}
                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                    {"Descripción"}
                  </span>
                  {" "}
                  <textarea value={$v.editDesc ?? ""} onChange={$v.onDesc} rows={"3"} style={{ width: "100%", padding: "12px 16px", border: "1px solid #E2CBC1", borderRadius: "10px", background: "transparent", fontSize: "14.5px", lineHeight: "1.55", color: "#3D0000", outline: "none", resize: "vertical", fontFamily: "Jost, sans-serif" }} />
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                    {"Pirámide olfativa (separa las notas con ·)"}
                  </span>
                  {" "}
                  {arr($v.noteFields).map((fd, $index) => (
                    <Fragment key={$index}>
                      <label style={{ display: "grid", gridTemplateColumns: "88px 1fr", gap: "12px", alignItems: "center" }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "19px" }}>
                          {fd?.label}
                        </span>
                        {" "}
                        <input value={fd?.value ?? ""} onChange={fd?.set} style={{ width: "100%", minHeight: "44px", padding: "0 14px", border: "1px solid #E2CBC1", borderRadius: "10px", background: "transparent", fontSize: "14px", color: "#3D0000", outline: "none" }} />
                      </label>
                    </Fragment>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                      {"Temporada y momento"}
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {arr($v.editChips).map((c, $index) => (
                        <Fragment key={$index}>
                          <button onClick={c?.toggle} style={{ minHeight: "38px", padding: "0 14px", borderRadius: "999px", border: `1px solid ${c?.border ?? ""}`, background: c?.bg, color: c?.color, fontSize: "12.5px", cursor: "pointer" }}>
                            {c?.label}
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {arr($v.editScales).map((sc, $index) => (
                      <Fragment key={$index}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <span style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#7A532E" }}>
                            {sc?.label}
                            <span style={{ letterSpacing: ".04em", textTransform: "none", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "17px", color: "#3D0000" }}>
                              {sc?.word}
                            </span>
                          </span>
                          <div style={{ display: "flex", gap: "4px" }}>
                            {arr(sc?.steps).map((s, $index) => (
                              <Fragment key={$index}>
                                <button onClick={s?.set} aria-label={s?.aria} style={{ flex: "1", height: "32px", border: "none", background: "none", padding: "0", cursor: "pointer", display: "flex", alignItems: "center" }}>
                                  <span style={{ width: "100%", height: "4px", background: s?.bg }} />
                                </button>
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "14px 24px", borderTop: "1px solid #E2CBC1" }}>
                {$v.canDelete ? (
                  <>
                    <button onClick={$v.deleteProduct} style={{ minHeight: "44px", padding: "0 6px", background: "none", border: "none", color: "#6E3A34", fontSize: "12.5px", cursor: "pointer", textDecoration: "underline", textDecorationColor: "#E2CBC1", textUnderlineOffset: "4px" }} className={"dcp6"}>
                      {$v.deleteLabel}
                    </button>
                  </>
                ) : null}
                {" "}
                <span style={{ flex: "1" }} />
                {" "}
                <button onClick={$v.closeEdit} style={{ minHeight: "48px", padding: "0 22px", borderRadius: "999px", border: "1px solid #3D0000", background: "transparent", color: "#3D0000", fontSize: "12px", letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer" }}>
                  {"Cancelar"}
                </button>
                {" "}
                <button onClick={$v.saveEdit} style={{ minHeight: "48px", padding: "0 26px", borderRadius: "999px", border: "1px solid #3D0000", background: "#3D0000", color: "#F5E6E0", fontSize: "12px", letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer" }} className={"dcp4"}>
                  {"Guardar"}
                </button>
              </div>
            </aside>
          </div>
        </>
      ) : null}
      {" "}
      {$v.hasToast ? (
        <>
          <div style={{ position: "fixed", left: "50%", bottom: "28px", transform: "translateX(-50%)", zIndex: "90", padding: "14px 24px", borderRadius: "999px", background: "#3D0000", color: "#F5E6E0", fontSize: "13px", boxShadow: "0 10px 30px rgba(61,0,0,.25)", maxWidth: "calc(100vw - 32px)" }}>
            {$v.toast}
          </div>
        </>
      ) : null}
    </div>
  </>
  );
}
