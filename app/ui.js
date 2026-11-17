/* SUM · interfaz. Sin dependencias: lee window.SUM_DATOS (datos.js) y window.SUM (motor.js). */
(function () {
  'use strict';
  const D = window.SUM_DATOS, M = window.SUM, DIC = D.dic, LISTAS = D.listas, CFG = D.cfg, ZONAS = D.zonas;
  const $ = s => document.querySelector(s);
  const clon = o => JSON.parse(JSON.stringify(o));
  const esc = s => String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const fn = (v, d) => M.isNum(v) ? v.toFixed(d === undefined ? 1 : d).replace('.', ',') : '—';
  const pct = v => M.isNum(v) ? (v * 100).toFixed(1).replace('.', ',') + ' %' : '—';
  const pn = v => { v = String(v).trim().replace(',', '.'); if (v === '') return null; const n = Number(v); return isFinite(n) ? n : null; };
  const niv = n => `<span class="niv n${n}" title="${n} de 3">${'■'.repeat(n)}${'□'.repeat(3 - n)}</span>`;
  const COMP = Object.keys(LISTAS.component);
  const CERT = ['[verificado]', '[rango de literatura]', '[estimado por analogía]'];
  const CLAVE = 'sum_app_v1';
  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

  let GRAFS = {};
  const st = { tab: 'inicio', dash: 'gen', deshacer: null, conComp: true, plComp: 'PAR', editadas: {}, ed: null, edVer: 'errores', edNf: { id: '', cita: '', tipo: 'ficha_tecnica' }, PAR: clon(D.param), S: null, sitioSel: '', comp: 'CUB', norm: 'proporcional', aj: {}, manual: {}, manualAutor: false, abierto: null, fichasUsuario: [], sitiosUsuario: [], fichaVista: null, filtro: { comp: '', q: '' }, form: null };
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify({ PAR: st.PAR, editadas: st.editadas, fichasUsuario: st.fichasUsuario, sitiosUsuario: st.sitiosUsuario, aj: st.aj, manual: st.manual, norm: st.norm })); } catch (e) { /* almacenamiento no disponible: se sigue en memoria */ }
  }
  function recuperar() {
    try { const g = JSON.parse(localStorage.getItem(CLAVE) || 'null'); if (!g) return; ['fichasUsuario', 'sitiosUsuario', 'aj', 'manual', 'norm', 'editadas'].forEach(k => { if (g[k]) st[k] = g[k]; }); if (g.PAR && g.PAR.umbrales) st.PAR = Object.assign(clon(D.param), g.PAR); } catch (e) { /* sin datos previos */ }
  }
  const esComp = c => !!c && (c.fuentes || []).some(r => /^INT-/.test(r.ref));
  const base = () => D.fichas.map(f => st.editadas[f.meta.id] || f);
  const sinComp = () => (base().map(f => { const g = Object.assign({}, f, { campos: {} }); Object.keys(f.campos).forEach(k => { g.campos[k] = esComp(f.campos[k]) ? { estado: 'no_disponible', nota: 'Dato de complemento excluido de esta vista.' } : f.campos[k]; }); return g; }));
  const fichas = () => base().concat(st.fichasUsuario);
  const fichasEval = () => (st.conComp ? base() : sinComp()).concat(st.fichasUsuario);
  const sitios = () => D.sitios.map(j => ({ k: 'b:' + j.sitio.id, j })).concat(st.sitiosUsuario.map(j => ({ k: 'u:' + j.sitio.id, j })));
  const calc = () => M.calcularSitio(st.S, st.PAR, ZONAS);
  function manualEfectivo() {
    const m = {};
    if (st.manualAutor && st.S.seleccion_manual) st.S.seleccion_manual.forEach(x => { if (x.id_ficha) m[x.id_ficha] = Object.assign({}, x.puntajes); });
    Object.keys(st.manual).forEach(id => { m[id] = Object.assign(m[id] || {}, st.manual[id]); });
    return m;
  }
  const evalComp = (comp, C) => M.evaluar(fichasEval(), comp, C, st.PAR, CFG, DIC, { norm: st.norm, manual: manualEfectivo(), aj: st.aj });
  function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 4200); }
  function bajar(nombre, texto, tipo) {
    const a = document.createElement('a'); a.href = URL.createObjectURL((texto instanceof Blob ? texto : new Blob([texto], { type: tipo || 'application/json' }))); a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function cargarSitio(k) {
    const x = sitios().find(s => s.k === k); if (!x) return;
    st.S = M.sitioDesdeJson(clon(x.j), st.PAR); st.sitioSel = k; st.manualAutor = false;
  }

  /* ================= 1. SITIO Y CLIMA ================= */
  /* ================= ICONOS Y GRÁFICOS (SVG propio, sin librerías) ================= */
  const ico = d => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const IC = {
    inicio: ico('<path d="M3 11 12 4l9 7"/><path d="M6 10v9h12v-9"/>'), sitio: ico('<circle cx="8" cy="9" r="3"/><path d="M8 2v2M8 14v2M1 9h2M13 9h2"/><path d="M10 20h9a3 3 0 0 0 0-6 5 5 0 0 0-9 1 2.5 2.5 0 0 0 0 5z"/>'),
    perfil: ico('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'), eval: ico('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    edif: ico('<path d="M4 21V7l8-4 8 4v14"/><path d="M9 21v-5h6v5M9 10h.01M15 10h.01"/>'), fichas: ico('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
    tutorial: ico('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M9 8h6M9 12h6"/>'), subir: ico('<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>'), bajar: ico('<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>'),
    cal: ico('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'), limpiar: ico('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'), img: ico('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m3 16 5-5 4 4 3-3 6 6"/>'),
    globo: ico('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'), capas: ico('<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>'), ok: ico('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'),
    fuente: ico('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h6M9 16h6"/>'), balanza: ico('<path d="M12 4v16M6 20h12M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>'), mas: ico('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'), lapiz: ico('<path d="M4 20h4L19 9l-4-4L4 16z"/>')
  };
  const FAM = 'Segoe UI,system-ui,-apple-system,Arial,sans-serif', TX = '#56645e';
  const fnum = v => (Math.round(v * 10) % 10 === 0 ? String(Math.round(v)) : v.toFixed(1)).replace('.', ',');
  const r2 = v => Math.round(v * 10) / 10;
  function escala(min, max) {
    if (!(max > min)) max = min + 1;
    const p0 = (max - min) / 4, mag = Math.pow(10, Math.floor(Math.log10(p0))), n = p0 / mag, paso = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
    const a = Math.floor(min / paso + 1e-9) * paso, b = Math.ceil(max / paso - 1e-9) * paso, t = [];
    for (let v = a; v <= b + paso / 1e6; v += paso) t.push(Math.round(v * 1e6) / 1e6);
    return { a, b, t };
  }
  const GW = 440, GH = 250, GL = 42, GR = 12, GT = 24, GB = 46;
  function marco(e, unidad) {
    const y = v => r2(GT + (GH - GT - GB) * (1 - (v - e.a) / (e.b - e.a))), w = (GW - GL - GR) / 12;
    let s = `<text x="2" y="12" font-size="10.5" fill="${TX}">${unidad}</text>`;
    e.t.forEach(v => { s += `<line x1="${GL}" x2="${GW - GR}" y1="${y(v)}" y2="${y(v)}" stroke="${v === e.a ? '#b9b4a4' : '#ebe6d9'}"/><text x="${GL - 6}" y="${y(v) + 3.5}" font-size="10.5" fill="${TX}" text-anchor="end">${fnum(v)}</text>`; });
    MESES.forEach((m, i) => { s += `<text x="${r2(GL + i * w + w / 2)}" y="${GH - GB + 15}" font-size="10.5" fill="${TX}" text-anchor="middle">${m}</text>`; });
    return { s, y, w };
  }
  const leyenda = items => items.map((it, i) => `<g transform="translate(${GL + i * 132},${GH - 12})"><rect width="14" height="${it.linea ? 3 : 9}" y="${it.linea ? -5 : -8}" rx="2" fill="${it.c}"/><text x="19" y="0" font-size="10.5" fill="${TX}">${it.n}</text></g>`).join('');
  function gBarras(vals, o) {
    const ok = vals.filter(M.isNum), e = escala(0, Math.max(...ok, 1)), m = marco(e, o.unidad), mx = Math.max(...ok);
    let s = m.s;
    vals.forEach((v, i) => { if (!M.isNum(v)) return; const x = r2(GL + i * m.w + 5), yy = m.y(v), h = r2(m.y(0) - yy);
      s += `<rect x="${x}" y="${yy}" width="${r2(m.w - 10)}" height="${Math.max(h, 0.5)}" rx="3" fill="${o.c}"><title>${MESES[i]}: ${fn(v, o.dec || 0)} ${o.unidad}</title></rect>`;
      if (v === mx || v === Math.min(...ok)) s += `<text x="${r2(x + (m.w - 10) / 2)}" y="${yy - 4}" font-size="10" fill="#17231f" text-anchor="middle" font-weight="600">${fn(v, o.dec || 0)}</text>`; });
    return { W: GW, H: GH - 18, b: s };
  }
  function gLineas(series, o) {
    const all = [].concat(...series.map(x => x.v)).filter(M.isNum), e = o.fijo ? escala(o.fijo[0], o.fijo[1]) : escala(Math.min(...all) - (o.aire || 0), Math.max(...all) + (o.aire || 0)), m = marco(e, o.unidad);
    let s = m.s;
    series.forEach(x => {
      const pts = x.v.map((v, i) => M.isNum(v) ? [r2(GL + i * m.w + m.w / 2), m.y(v)] : null), segs = []; let cur = [];
      pts.forEach(p => { if (p) cur.push(p); else if (cur.length) { segs.push(cur); cur = []; } }); if (cur.length) segs.push(cur);
      if (o.area) segs.forEach(g => { s += `<path d="M${g[0][0]},${m.y(e.a)}L${g.map(p => p.join(',')).join('L')}L${g[g.length - 1][0]},${m.y(e.a)}Z" fill="${x.c}" opacity=".14"/>`; });
      segs.forEach(g => { s += `<polyline points="${g.map(p => p.join(',')).join(' ')}" fill="none" stroke="${x.c}" stroke-width="2" stroke-linejoin="round"/>`; });
      pts.forEach((p, i) => { if (p) s += `<circle cx="${p[0]}" cy="${p[1]}" r="3.2" fill="${x.c}" stroke="#fff" stroke-width="1.2"><title>${x.n} · ${MESES[i]}: ${fn(x.v[i], o.dec === undefined ? 1 : o.dec)} ${o.unidad}</title></circle>`; });
    });
    if (series.length > 1) s += leyenda(series.map(x => ({ c: x.c, n: x.n, linea: true })));
    return { W: GW, H: series.length > 1 ? GH : GH - 18, b: s };
  }
  function gClimo(mens) {
    const hay = mens.some(m => m && m.prec !== null), ts = [].concat(...mens.filter(Boolean).map(m => [m.tmax, m.tmin])), et = escala(Math.min(...ts) - 2, Math.max(...ts) + 2), ep = escala(0, Math.max(50, ...mens.map(m => m && m.prec || 0)));
    const yt = v => r2(GT + (GH - GT - GB) * (1 - (v - et.a) / (et.b - et.a))), yp = v => r2(GT + (GH - GT - GB) * (1 - v / ep.b)), w = (GW - GL - 34) / 12;
    let s = `<text x="2" y="12" font-size="10.5" fill="${TX}">${hay ? 'mm' : ''}</text><text x="${GW - 2}" y="12" font-size="10.5" fill="${TX}" text-anchor="end">°C</text>`;
    for (let i = 0; i <= 4; i++) { const yy = r2(GT + (GH - GT - GB) * (1 - i / 4)); s += `<line x1="${GL}" x2="${GW - 34}" y1="${yy}" y2="${yy}" stroke="${i ? '#ebe6d9' : '#b9b4a4'}"/><text x="${GW - 28}" y="${yy + 3.5}" font-size="10.5" fill="${TX}">${fnum(et.a + (et.b - et.a) * i / 4)}</text>`; if (hay) s += `<text x="${GL - 6}" y="${yy + 3.5}" font-size="10.5" fill="${TX}" text-anchor="end">${fnum(ep.b * i / 4)}</text>`; }
    mens.forEach((m, i) => { if (!m) return; const x = r2(GL + i * w); if (m.prec !== null) s += `<rect x="${x + 5}" y="${yp(m.prec)}" width="${r2(w - 10)}" height="${Math.max(0.5, r2(yp(0) - yp(m.prec)))}" rx="3" fill="#7fa9c4"><title>${MESES[i]}: ${fn(m.prec, 0)} mm</title></rect>`; s += `<text x="${r2(x + w / 2)}" y="${GH - GB + 15}" font-size="10.5" fill="${TX}" text-anchor="middle">${MESES[i]}</text>`; });
    [['tmax', '#b4532a', 'T máx'], ['tmin', '#0e5a4a', 'T mín']].forEach(([k, c, n]) => { const p = mens.map((m, i) => m ? [r2(GL + i * w + w / 2), yt(m[k])] : null).filter(Boolean); s += `<polyline points="${p.map(q => q.join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="2"/>` + mens.map((m, i) => m ? `<circle cx="${r2(GL + i * w + w / 2)}" cy="${yt(m[k])}" r="3.2" fill="${c}" stroke="#fff" stroke-width="1.2"><title>${n} · ${MESES[i]}: ${fn(m[k])} °C</title></circle>` : '').join(''); });
    s += leyenda((hay ? [{ c: '#7fa9c4', n: 'Lluvia (mm, izq.)' }] : []).concat([{ c: '#b4532a', n: 'T máx (°C, der.)', linea: true }, { c: '#0e5a4a', n: 'T mín (°C, der.)', linea: true }]));
    return { W: GW, H: GH, b: s };
  }
  const cuna = (cx, cy, r1, r2_, a1, a2) => { const P = (r, a) => r2(cx + r * Math.sin(a)) + ',' + r2(cy - r * Math.cos(a)), g = a2 - a1 > Math.PI ? 1 : 0; return `M${P(r2_, a1)}A${r2_},${r2_} 0 ${g} 1 ${P(r2_, a2)}L${P(r1, a2)}A${r1},${r1} 0 ${g} 0 ${P(r1, a1)}Z`; };
  const ROSA_C = ['#cfe6df', '#9ccbbd', '#5faa98', '#2c8371', '#0a4539'], DIR16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  function gRosa(ro) {
    const W = 440, H = 300, cx = 150, cy = 152, R = 112, pc = ro.sectores.map(b => b.map(n => 100 * n / ro.total)), mx = Math.max(...pc.map(b => b.reduce((a, x) => a + x, 0)), 1), e = escala(0, mx), k = R / e.b;
    let s = '';
    e.t.slice(1).forEach(t => { s += `<circle cx="${cx}" cy="${cy}" r="${r2(t * k)}" fill="none" stroke="#e4dfd0"/><text x="${cx + 3}" y="${r2(cy - t * k - 2)}" font-size="9.5" fill="${TX}">${fnum(t)} %</text>`; });
    [0, 1, 2, 3].forEach(i => { const a = i * Math.PI / 4; s += `<line x1="${r2(cx - R * Math.sin(a))}" y1="${r2(cy + R * Math.cos(a))}" x2="${r2(cx + R * Math.sin(a))}" y2="${r2(cy - R * Math.cos(a))}" stroke="#eee9dc"/>`; });
    pc.forEach((b, i) => { let acc = 0; const a0 = i * Math.PI / 8; b.forEach((p, j) => { if (p <= 0) return; s += `<path d="${cuna(cx, cy, acc * k, (acc + p) * k, a0 - 0.165, a0 + 0.165)}" fill="${ROSA_C[j]}" stroke="#fff" stroke-width=".8"><title>${DIR16[i]} · ${ro.clases[j]} m/s: ${fn(p)} % de las horas</title></path>`; acc += p; }); });
    [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['O', -1, 0]].forEach(([t, dx, dy]) => { s += `<text x="${cx + dx * (R + 13)}" y="${cy + dy * (R + 13) + 4}" font-size="12" font-weight="700" fill="#17231f" text-anchor="middle">${t}</text>`; });
    s += `<text x="300" y="70" font-size="10.5" fill="${TX}">Velocidad (m/s)</text>` + ro.clases.map((c, j) => `<rect x="300" y="${80 + j * 20}" width="16" height="12" rx="2" fill="${ROSA_C[j]}"/><text x="322" y="${90 + j * 20}" font-size="11" fill="#17231f">${c}</text>`).join('') + `<text x="300" y="200" font-size="11" fill="#17231f">Calma (≤ 0,5): ${fn(100 * ro.calma / ro.total)} %</text><text x="300" y="218" font-size="10" fill="${TX}">Radio = % de las horas</text><text x="300" y="232" font-size="10" fill="${TX}">desde cada dirección</text>`;
    return { W, H, b: s };
  }
  const svgDe = (g, titulo, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.W} ${g.H}"${px ? ` width="${px}" height="${Math.round(px * g.H / g.W)}"` : ''} role="img" aria-label="${esc(titulo)}" font-family="${FAM}">${px ? `<rect width="${g.W}" height="${g.H}" fill="#fff"/>` : ''}${g.b}</svg>`;
  function grafsEPW(e) {
    const m = e.mensual, col = k => m.map(x => x ? x[k] : null), L = [{ k: 'climograma', t: 'Climograma: lluvia y temperatura', g: gClimo(m) },
      { k: 'temperatura', t: 'Temperatura media mensual (°C)', g: gLineas([{ n: 'Máxima', c: '#c53a2a', v: col('tmax') }, { n: 'Media', c: '#b8952a', v: col('tmed') }, { n: 'Mínima', c: '#1b7fb5', v: col('tmin') }], { unidad: '°C', aire: 1 }) }];
    if (m.some(x => x && x.prec !== null)) L.push({ k: 'lluvia', t: 'Lluvia mensual (mm)', g: gBarras(col('prec'), { c: '#3b7ea1', unidad: 'mm' }) }, { k: 'dias_lluvia', t: 'Días con lluvia por mes', g: gBarras(col('dias'), { c: '#6d9bb8', unidad: 'días' }) });
    if (m.some(x => x && x.hr !== null)) L.push({ k: 'humedad', t: 'Humedad relativa media (%)', g: gLineas([{ n: 'HR', c: '#2a7f7f', v: col('hr') }], { unidad: '%', fijo: [0, 100], area: true, dec: 0 }) });
    if (m.some(x => x && x.ghi !== null)) L.push({ k: 'radiacion', t: 'Radiación global diaria (kWh/m²·día)', g: gBarras(col('ghi'), { c: '#c98a12', unidad: 'kWh/m²·d', dec: 2 }) });
    if (m.some(x => x && x.viento !== null)) L.push({ k: 'viento', t: 'Velocidad media del viento (m/s)', g: gLineas([{ n: 'Viento', c: '#4b5d73', v: col('viento') }], { unidad: 'm/s', fijo: [0, Math.max(...col('viento').filter(M.isNum)) * 1.15], area: true }) });
    if (e.rosa) L.push({ k: 'rosa_vientos', t: 'Rosa de los vientos (año completo)', g: gRosa(e.rosa) });
    return L;
  }
  function svgAPng(svg, w, h, nombre) {
    const img = new Image();
    img.onload = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h); c.toBlob(b => bajar(nombre, b, 'image/png')); };
    img.onerror = () => toast('No se pudo generar la imagen en este navegador.');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  const slugSitio = () => (st.S.sitio.nombre || 'sitio').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '') || 'sitio';
  function laminaEPW() {
    const e = st.S.epw, G = grafsEPW(e), a = e.anual, W = 1920, H = 1080, x = t => esc(t);
    const K = [['T máx media', fn(a.t_max_media) + ' °C'], ['T mín media', fn(a.t_min_media) + ' °C'], ['T media', fn(a.t_media) + ' °C'], ['Lluvia anual', a.precipitacion_anual === null ? 'sin dato' : fn(a.precipitacion_anual, 0) + ' mm'], ['Días con lluvia', a.dias_con_lluvia === null ? 'sin dato' : String(a.dias_con_lluvia)], ['Meses secos', a.meses_secos === null ? 'sin dato' : String(a.meses_secos)], ['Humedad relativa', fn(a.hr_media_anual, 0) + ' %'], ['Radiación (kWh/m²·d)', fn(a.radiacion_global, 2)], ['Viento', fn(a.viento_medio) + ' m/s ' + (a.viento_dir || '')]];
    let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FAM}"><rect width="${W}" height="${H}" fill="#f7f5ee"/><rect width="${W}" height="118" fill="#0e5a4a"/><text x="48" y="58" font-size="40" font-weight="700" fill="#fff">Clima del sitio · ${x(st.S.sitio.nombre || e.loc.ciudad)}</text><text x="48" y="94" font-size="20" fill="#d9ece5">${x([e.loc.ciudad, e.loc.region, e.loc.pais].filter(t => t && t !== '-').join(', '))} · lat ${fn(e.loc.lat, 3)} · lon ${fn(e.loc.lon, 3)} · ${fn(e.loc.elev, 0)} msnm · EPW «${x(e.archivo || '')}» (${x(e.loc.fuente || 'fuente no declarada')})</text><text x="${W - 48}" y="58" font-size="26" font-weight="700" fill="#fff" text-anchor="end">SUM</text><text x="${W - 48}" y="90" font-size="16" fill="#d9ece5" text-anchor="end">Selección y Uso de Materiales</text>`;
    const kw = (W - 96 - 8 * 12) / 9;
    K.forEach(([l, v], i) => { const kx = 48 + i * (kw + 12); s += `<rect x="${kx}" y="136" width="${kw}" height="84" rx="12" fill="#fff" stroke="#ddd7c6"/><rect x="${kx}" y="136" width="6" height="84" rx="3" fill="${['#0e5a4a', '#c98a12', '#3b7ea1', '#a8501c'][i % 4]}"/><text x="${kx + 18}" y="164" font-size="15" fill="#56645e">${x(l)}</text><text x="${kx + 18}" y="200" font-size="21" font-weight="700" fill="#17231f">${x(v)}</text>`; });
    const cw = (W - 96 - 3 * 16) / 4, ch = 400;
    G.slice(0, 8).forEach((g, i) => { const gx = 48 + (i % 4) * (cw + 16), gy = 240 + Math.floor(i / 4) * (ch + 14), sc = Math.min((cw - 24) / g.g.W, (ch - 62) / g.g.H);
      s += `<rect x="${gx}" y="${gy}" width="${cw}" height="${ch}" rx="14" fill="#fff" stroke="#ddd7c6"/><text x="${gx + 16}" y="${gy + 32}" font-size="19" font-weight="700" fill="#17231f">${x(g.t)}</text><svg x="${gx + 12}" y="${gy + 46}" width="${r2(g.g.W * sc)}" height="${r2(g.g.H * sc)}" viewBox="0 0 ${g.g.W} ${g.g.H}">${g.g.b}</svg>`; });
    s += `<text x="48" y="${H - 14}" font-size="14" fill="#56645e">T máx y T mín: promedio de máximas y mínimas diarias · día con lluvia ≥ ${fn(e.criterios.dia_lluvia_mm)} mm · mes seco &lt; ${e.criterios.mes_seco_mm} mm · un EPW es un año típico o sintético, no una medición del sitio.</text></svg>`;
    svgAPng(s, W, H, 'Clima_' + slugSitio() + '_lamina.png');
  }
  function csvEPW() {
    const e = st.S.epw, a = e.anual, q = v => v === null || v === undefined ? '' : String(v).replace('.', ',');
    const f = [['Sitio', st.S.sitio.nombre], ['Archivo EPW', e.archivo], ['Ubicación del EPW', [e.loc.ciudad, e.loc.region, e.loc.pais].join(', ')], ['Latitud', q(e.loc.lat)], ['Longitud', q(e.loc.lon)], ['Altitud (msnm)', q(e.loc.elev)], ['Fuente declarada', e.loc.fuente], [], ['Mes', 'T máx media (°C)', 'T mín media (°C)', 'T media (°C)', 'Lluvia (mm)', 'Días con lluvia', 'HR (%)', 'Radiación global (kWh/m²·día)', 'Viento (m/s)']];
    e.mensual.forEach((m, i) => { if (m) f.push([MESES[i], q(m.tmax), q(m.tmin), q(m.tmed), q(m.prec), q(m.dias), q(m.hr), q(m.ghi), q(m.viento)]); });
    f.push(['Año', q(a.t_max_media), q(a.t_min_media), q(a.t_media), q(a.precipitacion_anual), q(a.dias_con_lluvia), q(a.hr_media_anual), q(a.radiacion_global), q(a.viento_medio)], [], ['Meses secos', q(a.meses_secos)], ['Viento dominante', a.viento_dir || ''], ['T mínima y máxima horaria (°C)', q(a.t_abs_min), q(a.t_abs_max)]);
    if (e.rosa) { f.push([], ['Rosa de los vientos: % de las horas por dirección y clase de velocidad (m/s)'], ['Dirección'].concat(e.rosa.clases)); e.rosa.sectores.forEach((b, i) => f.push([DIR16[i]].concat(b.map(n => q(Math.round(1000 * n / e.rosa.total) / 10))))); f.push(['Calma', q(Math.round(1000 * e.rosa.calma / e.rosa.total) / 10)]); }
    bajar('Clima_' + slugSitio() + '_resumen.csv', '﻿' + f.map(r => r.map(c => '"' + String(c === undefined || c === null ? '' : c).replace(/"/g, '""') + '"').join(';')).join('\r\n'), 'text/csv');
  }
  const fechaVer = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : (iso || ''); };
  const fechaIso = t => { t = String(t).trim(); let m = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/.exec(t); if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t); return m ? m[0] : t; };

  function vSitio(C) {
    const S = st.S, z = C.zona, e = S.epw;
    let h = `<h2>Sitio y clima</h2><p class="lead">Cargá un sitio ya trabajado en el curso, subí un archivo <b>.epw</b> de cualquier lugar o importá una <i>Matriz de Clima de Sitio</i> en Excel. Lo que no tengás del sitio se hereda de la subregión IMN; un dato vacío no es un cero.</p>
    <div class="card no-print"><div class="btn-fila">
      <label class="c" style="min-width:290px;flex:1">Sitio cargado<select data-a="sel-sitio">${sitios().map(s => `<option value="${esc(s.k)}"${s.k === st.sitioSel ? ' selected' : ''}>${esc(s.j.sitio.nombre)} · ${esc(s.j.sitio.id_zona || 's/zona')} · ${esc(s.j.sitio.elaborado_por || '')}${s.k[0] === 'u' ? ' (guardado en este navegador)' : ''}</option>`).join('')}${st.sitioSel ? '' : '<option value="" selected>— sitio sin guardar —</option>'}</select></label>
      <button class="btn" data-a="pick" data-f="f-epw">${IC.subir}Sitio nuevo desde .epw</button>
      <button class="btn sec" data-a="pick" data-f="f-epw2">${IC.subir}Cargar .epw en este sitio</button>
    </div><div class="btn-fila">
      <button class="btn sec" data-a="pick" data-f="f-matriz">Importar Matriz_Clima_Sitio.xlsx</button>
      <button class="btn sec" data-a="pick" data-f="f-sitio">Importar sitio .json</button>
      <button class="btn sec" data-a="sitio-nuevo">Sitio en blanco</button>
      <button class="btn rojo" data-a="limpiar-clima">${IC.limpiar}Limpiar datos de clima</button>
    </div>${st.deshacer ? `<div class="aviso info" role="status">Se borraron el archivo EPW y los datos climáticos de este sitio (la identificación y el microclima se conservan). <button class="btn sec peq" data-a="deshacer-clima">Deshacer</button></div>` : ''}</div>
    <div class="card"><h3>1 · Identificación</h3><div class="campos">
      <label class="c">Nombre del sitio o proyecto<input data-b="S.sitio.nombre" value="${esc(S.sitio.nombre)}"></label>
      <label class="c">Ubicación (provincia, cantón, distrito)<input data-b="S.sitio.ubicacion" value="${esc(S.sitio.ubicacion)}"></label>
      <label class="c">Latitud (° decimales)<input data-b="S.sitio.lat" data-t="num" value="${S.sitio.lat === null ? '' : S.sitio.lat}"></label>
      <label class="c">Longitud (° decimales)<input data-b="S.sitio.lon" data-t="num" value="${S.sitio.lon === null ? '' : S.sitio.lon}"></label>
      <label class="c">Subregión climática IMN<select data-b="S.sitio.id_zona"><option value="">Sin subregión (fuera de Costa Rica o por definir)</option>${ZONAS.map(x => `<option value="${x.id}"${x.id === S.sitio.id_zona ? ' selected' : ''}>${x.id} · ${esc(x.region)} · ${esc(x.subregion)}</option>`).join('')}</select></label>
      <label class="c">Elaborado por<input data-b="S.sitio.elaborado_por" value="${esc(S.sitio.elaborado_por)}"></label>
      <label class="c">Fecha (dd-mm-aaaa)<span class="fecha-w"><input data-b="S.sitio.fecha" data-t="fecha" value="${esc(fechaVer(S.sitio.fecha))}" placeholder="dd-mm-aaaa" inputmode="numeric" autocomplete="off"><button type="button" class="btn sec ic" data-a="cal" aria-label="Abrir calendario">${IC.cal}</button><input type="date" id="f-fecha" class="oculto" tabindex="-1" aria-hidden="true" data-a="fecha-pick" value="${/^\d{4}-\d{2}-\d{2}$/.test(S.sitio.fecha || '') ? S.sitio.fecha : ''}"></span></label>
    </div>${z ? `<p class="peq mut" style="margin-top:8px"><b>${z.id}</b> · ${esc(z.extension || '')}. ${esc(z.nota || '')} <span class="tag prop">${esc(z.estado_verificacion || '')}</span></p>` : '<div class="aviso info">Sin subregión IMN no hay valores de respaldo: todo dato climático debe venir del EPW o de una estación, y la sismicidad y el viento se indican como nivel 0–3 en el microclima.</div>'}</div>`;
    if (e) {
      const G = grafsEPW(e); GRAFS = {}; G.forEach(x => GRAFS[x.k] = x);
      h += `<div class="card"><h3>Archivo EPW · ${esc(e.archivo || '')}</h3><p class="peq mut">${esc(e.loc.ciudad)}, ${esc(e.loc.region)}, ${esc(e.loc.pais)} · lat ${fn(e.loc.lat, 4)} · lon ${fn(e.loc.lon, 4)} · ${fn(e.loc.elev, 0)} msnm · fuente declarada: ${esc(e.loc.fuente || 'no indicada')} · ${e.horas} registros (${e.dias} días)</p>
      ${e.avisos.map(a => `<div class="aviso">${esc(a)}</div>`).join('')}
      <div class="btn-fila no-print" style="margin:8px 0"><button class="btn" data-a="exp-lamina">${IC.img}Exportar lámina 16:9 (.png)</button><button class="btn sec" data-a="exp-todos">${IC.bajar}Exportar cada gráfico (.png)</button><button class="btn sec" data-a="exp-csv">${IC.bajar}Exportar datos (.csv)</button><span class="peq mut">Para pegar en una presentación.</span></div>
      <div class="grafs">${G.map(x => `<figure class="graf"><figcaption><span>${esc(x.t)}</span><button class="btn sec peq no-print" data-a="exp-uno" data-k="${x.k}" aria-label="Descargar ${esc(x.t)} como imagen">${IC.bajar}PNG</button></figcaption>${svgDe(x.g, x.t)}</figure>`).join('')}</div>
      <details open><summary>Tabla mensual</summary><div class="tabla-w"><table><tr><th>Mes</th><th class="n">T máx</th><th class="n">T mín</th><th class="n">T med</th><th class="n">Lluvia mm</th><th class="n">Días</th><th class="n">HR %</th><th class="n">GHI kWh/m²·d</th><th class="n">Viento m/s</th></tr>
      ${e.mensual.map((m, i) => m ? `<tr><td>${MESES[i]}</td><td class="n">${fn(m.tmax)}</td><td class="n">${fn(m.tmin)}</td><td class="n">${fn(m.tmed)}</td><td class="n">${fn(m.prec, 0)}</td><td class="n">${m.dias === null ? '—' : m.dias}</td><td class="n">${fn(m.hr, 0)}</td><td class="n">${fn(m.ghi, 2)}</td><td class="n">${fn(m.viento)}</td></tr>` : '').join('')}
      <tr><td><b>Año</b></td><td class="n"><b>${fn(e.anual.t_max_media)}</b></td><td class="n"><b>${fn(e.anual.t_min_media)}</b></td><td class="n"><b>${fn(e.anual.t_media)}</b></td><td class="n"><b>${fn(e.anual.precipitacion_anual, 0)}</b></td><td class="n"><b>${e.anual.dias_con_lluvia === null ? '—' : e.anual.dias_con_lluvia}</b></td><td class="n"><b>${fn(e.anual.hr_media_anual, 0)}</b></td><td class="n"><b>${fn(e.anual.radiacion_global, 2)}</b></td><td class="n"><b>${fn(e.anual.viento_medio)}</b></td></tr></table></div></details>
      <p class="peq mut">Cómo se obtiene: T máx y T mín = promedio de las máximas y mínimas <i>diarias</i>; día con lluvia = ≥ ${fn(e.criterios.dia_lluvia_mm)} mm; mes seco = &lt; ${e.criterios.mes_seco_mm} mm (criterio IMN); GHI = suma horaria ÷ días. Viento dominante: ${esc(e.anual.viento_dir || '—')}. Extremos horarios: ${fn(e.anual.t_abs_min)} a ${fn(e.anual.t_abs_max)} °C. Un EPW es un año típico o sintético: declará su certeza en la tabla de abajo.</p></div>`;
    }
    h += `<div class="card"><h3>2 · Datos climáticos</h3><div class="tabla-w"><table><tr><th>Variable</th><th>Unidad</th><th class="n">Subregión</th><th>Dato del sitio</th><th class="n">Valor usado</th><th>Origen</th><th style="min-width:260px">Fuente (estación, período, archivo)</th><th>Certeza</th></tr>
    ${M.VARS.map(([k, n, u]) => { const v = S.vars[k], x = C.usado[k], sis = k === 'zona_sismica_cscr'; return `<tr><td>${n}</td><td class="mut">${u}</td><td class="n">${x.sub === null ? '<span class="mut">sin dato</span>' : esc(x.sub)}</td><td>${sis ? `<select data-b="S.vars.${k}.entrada" data-t="nul"><option value="">—</option>${['II', 'III', 'IV'].map(o => `<option${v.entrada === o ? ' selected' : ''}>${o}</option>`).join('')}</select>` : `<input class="num" data-b="S.vars.${k}.entrada" data-t="num" value="${v.entrada === null ? '' : String(v.entrada).replace('.', ',')}">`}</td><td class="n"><b>${x.valor === null ? '<span class="tag critica">falta</span>' : esc(M.isNum(x.valor) ? String(x.valor).replace('.', ',') : x.valor)}</b></td><td class="peq">${esc(x.origen)}</td><td><input class="w100" data-b="S.vars.${k}.fuente" value="${esc(v.fuente)}"></td><td><select data-b="S.vars.${k}.certeza"><option value="">sin declarar</option>${CERT.concat(v.certeza && !CERT.includes(v.certeza) ? [v.certeza] : []).map(o => `<option${v.certeza === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></td></tr>`; }).join('')}</table></div>
    <p class="peq mut">La zona sísmica sale de la Tabla 2.1 del CSCR-2010 (por cantón y distrito). La humedad relativa y la radiación quedan registradas para la memoria; hoy no definen exigencias.</p></div>`;
    const mi = S.micro, sel = (p, ops, vacio) => `<select data-b="${p}">${vacio !== undefined ? `<option value="">${vacio}</option>` : ''}${ops.map(o => `<option${String(M.isNum(o) ? o : o) === String(p.split('.').reduce((a, k) => a[k], st)) ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
    h += `<div class="card"><h3>3 · Microclima del sitio</h3><div class="campos">
      <label class="c">Altitud del sitio (msnm)<input data-b="S.micro.altitud_sitio_msnm" data-t="num" value="${mi.altitud_sitio_msnm === null ? '' : mi.altitud_sitio_msnm}"></label>
      <label class="c">Altitud de la estación de referencia (msnm)<input data-b="S.micro.altitud_estacion_msnm" data-t="num" value="${mi.altitud_estacion_msnm === null ? '' : mi.altitud_estacion_msnm}"></label>
      <label class="c">Distancia a la línea de costa (km)<input data-b="S.micro.distancia_costa_km" data-t="num" value="${mi.distancia_costa_km === null ? '' : String(mi.distancia_costa_km).replace('.', ',')}"></label>
      <label class="c">Zona de viento CFIA (Lineamientos 2023)${sel('S.micro.zona_viento_cfia', ['I', 'II', 'III', 'IV', 'V'], 'sin zona')}</label>
      <label class="c">Exposición al viento${sel('S.micro.exposicion_viento', ['Protegido', 'Normal', 'Expuesto'])}</label>
      <label class="c">Sombra sobre la envolvente${sel('S.micro.sombra_envolvente', ['Alta', 'Media', 'Baja'])}</label>
      <label class="c">Orientación de la fachada principal${sel('S.micro.orientacion_fachada', ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'], 'por definir')}</label>
      ${C.usado.zona_sismica_cscr.valor ? '' : `<label class="c">Sismicidad, nivel 0–3 (sitio sin zona CSCR)${sel('S.micro.nivel_sis_manual', [0, 1, 2, 3], 'sin dato')}</label>`}
      ${mi.zona_viento_cfia ? '' : `<label class="c">Viento, nivel 0–3 (sitio sin zona CFIA)${sel('S.micro.nivel_vie_manual', [0, 1, 2, 3], 'sin dato')}</label>`}
    </div>
    <p style="margin-top:10px"><label><input type="checkbox" data-b="S.micro.ajustar_altitud" data-t="chk"${mi.ajustar_altitud ? ' checked' : ''}> Las temperaturas escritas arriba vienen de una estación a otra altitud: corregirlas con ${fn(st.PAR.gradiente_termico_C_por_km)} °C por 1000 m</label>${C.corr !== null ? ` <span class="tag prop">corrección ${C.corr >= 0 ? '+' : ''}${fn(C.corr)} °C</span>` : ''}</p>
    <p class="peq mut">Distancia a la costa: define el ambiente salino (≤ ${st.PAR.salinidad_km.n3} km = 3 · ≤ ${st.PAR.salinidad_km.n2} km = 2 · ≤ ${st.PAR.salinidad_km.n1} km = 1); sin distancia se usa «Costera S/N» de la subregión. Exposición ajusta el viento (±1) y la sombra alta resta un nivel al calor.</p></div>
    <div class="card"><h3>Resultado para este sitio</h3>${resumenSitio(C)}
    <div class="btn-fila no-print" style="margin-top:10px"><button class="btn" data-a="ir" data-t="perfil">Ver perfil y pesos →</button><button class="btn sec" data-a="guardar-sitio">Guardar sitio en este navegador</button><button class="btn sec" data-a="bajar-sitio">Descargar sitio .json</button>${st.sitioSel[0] === 'u' ? '<button class="btn rojo" data-a="borrar-sitio">Quitar sitio guardado</button>' : ''}</div></div>`;
    return h;
  }
  function resumenSitio(C) {
    const pr = C.pesos.filter(p => p.prioridad === 1).map(p => `${p.nombre} (${pct(p.peso)})`).join(' y ');
    return `<div class="kpis"><div class="kpi"><div class="l">Suma de exigencia</div><div class="v">${C.total} <span class="mut" style="font-size:.9rem">/ 27</span></div></div>
    <div class="kpi"><div class="l">Exigencias dominantes</div><div class="v" style="font-size:1rem">${C.dominantes.length ? C.dominantes.map(c => esc(C.exigencias[c].nombre)).join(' · ') : 'Ninguna'}</div></div>
    <div class="kpi"><div class="l">Dimensión prioritaria</div><div class="v" style="font-size:1rem">${esc(pr)}</div></div>
    <div class="kpi"><div class="l">Datos que faltan (de 7)</div><div class="v">${C.faltan}</div></div></div>${C.faltan ? `<div class="aviso">Faltan ${C.faltan} dato(s) que definen exigencias: el perfil está incompleto y <b>subestima</b> el clima del sitio.</div>` : ''}`;
  }

  /* ================= 2. PERFIL Y PESOS ================= */
  function vPerfil(C) {
    const P = st.PAR, S = st.S, mx = Math.max(...C.pesos.map(p => Math.max(p.peso, p.sin_clima))) * 1.08;
    let h = `<h2>Perfil de exigencia y pesos</h2><p class="lead">El clima del sitio se traduce en 9 exigencias (0–3) y estas reordenan el peso de las 6 dimensiones con que se evalúan los materiales. Umbrales y sensibilidades son una <b>propuesta metodológica</b> calibrable, no normativa.</p>${resumenSitio(C)}
    <div class="card"><h3>Exigencias climáticas del sitio</h3><div class="tabla-w"><table><tr><th>Código</th><th>Exigencia</th><th>Dato que la define</th><th class="n">Valor</th><th class="c">Por clima</th><th class="c">Microclima</th><th class="c">Nivel final</th><th>Qué le exige a los materiales</th></tr>
    ${M.COD.map(c => { const e = C.exigencias[c]; return `<tr><td><span class="cod">${c}</span></td><td><b>${esc(e.nombre)}</b></td><td class="mut">${esc(e.define)}</td><td class="n">${e.dato === null ? '<span class="tag critica">falta</span>' : esc(M.isNum(e.dato) ? String(e.dato).replace('.', ',') : e.dato)}</td><td class="c">${e.nivel_clima}</td><td class="c">${e.ajuste ? (e.ajuste > 0 ? '+' : '') + e.ajuste : '—'}</td><td class="c">${niv(e.nivel)} ${e.nivel}</td><td class="peq">${esc(e.exige)}</td></tr>`; }).join('')}</table></div></div>
    <div class="card"><h3>Pesos de las 6 dimensiones para este sitio</h3><div class="pesos"><div class="f h"><span>Dimensión</span><span>Peso con clima (barra) · sin clima (marca)</span><span class="n">Peso</span><span class="n">Factor</span><span class="n">Cambio</span><span class="n">Base</span></div>
    ${C.pesos.map((p, j) => `<div class="f"><span>${p.prioridad === 1 ? '<b>' + esc(p.nombre) + '</b> <span class="tag ok">prioritaria</span>' : esc(p.nombre)}</span><span class="pbar" title="con clima ${pct(p.peso)} · sin clima ${pct(p.sin_clima)}"><i style="width:${p.peso / mx * 100}%"></i><b style="left:${p.sin_clima / mx * 100}%"></b></span><span class="n"><b>${pct(p.peso)}</b></span><span class="n">${fn(p.factor, 2)}</span><span class="n">${p.cambio >= 0 ? '+' : ''}${fn(p.cambio)} pts</span><span class="n"><input class="mini" data-b="S.pesos_base.${j}" data-t="num0" value="${String(S.pesos_base[j]).replace('.', ',')}" aria-label="Peso base de ${esc(p.nombre)}"></span></div>`).join('')}</div>
    <p class="peq mut" style="margin-top:8px">Factor = 1 + Σ(sensibilidad × nivel) / (3 × Σ sensibilidad), entre 1,00 y 2,00 · Peso = base × factor / Σ(base × factor). El peso base lo decide el proyecto (por defecto, todas iguales).</p>
    <div class="aviso info"><b>Para discutir.</b> Ambiental / ACV no depende del clima: cuanto más exigente es el sitio, menos pesa relativamente. ¿Debe el proyecto subir su peso base para no sacrificar el carbono incorporado ante la durabilidad?</div>
    <details><summary>Sensibilidad exigencia × dimensión (0 = no influye · 1 = influye · 2 = influye mucho)</summary><div class="tabla-w"><table><tr><th>Exigencia</th><th class="c">Nivel</th>${C.pesos.map(p => `<th class="c">${esc(p.nombre)}</th>`).join('')}<th>Por qué</th></tr>
    ${M.COD.map(c => `<tr><td><span class="cod">${c}</span> ${esc(C.exigencias[c].nombre)}</td><td class="c">${C.niveles[c]}</td>${C.pesos.map((p, j) => `<td class="c"><input class="mini" data-b="S.sens.${c}.${j}" data-t="num0" value="${S.sens[c][j]}" aria-label="Sensibilidad ${c} sobre ${esc(p.nombre)}"></td>`).join('')}<td class="peq mut">${esc(P.sensibilidad[c].porque)}</td></tr>`).join('')}</table></div>
    <div class="btn-fila no-print" style="margin-top:8px"><button class="btn sec peq" data-a="reset-sens">Restablecer sensibilidades y pesos base</button></div></details>
    <details><summary>Umbrales y reglas (PARAM)</summary><div class="tabla-w"><table><tr><th>Exigencia</th><th>Variable</th><th class="c">Sentido</th><th class="c">Nivel 1</th><th class="c">Nivel 2</th><th class="c">Nivel 3</th></tr>
    ${Object.keys(P.umbrales).map(c => { const u = P.umbrales[c]; return `<tr><td><span class="cod">${c}</span></td><td>${esc(u.variable)}</td><td class="c">${u.sentido}</td>${['n1', 'n2', 'n3'].map(k => `<td class="c"><input class="num" style="width:5em" data-b="PAR.umbrales.${c}.${k}" data-t="num0" value="${u[k]}"></td>`).join('')}</tr>`; }).join('')}
    <tr><td><span class="cod">E_SAL</span></td><td>Distancia a la costa (km), ≤</td><td class="c">≤</td>${['n1', 'n2', 'n3'].map(k => `<td class="c"><input class="num" style="width:5em" data-b="PAR.salinidad_km.${k}" data-t="num0" value="${P.salinidad_km[k]}"></td>`).join('')}</tr></table></div>
    <div class="campos" style="margin-top:10px">${['I', 'II', 'III', 'IV', 'V'].map(zv => `<label class="c">Zona de viento CFIA ${zv} → nivel<input class="num" data-b="PAR.viento_cfia.${zv}" data-t="num0" value="${P.viento_cfia[zv]}"></label>`).join('')}
    <label class="c">Gradiente térmico (°C por 1000 m)<input class="num" data-b="PAR.gradiente_termico_C_por_km" data-t="num0" value="${String(P.gradiente_termico_C_por_km).replace('.', ',')}"></label>
    <label class="c">Mes seco si la lluvia es &lt; (mm)<input class="num" data-b="PAR.mes_seco_mm" data-t="num0" value="${P.mes_seco_mm}"></label>
    <label class="c">Peso que activa la alerta crítica<input class="num" data-b="PAR.umbral_alerta_critica" data-t="num0" value="${String(P.umbral_alerta_critica).replace('.', ',')}"></label></div>
    <p class="peq mut">Zona sísmica CSCR-2010: II = 1 · III = 2 · IV = 3. Pendientes de calibración declarados en la matriz del curso:</p><ul class="l peq mut">${P.pendientes_docente.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="btn-fila no-print"><button class="btn sec peq" data-a="reset-par">Restablecer umbrales del curso</button></div></details></div>
    <div class="btn-fila no-print"><button class="btn" data-a="ir" data-t="eval">Evaluar materiales en este sitio →</button></div>`;
    return h;
  }

  /* ================= 3. EVALUACIÓN ================= */
  const colorP = s => `hsl(${Math.round(Math.max(0, Math.min(3, s)) / 3 * 120)},72%,${s / 3 > 0.35 && s / 3 < 0.65 ? 44 : 40}%)`;
  const celdaDim = d => d.s === null ? '<span class="mut" title="Sin datos puntuables">s/d</span>' : `<b>${fn(d.s)}</b>${d.manual !== null ? ' <span class="tag prop" title="Puntaje manual">man.</span>' : `<span class="mut peq"> ${d.n}/${d.de}</span>`}<div class="barra"><i style="width:${Math.max(4, d.s / 3 * 100)}%;background:${colorP(d.s)}"></i></div>`;
  const refs = (f, c) => c && c.fuentes && c.fuentes.length ? c.fuentes.map(r => { const s = (f.fuentes || []).find(x => x.id === r.ref); return `<span class="cod" title="${esc(s ? s.cita : 'Fuente no registrada en la bibliografía')}">${esc(r.ref)}${r.loc ? ', ' + esc(r.loc) : ''}</span>`; }).join(' ') : '<span class="tag atencion">sin fuente</span>';
  const traza = (f, c) => !c || c.estado !== 'dato' ? '' : `${esComp(c) ? '<span class="tag comp" title="Dato agregado en la integración desde norma; pendiente de validar por el autor">complemento</span> ' : ''}${refs(f, c)} ${c.evidencia ? `<span class="cod" title="${esc(LISTAS.evidencia[c.evidencia] || '')}">${esc(c.evidencia)}</span>` : ''} ${c.certeza ? `<span class="tag ${c.certeza === 'verificado' ? 'ok' : 'prop'}">${esc(c.certeza.replace(/_/g, ' '))}</span>` : ''}`;
  function detalleFila(f, E, C) {
    let h = '';
    if (f.alertas.length || f.criticas.length) h += `<div style="margin-bottom:8px">${f.criticas.map(n => `<div class="aviso crit"><b>Alerta crítica:</b> puntaje 0 en ${esc(n)}, dimensión que este clima volvió prioritaria (peso ≥ ${pct(st.PAR.umbral_alerta_critica)}). No se especifica sin resolverlo.</div>`).join('')}${f.alertas.map(a => `<div class="aviso ${a.severidad === 'critica' ? 'crit' : a.severidad === 'dato' ? 'info' : ''}"><span class="cod">${a.id}</span> ${esc(a.mensaje)}${a.nota ? ` <span class="mut peq">Nota de la ficha: ${esc(a.nota)}</span>` : ''}</div>`).join('')}</div>`;
    C.pesos.forEach(p => {
      const d = f.dims[p.id], li = E.inds.filter(i => i.dim === p.id && i.activo);
      const otros = Object.keys(f.ficha.campos).filter(k => DIC[k] && DIC[k].dimension === p.cod && !E.inds.some(i => i.clave === k && i.activo) && M.tieneDato(f.ficha.campos[k]));
      h += `<div class="dimh"><b>${esc(p.nombre)} <span class="mut peq">· peso ${pct(p.peso)}</span></b><span class="peq">Automático: <b>${d.auto === null ? 's/d' : fn(d.auto, 2)}</b> (${d.n} de ${d.de} indicadores) · Manual 0–3: <input class="mini no-print" data-a="manual" data-id="${f.id}" data-d="${p.id}" value="${d.manual === null ? '' : String(d.manual).replace('.', ',')}" aria-label="Puntaje manual de ${esc(p.nombre)}"></span></div>`;
      if (li.length) h += `<table><tr><th>Indicador</th><th>Dato de la ficha</th><th>Trazabilidad</th><th class="c">Sentido</th><th class="n">Puntaje 0–3</th></tr>${li.map(i => { const o = f.det[i.clave]; return `<tr><td>${esc(i.etiqueta)}</td><td>${esc(o.texto)}${o.campo && o.campo.nota ? `<div class="mut peq">${esc(o.campo.nota)}</div>` : ''}</td><td>${traza(f.ficha, o.campo)}</td><td class="c peq">${i.sentido === 'mayor' ? '↑ mayor es mejor' : '↓ menor es mejor'}</td><td class="n">${o.s === null ? `<span class="mut peq">${esc(o.motivo)}</span>` : '<b>' + fn(o.s, 2) + '</b>'}</td></tr>`; }).join('')}</table>`;
      else h += '<p class="peq mut">Sin indicadores activos para este componente y clima: puntuá la dimensión a mano con los datos de abajo.</p>';
      if (otros.length) h += `<details><summary class="peq">Otros datos de la ficha en esta dimensión (no se puntúan solos: clases, textos o indicadores inactivos) · ${otros.length}</summary><table>${otros.map(k => `<tr><td style="width:28%">${esc(DIC[k].campo)}</td><td>${esc(M.valorTexto(f.ficha.campos[k]))}${f.ficha.campos[k].nota ? `<div class="mut peq">${esc(f.ficha.campos[k].nota)}</div>` : ''}</td><td style="width:26%">${traza(f.ficha, f.ficha.campos[k])}</td></tr>`).join('')}</table></details>`;
    });
    return h + `<div class="btn-fila no-print" style="margin-top:10px"><button class="btn sec peq" data-a="ver-ficha" data-id="${f.id}">Abrir ficha completa</button>${st.manual[f.id] ? `<button class="btn sec peq" data-a="quitar-manual" data-id="${f.id}">Quitar puntajes manuales</button>` : ''}</div>`;
  }
  const media = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  function vEval(C) {
    const E = evalComp(st.comp, C), fs = fichas();
    const autor = st.S.seleccion_manual && st.S.seleccion_manual.some(x => x.id_ficha);
    let h = `<h2>Evaluación clima × material</h2><p class="lead">Las barras van de <b style="color:hsl(0,72%,40%)">rojo</b> (puntaje bajo) a <b style="color:hsl(55,72%,34%)">amarillo</b> (medio) y <b style="color:hsl(120,72%,30%)">verde</b> (alto). Ranking de las alternativas de un componente con los pesos del sitio. Cada dimensión (0–3) es el promedio de sus indicadores con dato; «n/de» indica cuántos indicadores activos tenían dato. Hacé clic en una fila para ver el cálculo y la trazabilidad.</p>
    <div class="card no-print"><div class="chips">${COMP.map(c => `<button data-a="comp" data-c="${c}" class="${c === st.comp ? 'on' : ''}">${esc(LISTAS.component[c].nombre)} · ${fs.filter(f => f.meta.componente === c).length}</button>`).join('')}</div>
    <div class="btn-fila" style="margin-top:10px"><label class="peq">Normalización de valores numéricos <select data-b="norm"><option value="proporcional"${st.norm === 'proporcional' ? ' selected' : ''}>Proporcional al mejor (v/máx o mín/v)</option><option value="minmax"${st.norm === 'minmax' ? ' selected' : ''}>Mín–máx (peor = 0, mejor = 3)</option></select></label>
    ${autor ? `<label class="peq"><input type="checkbox" data-b="manualAutor" data-t="chk"${st.manualAutor ? ' checked' : ''}> Usar los puntajes manuales del autor del sitio (hoja SELECCION, ${st.S.seleccion_manual.length} materiales)</label>` : ''}
    <label class="peq"><input type="checkbox" data-b="conComp" data-t="chk"${st.conComp ? ' checked' : ''}> Incluir datos de complemento (norma)</label>
    <button class="btn sec peq" data-a="csv">Descargar tabla .csv</button><button class="btn sec peq" data-a="imprimir">Imprimir</button></div></div>
    <div class="card"><h3>${esc(LISTAS.component[st.comp].nombre)} <span class="mut peq">· dominantes: ${C.dominantes.join(' ') || 'ninguna'}</span></h3><div class="tabla-w"><table><tr><th class="c">#</th><th>Alternativa</th>${C.pesos.map(p => `<th title="${esc(p.nombre)} · peso ${pct(p.peso)}">${esc({termico:'Térm.',higrotermico:'Higrot.',mecanico:'Mecán.',durabilidad:'Durab.',ambiental:'Amb.',constructibilidad:'Constr.'}[p.id]||p.nombre)}<br><span style="font-weight:400">${pct(p.peso)}</span></th>`).join('')}<th class="n">Genérico</th><th class="n">En el sitio</th><th class="c">Mov.</th><th class="n">Cobert.</th><th>Alertas</th></tr>
    ${E.filas.map(f => { const nc = f.alertas.filter(a => a.severidad === 'critica').length + f.criticas.length, na = f.alertas.filter(a => a.severidad === 'atencion').length, nd = f.alertas.filter(a => a.severidad === 'dato').length, ab = st.abierto === f.id;
      return `<tr class="clic${f.r_sit === 1 ? ' gan' : ''}" data-a="abrir" data-id="${f.id}" tabindex="0" aria-expanded="${ab}"><td class="c"><b>${f.r_sit === null ? '—' : f.r_sit}</b></td><td style="min-width:190px"><b>${esc(f.nombre)}</b><div class="mut peq"><span class="cod">${f.id}</span> ${esc(f.ficha.meta.autor || '')}${f.ficha._usuario ? ' <span class="tag prop">agregada</span>' : ''}</div></td>${C.pesos.map(p => `<td style="min-width:62px">${celdaDim(f.dims[p.id])}</td>`).join('')}<td class="n">${pct(f.gen)}<div class="mut peq">puesto ${f.r_gen === null ? '—' : f.r_gen}</div></td><td class="n"><b>${pct(f.sit)}</b>${f.completo ? '' : `<div class="peq"><span class="tag ${f.suf ? 'atencion' : 'critica'}" title="${f.suf ? 'Se compara con menos de 6 dimensiones' : 'Menos de 3 dimensiones con dato: no entra al ranking'}">${f.dimsCon}/6 dim.${f.suf ? '' : ' · insuficiente'}</span></div>`}</td><td class="c">${f.mov > 0 ? `<span class="tag ok">▲ ${f.mov}</span>` : f.mov < 0 ? `<span class="tag atencion">▼ ${-f.mov}</span>` : '='}</td><td class="n">${pct(f.cobertura)}<div class="peq"><span class="tag ${f.conf === 'alta' ? 'ok' : f.conf === 'media' ? 'prop' : 'critica'}" title="Proporción de indicadores con dato; no mide la calidad de la evidencia">cobertura ${f.conf}</span></div></td><td>${f.bloq ? '<span class="tag critica" title="No se recomienda mientras no se resuelva la alerta crítica">no recomendable</span> ' : ''}${nc ? `<span class="tag critica">${nc} crítica${nc > 1 ? 's' : ''}</span> ` : ''}${na ? `<span class="tag atencion">${na} atención</span> ` : ''}${nd ? `<span class="tag dato">${nd} sin dato</span>` : ''}${nc + na + nd ? '' : '<span class="mut">—</span>'}</td></tr>${ab ? `<tr class="det"><td colspan="${C.pesos.length + 7}">${detalleFila(f, E, C)}</td></tr>` : ''}`; }).join('')}</table></div>
    <p class="peq mut">Genérico = promedio simple de las dimensiones con dato ÷ 3. En el sitio = Σ(puntaje × peso) ÷ 3, renormalizado sobre las dimensiones con dato. Mov. = puestos que sube o baja por el clima.</p></div>
    <div class="card"><div class="dimh" style="margin-top:0"><h3 style="margin:0">Tablero de recomendación</h3><div class="chips no-print"><button data-a="dash" data-k="gen" class="${st.dash !== 'sit' ? 'on' : ''}" aria-pressed="${st.dash !== 'sit'}">Genérico</button><button data-a="dash" data-k="sit" class="${st.dash === 'sit' ? 'on' : ''}" aria-pressed="${st.dash === 'sit'}">En el sitio</button></div></div>${tablero(E)}</div>
    <div class="card"><h3>Síntesis técnica</h3>${sintesis(E, C)}</div>
    <div class="card"><details><summary>Criterios: indicadores que puntúan en ${esc(LISTAS.component[st.comp].nombre)} (${E.inds.filter(i => i.activo).length} activos de ${E.inds.length})</summary><p class="peq mut">Regla por tipo: escala 1–5 → (v−1)/4×3 · Sí/Condicionado/No → 3/1,5/0 · número → relativo al conjunto. Activá, desactivá o invertí el sentido; queda guardado en este navegador. Es una propuesta: lo que se cambie aquí debe justificarse en la memoria.</p>
    <div class="tabla-w"><table><tr><th class="c">Activo</th><th>Indicador</th><th>Dimensión</th><th>Tipo</th><th>Sentido</th><th>Condición / nota</th></tr>${E.inds.map(i => `<tr><td class="c"><input type="checkbox" data-a="ind-act" data-k="${i.clave}"${i.activo ? ' checked' : ''} aria-label="Activar ${esc(i.etiqueta)}"></td><td>${esc(i.etiqueta)} <span class="cod">${i.clave}</span>${i.ajustado ? ' <span class="tag prop">ajustado</span>' : ''}</td><td>${esc(C.pesos.find(p => p.id === i.dim).nombre)}</td><td class="peq">${esc(i.tipo)}${i.unidad ? ' · ' + esc(i.unidad) : ''}</td><td><select data-a="ind-sen" data-k="${i.clave}"><option value="mayor"${i.sentido === 'mayor' ? ' selected' : ''}>↑ mayor es mejor</option><option value="menor"${i.sentido === 'menor' ? ' selected' : ''}>↓ menor es mejor</option></select></td><td class="peq mut">${i.motivo ? '<b>' + esc(i.motivo) + '.</b> ' : ''}${esc(i.nota)}</td></tr>`).join('')}</table></div>
    <div class="btn-fila no-print" style="margin-top:8px"><button class="btn sec peq" data-a="reset-aj">Restablecer criterios</button></div></details></div>`;
    return h;
  }
  function csvEval(C) {
    const E = evalComp(st.comp, C), q = v => '"' + String(v === null || v === undefined ? '' : v).replace(/"/g, '""') + '"';
    const filas = [['sitio', 'componente', 'puesto_sitio', 'id', 'alternativa', 'autor'].concat(C.pesos.map(p => p.id + '_0a3'), ['puntaje_generico', 'puesto_generico', 'puntaje_sitio', 'dimensiones_con_dato', 'cobertura_indicadores', 'alertas'])];
    E.filas.forEach(f => filas.push([st.S.sitio.nombre, st.comp, f.r_sit, f.id, f.nombre, f.ficha.meta.autor].concat(C.pesos.map(p => f.dims[p.id].s === null ? '' : f.dims[p.id].s.toFixed(3)), [f.gen === null ? '' : f.gen.toFixed(4), f.r_gen, f.sit === null ? '' : f.sit.toFixed(4), f.dimsCon, f.cobertura.toFixed(3), f.criticas.map(x => 'CRITICA ' + x).concat(f.alertas.map(a => a.id)).join(' ')])));
    filas.push([]); filas.push(['pesos'].concat(C.pesos.map(p => p.id + '=' + p.peso.toFixed(4)))); filas.push(['exigencias'].concat(M.COD.map(c => c + '=' + C.niveles[c])));
    bajar(`SUM_${st.comp}_${(st.S.sitio.nombre || 'sitio').replace(/[^\w]+/g, '_')}.csv`, '﻿' + filas.map(r => r.map(q).join(';')).join('\r\n'), 'text/csv');
  }

  /* ================= 4. EDIFICIO ================= */
  function vEdificio(C) {
    const R = COMP.map(c => evalComp(c, C));
    return `<h2>Edificio: síntesis por componente</h2><p class="lead">Cruce del clima del sitio con los ${fichas().length} sistemas del catálogo, componente por componente. Es un punto de partida para la especificación: cada fila se abre en «Evaluación» con su trazabilidad.</p>${resumenSitio(C)}
    <div class="card"><div class="tabla-w"><table><tr><th>Componente</th><th>Mejor recomendable en el sitio</th><th class="n">Puntaje</th><th class="n">Margen</th><th>Mejor sin clima</th><th>Estabilidad</th><th class="n">Cobertura</th><th>Alertas del primero</th><th class="no-print"></th></tr>
    ${R.map(E => { const v = E.filas.filter(f => f.r_sit !== null), g = v.find(f => !f.bloq) || v[0], nom = LISTAS.component[E.comp].nombre; if (!g) return `<tr><td><b>${esc(nom)}</b></td><td colspan="8" class="mut">Datos insuficientes: ninguna ficha alcanza 3 de 6 dimensiones con dato puntuable. Completar las fichas o puntuar a mano.</td></tr>`; const gg = v.slice().sort((a, b) => a.r_gen - b.r_gen)[0], nc = g.alertas.filter(a => a.severidad === 'critica').length + g.criticas.length, na = g.alertas.filter(a => a.severidad !== 'critica').length;
      return `<tr><td><b>${esc(nom)}</b><div class="mut peq">${E.filas.length} alternativas</div></td><td><b>${esc(g.nombre)}</b><div class="mut peq"><span class="cod">${g.id}</span>${g.bloq ? ' <span class="tag critica">todas con alerta crítica</span>' : g.r_sit > 1 ? ` <span class="tag prop" title="Las de mayor puntaje tienen alerta crítica">puesto ${g.r_sit}: las anteriores tienen alerta crítica</span>` : ''} <span class="tag ${g.conf === 'alta' ? 'ok' : g.conf === 'media' ? 'prop' : 'critica'}">cobertura ${g.conf}${g.conf === 'baja' ? ' · evidencia insuficiente para recomendar' : ''}</span></div></td><td class="n"><b>${pct(g.sit)}</b>${g.completo ? '' : `<div class="peq"><span class="tag atencion">${g.dimsCon}/6 dim.</span></div>`}</td><td class="n">${E.sens ? fn(E.sens.margen) + ' pts' : '—'}</td><td>${gg.id === g.id ? '<span class="mut">el mismo</span>' : esc(gg.nombre) + ' <span class="tag prop">cambia por el clima</span>'}</td><td>${!E.sens ? '—' : E.sens.estable ? '<span class="tag ok">estable</span>' : `<span class="tag atencion">cambia en ${E.sens.cambian.length} de ${E.sens.escenarios.length}</span>`}</td><td class="n">${pct(g.cobertura)}</td><td>${nc ? `<span class="tag critica">${nc} crítica${nc > 1 ? 's' : ''}</span> ` : ''}${na ? `<span class="tag dato">${na} por revisar</span>` : ''}${nc + na ? '' : '<span class="mut">—</span>'}</td><td class="no-print"><button class="btn sec peq" data-a="comp-ir" data-c="${E.comp}">Ver</button></td></tr>`; }).join('')}</table></div>
    <p class="peq mut">Margen = diferencia con la segunda alternativa. Estabilidad = si el primer lugar se mantiene al duplicar o quitar el peso de cada dimensión. Un margen menor a 3 puntos debe leerse como empate.</p></div>
    <div class="aviso info">Este cuadro <b>no</b> es una especificación. La compatibilidad entre los sistemas elegidos (p. ej. cubierta liviana sobre mampostería, o cielo registrable bajo panel aislado) y el costo no se evalúan aquí: se resuelven en el proyecto.</div>
    <div class="btn-fila no-print"><button class="btn sec" data-a="imprimir">Imprimir síntesis</button></div>`;
  }

  /* ================= 5. FICHAS ================= */
  const itDe = f => { if (f._val && !f._editada) return f._val; const dg = M.diagnostico(f, DIC), e = dg.filter(x => x.nivel === 'error').length; return Object.assign(M.trazabilidad(f, DIC), { errores: e, avisos: dg.length - e }); };
  function vFichaCompleta(f) {
    const v = itDe(f), sec = {};
    Object.keys(DIC).forEach(k => { if (f.campos[k]) (sec[DIC[k].seccion] = sec[DIC[k].seccion] || []).push(k); });
    return `<div class="btn-fila no-print" style="margin-bottom:10px"><button class="btn sec" data-a="cerrar-ficha">← Volver al catálogo</button><button class="btn" data-a="editar" data-id="${f.meta.id}">Corregir faltantes y errores</button>${f._editada && !f._usuario ? `<button class="btn rojo" data-a="ed-restaurar" data-id="${f.meta.id}">Restaurar la ficha original</button>` : ''}<button class="btn sec" data-a="bajar-ficha" data-id="${f.meta.id}">Descargar ${f.meta.id}.json</button>${f._usuario ? `<button class="btn rojo" data-a="borrar-ficha" data-id="${f.meta.id}">Quitar de la app</button>` : ''}<button class="btn sec" data-a="imprimir">Imprimir</button></div>
    <div class="card"><h2>${esc((f.campos.name || {}).valor || f.meta.id)}</h2><p class="mut"><span class="cod">${f.meta.id}</span> ${esc(LISTAS.component[f.meta.componente].nombre)} · ${esc(f.meta.autor || 'sin autor')} · estado: ${esc(f.meta.estado_revision || '')} · actualizada ${esc(f.meta.fecha_actualizacion || '')}${f.meta.id_legado ? ' · ID anterior ' + esc(f.meta.id_legado) : ''}</p>
    <div class="kpis"><div class="kpi"><div class="l">Índice de trazabilidad</div><div class="v">${fn(v.it)} %</div></div><div class="kpi"><div class="l">Datos declarados</div><div class="v">${v.datos}</div></div>${v.errores !== null ? `<div class="kpi"><div class="l">Errores del validador</div><div class="v">${v.errores}</div></div><div class="kpi"><div class="l">Avisos</div><div class="v">${v.avisos}</div></div>` : `<div class="kpi"><div class="l">Números sin certeza</div><div class="v">${v.num_sin_certeza}</div></div><div class="kpi"><div class="l">Datos sin fuente</div><div class="v">${v.sin_fuente}</div></div>`}</div>
    ${Object.keys(sec).map(s => `<h3 style="margin-top:14px">${esc(s)}</h3><table>${sec[s].map(k => { const c = f.campos[k]; return `<tr><td style="width:24%">${esc(DIC[k].campo)}${DIC[k].obligatorio === 'Sí' ? ' <span class="mut" title="Obligatorio">*</span>' : ''}</td><td>${c.estado === 'dato' ? esc(M.valorTexto(c)) : `<span class="mut">${esc(M.valorTexto(c))}</span>`}${c.justificacion ? `<div class="peq"><i>Justificación:</i> ${esc(c.justificacion)}</div>` : ''}${c.nota ? `<div class="mut peq">${esc(c.nota)}</div>` : ''}</td><td style="width:25%">${traza(f, c)}</td></tr>`; }).join('')}</table>`).join('')}
    <h3 style="margin-top:14px">Fuentes</h3><table>${(f.fuentes || []).map(x => `<tr><td style="width:12%"><span class="cod">${esc(x.id)}</span></td><td>${esc(x.cita)}${x.url ? ` <span class="mut peq">${esc(x.url)}</span>` : ''}</td><td style="width:16%" class="peq mut">${esc(x.tipo || '')}</td></tr>`).join('')}</table></div>`;
  }
  function camposForm(comp) {
    const base = ['name', 'description', 'record_type', 'main_material', 'location', 'layers'], vistos = new Set(base), out = base.slice();
    CFG.indicadores.concat(CFG.alertas.map(a => ({ clave: a.campo, componentes: a.componentes }))).forEach(i => { if (!vistos.has(i.clave) && DIC[i.clave] && M.aplica(DIC[i.clave], comp) && (!i.componentes || i.componentes.includes(comp))) { vistos.add(i.clave); out.push(i.clave); } });
    Object.keys(DIC).forEach(k => { if (!vistos.has(k) && DIC[k].seccion === 'Específico' && M.aplica(DIC[k], comp)) out.push(k); });
    return out;
  }
  function vForm() {
    const F = st.form, ks = camposForm(F.comp);
    const ent = k => { const d = DIC[k], c = F.campos[k] || {}, p = `form.campos.${k}.`; let inp;
      if (d.tipo === 'escala') inp = `<select data-b="${p}valor"><option value="">—</option>${[1, 2, 3, 4, 5].map(n => `<option value="${n}"${String(c.valor) === String(n) ? ' selected' : ''}>${n} · ${LISTAS.escala_1_5[n]}</option>`).join('')}</select>`;
      else if (d.dominio && Array.isArray(LISTAS[d.dominio]) && d.tipo !== 'lista_multiple') inp = `<select data-b="${p}valor"><option value="">—</option>${LISTAS[d.dominio].map(o => `<option${c.valor === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
      else inp = `<input class="w100" data-b="${p}valor" value="${esc(c.valor || '')}" placeholder="${d.tipo === 'lista_multiple' ? 'separar con |' : NUMEROS(d) ? 'solo el número' : ''}">`;
      const us = [d.unidad].concat((d.unidades_alternativas || '').split('|')).filter(u => u && !/^(1–5)$/.test(u));
      return `<tr><td>${esc(d.campo)}<div class="mut peq"><span class="cod">${k}</span> ${esc(d.seccion)}${d.regla ? ' · ' + esc(d.regla) : ''}</div></td><td>${inp}</td><td>${NUMEROS(d) && us.length ? (us.length > 1 ? `<select data-b="${p}unidad">${us.map(u => `<option${(c.unidad || us[0]) === u ? ' selected' : ''}>${esc(u)}</option>`).join('')}</select>` : `<span class="mut">${esc(us[0])}</span>`) : ''}</td><td><select data-b="${p}evidencia">${Object.keys(LISTAS.evidencia).map(e => `<option value="${e}"${(c.evidencia || F.evid) === e ? ' selected' : ''} title="${esc(LISTAS.evidencia[e])}">${e}</option>`).join('')}</select></td><td>${NUMEROS(d) ? `<select data-b="${p}certeza"><option value="">—</option>${Object.keys(LISTAS.certeza).map(e => `<option value="${e}"${c.certeza === e ? ' selected' : ''}>${e.replace(/_/g, ' ')}</option>`).join('')}</select>` : ''}</td><td><input class="w100" data-b="${p}nota" value="${esc(c.nota || '')}" placeholder="${d.tipo === 'escala' ? 'justificación del puntaje (obligatoria)' : 'condición, ensayo, página…'}"></td></tr>`; };
    return `<div class="btn-fila no-print" style="margin-bottom:10px"><button class="btn sec" data-a="cerrar-form">← Volver al catálogo</button></div>
    <div class="card"><h2>Sistema nuevo desde una ficha técnica</h2><p class="lead">Transcribí los datos de la ficha técnica del fabricante (o de un ensayo, norma o artículo). Solo se escribe lo que tiene respaldo: lo que dejés vacío queda como «pendiente» y no puntúa. La app <b>no</b> extrae datos de un PDF por sí sola: la lectura crítica de la ficha es parte del ejercicio.</p>
    <div class="campos"><label class="c">Componente<select data-b="form.comp">${COMP.map(c => `<option value="${c}"${F.comp === c ? ' selected' : ''}>${c} · ${esc(LISTAS.component[c].nombre)}</option>`).join('')}</select></label>
    <label class="c">ID (COMP-SUB-NN)<input data-b="form.id" value="${esc(F.id)}" placeholder="${F.comp}-XXX-${String(fichas().filter(f => f.meta.componente === F.comp).length + 1).padStart(2, '0')}"></label>
    <label class="c">Autor(a)<input data-b="form.autor" value="${esc(F.autor)}"></label>
    <label class="c">Evidencia por defecto<select data-b="form.evid">${Object.keys(LISTAS.evidencia).map(e => `<option value="${e}"${F.evid === e ? ' selected' : ''}>${e} · ${esc(LISTAS.evidencia[e])}</option>`).join('')}</select></label></div>
    <div class="campos" style="margin-top:10px;grid-template-columns:2fr 1fr 1fr"><label class="c">Fuente principal (cita APA de la ficha técnica, norma o ensayo)<input data-b="form.cita" value="${esc(F.cita)}" placeholder="Fabricante. (año). Nombre del documento. Versión."></label><label class="c">URL o archivo<input data-b="form.url" value="${esc(F.url)}"></label><label class="c">Tipo de fuente<select data-b="form.tipo">${LISTAS.tipo_fuente.map(t => `<option${F.tipo === t ? ' selected' : ''}>${t}</option>`).join('')}</select></label></div></div>
    <div class="card"><div class="tabla-w"><table><tr><th style="width:26%">Campo</th><th style="width:20%">Valor</th><th>Unidad</th><th>Evid.</th><th>Certeza</th><th style="width:26%">Nota / justificación</th></tr>${ks.map(ent).join('')}</table></div>
    <div class="btn-fila no-print" style="margin-top:12px"><button class="btn" data-a="guardar-form">Agregar al catálogo y evaluar</button><span class="peq mut">Queda guardada en este navegador. Para que entre al repositorio: descargá el .json, completá los campos obligatorios restantes y abrí un Pull Request en <span class="cod">data/${esc(LISTAS.component[F.comp].nombre.split(' ')[0].toLowerCase())}/</span>.</span></div></div>`;
  }
  const NUMEROS = d => ['numero', 'entero'].includes(d.tipo) || d.tipo === 'valor_o_clase';
  function guardarForm() {
    const F = st.form, id = (F.id || '').trim().toUpperCase();
    if (!/^[A-Z]{3}-[A-Z0-9]{2,4}-\d{2}$/.test(id) || id.split('-')[0] !== F.comp) return toast('El ID debe tener el formato ' + F.comp + '-SUB-NN, por ejemplo ' + F.comp + '-BAM-08.');
    if (D.fichas.some(f => f.meta.id === id)) return toast('Ya existe una ficha del curso con el ID ' + id + '. Usá otro consecutivo.');
    if (!(F.campos.name && String(F.campos.name.valor || '').trim())) return toast('Escribí al menos el nombre genérico o comercial.');
    const f = M.fichaNueva(id, F.comp, F.autor, DIC), ref = F.cita.trim() ? 'FT01' : 'PROPIO';
    if (F.cita.trim()) f.fuentes.push(Object.assign({ id: 'FT01', cita: F.cita.trim(), tipo: F.tipo }, F.url.trim() ? { url: F.url.trim() } : {}));
    let sinJust = 0;
    Object.keys(F.campos).forEach(k => {
      const x = F.campos[k], d = DIC[k], raw = String(x.valor === undefined || x.valor === null ? '' : x.valor).trim(); if (!d || !f.campos[k] || raw === '') return;
      const c = { estado: 'dato', fuentes: [{ ref }], evidencia: x.evidencia || F.evid };
      if (d.tipo === 'escala') { c.valor = +raw; if ((x.nota || '').trim()) c.justificacion = x.nota.trim(); else sinJust++; }
      else if (d.tipo === 'lista_multiple') c.valor = raw.split('|').map(s => s.trim()).filter(Boolean);
      else if (NUMEROS(d) && pn(raw) !== null) { c.valor = d.tipo === 'entero' ? Math.round(pn(raw)) : pn(raw); c.calificador = '='; const us = [d.unidad].concat((d.unidades_alternativas || '').split('|')).filter(Boolean); if (us.length) c.unidad = x.unidad || us[0]; if (x.certeza) c.certeza = x.certeza; }
      else c.valor = raw;
      if (d.tipo !== 'escala' && (x.nota || '').trim()) c.nota = x.nota.trim();
      if (ref === 'PROPIO' && c.evidencia !== 'E1') c.evidencia = 'E1';
      f.campos[k] = c;
    });
    f._usuario = true; st.fichasUsuario = st.fichasUsuario.filter(u => u.meta.id !== id).concat([f]); st.form = null; st.comp = F.comp; st.tab = 'eval'; st.abierto = id; guardar();
    toast('Ficha ' + id + ' agregada.' + (ref === 'PROPIO' ? ' Sin cita de fuente: todos los datos quedaron como E1 (criterio propio).' : '') + (sinJust ? ' ' + sinJust + ' escala(s) sin justificación.' : ''));
  }
  /* ---------- corrección de fichas en la app ---------- */
  const NUMT = d => ['numero', 'entero'].includes(d.tipo);
  function abrirEdicion(id) {
    const f = clon(fichas().find(x => x.meta.id === id)); delete f._val;
    Object.keys(DIC).forEach(k => { if (M.aplica(DIC[k], f.meta.componente) && !f.campos[k]) f.campos[k] = { estado: 'pendiente' }; });
    Object.keys(f.campos).forEach(k => { const c = f.campos[k]; c._v = Array.isArray(c.valor) ? c.valor.join(' | ') : c.valor === undefined || c.valor === null ? '' : String(c.valor).replace(M.isNum(c.valor) ? '.' : '\u0000', ','); c._min = M.isNum(c.min) ? String(c.min).replace('.', ',') : ''; c._max = M.isNum(c.max) ? String(c.max).replace('.', ',') : ''; c._ref = (c.fuentes || []).map(r => r.ref).join('; '); });
    st.ed = f; st.edVer = 'errores'; st.edNf = { id: '', cita: '', tipo: 'ficha_tecnica' };
  }
  function cerrarEdicion(guardarla) {
    const f = st.ed, id = f.meta.id;
    if (guardarla) {
      Object.keys(f.campos).forEach(k => {
        const c = f.campos[k], d = DIC[k], v = String(c._v || '').trim(), mn = pn(c._min || ''), mx = pn(c._max || '');
        if (d && (v !== '' || (mn !== null && mx !== null)) && c.estado !== 'dato') c.estado = 'dato'; /* escribir un valor lo convierte en dato */
        if (d && c.estado === 'dato') {
          delete c.valor; delete c.min; delete c.max;
          if (mn !== null && mx !== null && v === '') { c.min = mn; c.max = mx; c.calificador = 'rango'; }
          else if (v !== '') {
            if (d.tipo === 'lista_multiple') c.valor = v.split('|').map(s => s.trim()).filter(Boolean);
            else if (d.tipo === 'escala' || d.tipo === 'entero') c.valor = pn(v) !== null ? Math.round(pn(v)) : v;
            else if (d.tipo === 'numero' || d.tipo === 'valor_o_clase') c.valor = pn(v) !== null ? pn(v) : v;
            else c.valor = v;
            if (M.isNum(c.valor) && d.tipo !== 'escala') { if (!c.calificador || c.calificador === 'rango') c.calificador = '='; } else if (c.calificador === 'rango') delete c.calificador;
            if (M.isNum(c.valor) || v !== '') delete c.valor_texto_original;
          }
          const refs = String(c._ref || '').split(/[;,]/).map(s => s.trim()).filter(Boolean), prev = c.fuentes || [];
          if (refs.length) c.fuentes = refs.map(r => { const p = prev.find(x => x.ref === r); return p || { ref: r }; }); else delete c.fuentes;
        } else if (d && c.estado !== 'dato') { ['valor', 'min', 'max', 'calificador', 'unidad', 'evidencia', 'certeza', 'justificacion', 'valor_texto_original', 'fuentes'].forEach(a => delete c[a]); }
        ['evidencia', 'certeza', 'justificacion', 'nota', 'unidad'].forEach(a => { if (c[a] === '') delete c[a]; });
        delete c._v; delete c._min; delete c._max; delete c._ref;
      });
      f.meta.fecha_actualizacion = new Date().toISOString().slice(0, 10); f._editada = true;
      if (D.fichas.some(b => b.meta.id === id)) st.editadas[id] = f; else { f._usuario = true; st.fichasUsuario = st.fichasUsuario.filter(u => u.meta.id !== id).concat([f]); }
      guardar(); const e = M.diagnostico(f, DIC).filter(x => x.nivel === 'error').length;
      toast('Correcciones guardadas en este navegador. ' + (e ? 'Quedan ' + e + ' errores en esta ficha.' : 'La ficha quedó sin errores.') + ' Descargá el .json para entregarla.');
    }
    st.ed = null; st.fichaVista = id;
  }
  function vCorregir() {
    const f = st.ed, comp = f.meta.componente, dg = M.diagnostico(f, DIC), por = {};
    dg.forEach(x => (por[x.clave] = por[x.clave] || []).push(x));
    const nE = dg.filter(x => x.nivel === 'error').length, nA = dg.length - nE;
    const ks = Object.keys(DIC).filter(k => M.aplica(DIC[k], comp) && k !== 'id' && k !== 'component' && (st.edVer === 'todos' || (por[k] && (st.edVer === 'avisos' || por[k].some(x => x.nivel === 'error')))));
    const fila = k => { const d = DIC[k], c = f.campos[k], p = `ed.campos.${k}.`; let val;
      if (d.tipo === 'escala') val = `<select data-b="${p}_v"><option value="">—</option>${[1, 2, 3, 4, 5].map(n => `<option value="${n}"${String(c._v) === String(n) ? ' selected' : ''}>${n} · ${LISTAS.escala_1_5[n]}</option>`).join('')}</select>`;
      else if (d.dominio && Array.isArray(LISTAS[d.dominio]) && d.tipo !== 'lista_multiple') val = `<select data-b="${p}_v"><option value="">—</option>${LISTAS[d.dominio].concat(c._v && !LISTAS[d.dominio].includes(c._v) ? [c._v] : []).map(o => `<option${c._v === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
      else if (d.tipo === 'texto_largo' || String(c._v || '').length > 60) val = `<textarea class="w100" rows="3" data-b="${p}_v">${esc(c._v)}</textarea>`;
      else val = `<input class="w100" data-b="${p}_v" value="${esc(c._v)}" placeholder="${d.tipo === 'lista_multiple' ? 'separar con |' : ''}">`;
      const us = [d.unidad].concat((d.unidades_alternativas || '').split('|')).filter(u => u && u !== '1–5');
      if (NUMT(d) || d.tipo === 'valor_o_clase') val += `<div class="peq mut" style="margin-top:4px">o rango <input class="mini" style="width:5em" data-b="${p}_min" value="${esc(c._min)}" aria-label="Mínimo"> a <input class="mini" style="width:5em" data-b="${p}_max" value="${esc(c._max)}" aria-label="Máximo"> ${us.length ? `<select data-b="${p}unidad"><option value="">unidad</option>${us.map(u => `<option${c.unidad === u ? ' selected' : ''}>${esc(u)}</option>`).join('')}</select>` : ''}</div>`;
      if (c.valor_texto_original) val += `<div class="peq mut">Texto original: ${esc(c.valor_texto_original)}</div>`;
      return `<tr><td style="width:22%"><b>${esc(d.campo)}</b>${d.obligatorio === 'Sí' ? ' *' : ''}<div class="mut peq"><span class="cod">${k}</span> ${esc(d.seccion)}</div>${(por[k] || []).map(x => `<div><span class="tag ${x.nivel === 'error' ? 'critica' : 'atencion'}">${x.cod}</span> <span class="peq">${esc(x.msg)}</span></div>`).join('')}${d.regla ? `<div class="mut peq">${esc(d.regla)}</div>` : ''}</td>
      <td><select data-b="${p}estado">${LISTAS.estado.map(e => `<option${c.estado === e ? ' selected' : ''}>${e}</option>`).join('')}</select></td><td style="width:32%">${val}</td>
      <td><input data-b="${p}_ref" value="${esc(c._ref)}" list="ed-fuentes" placeholder="ID de fuente" style="width:8.5em"><div style="margin-top:4px"><select data-b="${p}evidencia"><option value="">evid.</option>${Object.keys(LISTAS.evidencia).map(e => `<option value="${e}"${c.evidencia === e ? ' selected' : ''} title="${esc(LISTAS.evidencia[e])}">${e}</option>`).join('')}</select>${NUMT(d) ? ` <select data-b="${p}certeza"><option value="">certeza</option>${Object.keys(LISTAS.certeza).map(e => `<option value="${e}"${c.certeza === e ? ' selected' : ''}>${e.replace(/_/g, ' ')}</option>`).join('')}</select>` : ''}</div></td>
      <td style="width:24%">${d.tipo === 'escala' ? `<textarea class="w100" rows="2" data-b="${p}justificacion" placeholder="Justificación del puntaje">${esc(c.justificacion || '')}</textarea>` : ''}<textarea class="w100" rows="2" data-b="${p}nota" placeholder="Nota: condición, ensayo, valor en servicio…">${esc(c.nota || '')}</textarea></td></tr>`; };
    return `<div class="btn-fila no-print" style="margin-bottom:10px"><button class="btn" data-a="ed-guardar">Guardar correcciones</button><button class="btn sec" data-a="ed-cancelar">Cancelar</button></div>
    <div class="card"><h2>Corregir ${f.meta.id}</h2><p class="mut">${esc((f.campos.name || {})._v || '')} · ${esc(f.meta.autor || '')}</p>
    <div class="kpis"><div class="kpi"><div class="l">Errores</div><div class="v">${nE}</div></div><div class="kpi"><div class="l">Avisos</div><div class="v">${nA}</div></div><div class="kpi"><div class="l">Campos en pantalla</div><div class="v">${ks.length}</div></div></div>
    <p class="peq">Llená solo lo que tenga respaldo. Si escribís un valor en un campo que no era dato, pasa a «dato» al guardar. Lo que no exista o no aplique se declara <span class="cod">no_disponible</span> o <span class="cod">no_aplica</span>: eso también corrige el error, y es más honesto que un dato sin fuente. Los cambios se guardan en este navegador; para entregarlos, descargá el .json desde la ficha.</p>
    <div class="chips no-print">${[['errores', 'Solo errores'], ['avisos', 'Errores y avisos'], ['todos', 'Todos los campos']].map(([k, n]) => `<button data-a="ed-ver" data-k="${k}" class="${st.edVer === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>
    <div class="card"><h3>Fuentes de la ficha</h3><p class="peq">${f.fuentes.map(s => `<span class="cod" title="${esc(s.cita)}">${esc(s.id)}</span>`).join(' ')}</p><datalist id="ed-fuentes">${f.fuentes.map(s => `<option value="${esc(s.id)}">${esc(s.cita.slice(0, 80))}</option>`).join('')}</datalist>
    <div class="campos" style="grid-template-columns:120px 1fr 170px auto;align-items:end"><label class="c">ID nuevo<input data-b="edNf.id" value="${esc(st.edNf.id)}" placeholder="F21"></label><label class="c">Cita (APA 7)<input data-b="edNf.cita" value="${esc(st.edNf.cita)}"></label><label class="c">Tipo<select data-b="edNf.tipo">${LISTAS.tipo_fuente.map(t => `<option${st.edNf.tipo === t ? ' selected' : ''}>${t}</option>`).join('')}</select></label><button class="btn sec" data-a="ed-fuente">Agregar fuente</button></div></div>
    <div class="card"><div class="tabla-w"><table><tr><th>Campo y problema</th><th>Estado</th><th>Valor</th><th>Fuente · evidencia · certeza</th><th>Justificación y nota</th></tr>${ks.map(fila).join('') || '<tr><td colspan="5" class="mut">Nada que mostrar con este filtro.</td></tr>'}</table></div>
    <div class="btn-fila no-print" style="margin-top:12px"><button class="btn" data-a="ed-guardar">Guardar correcciones</button><button class="btn sec" data-a="ed-cancelar">Cancelar</button></div></div>`;
  }

  function vFichas() {
    if (st.ed) return vCorregir();
    if (st.form) return vForm();
    if (st.fichaVista) { const f = fichas().find(x => x.meta.id === st.fichaVista); if (f) return vFichaCompleta(f); st.fichaVista = null; }
    const q = st.filtro.q.toLowerCase(), L = fichas().filter(f => (!st.filtro.comp || f.meta.componente === st.filtro.comp) && (!q || (f.meta.id + ' ' + ((f.campos.name || {}).valor || '') + ' ' + (f.meta.autor || '')).toLowerCase().includes(q)));
    return `<h2>Catálogo de fichas</h2><p class="lead">${D.fichas.length} fichas del TP1 migradas al estándar Ficha SUM v1.0${st.fichasUsuario.length ? ` y ${st.fichasUsuario.length} agregada(s) en este navegador` : ''}. El índice de trazabilidad (IT) es el porcentaje de datos con fuente y evidencia (y certeza, si son numéricos).</p>
    <div class="card no-print"><h3>Agregar un sistema nuevo</h3>
    <p class="peq mut">Tres caminos, cada uno con su plantilla. Elegí el componente, descargá la plantilla, llenala y subila con el botón de su columna: se evalúa de inmediato junto a las demás.</p>
    <p><label class="peq">Componente de la plantilla <select data-b="plComp">${COMP.map(c => `<option value="${c}"${st.plComp === c ? ' selected' : ''}>${c} · ${esc(LISTAS.component[c].nombre)}</option>`).join('')}</select></label></p>
    <div class="grid g3">
      <div class="via"><div class="pn">1</div><h3>Desde una ficha técnica</h3><p class="peq">Para un producto con hoja técnica del fabricante. Solo los ${camposForm(st.plComp).length} campos que la app usa para evaluar ${esc(LISTAS.component[st.plComp].nombre.toLowerCase())}.</p><div class="btn-fila"><button class="btn" data-a="nuevo-form">Llenar formulario aquí</button>${D.plantillas_b64 ? `<button class="btn sec" data-a="bajar-pl" data-k="rapida">Descargar plantilla rápida .xlsx</button>` : ''}<button class="btn sec" data-a="pick" data-f="f-plantilla">Subir plantilla llena</button></div></div>
      <div class="via"><div class="pn">2</div><h3>Plantilla Excel completa</h3><p class="peq">La Ficha SUM v1.0 entera (todos los campos del estándar, con listas desplegables y validación). Es la que va al repositorio.</p><div class="btn-fila">${D.plantillas_b64 ? `<button class="btn sec" data-a="bajar-pl" data-k="completa">Descargar plantilla completa .xlsx</button>` : ''}<button class="btn sec" data-a="pick" data-f="f-plantilla">Subir plantilla llena</button></div></div>
      <div class="via"><div class="pn">3</div><h3>Archivo .json</h3><p class="peq">Para quien trabaja en el repositorio o genera la ficha con un script. Misma estructura que <span class="cod">data/&lt;componente&gt;/&lt;ID&gt;.json</span>.</p><div class="btn-fila"><button class="btn sec" data-a="bajar-pl" data-k="json">Descargar plantilla .json</button><button class="btn sec" data-a="pick" data-f="f-ficha">Subir ficha .json</button></div></div>
    </div>
    <details><summary class="peq">Cómo llenarlas (reglas comunes)</summary><ul class="l peq"><li><b>ID</b>: cambiá <span class="cod">${st.plComp}-XXX-01</span> por el tuyo, con el formato COMP-SUB-NN (por ejemplo <span class="cod">${st.plComp}-BAM-08</span>). En Excel está en la celda G2 de la hoja Ficha; en JSON, en <span class="cod">meta.id</span> y en <span class="cod">campos.id.valor</span>. No puede repetir un ID del catálogo.</li><li><b>Estado</b> de cada campo: dato, no_disponible, no_aplica o pendiente. Solo «dato» puntúa.</li><li><b>Números</b> sin unidad dentro del valor: la unidad va en su columna. Un rango va en Mín y Máx.</li><li><b>Escalas 1–5</b>: llevan justificación escrita.</li><li><b>Fuentes</b>: cada referencia se registra una vez (hoja Fuentes, o arreglo <span class="cod">fuentes</span>) y se cita por su ID en cada dato, con evidencia E1–E5. Una ficha técnica de fabricante es evidencia E2.</li><li><b>Certeza</b> de cada número: verificado, rango_literatura o estimado_analogia.</li><li>En JSON, un dato se escribe así: <span class="cod">"u_value": {"estado": "dato", "valor": 2.8, "calificador": "=", "unidad": "W/(m²·K)", "fuentes": [{"ref": "FT01", "loc": "p. 2"}], "evidencia": "E2", "certeza": "verificado"}</span></li><li>Lo que no tengás se deja en «pendiente»: no puntúa, y la app lo cuenta como cobertura faltante.</li></ul></details></div>
    <div class="card no-print"><div class="btn-fila"><div class="chips"><button data-a="f-comp" data-c="" class="${st.filtro.comp ? '' : 'on'}">Todos</button>${COMP.map(c => `<button data-a="f-comp" data-c="${c}" class="${st.filtro.comp === c ? 'on' : ''}">${esc(LISTAS.component[c].nombre)}</button>`).join('')}</div><input data-b="filtro.q" value="${esc(st.filtro.q)}" placeholder="Buscar por nombre, ID o autor" style="flex:1;min-width:200px"></div></div>
    <div class="fichas">${L.map(f => { const v = itDe(f); return `<button class="fcard" data-a="ver-ficha" data-id="${f.meta.id}"><span class="cod">${f.meta.id}</span> ${f._usuario ? '<span class="tag prop">agregada</span>' : f._editada ? '<span class="tag prop">corregida aquí</span>' : ''}<div class="t">${esc((f.campos.name || {}).valor || '')}</div><div class="mut peq">${esc(LISTAS.component[f.meta.componente].nombre)} · ${esc(f.meta.autor || '')}</div><div class="peq" style="margin-top:5px">IT <b>${fn(v.it)} %</b> · ${v.datos} datos${v.errores ? ` · <span class="tag atencion">${v.errores} errores</span>` : v.errores === 0 ? ' · <span class="tag ok">valida</span>' : ''}</div><div class="barra"><i style="width:${v.it}%"></i></div></button>`; }).join('') || '<p class="mut">Ninguna ficha coincide con el filtro.</p>'}</div>`;
  }

  /* ---------- síntesis técnica y tablero ---------- */
  const lecturaDim = s => s === null ? ['Sin dato', 'dato'] : s >= 2.25 ? ['Fortaleza', 'ok'] : s >= 1.5 ? ['Aceptable', 'prop'] : s >= 0.75 ? ['Débil', 'atencion'] : ['Muy débil', 'critica'];
  function porque(f, E, C, positivo) {
    const act = E.inds.filter(i => i.activo), dom = M.COD.filter(c => C.niveles[c] >= 2);
    const tabla = `<table><tr><th>Dimensión</th><th class="n">Peso aquí</th><th>Puntaje 0–3</th><th>Lectura</th><th>Qué lo explica en la ficha</th></tr>${C.pesos.map(p => { const d = f.dims[p.id], [t, cl] = lecturaDim(d.s);
      const li = act.filter(i => i.dim === p.id && f.det[i.clave].s !== null).sort((a, b) => positivo ? f.det[b.clave].s - f.det[a.clave].s : f.det[a.clave].s - f.det[b.clave].s).slice(0, 2);
      return `<tr><td><b>${esc(p.nombre)}</b>${p.prioridad === 1 ? ' <span class="tag ok">prioritaria</span>' : ''}</td><td class="n">${pct(p.peso)}</td><td style="min-width:88px">${d.s === null ? '<span class="mut">s/d</span>' : `<b>${fn(d.s)}</b><div class="barra"><i style="width:${Math.max(4, d.s / 3 * 100)}%;background:${colorP(d.s)}"></i></div>`}</td><td><span class="tag ${cl}">${t}</span></td><td class="peq">${d.manual !== null ? 'Puntaje manual de quien evalúa.' : li.length ? li.map(i => `${esc(i.etiqueta)}: ${esc(f.det[i.clave].texto)}`).join(' · ') : '<span class="mut">Sin indicadores con dato: puntuar a mano o completar la ficha.</span>'}</td></tr>`; }).join('')}</table>`;
    const clima = dom.length ? `<ul class="l">${dom.map(c => { const e = C.exigencias[c], ds = C.pesos.filter((p, j) => st.S.sens[c][j] >= 1); return `<li><b>${esc(e.nombre)} ${e.nivel}/3</b> (${esc(String(e.dato).replace('.', ','))}): exige ${ds.map(p => { const d = f.dims[p.id]; return `${esc(p.nombre.toLowerCase())} ${d.s === null ? '<span class="mut">(sin dato)</span>' : `<b>${fn(d.s)}</b>`}`; }).join(', ') || 'sin dimensión asociada'}.</li>`; }).join('')}</ul>` : '<p class="peq mut">El sitio no tiene exigencias climáticas de nivel 2 o 3: pesan casi igual las seis dimensiones.</p>';
    const al = f.criticas.map(n => `<div class="aviso crit"><b>Alerta crítica:</b> puntaje 0 en ${esc(n)}, dimensión que este clima volvió prioritaria.</div>`).join('') + f.alertas.filter(a => positivo ? a.severidad !== 'critica' : true).map(a => `<div class="aviso ${a.severidad === 'critica' ? 'crit' : a.severidad === 'dato' ? 'info' : ''}"><span class="cod">${a.id}</span> ${esc(a.mensaje)}</div>`).join('');
    return `<p class="nm">${esc(f.nombre)} <span class="cod">${f.id}</span></p><p class="peq">Puesto ${f.r_sit} de ${E.filas.filter(x => x.r_sit !== null).length} · ${pct(f.sit)} en el sitio · ${pct(f.gen)} genérico · cobertura de datos ${f.conf} (${pct(f.cobertura)})</p>
    <h3 style="margin-top:10px">Por el clima del sitio</h3>${clima}${al || (positivo ? '<div class="aviso bien">Sin alertas de incompatibilidad con este clima.</div>' : '')}
    <h3 style="margin-top:10px">Por las 6 dimensiones de la materialidad</h3><div class="tabla-w">${tabla}</div>`;
  }
  function sintesis(E, C) {
    const val = E.filas.filter(f => f.r_sit !== null);
    if (val.length < 2 || !E.sens) return '<div class="aviso">No hay al menos dos alternativas con 3 o más dimensiones puntuables: no se puede establecer una recomendación. Completá las fichas de este componente o puntuá las dimensiones a mano (clic en cada fila).</div>';
    const rec = val.find(f => !f.bloq), bl = val.filter(f => f.bloq), ult = val[val.length - 1], no = bl.length ? bl[0] : (rec && ult.id !== rec.id ? ult : null), s = E.sens;
    const fuertes = f => C.pesos.filter(p => f.dims[p.id].s !== null && f.dims[p.id].s >= 2.25).map(p => p.nombre.toLowerCase()), debiles = f => C.pesos.filter(p => f.dims[p.id].s !== null && f.dims[p.id].s < 1.5).map(p => p.nombre.toLowerCase());
    let h = '<div class="sint">';
    h += `<section class="si"><h4>Material recomendado</h4>${rec ? porque(rec, E, C, true) + `<p style="margin-top:10px"><b>En síntesis:</b> es la alternativa de mayor puntaje ponderado sin incompatibilidades con el clima${fuertes(rec).length ? ', con fortaleza en ' + esc(fuertes(rec).join(', ')) : ''}${debiles(rec).length ? '; su punto a vigilar es ' + esc(debiles(rec).join(', ')) : ''}.${rec.conf === 'baja' ? ' La cobertura de datos es baja: la evidencia es insuficiente para recomendar sin completar la ficha.' : ''}${rec.r_sit > 1 ? ' Las alternativas con más puntaje quedaron descartadas por alerta crítica.' : ''}</p>` : '<p>Ninguna alternativa del catálogo queda libre de alertas críticas en este sitio: no hay material recomendable sin resolver esas incompatibilidades.</p>'}</section>`;
    h += `<section class="no"><h4>Material no recomendado</h4>${no ? porque(no, E, C, false) + `<p style="margin-top:10px"><b>En síntesis:</b> ${no.bloq ? 'tiene una incompatibilidad con el clima del sitio que el puntaje no compensa' : 'no tiene incompatibilidades críticas, pero es la de menor puntaje ponderado del componente'}${debiles(no).length ? '; es débil en ' + esc(debiles(no).join(', ')) : ''}.${bl.length > 1 ? ` También quedan sin recomendar por alerta crítica: ${bl.slice(1).map(f => esc(f.nombre)).join('; ')}.` : ''}</p>` : '<p class="mut">No hay una alternativa claramente descartable: todas quedan sin alertas críticas y con puntajes cercanos.</p>'}</section></div>`;
    const sinDim = C.pesos.filter(p => val.every(f => f.dims[p.id].s === null)).map(p => p.nombre);
    h += `<details><summary>Solidez del resultado</summary><p class="peq">Margen sobre la segunda alternativa: <b>${fn(s.margen)} puntos</b>${s.margen < 3 ? ' (menos de 3: léase como empate)' : ''}. ${s.estable ? `El primer lugar se mantiene en los ${s.escenarios.length} escenarios de pesos probados.` : `El primer lugar cambia en ${s.cambian.length} de ${s.escenarios.length} escenarios.`} ${sinDim.length ? `Ninguna ficha tiene datos puntuables en ${esc(sinDim.join(', '))}. ` : ''}Los valores numéricos se normalizan respecto del conjunto comparado: al agregar o quitar una alternativa los puntajes cambian.</p>
    <table><tr><th>Escenario de pesos</th><th>Gana</th><th class="n">Puntaje</th><th>Segundo</th><th class="n">Margen</th></tr>${s.escenarios.map(e => `<tr><td>${esc(e.nombre)}</td><td>${esc(e.ganador.nombre)}${e.ganador.id !== val[0].id ? ' <span class="tag atencion">cambia</span>' : ''}</td><td class="n">${pct(e.ganador.p)}</td><td>${esc(e.segundo.nombre)}</td><td class="n">${fn(e.margen)} pts</td></tr>`).join('')}</table></details>`;
    return h;
  }
  function tablero(E) {
    const k = st.dash === 'sit' ? 'sit' : 'gen', rk = 'r_' + k, L = E.filas.filter(f => f[k] !== null && f[rk] !== null).sort((a, b) => a[rk] - b[rk] || a.id.localeCompare(b.id));
    if (!L.length) return '<p class="mut">Sin alternativas con puntaje para graficar.</p>';
    const W = 380, cx = 190, cy = 190, R0 = 40, R = 150, n = L.length, paso = 2 * Math.PI / n, gap = Math.min(0.05, paso * 0.08);
    let s = '';
    L.forEach((f, i) => { const a1 = i * paso + gap, a2 = (i + 1) * paso - gap, p = f[k], am = (a1 + a2) / 2, col = colorP(p * 3);
      s += `<path d="${cuna(cx, cy, R0, R, a1, a2)}" fill="#ece7d9"/><path d="${cuna(cx, cy, R0, r2(R0 + (R - R0) * p), a1, a2)}" fill="${col}"><title>Puesto ${f[rk]} · ${esc(f.nombre)}: ${pct(p)}</title></path>`;
      const lx = r2(cx + (R + 20) * Math.sin(am)), ly = r2(cy - (R + 20) * Math.cos(am));
      s += `<circle cx="${lx}" cy="${ly}" r="13" fill="${col}"/><text x="${lx}" y="${ly + 4.5}" font-size="13" font-weight="700" fill="#fff" text-anchor="middle">${f[rk]}</text><text x="${r2(cx + (R0 + (R - R0) * 0.5) * Math.sin(am))}" y="${r2(cy - (R0 + (R - R0) * 0.5) * Math.cos(am) + 4)}" font-size="12" font-weight="700" fill="#17231f" text-anchor="middle" stroke="#fff" stroke-width="3" paint-order="stroke">${Math.round(p * 100)} %</text>`; });
    [0.25, 0.5, 0.75].forEach(t => { s += `<circle cx="${cx}" cy="${cy}" r="${R0 + (R - R0) * t}" fill="none" stroke="#fff" stroke-width="1" opacity=".75"/>`; });
    s += `<circle cx="${cx}" cy="${cy}" r="${R0 - 4}" fill="#fff" stroke="#ddd7c6"/><text x="${cx}" y="${cy - 2}" font-size="10" fill="${TX}" text-anchor="middle">${k === 'gen' ? 'Genérico' : 'En el sitio'}</text><text x="${cx}" y="${cy + 12}" font-size="10" fill="${TX}" text-anchor="middle">0–100 %</text>`;
    return `<div class="dash"><svg viewBox="0 0 ${W} ${W}" role="img" aria-label="Tablero de recomendación: cada sector es una alternativa y se llena según su puntaje ${k === 'gen' ? 'genérico' : 'en el sitio'}" font-family="${FAM}">${s}</svg>
    <ol>${L.map(f => `<li><span class="rk" style="background:${colorP(f[k] * 3)}">${f[rk]}</span><span><b>${esc(f.nombre)}</b><br><span class="mut peq"><span class="cod">${f.id}</span>${f.bloq ? ' <span class="tag critica">no recomendable por alerta crítica</span>' : ''}</span></span><span class="pc">${pct(f[k])}</span></li>`).join('')}</ol></div>
    <p class="peq mut">Cada sector del círculo es una alternativa, ordenadas por puesto en el sentido del reloj. El sector se llena desde el centro según su porcentaje (anillos a 25, 50 y 75 %) y su color va de rojo (bajo) a amarillo y verde (alto). El número en el borde es el puesto.</p>`;
  }

  /* ================= 0. PORTADA ================= */
  function vInicio(C) {
    const aut = [...new Set(D.fichas.map(f => f.meta.autor).concat(D.sitios.map(j => j.sitio.elaborado_por)).filter(Boolean))];
    const F = [['globo', 'Cualquier clima, un archivo', 'Subí un <b>.epw</b> de cualquier lugar y la app obtiene temperaturas, lluvia, días con lluvia, meses secos, humedad, radiación y viento. En Costa Rica, lo que falte se hereda de la subregión IMN.'],
      ['img', 'Gráficos de clima listos para presentar', 'Climograma, temperatura, lluvia, humedad, radiación y rosa de los vientos, exportables como imagen o en una lámina 16:9 con el resumen del sitio.'],
      ['capas', 'Componente por componente', 'Cimentaciones, pisos, paredes, cubiertas, cielos, puertas y ventanas se comparan con los pesos que el clima asigna a seis dimensiones de la materialidad.'],
      ['ok', 'Recomendado y no recomendado, con su porqué', 'Para cada componente, una síntesis técnica explica qué material conviene y cuál no en ese sitio, desde el clima y desde cada una de las seis dimensiones.'],
      ['fuente', 'Cada número con su fuente', 'Todo dato muestra su referencia, tipo de evidencia y certeza. Lo que no tiene respaldo no puntúa, y la app indica cuánto del resultado descansa en datos reales.'],
      ['balanza', 'Resultados que se dejan discutir', 'Un tablero muestra de un vistazo el puntaje de cada alternativa, y cada ranking trae su margen y su análisis de sensibilidad.'],
      ['mas', 'Catálogo abierto', 'Agregá un sistema nuevo desde una ficha técnica, una plantilla Excel o un archivo .json, con plantillas incluidas, y comparalo de inmediato.'],
      ['lapiz', 'Fichas que se corrigen aquí mismo', 'Cada ficha lista sus faltantes y errores con los campos para completarlos; al guardar, todo se recalcula y la ficha se descarga corregida.']];
    return `<section class="hero"${D.portada ? ` style="background-image:linear-gradient(90deg,rgba(6,38,31,.94) 0%,rgba(6,38,31,.86) 26%,rgba(6,38,31,.45) 44%,rgba(6,38,31,0) 62%),url(${D.portada})"` : ''}>
      <div class="hero-t"><div class="hero-k">Maestría en Arquitectura Tropical · UCR</div>
      <h2>SUM</h2><div class="hero-s">Selección y Uso de Materiales</div>
      <p>El material correcto depende del sitio. SUM cruza el clima de cualquier lugar con cada componente del edificio y muestra, con sus fuentes, qué sistema responde mejor y por qué.</p>
      <div class="btn-fila no-print"><button class="btn claro" data-a="ir" data-t="sitio">${IC.sitio}Empezar con un sitio</button><button class="btn borde" data-a="pick" data-f="f-epw">${IC.subir}Subir un archivo .epw</button><button class="btn borde" data-a="ir" data-t="tutorial">${IC.tutorial}Ver el tutorial</button></div></div></section>
    <div class="kpis" style="margin-top:16px"><div class="kpi"><div class="v">${fichas().length}</div><div class="l">sistemas constructivos documentados</div></div><div class="kpi"><div class="v">${COMP.length}</div><div class="l">componentes, de la cimentación a la cubierta</div></div><div class="kpi"><div class="v">${ZONAS.length}</div><div class="l">subregiones climáticas IMN de respaldo</div></div><div class="kpi"><div class="v">9 → 6</div><div class="l">exigencias del clima que reordenan 6 dimensiones</div></div></div>
    <div class="grid g4" style="margin-bottom:16px">${F.map(([i, t, p]) => `<div class="feat"><div class="fi">${IC[i]}</div><h3>${t}</h3><p>${p}</p></div>`).join('')}</div>
    <div class="card"><h3>Sitio activo: ${esc(st.S.sitio.nombre || 'sin nombre')}</h3>${resumenSitio(C)}<div class="btn-fila no-print"><button class="btn" data-a="ir" data-t="eval">${IC.eval}Evaluar materiales en este sitio</button><button class="btn sec" data-a="ir" data-t="edif">${IC.edif}Ver síntesis del edificio</button></div></div>
    <div class="card"><h3>Hecho en el taller</h3><p class="peq">Curso Materiales y Técnicas Avanzadas · Docente: Mag. Arq. Minor Martin Aguilar. Fichas de sistemas y estudios de clima de sitio: ${aut.map(esc).join(' · ')}.</p>
    <p class="peq mut">Herramienta docente en desarrollo (v1.2). Las fichas incluyen datos de complemento tomados de norma y campos sintetizados, identificados uno a uno y pendientes de validación por su autor. Los resultados orientan la discusión de proyecto; no sustituyen la verificación normativa ni el diseño del detalle.</p></div>`;
  }

  /* ================= 6. TUTORIAL ================= */
  function vTutorial() {
    const paso = (n, tab, titulo, intro, secs) => `<div class="card paso"><div class="pn" aria-hidden="true">${n}</div><div><h3>Pestaña ${n} · ${titulo}</h3><p>${intro}</p><dl class="sec">${secs.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl><div class="btn-fila no-print" style="margin-top:12px"><button class="btn sec peq" data-a="ir" data-t="${tab}">Ir a ${titulo}</button></div></div></div>`;
    return `<h2>Tutorial: cómo usar SUM</h2><p class="lead">Cada paso corresponde a la pestaña con el mismo número y explica, sección por sección, qué muestra y qué se hace ahí. El método completo y sus supuestos están en el documento aparte <b>Guía de método, corrección y mejora de SUM</b>.</p>
    ${paso(1, 'sitio', 'Sitio y clima', 'Aquí se define <b>dónde</b> está el proyecto y cómo es su clima. Todo lo demás se calcula a partir de esta pestaña.', [
      ['Sitio cargado', 'Elegí un sitio del curso o cargá uno: <b>desde un .epw</b> (cualquier lugar), desde la <b>Matriz de Clima de Sitio</b> en Excel, o desde un <b>.json</b> guardado antes. «Limpiar datos de clima» borra el EPW y los valores cargados, sin tocar la identificación.'],
      ['1 · Identificación', 'Nombre, ubicación, coordenadas, fecha y la <b>subregión IMN</b>. La subregión aporta valores de respaldo para lo que no tengás del sitio (solo Costa Rica).'],
      ['Archivo EPW', 'Aparece al subir un .epw: un gráfico por variable (temperatura, lluvia, días con lluvia, humedad, radiación, viento y rosa de los vientos) y la tabla mensual. Con «Exportar» se descargan como imágenes, lámina 16:9 o datos.'],
      ['2 · Datos climáticos', 'La tabla de las 9 variables. «Dato del sitio» es lo que viene del EPW o de una estación; «Valor usado» es el que entra al cálculo. Escribí la fuente y declará la <b>certeza</b> de cada dato.'],
      ['3 · Microclima', 'Lo que un EPW <b>no</b> trae: altitud, distancia a la costa, zona de viento CFIA, exposición, sombra y orientación. La zona sísmica (CSCR-2010) se indica en la tabla de datos. Fuera de Costa Rica, sismicidad y viento se dan como nivel 0–3.'],
      ['Resultado para este sitio', 'Resumen: suma de exigencia, exigencias dominantes, dimensión prioritaria y datos que faltan. Si faltan datos, el perfil subestima el clima. Aquí se guarda o descarga el sitio.']])}
    ${paso(2, 'perfil', 'Perfil y pesos', 'Traduce el clima en <b>exigencias</b> y estas en el <b>peso</b> de cada dimensión con que se evalúan los materiales.', [
      ['Exigencias climáticas', 'Nueve exigencias de 0 a 3 (calor, frío, lluvia, persistencia de humedad, estación seca, amplitud térmica, salinidad, sismicidad, viento), con el dato que define cada una y qué le pide a los materiales.'],
      ['Pesos de las 6 dimensiones', 'La barra es el peso con clima y la marca vertical el peso sin clima. La dimensión que más pesa es la «prioritaria». El <b>peso base</b> es una decisión del proyecto y se cambia en la última columna.'],
      ['Sensibilidad exigencia × dimensión', 'Desplegable. Cuánto influye cada exigencia en cada dimensión (0, 1 o 2). Es una propuesta del curso que se puede calibrar.'],
      ['Umbrales y reglas', 'Desplegable. Los cortes que convierten cada variable en nivel 0–3 y las reglas de microclima. Solo para calibración docente.']])}
    ${paso(3, 'eval', 'Evaluación', 'Compara las alternativas de <b>un componente</b> con los pesos del sitio. Es la pestaña central.', [
      ['Selector de componente', 'Elegí cimentaciones, pisos, paredes, cubiertas, cielos, puertas o ventanas. Al lado: la forma de normalizar los números y si se incluyen los datos de complemento tomados de norma.'],
      ['Tabla de ranking', 'Una fila por alternativa. Cada dimensión muestra su puntaje 0–3 con una barra de rojo (bajo) a verde (alto) y «n/de»: cuántos indicadores tenían dato. «Genérico» es sin clima; «En el sitio», con los pesos del sitio; «Mov.» son los puestos que cambia por el clima.'],
      ['Detalle de una fila', 'Un clic en la fila abre el cálculo: cada indicador con el dato de la ficha, su fuente, evidencia, certeza y puntaje. Ahí se puede escribir un <b>puntaje manual</b> por dimensión.'],
      ['Tablero de recomendación', 'Un círculo dividido en sectores, uno por alternativa. Cada sector se llena según su porcentaje y lleva su número de puesto.'],
      ['Síntesis técnica', 'Explica el <b>material recomendado</b> y el <b>no recomendado</b>: por el clima del sitio y por cada una de las 6 dimensiones. «Solidez del resultado» indica el margen y si el primer lugar cambia al variar los pesos.'],
      ['Criterios', 'Desplegable. Qué indicadores puntúan y en qué sentido. Se pueden activar, desactivar o invertir, con justificación en la memoria.']])}
    ${paso(4, 'edif', 'Edificio', 'Reúne en una sola tabla el resultado de los <b>siete componentes</b> para el sitio.', [
      ['Resumen del sitio', 'Los mismos cuatro indicadores de la pestaña 1, para tener el clima a la vista.'],
      ['Tabla por componente', 'La mejor alternativa recomendable de cada componente, su puntaje, el margen sobre la segunda, si el clima cambió al ganador, la estabilidad y las alertas. «Ver» abre ese componente en Evaluación.'],
      ['Advertencia', 'El cuadro es un punto de partida. La compatibilidad entre los sistemas elegidos y el costo se resuelven en el proyecto.']])}
    ${paso(5, 'fichas', 'Fichas', 'El <b>catálogo</b> de sistemas: se consulta, se amplía y se corrige.', [
      ['Agregar un sistema nuevo', 'Tres caminos con su plantilla: desde una ficha técnica (formulario o plantilla rápida), plantilla Excel completa, o archivo .json. Se descargan y se suben ahí mismo.'],
      ['Filtros y catálogo', 'Buscá por componente, nombre, ID o autor. Cada tarjeta muestra el índice de trazabilidad (IT) y los errores del validador.'],
      ['Ficha completa', 'Todos los campos por sección, con su fuente, evidencia y certeza, y la bibliografía al final. Se descarga como .json.'],
      ['Corregir faltantes y errores', 'Lista cada error con los campos para llenarlo. Al guardar se recalcula la evaluación y la ficha corregida queda lista para descargar.']])}
    <div class="card"><h3>Cómo leer las etiquetas</h3><div class="tabla-w"><table><tr><th>Etiqueta</th><th>Significa</th></tr>
      <tr><td><span class="mut">s/d</span></td><td>Sin datos puntuables en esa dimensión. No es un cero: su peso se reparte entre las demás.</td></tr>
      <tr><td><span class="tag prop">man.</span></td><td>Puntaje manual escrito por quien evalúa.</td></tr>
      <tr><td><span class="tag atencion">4/6 dim.</span></td><td>Se compara con menos de 6 dimensiones. Con menos de 3, la ficha no entra al ranking.</td></tr>
      <tr><td><span class="tag ok">cobertura alta</span> <span class="tag prop">media</span> <span class="tag critica">baja</span></td><td>Alta si 70 % o más de los indicadores tiene dato; media desde 40 %; baja por debajo (evidencia insuficiente para recomendar). Mide cantidad de datos, no su calidad.</td></tr>
      <tr><td><span class="tag critica">crítica</span> <span class="tag atencion">atención</span> <span class="tag dato">sin dato</span></td><td>Alertas clima × material: incompatibilidad seria, condición a revisar, o dato que el clima vuelve necesario y la ficha no trae.</td></tr>
      <tr><td><span class="tag critica">no recomendable</span></td><td>Tiene una alerta crítica: conserva su puntaje, pero no se propone como mejor opción.</td></tr>
      <tr><td><span class="tag comp">complemento</span></td><td>Dato agregado en la integración desde norma (valor genérico del material, no del producto). Pendiente de validar por el autor.</td></tr></table></div></div>
    <div class="card"><h3>Errores frecuentes</h3><ul class="l"><li><b>Leer el puntaje como calificación absoluta.</b> Los números se normalizan respecto de las alternativas comparadas: al agregar o quitar una, cambian.</li><li><b>Ignorar la cobertura.</b> Un 70 % con cobertura baja dice poco; primero hay que completar la ficha.</li><li><b>Tomar un dato de complemento como dato del producto.</b> Es el valor genérico del material en condiciones de laboratorio.</li><li><b>Usar un EPW sin declarar qué es.</b> Un año típico o sintético es un dato estimado, no una medición del sitio.</li><li><b>Compensar una alerta crítica con puntaje.</b> Una incompatibilidad con el clima no se promedia.</li></ul><p class="peq mut">Los sitios, fichas agregadas o corregidas, puntajes manuales y criterios se guardan en este navegador. Para compartirlos, descargá el .json; para entregar, usá «Descargar tabla .csv», «Exportar» o «Imprimir».</p></div>
    <div class="card"><h3>Fuentes y bibliografía</h3><ul class="l peq">${st.PAR.fuentes.map(f => `<li><b>${esc(f.id)}.</b> ${esc(f.cita)}</li>`).join('')}
    <li><b>Propiedades de materiales (complemento).</b> Instituto Eduardo Torroja de Ciencias de la Construcción, CEPCO y AICIA. (2010). Catálogo de Elementos Constructivos del CTE (versión 6.3), sección 3. Ministerio de Vivienda, España. Valores de diseño según UNE-EN ISO 10456.</li>
    <li><b>Formato EPW.</b> U.S. Department of Energy. EnergyPlus Weather File (EPW) Data Dictionary. Auxiliary Programs, EnergyPlus Documentation.</li>
    <li><b>Datos de cada sistema.</b> Fichas TP1 de cada estudiante; la bibliografía completa está al final de cada ficha, en la pestaña Fichas.</li></ul></div>`;
  }

  /* ================= RENDER Y EVENTOS ================= */
  const TABS = [['inicio', 'Inicio'], ['sitio', 'Sitio y clima'], ['perfil', 'Perfil y pesos'], ['eval', 'Evaluación'], ['edif', 'Edificio'], ['fichas', 'Fichas'], ['tutorial', 'Tutorial']];
  function render() {
    const C = calc();
    $('#tabs').innerHTML = TABS.map(([k, n], i) => `<button data-a="ir" data-t="${k}" class="${st.tab === k ? 'on' : ''}"${st.tab === k ? ' aria-current="page"' : ''}>${i > 0 && i < 6 ? `<span class="n">${i}</span>` : IC[k]}${n}</button>`).join('');
    $('#chip').innerHTML = `<b>${esc(st.S.sitio.nombre || 'Sitio sin nombre')}</b> · ${esc(st.S.sitio.id_zona || 'sin subregión')} · exigencia ${C.total}/27${C.dominantes.length ? ' · ' + C.dominantes.join(' ') : ''}`;
    $('#app').innerHTML = ({ inicio: vInicio, sitio: vSitio, perfil: vPerfil, eval: vEval, edif: vEdificio, fichas: vFichas, tutorial: vTutorial })[st.tab](C);
    $('#pie').textContent = 'SUM v1.2 · ' + D.fichas.length + ' fichas · ' + D.sitios.length + ' sitios · datos generados ' + D.generado + ' · Herramienta docente: los resultados dependen de la calidad y trazabilidad de los datos de cada ficha.';
  }
  function setPath(path, val) { const p = path.split('.'); let o = st; for (let i = 0; i < p.length - 1; i++) { if (o[p[i]] === undefined || o[p[i]] === null) o[p[i]] = {}; o = o[p[i]]; } o[p[p.length - 1]] = val; }
  document.addEventListener('change', ev => {
    const el = ev.target, b = el.dataset.b, a = el.dataset.a;
    if (b) {
      const t = el.dataset.t; let v = el.value;
      if (t === 'fecha') v = fechaIso(v); else if (t === 'num') v = pn(v); else if (t === 'num0') { v = pn(v); if (v === null) v = 0; } else if (t === 'chk') v = el.checked; else if (t === 'nul') v = v || null;
      else if (/nivel_(sis|vie)_manual$/.test(b)) v = v === '' ? null : +v;
      setPath(b, v);
      if (/^S\.vars\.[a-z_]+\.entrada$/.test(b)) { const k = b.split('.')[2]; st.S.vars[k].deEPW = false; }
      if (b === 'form.comp') st.form.campos = { name: st.form.campos.name || {} };
      if (b.startsWith('S.')) st.sitioSel = st.sitioSel && st.sitioSel[0] === 'u' ? st.sitioSel : '';
      if (b.startsWith('PAR.') || b === 'norm') guardar();
      if (b.startsWith('form.') && b !== 'form.comp') return;
      if (b.startsWith('ed.') || b.startsWith('edNf.')) return; /* el formulario no se redibuja al escribir */
      return render();
    }
    if (a === 'sel-sitio') { if (el.value) { cargarSitio(el.value); st.deshacer = null; } return render(); }
    if (a === 'fecha-pick') { if (el.value) st.S.sitio.fecha = el.value; return render(); }
    if (a === 'manual') { const id = el.dataset.id, d = el.dataset.d, v = pn(el.value); st.manual[id] = st.manual[id] || {}; if (v === null) delete st.manual[id][d]; else st.manual[id][d] = Math.max(0, Math.min(3, v)); if (!Object.keys(st.manual[id]).length) delete st.manual[id]; guardar(); return render(); }
    if (a === 'ind-act') { st.aj[el.dataset.k] = Object.assign(st.aj[el.dataset.k] || {}, { activo: el.checked }); guardar(); return render(); }
    if (a === 'ind-sen') { st.aj[el.dataset.k] = Object.assign(st.aj[el.dataset.k] || {}, { sentido: el.value }); guardar(); return render(); }
  });
  document.addEventListener('keydown', ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches && ev.target.matches('tr.clic')) { ev.preventDefault(); ev.target.click(); } });
  document.addEventListener('click', ev => {
    if (ev.target.closest('input,select,textarea,a,label') && !ev.target.closest('[data-a="pick"]')) return;
    const el = ev.target.closest('[data-a]'); if (!el) return; const a = el.dataset.a, C = () => calc();
    switch (a) {
      case 'ir': st.tab = el.dataset.t; st.fichaVista = null; st.form = null; st.ed = null; window.scrollTo(0, 0); break;
      case 'pick': document.getElementById(el.dataset.f).click(); return;
      case 'sitio-nuevo': st.S = M.estadoVacio(st.PAR); st.sitioSel = ''; st.deshacer = null; break;
      case 'limpiar-clima': { st.deshacer = { S: clon(st.S), sel: st.sitioSel }; const v = M.estadoVacio(st.PAR); st.S.vars = v.vars; st.S.epw = null; st.S.origen = ''; if (st.sitioSel[0] !== 'u') st.sitioSel = ''; break; }
      case 'deshacer-clima': if (st.deshacer) { st.S = st.deshacer.S; st.sitioSel = st.deshacer.sel; st.deshacer = null; } break;
      case 'cal': { const d = document.getElementById('f-fecha'); if (d.showPicker) { try { d.showPicker(); } catch (e) { d.focus(); } } else d.click(); return; }
      case 'dash': st.dash = el.dataset.k; break;
      case 'exp-lamina': laminaEPW(); return;
      case 'exp-csv': csvEPW(); return;
      case 'exp-uno': { const x = GRAFS[el.dataset.k]; if (x) svgAPng(svgDe(x.g, x.t, 1600), 1600, Math.round(1600 * x.g.H / x.g.W), 'Clima_' + slugSitio() + '_' + x.k + '.png'); return; }
      case 'exp-todos': Object.values(GRAFS).forEach((x, i) => setTimeout(() => svgAPng(svgDe(x.g, x.t, 1600), 1600, Math.round(1600 * x.g.H / x.g.W), 'Clima_' + slugSitio() + '_' + x.k + '.png'), i * 350)); toast('Descargando ' + Object.keys(GRAFS).length + ' imágenes… Si el navegador pregunta, permití las descargas múltiples.'); return;
      case 'guardar-sitio': { if (!st.S.sitio.nombre.trim()) return toast('Poné un nombre al sitio antes de guardarlo.'); const j = M.sitioAJson(st.S, C(), st.PAR); if (D.sitios.some(s => s.sitio.id === j.sitio.id)) j.sitio.id += '_copia'; st.S.sitio.id = j.sitio.id; st.sitiosUsuario = st.sitiosUsuario.filter(s => s.sitio.id !== j.sitio.id).concat([j]); st.sitioSel = 'u:' + j.sitio.id; guardar(); toast('Sitio guardado en este navegador. Descargá el .json para compartirlo o subirlo a data/sitios/.'); break; }
      case 'borrar-sitio': st.sitiosUsuario = st.sitiosUsuario.filter(s => 'u:' + s.sitio.id !== st.sitioSel); guardar(); cargarSitio(sitios()[0].k); break;
      case 'bajar-sitio': { const j = M.sitioAJson(st.S, C(), st.PAR); bajar(j.sitio.id + '.json', JSON.stringify(j, null, 2)); return; }
      case 'reset-sens': st.S.pesos_base = st.PAR.dimensiones.map(d => d.peso_base); st.S.sens = Object.fromEntries(M.COD.map(c => [c, D.param.sensibilidad[c].valores.slice()])); break;
      case 'reset-par': st.PAR = clon(D.param); guardar(); break;
      case 'reset-aj': st.aj = {}; guardar(); break;
      case 'comp': st.comp = el.dataset.c; st.abierto = null; break;
      case 'comp-ir': st.comp = el.dataset.c; st.abierto = null; st.tab = 'eval'; window.scrollTo(0, 0); break;
      case 'abrir': st.abierto = st.abierto === el.dataset.id ? null : el.dataset.id; break;
      case 'quitar-manual': delete st.manual[el.dataset.id]; guardar(); break;
      case 'csv': csvEval(C()); return;
      case 'imprimir': window.print(); return;
      case 'ver-ficha': st.fichaVista = el.dataset.id; st.tab = 'fichas'; st.form = null; window.scrollTo(0, 0); break;
      case 'cerrar-ficha': st.fichaVista = null; break;
      case 'editar': abrirEdicion(el.dataset.id); st.tab = 'fichas'; st.form = null; window.scrollTo(0, 0); break;
      case 'ed-ver': st.edVer = el.dataset.k; break;
      case 'ed-guardar': cerrarEdicion(true); window.scrollTo(0, 0); break;
      case 'ed-cancelar': cerrarEdicion(false); break;
      case 'ed-restaurar': delete st.editadas[el.dataset.id]; guardar(); toast('Se restauró la ficha integrada.'); break;
      case 'ed-fuente': { const n = st.edNf, id = n.id.trim(); if (!/^[A-Za-z0-9_.\-]{1,24}$/.test(id) || n.cita.trim().length < 3) return toast('La fuente necesita un ID corto (letras, números, guion) y su cita.'); if (st.ed.fuentes.some(s => s.id === id)) return toast('Ya existe una fuente con ese ID.'); st.ed.fuentes.push({ id, cita: n.cita.trim(), tipo: n.tipo }); st.edNf = { id: '', cita: '', tipo: n.tipo }; break; }
      case 'bajar-ficha': { const f = clon(fichas().find(x => x.meta.id === el.dataset.id)); delete f._val; delete f._usuario; bajar(f.meta.id + '.json', JSON.stringify(f, null, 2)); return; }
      case 'borrar-ficha': st.fichasUsuario = st.fichasUsuario.filter(f => f.meta.id !== el.dataset.id); delete st.manual[el.dataset.id]; st.fichaVista = null; guardar(); break;
      case 'f-comp': st.filtro.comp = el.dataset.c; if (el.dataset.c) st.plComp = el.dataset.c; break;
      case 'bajar-pl': { const c = st.plComp, k = el.dataset.k;
        if (k === 'json') { const f = M.fichaNueva(c + '-XXX-01', c, '', DIC); delete f.meta.origen; f.fuentes[0].cita = 'Elaboración propia.'; bajar('Plantilla_Ficha_SUM_' + c + '.json', JSON.stringify(f, null, 2)); }
        else { const b = atob(D.plantillas_b64[c][k]), u8 = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u8[i] = b.charCodeAt(i); bajar('Plantilla_' + (k === 'rapida' ? 'Rapida' : 'Ficha') + '_SUM_' + c + '.xlsx', u8, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); }
        toast('Plantilla descargada. Llenala y subila con el botón de la misma columna.'); return; }
      case 'nuevo-form': st.form = { comp: st.plComp || st.comp, id: '', autor: '', cita: '', url: '', tipo: 'ficha_tecnica', evid: 'E2', campos: {} }; window.scrollTo(0, 0); break;
      case 'cerrar-form': st.form = null; break;
      case 'guardar-form': guardarForm(); window.scrollTo(0, 0); break;
      default: return;
    }
    render();
  });
  const leer = (f, modo) => new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => mal(new Error('No se pudo leer ' + f.name)); modo === 'buf' ? r.readAsArrayBuffer(f) : r.readAsText(f); });
  function aplicarEPW(e, nombre, nuevo) {
    if (nuevo) { st.S = M.estadoVacio(st.PAR); st.sitioSel = ''; st.S.sitio.nombre = [e.loc.ciudad, e.loc.region].filter(t => t && t !== '-').join(', ') || nombre.replace(/\.epw$/i, ''); st.S.sitio.ubicacion = [e.loc.region, e.loc.pais].filter(t => t && t !== '-').join(', '); st.S.sitio.fecha = new Date().toISOString().slice(0, 10); st.S.origen = nombre; }
    const S = st.S; if (nuevo || S.sitio.lat === null) { S.sitio.lat = e.loc.lat; S.sitio.lon = e.loc.lon; }
    if (nuevo || S.micro.altitud_sitio_msnm === null) S.micro.altitud_sitio_msnm = e.loc.elev;
    S.micro.ajustar_altitud = false;
    const fu = `EPW «${nombre}» (${e.loc.fuente || 'fuente no declarada'}; ${e.horas} h${e.anios.length === 1 ? ', año ' + e.anios[0] : ', año típico de ' + e.anios.length + ' años'})`;
    M.VARS.forEach(([k]) => { if (M.isNum(e.anual[k])) S.vars[k] = { entrada: e.anual[k], fuente: fu, certeza: '', deEPW: true }; });
    st.deshacer = null;
    S.epw = { rosa: e.rosa, archivo: nombre, loc: e.loc, anual: e.anual, mensual: e.mensual, avisos: e.avisos, criterios: e.criterios, horas: e.horas, dias: e.dias };
    if (!nuevo && st.sitioSel[0] !== 'u') st.sitioSel = '';
    st.tab = 'sitio'; render();
    toast('EPW leído: ' + e.horas + ' registros. Completá subregión, zona sísmica, zona de viento y distancia a la costa: no vienen en el archivo.');
  }
  async function alElegir(id, files) {
    try {
      if (id === 'f-epw' || id === 'f-epw2') { const f = files[0]; aplicarEPW(M.parseEPW(await leer(f), st.PAR), f.name, id === 'f-epw'); }
      else if (id === 'f-matriz') { const f = files[0]; st.S = M.sitioDesdeMatriz(await M.leerXlsx(await leer(f, 'buf')), st.PAR, f.name); st.sitioSel = ''; st.manualAutor = false; st.tab = 'sitio'; render(); toast('Matriz importada: ' + (st.S.sitio.nombre || f.name) + '. Se leyeron solo las celdas de entrada; la app recalcula el resto.'); }
      else if (id === 'f-sitio') { const j = JSON.parse(await leer(files[0])); if (!j.sitio || !j.clima) throw new Error('El archivo no tiene la estructura sum.sitio/1.0 (faltan «sitio» o «clima»).'); st.S = M.sitioDesdeJson(j, st.PAR); st.sitioSel = ''; st.tab = 'sitio'; render(); toast('Sitio importado: ' + (j.sitio.nombre || '')); }
      else { let ok = 0; const err = [];
        for (const f of files) { try { const x = id === 'f-ficha' ? JSON.parse(await leer(f)) : M.fichaDesdePlantilla(await M.leerXlsx(await leer(f, 'buf')), DIC); const lista = Array.isArray(x) ? x : [x];
          lista.forEach(fi => { const e = M.validarFicha(fi, DIC, LISTAS); if (e.length) throw new Error(e.join(' ')); if (/-XXX-/.test(fi.meta.id)) throw new Error('cambiá el ID de la plantilla (' + fi.meta.id + ') por el de tu sistema antes de subirla; en Excel está en la celda G2.'); if (D.fichas.some(b => b.meta.id === fi.meta.id)) throw new Error('el ID ' + fi.meta.id + ' ya existe en el catálogo del curso.'); delete fi._val; fi._usuario = true; st.fichasUsuario = st.fichasUsuario.filter(u => u.meta.id !== fi.meta.id).concat([fi]); st.comp = fi.meta.componente; ok++; }); } catch (e) { err.push(f.name + ': ' + e.message); } }
        guardar(); st.tab = 'fichas'; st.fichaVista = null; st.filtro.comp = ok ? st.comp : st.filtro.comp; render(); toast((ok ? ok + ' ficha(s) agregada(s). ' : '') + (err.length ? 'No se pudo: ' + err.join(' · ') : '')); }
    } catch (e) { toast('No se pudo cargar: ' + e.message); }
  }
  ['f-epw', 'f-epw2', 'f-matriz', 'f-sitio', 'f-ficha', 'f-plantilla'].forEach(id => { const el = document.getElementById(id); el.addEventListener('change', () => { const fs = [...el.files]; el.value = ''; if (fs.length) alElegir(id, fs); }); });

  recuperar();
  cargarSitio(sitios()[0].k);
  render();
})();
