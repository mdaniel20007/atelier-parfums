// Métricas de Atelier Parfums: agrega los eventos que registra la tienda
// (visitas, clics, WhatsApp, pedidos, búsquedas) para los tableros del administrador.
// En producción conviene mover aggregate() al servidor.

  const DAY = 864e5;
  const sod = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  // Sin datos de ejemplo. sample() se conserva solo por compatibilidad y devuelve [].
  function sample() { return []; }

  function aggregate(events, productos, days, cats, matchCat) {
    const now = Date.now();
    const from = sod(now) - (days - 1) * DAY;
    const pfrom = from - days * DAY;
    const cur = [], prev = [];
    for (const e of events) { if (e.t >= from && e.t <= now) cur.push(e); else if (e.t >= pfrom && e.t < from) prev.push(e); }
    const kpi = (list) => {
      const k = { visitas: 0, clics: 0, vistas: 0, wa: 0, agregar: 0, pedidos: 0, ingresos: 0, articulos: 0 };
      const vids = new Set();
      for (const e of list) {
        vids.add(e.vid);
        if (e.tipo === 'visita') k.visitas++;
        else if (e.tipo === 'clic') k.clics++;
        else if (e.tipo === 'vista') k.vistas++;
        else if (e.tipo === 'whatsapp') k.wa++;
        else if (e.tipo === 'agregar') k.agregar++;
        else if (e.tipo === 'pedido') { k.pedidos++; k.ingresos += e.total || 0; k.articulos += (e.pids || []).length; }
      }
      k.personas = vids.size;
      k.conv = k.visitas ? (k.pedidos / k.visitas) * 100 : 0;
      return k;
    };
    const daily = [];
    for (let i = 0; i < days; i++) daily.push({ t: from + i * DAY, visitas: 0, clics: 0, wa: 0, pedidos: 0 });
    const dev = { mob: 0, desk: 0 };
    const horas = new Array(24).fill(0);
    const semana = new Array(7).fill(0);
    const sets = { v: new Set(), c: new Set(), a: new Set(), p: new Set() };
    const prod = {};
    const P = (id) => prod[id] || (prod[id] = { pid: id, clics: 0, personas: new Set(), vistas: 0, wa: 0, agregar: 0, pedidos: 0, intencion: new Set() });
    const catNav = {};
    const busq = {};
    for (const e of cur) {
      const di = Math.floor((sod(e.t) - from) / DAY);
      const row = daily[di];
      if (e.tipo === 'visita') { if (row) row.visitas++; dev[e.dev === 'desk' ? 'desk' : 'mob']++; horas[new Date(e.t).getHours()]++; semana[new Date(e.t).getDay()]++; sets.v.add(e.vid); }
      else if (e.tipo === 'clic') { if (row) row.clics++; sets.c.add(e.vid); if (e.pid) { const x = P(e.pid); x.clics++; x.personas.add(e.vid); } }
      else if (e.tipo === 'vista') { if (e.pid) P(e.pid).vistas++; }
      else if (e.tipo === 'whatsapp') { if (row) row.wa++; if (e.pid) { const x = P(e.pid); x.wa++; x.intencion.add(e.vid); } }
      else if (e.tipo === 'agregar') { sets.a.add(e.vid); if (e.pid) { const x = P(e.pid); x.agregar++; x.intencion.add(e.vid); } }
      else if (e.tipo === 'pedido') { if (row) row.pedidos++; sets.p.add(e.vid); (e.pids || []).forEach((id) => P(id).pedidos++); }
      else if (e.tipo === 'categoria' && e.cat) catNav[e.cat] = (catNav[e.cat] || 0) + 1;
      else if (e.tipo === 'busqueda' && e.q) { const q = String(e.q).trim().toLowerCase(); if (q) { const b = busq[q] || (busq[q] = { q, n: 0, res: e.res }); b.n++; b.res = e.res; } }
    }
    const prodList = productos.map((p) => { const x = prod[p.id] || P(p.id); return { pid: p.id, clics: x.clics, personas: x.personas.size, vistas: x.vistas, wa: x.wa, agregar: x.agregar, pedidos: x.pedidos, intencion: x.intencion.size }; });
    const catList = cats.map((c) => {
      let clics = 0;
      productos.forEach((p) => { if (matchCat(p, c)) clics += (prod[p.id] ? prod[p.id].clics : 0); });
      return { cat: c, clics, nav: catNav[c] || 0 };
    });
    return {
      kpi: kpi(cur), prev: kpi(prev), daily, dev, horas, semana,
      funnel: [sets.v.size, sets.c.size, sets.a.size, sets.p.size],
      prod: prodList, cats: catList,
      busq: Object.values(busq).sort((a, b) => b.n - a.n),
      eventos: cur.length
    };
  }
const AtelierMetricas = { sample, aggregate };
if (typeof window !== "undefined") window.AtelierMetricas = AtelierMetricas;
export default AtelierMetricas;

