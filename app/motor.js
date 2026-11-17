/* SUM · Selección y Uso de Materiales — motor de cálculo (sin dependencias).
   Funciona en el navegador (window.SUM) y en Node (require). Misma lógica que la
   Matriz de Clima de Sitio v1.0 (hojas PERFIL, PESOS y SELECCION) y que scripts/sitio_a_json.py. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SUM = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const COD = ['E_CAL', 'E_FRIO', 'E_LLUV', 'E_PERS', 'E_SECA', 'E_AMPL', 'E_SAL', 'E_SIS', 'E_VIE'];
  const VARS = [
    ['precipitacion_anual', 'Precipitación anual', 'mm'], ['t_max_media', 'Temperatura máxima media', '°C'],
    ['t_min_media', 'Temperatura mínima media', '°C'], ['t_media', 'Temperatura media', '°C'],
    ['dias_con_lluvia', 'Días con lluvia al año', 'días'], ['meses_secos', 'Meses secos', 'meses'],
    ['zona_sismica_cscr', 'Zona sísmica CSCR-2010', 'II/III/IV'], ['hr_media_anual', 'Humedad relativa media anual', '%'],
    ['radiacion_global', 'Radiación global diaria', 'kWh/m²·día']];
  const NUMERICOS = ['numero', 'entero'];
  const SIN_EVIDENCIA = ['id', 'component', 'country', 'record_type', 'subcategory', 'keywords'];
  const isNum = v => typeof v === 'number' && isFinite(v);
  const r1 = v => Math.round(v * 10) / 10;
  const media = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;

  /* ---------- 1. EPW ---------- */
  function parseEPW(txt, opt) {
    opt = opt || {};
    const umbDia = isNum(opt.dia_lluvia_mm) ? opt.dia_lluvia_mm : 1.0, umbMes = isNum(opt.mes_seco_mm) ? opt.mes_seco_mm : 75;
    const L = txt.split(/\r?\n/), avisos = [];
    const h = (L[0] || '').split(',');
    if ((h[0] || '').trim().toUpperCase() !== 'LOCATION') throw new Error('No parece un archivo EPW: la primera línea debe empezar con LOCATION.');
    const loc = { ciudad: (h[1] || '').trim(), region: (h[2] || '').trim(), pais: (h[3] || '').trim(), fuente: (h[4] || '').trim(), lat: +h[6], lon: +h[7], tz: +h[8], elev: +h[9] };
    const comentarios = L.filter(l => /^COMMENTS/i.test(l)).map(l => l.replace(/^COMMENTS\s*\d\s*,?/i, '').trim()).filter(Boolean);
    const dias = new Map(); let n = 0; const anios = new Set();
    const hr = [], vv = [], sect = new Array(8).fill(0), rosa = Array.from({ length: 16 }, () => [0, 0, 0, 0, 0]); let calma = 0, nVie = 0;
    for (const l of L) {
      const c = l.split(',');
      if (c.length < 22 || !/^\s*\d{4}\s*$/.test(c[0])) continue;
      n++; anios.add(c[0].trim());
      const m = +c[1], d = +c[2], k = m * 100 + d;
      let D = dias.get(k);
      if (!D) { D = { m, tmax: -1e9, tmin: 1e9, ts: 0, nt: 0, prec: 0, np: 0, ghi: 0, ng: 0, hr: 0, nh: 0, vv: 0, nv: 0 }; dias.set(k, D); }
      const t = +c[6]; if (isNum(t) && t < 99) { D.tmax = Math.max(D.tmax, t); D.tmin = Math.min(D.tmin, t); D.ts += t; D.nt++; }
      const H = +c[8]; if (isNum(H) && H <= 110) { D.hr += H; D.nh++; hr.push(H); }
      const g = +c[13]; if (isNum(g) && g >= 0 && g < 9999) { D.ghi += g; D.ng++; }
      const w = +c[21]; if (isNum(w) && w < 999) { D.vv += w; D.nv++; vv.push(w); const wd = +c[20]; if (isNum(wd) && wd <= 360) { nVie++; if (w > 0.5) { sect[Math.round(wd / 45) % 8]++; rosa[Math.round(wd / 22.5) % 16][w < 2 ? 0 : w < 4 ? 1 : w < 6 ? 2 : w < 8 ? 3 : 4]++; } else calma++; } }
      const p = c.length > 33 ? +c[33] : NaN; if (c.length > 33 && c[33].trim() !== '' && isNum(p) && p >= 0 && p < 999) { D.prec += p; D.np++; }
    }
    if (!n) throw new Error('El archivo no contiene registros horarios legibles.');
    const pasos = Math.max(1, Math.round(n / (dias.size * 24)));
    if (dias.size < 365) avisos.push(`El archivo trae ${dias.size} días (${n} registros): no es un año completo; los valores anuales son parciales.`);
    if (pasos > 1) avisos.push(`Archivo subhorario (${pasos} registros por hora): la radiación se promedia por hora.`);
    const DD = [...dias.values()].filter(D => D.nt > 0);
    if (!DD.length) throw new Error('El archivo no trae temperatura de bulbo seco utilizable.');
    const npTot = DD.reduce((s, D) => s + D.np, 0), precTot = DD.reduce((s, D) => s + D.prec, 0);
    const hayPrec = npTot > 0 && precTot > 0;
    if (!hayPrec) avisos.push('El EPW no trae precipitación utilizable (campo «Liquid Precipitation Depth» vacío, 999 o 0 todo el año). La lluvia anual, los días con lluvia y los meses secos deben venir de una estación o de la subregión.');
    const mensual = [];
    for (let m = 1; m <= 12; m++) {
      const d = DD.filter(D => D.m === m);
      if (!d.length) { mensual.push(null); continue; }
      const nh = d.reduce((s, D) => s + D.nh, 0), nv = d.reduce((s, D) => s + D.nv, 0), ng = d.reduce((s, D) => s + D.ng, 0);
      mensual.push({
        tmax: r1(media(d.map(D => D.tmax))), tmin: r1(media(d.map(D => D.tmin))), tmed: r1(d.reduce((s, D) => s + D.ts, 0) / d.reduce((s, D) => s + D.nt, 0)),
        prec: hayPrec ? r1(d.reduce((s, D) => s + D.prec, 0)) : null, dias: hayPrec ? d.filter(D => D.prec >= umbDia).length : null,
        hr: nh ? r1(d.reduce((s, D) => s + D.hr, 0) / nh) : null, ghi: ng ? Math.round(d.reduce((s, D) => s + D.ghi, 0) / pasos / d.length / 10) / 100 : null,
        viento: nv ? r1(d.reduce((s, D) => s + D.vv, 0) / nv) : null
      });
    }
    const ok = mensual.filter(Boolean);
    const ngT = DD.reduce((s, D) => s + D.ng, 0);
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const anual = {
      t_max_media: r1(media(DD.map(D => D.tmax))), t_min_media: r1(media(DD.map(D => D.tmin))),
      t_media: r1(DD.reduce((s, D) => s + D.ts, 0) / DD.reduce((s, D) => s + D.nt, 0)),
      precipitacion_anual: hayPrec ? r1(precTot) : null, dias_con_lluvia: hayPrec ? DD.filter(D => D.prec >= umbDia).length : null,
      meses_secos: hayPrec ? ok.filter(x => x.prec < umbMes).length : null,
      hr_media_anual: hr.length ? r1(media(hr)) : null,
      radiacion_global: ngT ? Math.round(DD.reduce((s, D) => s + D.ghi, 0) / pasos / DD.length / 10) / 100 : null,
      viento_medio: vv.length ? r1(media(vv)) : null, viento_dir: vv.length && Math.max(...sect) > 0 ? dirs[sect.indexOf(Math.max(...sect))] : null,
      t_abs_max: Math.max(...DD.map(D => D.tmax)), t_abs_min: Math.min(...DD.map(D => D.tmin))
    };
    if (hayPrec && npTot < n * 0.9) avisos.push(`Solo ${Math.round(100 * npTot / n)} % de las horas trae dato de precipitación: la lluvia anual puede estar subestimada.`);
    return { rosa: nVie ? { sectores: rosa, calma, total: nVie, clases: ['0,5–2', '2–4', '4–6', '6–8', '> 8'] } : null, loc, comentarios, horas: n, dias: dias.size, anios: [...anios], mensual, anual, avisos, criterios: { dia_lluvia_mm: umbDia, mes_seco_mm: umbMes } };
  }

  /* ---------- 2. Perfil de exigencias y pesos ---------- */
  function nivelUmbral(PAR, cod, x) {
    if (!isNum(x)) return 0;
    const u = PAR.umbrales[cod];
    if (u.sentido === '≥') return x >= u.n3 ? 3 : x >= u.n2 ? 2 : x >= u.n1 ? 1 : 0;
    return x <= u.n3 ? 3 : x <= u.n2 ? 2 : x <= u.n1 ? 1 : 0;
  }
  function estadoVacio(PAR) {
    const vars = {}; VARS.forEach(v => vars[v[0]] = { entrada: null, fuente: '', certeza: '' });
    return {
      sitio: { id: '', nombre: '', ubicacion: '', lat: null, lon: null, id_zona: '', elaborado_por: '', fecha: '' }, vars,
      micro: { altitud_sitio_msnm: null, altitud_estacion_msnm: null, ajustar_altitud: false, distancia_costa_km: null, zona_viento_cfia: '', exposicion_viento: 'Normal', sombra_envolvente: 'Media', orientacion_fachada: '', nivel_sis_manual: null, nivel_vie_manual: null },
      pesos_base: PAR.dimensiones.map(d => d.peso_base), sens: Object.fromEntries(COD.map(c => [c, PAR.sensibilidad[c].valores.slice()])), epw: null, seleccion_manual: null, origen: ''
    };
  }
  function calcularSitio(S, PAR, ZONAS) {
    const zona = ZONAS.find(z => z.id === S.sitio.id_zona) || null, mi = S.micro;
    const corr = mi.ajustar_altitud && isNum(mi.altitud_sitio_msnm) && isNum(mi.altitud_estacion_msnm) ? (mi.altitud_estacion_msnm - mi.altitud_sitio_msnm) * PAR.gradiente_termico_C_por_km / 1000 : null;
    const usado = {};
    VARS.forEach(([k]) => {
      const e = S.vars[k].entrada, sub = zona ? zona[k] : null;
      if (k === 'zona_sismica_cscr') {
        const ok = ['II', 'III', 'IV'].includes(e);
        usado[k] = { valor: ok ? e : (sub || null), origen: ok ? 'Estación o sitio' : sub ? 'Subregión' : 'Sin dato', ajustado: false, sub: sub || null };
      } else {
        const aj = isNum(e) && corr !== null && k.startsWith('t_');
        usado[k] = { valor: aj ? r1(e + corr) : isNum(e) ? e : isNum(sub) ? sub : null, origen: aj ? 'Estación ajustada por altitud' : isNum(e) ? (S.vars[k].deEPW ? 'Archivo EPW' : 'Estación o sitio') : isNum(sub) ? 'Subregión' : 'Sin dato', ajustado: aj, sub: isNum(sub) ? sub : null };
      }
    });
    const g = k => usado[k].valor, tmax = g('t_max_media'), tmin = g('t_min_media');
    const ampl = isNum(tmax) && isNum(tmin) ? r1(tmax - tmin) : null;
    let sal, dsal; const s = PAR.salinidad_km, dist = mi.distancia_costa_km;
    if (isNum(dist)) { sal = dist <= s.n3 ? 3 : dist <= s.n2 ? 2 : dist <= s.n1 ? 1 : 0; dsal = String(dist).replace('.', ',') + ' km'; }
    else { sal = zona && zona.costera === 'S' ? 3 : 0; dsal = zona ? 'Costera: ' + zona.costera : 'sin dato'; }
    const zs = g('zona_sismica_cscr'), zv = mi.zona_viento_cfia;
    const sis = zs ? (PAR.sismica_cscr[zs] || 0) : (isNum(mi.nivel_sis_manual) ? mi.nivel_sis_manual : 0);
    const vie = zv ? (PAR.viento_cfia[zv] || 0) : (isNum(mi.nivel_vie_manual) ? mi.nivel_vie_manual : 0);
    const base = { E_CAL: nivelUmbral(PAR, 'E_CAL', tmax), E_FRIO: nivelUmbral(PAR, 'E_FRIO', tmin), E_LLUV: nivelUmbral(PAR, 'E_LLUV', g('precipitacion_anual')), E_PERS: nivelUmbral(PAR, 'E_PERS', g('dias_con_lluvia')), E_SECA: nivelUmbral(PAR, 'E_SECA', g('meses_secos')), E_AMPL: nivelUmbral(PAR, 'E_AMPL', ampl), E_SAL: sal, E_SIS: sis, E_VIE: vie };
    const dato = { E_CAL: tmax, E_FRIO: tmin, E_LLUV: g('precipitacion_anual'), E_PERS: g('dias_con_lluvia'), E_SECA: g('meses_secos'), E_AMPL: ampl, E_SAL: dsal, E_SIS: zs || (isNum(mi.nivel_sis_manual) ? 'nivel manual' : '(sin zona)'), E_VIE: zv ? 'Zona ' + zv : (isNum(mi.nivel_vie_manual) ? 'nivel manual' : '(sin zona)') };
    const aj = Object.fromEntries(COD.map(c => [c, 0]));
    if (mi.sombra_envolvente === 'Alta') aj.E_CAL = PAR.ajuste_sombra_alta; else if (mi.sombra_envolvente === 'Baja') aj.E_CAL = PAR.ajuste_sombra_baja;
    if (mi.exposicion_viento === 'Protegido') aj.E_VIE = PAR.ajuste_viento_protegido; else if (mi.exposicion_viento === 'Expuesto') aj.E_VIE = PAR.ajuste_viento_expuesto;
    const exig = {}, niveles = {};
    PAR.exigencias.forEach(e => { const c = e.codigo, nv = Math.max(0, Math.min(3, base[c] + aj[c])); niveles[c] = nv; exig[c] = { nombre: e.nombre, define: e.dato, exige: e.exige, dato: dato[c], nivel_clima: base[c], ajuste: aj[c], nivel: nv }; });
    const dims = PAR.dimensiones, pb = S.pesos_base, sens = S.sens;
    const fac = dims.map((d, j) => { const ss = COD.reduce((a, c) => a + sens[c][j], 0); return ss === 0 ? 1 : 1 + COD.reduce((a, c) => a + sens[c][j] * niveles[c], 0) / (3 * ss); });
    const den = pb.reduce((a, b, j) => a + b * fac[j], 0), sb = pb.reduce((a, b) => a + b, 0);
    const w = pb.map((b, j) => b * fac[j] / den);
    const pesos = dims.map((d, j) => ({ id: d.id, nombre: d.nombre, cod: d.cod, base: pb[j], factor: fac[j], peso: w[j], sin_clima: pb[j] / sb, cambio: (w[j] - pb[j] / sb) * 100, prioridad: 1 + w.filter(x => x > w[j] + 1e-12).length }));
    const mx = Math.max(...COD.map(c => niveles[c]));
    const faltan = ['precipitacion_anual', 't_max_media', 't_min_media', 'dias_con_lluvia', 'meses_secos'].filter(k => !isNum(g(k))).length + (zs || isNum(mi.nivel_sis_manual) ? 0 : 1) + (zv || isNum(mi.nivel_vie_manual) ? 0 : 1);
    return { zona, corr, usado, exigencias: exig, niveles, total: COD.reduce((a, c) => a + niveles[c], 0), dominantes: mx ? COD.filter(c => niveles[c] === mx) : [], faltan, pesos };
  }
  function sitioDesdeJson(j, PAR) {
    const S = estadoVacio(PAR);
    Object.assign(S.sitio, j.sitio || {});
    VARS.forEach(([k]) => { const c = (j.clima || {})[k]; if (!c) return; const deSitio = c.origen && c.origen !== 'Subregión' && c.origen !== 'Sin dato'; S.vars[k] = { entrada: deSitio ? c.valor : null, fuente: c.fuente || '', certeza: c.certeza || '', deEPW: c.origen === 'Archivo EPW' }; });
    const m = j.microclima || {};
    ['altitud_sitio_msnm', 'altitud_estacion_msnm', 'distancia_costa_km', 'zona_viento_cfia', 'exposicion_viento', 'sombra_envolvente', 'orientacion_fachada', 'nivel_sis_manual', 'nivel_vie_manual'].forEach(k => { if (m[k] !== undefined && m[k] !== null) S.micro[k] = m[k]; });
    S.micro.ajustar_altitud = false; /* los JSON de sitio ya traen la temperatura corregida */
    if (j.pesos_base_del_autor) S.pesos_base = j.pesos_base_del_autor.slice();
    if (j.sensibilidad_del_autor) S.sens = JSON.parse(JSON.stringify(j.sensibilidad_del_autor));
    if (j.seleccion_manual) S.seleccion_manual = j.seleccion_manual;
    if (j.epw_resumen) S.epw = j.epw_resumen;
    S.origen = j.origen_archivo || '';
    return S;
  }
  function sitioAJson(S, C, PAR) {
    const clima = {};
    VARS.forEach(([k, , u]) => { const x = C.usado[k]; clima[k] = { valor: x.valor, unidad: u, origen: x.origen, ajustado_por_altitud: x.ajustado, valor_subregion: x.sub, fuente: S.vars[k].fuente || null, certeza: S.vars[k].certeza || null }; });
    const ex = {}; COD.forEach(c => { const e = C.exigencias[c]; ex[c] = { nombre: e.nombre, dato: e.dato, nivel_clima: e.nivel_clima, ajuste_microclima: e.ajuste, nivel: e.nivel }; });
    const pd = {}; C.pesos.forEach(p => pd[p.id] = { nombre: p.nombre, peso_base: p.base, factor_climatico: +p.factor.toFixed(4), peso: +p.peso.toFixed(4), prioridad: p.prioridad });
    const slug = s => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const o = { schema: 'sum.sitio/1.0', sitio: Object.assign({}, S.sitio, { id: S.sitio.id || slug((S.sitio.id_zona || 'sitio') + '_' + (S.sitio.nombre || 'sin_nombre')), subregion: C.zona ? C.zona.subregion : null, region: C.zona ? C.zona.region : null }), clima, microclima: Object.assign({}, S.micro), exigencias: ex, exigencia_total: C.total, exigencias_dominantes: C.dominantes, datos_pendientes: C.faltan, pesos_dimension: pd };
    delete o.microclima.ajustar_altitud;
    const pb0 = PAR.dimensiones.map(d => d.peso_base); if (S.pesos_base.some((b, i) => b !== pb0[i])) o.pesos_base_del_autor = S.pesos_base;
    if (COD.some(c => S.sens[c].some((v, j) => v !== PAR.sensibilidad[c].valores[j]))) o.sensibilidad_del_autor = S.sens;
    if (S.seleccion_manual) o.seleccion_manual = S.seleccion_manual;
    if (S.epw) o.epw_resumen = S.epw;
    o.regla_puntaje = 'puntaje_sitio = sum(puntaje_dimension_0a3 * peso) / 3'; o.origen_archivo = S.origen || 'App SUM';
    return o;
  }

  /* ---------- 3. Fichas: lectura de valores ---------- */
  function valorNum(c) {
    if (!c || c.estado !== 'dato') return null;
    if (isNum(c.valor)) return c.valor;
    if (isNum(c.min) && isNum(c.max)) return (c.min + c.max) / 2;
    return null;
  }
  function fmtNum(v) { return isNum(v) ? String(Math.round(v * 1000) / 1000).replace('.', ',') : String(v); }
  function valorTexto(c) {
    if (!c) return '—';
    if (c.estado !== 'dato') return { no_disponible: 'no disponible', no_aplica: 'no aplica', pendiente: 'pendiente' }[c.estado] || '—';
    let t;
    if (isNum(c.min) && isNum(c.max) && (c.valor === undefined || c.valor === null)) t = fmtNum(c.min) + '–' + fmtNum(c.max);
    else if (Array.isArray(c.valor)) t = c.valor.join(' · ');
    else if (c.valor !== undefined && c.valor !== null) t = (c.calificador && c.calificador !== '=' && c.calificador !== 'rango' ? c.calificador + ' ' : '') + fmtNum(c.valor);
    else if (c.valor_texto_original) t = c.valor_texto_original + ' (texto sin convertir)';
    else t = '—';
    return t + (c.unidad && !/^(1–5|adimensional|0–1)$/.test(c.unidad) ? ' ' + c.unidad : '');
  }
  function tieneDato(c) { return !!c && c.estado === 'dato' && (c.valor !== undefined && c.valor !== null && c.valor !== '' || isNum(c.min) || !!c.valor_texto_original); }
  function aplica(d, comp) { return d.componentes === 'TODOS' || d.componentes.split('|').includes(comp); }
  function trazabilidad(f, DIC) {
    let n = 0, ok = 0, numSinCert = 0, sinFuente = 0, textoOrig = 0, pend = 0;
    for (const k in f.campos) {
      const c = f.campos[k], d = DIC[k]; if (!d) continue;
      if (c.valor_texto_original) textoOrig++;
      if (c.estado === 'pendiente') pend++;
      if (c.estado !== 'dato' || SIN_EVIDENCIA.includes(k)) continue;
      n++; const sf = !(c.fuentes && c.fuentes.length), num = NUMERICOS.includes(d.tipo);
      if (sf) sinFuente++; if (num && !c.certeza) numSinCert++;
      if (!sf && c.evidencia && (!num || c.certeza)) ok++;
    }
    return { datos: n, it: n ? Math.round(1000 * ok / n) / 10 : 0, sin_fuente: sinFuente, num_sin_certeza: numSinCert, texto_sin_convertir: textoOrig, pendientes: pend };
  }

  /* Mismas reglas que scripts/validar.py (sin la comprobación de schema E01) */
  function diagnostico(f, DIC) {
    const out = [], comp = f.meta.componente, ids = new Set((f.fuentes || []).map(s => s.id));
    const P = (clave, cod, nivel, msg) => out.push({ clave, cod, nivel, msg });
    Object.keys(DIC).forEach(k => {
      const d = DIC[k]; if (!aplica(d, comp)) return; const c = f.campos[k];
      if (!c || c.estado === 'pendiente') { if (d.obligatorio === 'Sí') P(k, 'E05', 'error', 'Obligatorio sin completar'); else P(k, 'A04', 'aviso', 'Opcional sin completar'); return; }
      if (c.valor_texto_original) P(k, 'E04', 'error', 'Texto sin convertir a número, rango o valor de lista');
      (c.fuentes || []).forEach(r => { if (!ids.has(r.ref)) P(k, 'E06', 'error', 'Cita la fuente «' + r.ref + '», que no está en la bibliografía'); });
      if (c.estado !== 'dato' || SIN_EVIDENCIA.includes(k)) return;
      const num = NUMERICOS.includes(d.tipo);
      if (!c.evidencia) P(k, 'E07', 'error', 'Dato sin nivel de evidencia E1–E5');
      if (c.evidencia === 'E1' && c.certeza === 'verificado') P(k, 'E08', 'error', 'E1 (criterio propio) no puede declararse verificado');
      if (num && (c.valor !== undefined || c.min !== undefined) && !c.unidad && d.unidad) P(k, 'E09', 'error', 'Número sin unidad');
      if (isNum(c.min) && isNum(c.max) && c.min > c.max) P(k, 'E10', 'error', 'Rango invertido');
      if (!(c.fuentes && c.fuentes.length)) P(k, 'A01', 'aviso', 'Dato sin fuente');
      if (num && !c.certeza && !c.valor_texto_original) P(k, 'A02', 'aviso', 'Número sin certeza declarada');
      if (d.tipo === 'escala' && !c.justificacion) P(k, 'A03', 'aviso', 'Escala 1–5 sin justificación');
    });
    return out;
  }

  /* ---------- 4. Evaluación clima × material ---------- */
  function cumple(cond, niv) {
    const m = /^(E_[A-Z]+)\s*(>=|<=|==|>|<)\s*(\d)$/.exec(cond || ''); if (!m) return true;
    const a = niv[m[1]] || 0, b = +m[3];
    return m[2] === '>=' ? a >= b : m[2] === '<=' ? a <= b : m[2] === '>' ? a > b : m[2] === '<' ? a < b : a === b;
  }
  /* aj = ajustes del usuario por indicador: {clave: {activo: bool, sentido: 'mayor'|'menor'}} */
  function indicadores(CFG, DIC, comp, niv, aj) {
    aj = aj || {};
    return CFG.indicadores.filter(i => DIC[i.clave] && aplica(DIC[i.clave], comp) && (!i.componentes || i.componentes.includes(comp))).map(i => {
      const d = DIC[i.clave], u = aj[i.clave] || {};
      let sentido = i.sentido, activo = i.activo, motivo = i.activo ? '' : 'Inactivo por defecto';
      if (i.si && !cumple(i.si, niv)) {
        if (i.sentido_alterno && cumple(i.sentido_alterno.si, niv)) sentido = i.sentido_alterno.sentido;
        else { activo = false; motivo = 'No puntúa en este clima (requiere ' + i.si + ')'; }
      }
      if (u.activo !== undefined) { activo = u.activo; motivo = u.activo ? '' : 'Desactivado por el usuario'; }
      if (u.sentido) sentido = u.sentido;
      return { clave: i.clave, dim: i.dim, sentido, activo, motivo, tipo: d.tipo, etiqueta: d.campo, unidad: d.unidad, nota: i.nota || '', grupo: i.grupo || '', mapa: i.mapa || null, si: i.si || '', ajustado: u.activo !== undefined || !!u.sentido };
    });
  }
  /* op = { norm: 'proporcional'|'minmax', manual: {idFicha: {dim: 0..3}}, aj } */
  function evaluar(fichas, comp, C, PAR, CFG, DIC, op) {
    op = op || {};
    const fs = fichas.filter(f => f.meta.componente === comp), inds = indicadores(CFG, DIC, comp, C.niveles, op.aj), act = inds.filter(i => i.activo);
    const det = {}; fs.forEach(f => det[f.meta.id] = {});
    const analog = c => !!c && c.certeza === 'estimado_analogia' && (c.fuentes || []).some(r => /^INT-/.test(r.ref));
    act.forEach(i => {
      const relativo = i.tipo !== 'escala' && !i.mapa;
      let uni = null, vals = [];
      if (relativo) {
        const cu = {}; fs.forEach(f => { const c = f.campos[i.clave], v = analog(c) ? null : valorNum(c); if (v !== null) { const u = c.unidad || ''; cu[u] = (cu[u] || 0) + 1; } });
        uni = Object.keys(cu).sort((a, b) => cu[b] - cu[a])[0];
        vals = fs.map(f => { const c = f.campos[i.clave], v = analog(c) ? null : valorNum(c); return v !== null && (c.unidad || '') === uni ? v : null; }).filter(v => v !== null);
      }
      const mn = Math.min(...vals), mx = Math.max(...vals);
      fs.forEach(f => {
        const c = f.campos[i.clave], o = { s: null, motivo: '', texto: valorTexto(c), campo: c || null };
        if (analog(c)) o.motivo = 'Complemento por analogía: se muestra, no puntúa';
        else if (!tieneDato(c)) o.motivo = c ? ({ no_disponible: 'No disponible', no_aplica: 'No aplica', pendiente: 'Pendiente' }[c.estado] || 'Sin dato') : 'Campo ausente';
        else if (i.mapa) { const v = Array.isArray(c.valor) ? c.valor[0] : c.valor; if (i.mapa[v] !== undefined) o.s = i.sentido === 'menor' ? 3 - i.mapa[v] : i.mapa[v]; else o.motivo = c.valor_texto_original ? 'Texto sin convertir (E04)' : 'Valor fuera de lista'; }
        else if (i.tipo === 'escala') { const v = valorNum(c); if (v !== null && v >= 1 && v <= 5) { o.s = (v - 1) / 4 * 3; if (i.sentido === 'menor') o.s = 3 - o.s; } else o.motivo = 'Escala no numérica'; }
        else {
          const v = valorNum(c);
          if (v === null) o.motivo = c.valor_texto_original ? 'Texto sin convertir (E04)' : 'Clase o texto: no se puntúa solo';
          else if ((c.unidad || '') !== uni) o.motivo = 'Unidad distinta (' + (c.unidad || 'sin unidad') + ' frente a ' + uni + ')';
          else if (vals.length < 2) o.motivo = 'Único dato del conjunto: sin comparación';
          else if (op.norm === 'minmax' || mn <= 0) o.s = mx === mn ? 1.5 : (i.sentido === 'menor' ? (mx - v) / (mx - mn) : (v - mn) / (mx - mn)) * 3;
          else o.s = (i.sentido === 'menor' ? mn / v : v / mx) * 3;
        }
        det[f.meta.id][i.clave] = o;
      });
    });
    const umb = PAR.umbral_alerta_critica, man = op.manual || {};
    const filas = fs.map(f => {
      const id = f.meta.id, dims = {};
      C.pesos.forEach(p => {
        const li = act.filter(i => i.dim === p.id), sc = li.map(i => det[id][i.clave].s).filter(s => s !== null);
        const gr = {}; li.forEach(i => { const s = det[id][i.clave].s; if (s !== null) (gr[i.grupo || i.clave] = gr[i.grupo || i.clave] || []).push(s); });
        const auto = sc.length ? media(Object.values(gr).map(media)) : null, m = man[id] && isNum(man[id][p.id]) ? man[id][p.id] : null;
        dims[p.id] = { auto, manual: m, s: m !== null ? m : auto, n: sc.length, de: li.length };
      });
      const con = C.pesos.filter(p => dims[p.id].s !== null);
      const gen = con.length ? media(con.map(p => dims[p.id].s)) / 3 : null;
      const sw = con.reduce((a, p) => a + p.peso, 0);
      const sit = con.length ? Math.min(1, con.reduce((a, p) => a + p.peso * dims[p.id].s, 0) / sw / 3) : null;
      const nInd = act.length, nSc = act.filter(i => det[id][i.clave].s !== null).length;
      return { id, ficha: f, nombre: String((f.campos.name || {}).valor || id), dims, gen, sit, completo: con.length === C.pesos.length, dimsCon: con.length, cobertura: nInd ? nSc / nInd : 0, criticas: C.pesos.filter(p => p.peso >= umb && dims[p.id].s === 0).map(p => p.nombre), alertas: alertasClima(f, comp, C, CFG), det: det[id] };
    });
    filas.forEach(a => { a.bloq = a.criticas.length > 0 || a.alertas.some(x => x.severidad === 'critica'); a.conf = a.cobertura >= 0.7 ? 'alta' : a.cobertura >= 0.4 ? 'media' : 'baja'; });
    const minD = isNum(PAR.min_dimensiones) ? PAR.min_dimensiones : 3; filas.forEach(a => { a.suf = a.dimsCon >= minD; });
    const rank = (k) => filas.forEach(a => { a['r_' + k] = a[k] === null || !a.suf ? null : 1 + filas.filter(b => b.suf && b[k] !== null && b[k] > a[k] + 1e-9).length; });
    rank('gen'); rank('sit');
    filas.forEach(a => { a.mov = a.r_gen !== null && a.r_sit !== null ? a.r_gen - a.r_sit : 0; });
    filas.sort((a, b) => (a.r_sit === null) - (b.r_sit === null) || a.r_sit - b.r_sit || a.id.localeCompare(b.id));
    return { comp, filas, inds, sens: sensibilidad(filas, C) };
  }
  function puntajeCon(fila, pesos) {
    const con = pesos.filter(p => fila.dims[p.id].s !== null); if (!con.length) return null;
    const sw = con.reduce((a, p) => a + p.w, 0); if (!sw) return null;
    return con.reduce((a, p) => a + p.w * fila.dims[p.id].s, 0) / sw / 3;
  }
  function sensibilidad(filas, C) {
    const val = filas.filter(f => f.r_sit !== null); if (val.length < 2) return null;
    const esc = [{ nombre: 'Clima del sitio (pesos calculados)', pesos: C.pesos.map(p => ({ id: p.id, w: p.peso })) }, { nombre: 'Sin clima (solo pesos base)', pesos: C.pesos.map(p => ({ id: p.id, w: p.sin_clima })) }];
    C.pesos.forEach(p => esc.push({ nombre: 'Doble peso a ' + p.nombre, dim: p.id, pesos: C.pesos.map(q => ({ id: q.id, w: q.peso * (q.id === p.id ? 2 : 1) })) }));
    C.pesos.forEach(p => esc.push({ nombre: 'Sin ' + p.nombre, dim: p.id, quita: true, pesos: C.pesos.map(q => ({ id: q.id, w: q.id === p.id ? 0 : q.peso })) }));
    const out = [];
    esc.forEach(e => {
      const o = val.map(f => ({ id: f.id, nombre: f.nombre, p: puntajeCon(f, e.pesos) })).filter(x => x.p !== null).sort((a, b) => b.p - a.p);
      if (o.length < 2) return;
      e.ganador = o[0]; e.segundo = o[1]; e.margen = (o[0].p - o[1].p) * 100; out.push(e);
    });
    if (!out.length) return null;
    const g0 = out[0].ganador.id, cambian = out.filter(e => e.ganador.id !== g0);
    return { escenarios: out, estable: cambian.length === 0, cambian, margen: out[0].margen };
  }
  function alertasClima(f, comp, C, CFG) {
    const niv = C.niveles, out = [], interior = (f.campos.location || {}).valor === 'Interior';
    CFG.alertas.forEach(a => {
      if (!cumple(a.si, niv)) return; if (a.componentes && !a.componentes.includes(comp)) return; if (a.solo_exterior && interior) return;
      const c = f.campos[a.campo], p = a.prueba, v = valorNum(c); let hit = false;
      if (p.sin_dato) hit = !tieneDato(c) && !(c && c.estado === 'no_aplica');
      else if (p.igual !== undefined) hit = !!c && c.estado === 'dato' && c.valor === p.igual;
      else if (p.menor_igual !== undefined) hit = v !== null && v <= p.menor_igual;
      else if (p.mayor_igual !== undefined) hit = v !== null && v >= p.mayor_igual;
      if (hit) { const cod = (/^(E_[A-Z]+)/.exec(a.si) || [])[1]; out.push({ id: a.id, severidad: a.severidad, exigencia: cod, campo: a.campo, mensaje: a.mensaje.replace('{nivel}', niv[cod]), nota: c && c.nota ? c.nota : '' }); }
    });
    const sr = f.campos.imn_subregions, z = C.zona && C.zona.id;
    if (z && sr && sr.estado === 'dato' && Array.isArray(sr.valor) && sr.valor.length && !sr.valor.includes('TODAS') && !sr.valor.includes(z)) out.push({ id: 'ZON-01', severidad: 'atencion', campo: 'imn_subregions', mensaje: 'La ficha declara aptitud para ' + sr.valor.join(', ') + ' y el sitio está en ' + z + '.', nota: sr.nota || '' });
    const ord = { critica: 0, atencion: 1, dato: 2 }; out.sort((a, b) => ord[a.severidad] - ord[b.severidad]);
    return out;
  }

  /* ---------- 5. Lectura de .xlsx sin librerías (zip + DecompressionStream) ---------- */
  const dec = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#x([0-9a-fA-F]+);/g, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&amp;/g, '&').replace(/_x000D_/g, '');
  async function inflar(u8) {
    const ds = new DecompressionStream('deflate-raw'), w = ds.writable.getWriter(); w.write(u8); w.close();
    return new Uint8Array(await new Response(ds.readable).arrayBuffer());
  }
  async function unzip(buf) {
    const u = new Uint8Array(buf), v = new DataView(u.buffer, u.byteOffset, u.byteLength); let e = u.length - 22;
    while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error('El archivo no es un .xlsx válido (no es un zip).');
    const n = v.getUint16(e + 10, true); let p = v.getUint32(e + 16, true); const td = new TextDecoder('utf-8'), out = {};
    for (let i = 0; i < n; i++) {
      const met = v.getUint16(p + 10, true), cs = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), el = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), off = v.getUint32(p + 42, true);
      const name = td.decode(u.subarray(p + 46, p + 46 + nl));
      if (/^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/[^\/]+\.xml)$/.test(name)) {
        const ds = off + 30 + v.getUint16(off + 26, true) + v.getUint16(off + 28, true), raw = u.subarray(ds, ds + cs);
        out[name] = td.decode(met === 0 ? raw : await inflar(raw));
      }
      p += 46 + nl + el + cl;
    }
    return out;
  }
  async function leerXlsx(buf) {
    const z = await unzip(buf), ss = [];
    if (z['xl/sharedStrings.xml']) for (const m of z['xl/sharedStrings.xml'].matchAll(/<si>([\s\S]*?)<\/si>|<si\/>/g)) ss.push(m[1] === undefined ? '' : dec([...m[1].replace(/<rPh[\s\S]*?<\/rPh>/g, '').matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(x => x[1]).join('')));
    const rel = {}; for (const m of (z['xl/_rels/workbook.xml.rels'] || '').matchAll(/<Relationship\b[^>]*>/g)) { const id = /Id="([^"]+)"/.exec(m[0]), t = /Target="([^"]+)"/.exec(m[0]); if (id && t) rel[id[1]] = t[1].replace(/^\/?xl\//, '').replace(/^\//, ''); }
    const hojas = {};
    for (const m of (z['xl/workbook.xml'] || '').matchAll(/<sheet\b[^>]*>/g)) {
      const nm = dec(/name="([^"]*)"/.exec(m[0])[1]), rid = /r:id="([^"]+)"/.exec(m[0])[1], x = z['xl/' + rel[rid]]; if (!x) continue;
      const H = {};
      for (const c of x.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = /\br="([A-Z]+\d+)"/.exec(c[1]); if (!ref || c[2] === undefined) continue;
        const t = (/\bt="([^"]+)"/.exec(c[1]) || [])[1], vm = /<v>([\s\S]*?)<\/v>/.exec(c[2]);
        let val;
        if (t === 'inlineStr') val = dec([...c[2].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(y => y[1]).join(''));
        else if (!vm) continue;
        else if (t === 's') val = ss[+vm[1]];
        else if (t === 'str') val = dec(vm[1]);
        else if (t === 'b') val = vm[1] === '1';
        else if (t === 'e') continue;
        else val = +vm[1];
        if (val !== '' && val !== undefined) H[ref[1]] = val;
      }
      hojas[nm] = H;
    }
    return hojas;
  }
  const fechaExcel = v => isNum(v) ? new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10) : String(v || '').slice(0, 10);
  const COLS = 'ABCDEFGHIJKLMNOPQ';
  function fichaDesdePlantilla(hojas, DIC) {
    const H = hojas['Ficha']; if (!H) throw new Error('El libro no tiene la hoja «Ficha»: usá una Plantilla_Ficha_SUM_<COMP>.xlsx.');
    const fid = String(H.G2 || '').trim(), comp = fid.split('-')[0], campos = {};
    if (!/^[A-Z]{3}-[A-Z0-9]{2,4}-\d{2}$/.test(fid)) throw new Error('El ID de la ficha (celda G2) debe tener el formato COMP-SUB-NN, p. ej. PIS-CER-01. Se leyó: «' + fid + '».');
    let maxR = 0; Object.keys(H).forEach(k => { const r = +k.replace(/[A-Z]+/, ''); if (r > maxR) maxR = r; });
    for (let r = 6; r <= maxR; r++) {
      const k = H['B' + r]; if (!DIC[k]) continue;
      const v = i => H[COLS[i] + r], t = DIC[k].tipo, valor = v(6), c = { estado: v(5) || 'pendiente' };
      if (c.estado === 'dato') {
        if (t === 'lista_multiple' && valor !== undefined) c.valor = String(valor).split('|').map(x => x.trim()).filter(Boolean);
        else if (['numero', 'entero', 'escala'].includes(t) && valor !== undefined) c.valor = isNum(valor) ? (t !== 'numero' ? Math.round(valor) : valor) : valor;
        else if (valor !== undefined) c.valor = valor;
        if (v(7) !== undefined && v(8) !== undefined) { c.min = v(7); c.max = v(8); c.calificador = 'rango'; }
        if (v(9) && !c.calificador) c.calificador = v(9);
        if (v(10) && (NUMERICOS.includes(t) || t === 'valor_o_clase' && isNum(valor))) c.unidad = v(10);
      }
      if (v(11)) { const refs = String(v(11)).split(/[;,]/).map(x => x.trim()).filter(Boolean); c.fuentes = refs.map(x => Object.assign({ ref: x }, v(12) && refs.length === 1 ? { loc: String(v(12)) } : {})); }
      if (v(13)) c.evidencia = String(v(13)); if (v(14)) c.certeza = String(v(14)); if (v(15)) c.justificacion = String(v(15));
      if (v(16) && v(16) !== DIC[k].regla) c.nota = String(v(16));
      campos[k] = c;
    }
    campos.id = { estado: 'dato', valor: fid, fuentes: [{ ref: 'PROPIO' }], evidencia: 'E1' }; campos.component = { estado: 'dato', valor: comp };
    const fuentes = [], F = hojas['Fuentes'] || {};
    for (let r = 2; r < 400; r++) if (F['A' + r] && F['B' + r]) { const e = { id: String(F['A' + r]).trim(), cita: String(F['B' + r]).trim() }; if (F['C' + r]) e.url = String(F['C' + r]); if (F['D' + r]) e.tipo = String(F['D' + r]); if (F['E' + r]) e.fecha_consulta = fechaExcel(F['E' + r]); fuentes.push(e); }
    const ord = {}; Object.keys(DIC).forEach(k => { if (campos[k]) ord[k] = campos[k]; else if (aplica(DIC[k], comp)) ord[k] = { estado: 'pendiente' }; }); /* plantilla rápida: lo que no trae queda pendiente */
    return { schema_version: '1.0', meta: { id: fid, componente: comp, autor: String(H.C2 || ''), estado_revision: 'borrador', fecha_actualizacion: new Date().toISOString().slice(0, 10) }, campos: ord, fuentes };
  }
  function sitioDesdeMatriz(hojas, PAR, nombreArchivo) {
    const s = hojas['SITIO']; if (!s) throw new Error('El libro no tiene la hoja «SITIO»: usá una Matriz_Clima_Sitio.xlsx.');
    const S = estadoVacio(PAR), num = v => isNum(v) ? v : null;
    Object.assign(S.sitio, { nombre: String(s.B5 || '').trim(), ubicacion: s.B6 || '', lat: num(s.B7), lon: num(s.B8), id_zona: String(s.B9 || '').trim(), elaborado_por: s.B11 || '', fecha: fechaExcel(s.B12) });
    VARS.forEach(([k], i) => { const r = 16 + i, d = s['D' + r]; S.vars[k] = { entrada: k === 'zona_sismica_cscr' ? (['II', 'III', 'IV'].includes(d) ? d : null) : num(d), fuente: s['G' + r] || '', certeza: s['H' + r] || '' }; });
    const op = (v, ok) => ok.includes(v) ? v : '';
    Object.assign(S.micro, { altitud_sitio_msnm: num(s.D28), altitud_estacion_msnm: num(s.D29), distancia_costa_km: num(s.D30), zona_viento_cfia: op(s.D31, ['I', 'II', 'III', 'IV', 'V']), exposicion_viento: op(s.D32, ['Protegido', 'Normal', 'Expuesto']) || 'Normal', sombra_envolvente: op(s.D33, ['Alta', 'Media', 'Baja']) || 'Media', orientacion_fachada: s.D34 || '' });
    S.micro.ajustar_altitud = isNum(S.micro.altitud_sitio_msnm) && isNum(S.micro.altitud_estacion_msnm);
    const p = hojas['PESOS'] || {};
    'CDEFGH'.split('').forEach((c, j) => { if (isNum(p[c + '15'])) S.pesos_base[j] = p[c + '15']; COD.forEach((cod, i) => { if (isNum(p[c + (5 + i)])) S.sens[cod][j] = p[c + (5 + i)]; }); });
    const se = hojas['SELECCION'] || {}, man = [];
    for (let r = 6; r <= 15; r++) { const n = se['B' + r], pts = 'DEFGHI'.split('').map(c => num(se[c + r])); if (n && !/EJEMPLO/.test(n) && pts.every(x => x !== null)) man.push({ material: n, componente: se['C' + r] || '', puntajes: Object.fromEntries(PAR.dimensiones.map((d, j) => [d.id, pts[j]])) }); }
    if (man.length) S.seleccion_manual = man;
    S.origen = nombreArchivo || 'Matriz_Clima_Sitio.xlsx';
    return S;
  }
  function fichaNueva(id, comp, autor, DIC) {
    const campos = {};
    Object.keys(DIC).forEach(k => { if (aplica(DIC[k], comp)) campos[k] = { estado: 'pendiente' }; });
    campos.id = { estado: 'dato', valor: id, fuentes: [{ ref: 'PROPIO' }], evidencia: 'E1' }; campos.component = { estado: 'dato', valor: comp };
    return { schema_version: '1.0', meta: { id, componente: comp, autor: autor || '', estado_revision: 'borrador', fecha_actualizacion: new Date().toISOString().slice(0, 10), origen: 'App SUM · formulario' }, campos, fuentes: [{ id: 'PROPIO', cita: 'Elaboración propia.', tipo: 'elaboracion_propia' }] };
  }
  function validarFicha(f, DIC, LISTAS) {
    const e = [];
    if (!f || typeof f !== 'object' || !f.meta || !f.campos) return ['El archivo no tiene la estructura de una Ficha SUM (faltan «meta» o «campos»).'];
    if (!/^[A-Z]{3}-[A-Z0-9]{2,4}-\d{2}$/.test(f.meta.id || '')) e.push('meta.id debe tener el formato COMP-SUB-NN (p. ej. PAR-BAM-06).');
    if (!LISTAS.component[f.meta.componente]) e.push('meta.componente no es un código válido (CIM, PIS, PAR, CUB, CIE, PUE, VEN).');
    else if ((f.meta.id || '').split('-')[0] !== f.meta.componente) e.push('El prefijo del ID no coincide con el componente.');
    const otros = Object.keys(f.campos).filter(k => !DIC[k]); if (otros.length) e.push('Claves que no existen en el diccionario: ' + otros.slice(0, 6).join(', '));
    return e;
  }
  return { COD, VARS, isNum, parseEPW, estadoVacio, calcularSitio, sitioDesdeJson, sitioAJson, valorNum, valorTexto, tieneDato, aplica, trazabilidad, diagnostico, cumple, indicadores, evaluar, sensibilidad, alertasClima, leerXlsx, fichaDesdePlantilla, sitioDesdeMatriz, fichaNueva, validarFicha, fechaExcel };
});
