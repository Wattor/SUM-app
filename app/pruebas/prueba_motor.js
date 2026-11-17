/* Pruebas del motor SUM contra los libros de los estudiantes.
   Uso (desde la raíz del repositorio):  node app/pruebas/prueba_motor.js  */
const fs = require('fs'), path = require('path');
const SUM = require('../motor.js');
const R = path.resolve(__dirname, '..', '..');
const J = p => JSON.parse(fs.readFileSync(path.join(R, p), 'utf8'));
const PAR = J('estandar/clima_parametros.json'), ZONAS = J('estandar/clima_zonas.json').zonas, CFG = J('estandar/indicadores_app.json'), LISTAS = J('estandar/listas.json');
const DIC = {};
{ // CSV simple con comillas
  const t = fs.readFileSync(path.join(R, 'estandar/diccionario_campos.csv'), 'utf8').replace(/^﻿/, '');
  const filas = []; let f = [], c = '', q = false;
  for (let i = 0; i < t.length; i++) { const ch = t[i]; if (q) { if (ch === '"' && t[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; } else if (ch === '"') q = true; else if (ch === ',') { f.push(c); c = ''; } else if (ch === '\n') { f.push(c); filas.push(f); f = []; c = ''; } else if (ch !== '\r') c += ch; }
  if (c || f.length) { f.push(c); filas.push(f); }
  const h = filas[0]; filas.slice(1).forEach(r => { if (r[0]) DIC[r[0]] = Object.fromEntries(h.map((k, i) => [k, r[i] || ''])); });
}
let ok = 0, mal = 0;
const t = (nombre, cond, extra) => { if (cond) ok++; else { mal++; console.log('  ✗ ' + nombre + (extra ? ' → ' + extra : '')); } };
const fichas = [];
fs.readdirSync(path.join(R, 'data')).forEach(d => { if (d === 'sitios') return; fs.readdirSync(path.join(R, 'data', d)).filter(x => x.endsWith('.json')).forEach(x => fichas.push(J('data/' + d + '/' + x))); });

// 1. Los sitios guardados se recalculan idénticos (niveles y pesos) al pasar por la app
const sitios = fs.readdirSync(path.join(R, 'data/sitios')).filter(x => x.endsWith('.json')).map(x => J('data/sitios/' + x));
sitios.forEach(j => {
  const S = SUM.sitioDesdeJson(j, PAR), C = SUM.calcularSitio(S, PAR, ZONAS);
  SUM.COD.forEach(c => t(j.sitio.id + ' nivel ' + c, C.niveles[c] === j.exigencias[c].nivel, C.niveles[c] + ' vs ' + j.exigencias[c].nivel));
  C.pesos.forEach(p => t(j.sitio.id + ' peso ' + p.id, Math.abs(p.peso - j.pesos_dimension[p.id].peso) < 1e-4, p.peso + ' vs ' + j.pesos_dimension[p.id].peso));
  const k = SUM.sitioAJson(S, C, PAR); t(j.sitio.id + ' ida y vuelta', k.exigencia_total === j.exigencia_total && k.sitio.id === j.sitio.id);
});
console.log('Sitios recalculados: ' + sitios.length);

// 2. EPW de Tierra Blanca frente a lo que declara su ficha
const epw = SUM.parseEPW(fs.readFileSync(path.join(R, 'clima/TierraBlanca_Cartago_CRI_sintetico.epw'), 'utf8'), PAR);
console.log('EPW Tierra Blanca:', JSON.stringify(epw.anual), epw.avisos);
t('EPW 8760 h', epw.horas === 8760 && epw.dias === 365);
t('EPW HR = 85,9 (cálculo independiente en Python: 85,85)', Math.abs(epw.anual.hr_media_anual - 85.85) < 0.06, epw.anual.hr_media_anual);
t('EPW GHI = 3,65 (Python: 3,654)', Math.abs(epw.anual.radiacion_global - 3.654) < 0.006, epw.anual.radiacion_global);
t('EPW lluvia = 1449,4 (Python)', Math.abs(epw.anual.precipitacion_anual - 1449.4) < 0.06, epw.anual.precipitacion_anual);
t('EPW Tmáx = 18,9 y Tmín = 11,1 (Python: 18,94 / 11,06)', epw.anual.t_max_media === 18.9 && epw.anual.t_min_media === 11.1, epw.anual.t_max_media);
t('EPW elevación', epw.loc.elev === 2080 && Math.abs(epw.loc.lat - 9.9307) < 1e-6);
t('EPW rosa de vientos', epw.rosa && epw.rosa.sectores.length === 16 && epw.rosa.total > 8000 && Math.abs(epw.rosa.sectores.reduce((s, b) => s + b.reduce((x, y) => x + y, 0), 0) + epw.rosa.calma - epw.rosa.total) < 1, JSON.stringify(epw.rosa && epw.rosa.total));
t('EPW rechaza otro archivo', (() => { try { SUM.parseEPW('hola,1,2'); return false; } catch (e) { return true; } })());

// 3. Evaluación de los 7 componentes en los 4 sitios
sitios.forEach(j => {
  const C = SUM.calcularSitio(SUM.sitioDesdeJson(j, PAR), PAR, ZONAS);
  Object.keys(LISTAS.component).forEach(comp => {
    const E = SUM.evaluar(fichas, comp, C, PAR, CFG, DIC, {});
    t(j.sitio.id + ' ' + comp + ' tiene filas', E.filas.length >= 4);
    E.filas.forEach(f => { t(f.id + ' puntaje en rango', f.sit === null || (f.sit >= 0 && f.sit <= 1), f.sit); Object.values(f.dims).forEach(d => t(f.id + ' dim en rango', d.s === null || (d.s >= -1e-9 && d.s <= 3 + 1e-9), d.s)); });
  });
});
// reproducir la hoja SELECCION de Curridabat con sus puntajes manuales
{
  const j = sitios.find(s => s.sitio.id === 'vc1_ebais_curridabat'), C = SUM.calcularSitio(SUM.sitioDesdeJson(j, PAR), PAR, ZONAS);
  const esperado = { 'PIS-CER-01': 0.78646188850967, 'PAR-MAM-01': 0.7708759954493742, 'VEN-PVC-05': 0.7085324232081911 };
  const manual = {}; j.seleccion_manual.forEach(m => manual[m.id_ficha] = m.puntajes);
  ['PIS', 'PAR', 'VEN'].forEach(comp => SUM.evaluar(fichas, comp, C, PAR, CFG, DIC, { manual }).filas.forEach(f => { if (esperado[f.id]) t('SELECCION Curridabat ' + f.id, Math.abs(f.sit - esperado[f.id]) < 1e-6, f.sit); }));
}
// 4. Trazabilidad igual a validar.py (PIS-CER-01 se compara a mano en el reporte)
{
  global.window = {}; eval(fs.readFileSync(path.join(R, 'app/datos.js'), 'utf8')); const DD = global.window.SUM_DATOS;
  DD.fichas.forEach(f => { const tr = SUM.trazabilidad(f, DIC); t('IT de ' + f.meta.id + ' igual al de validar.py', Math.abs(tr.it - f._val.it) < 0.11 && tr.datos === f._val.datos, tr.it + '/' + tr.datos + ' vs ' + f._val.it + '/' + f._val.datos); });
}
// 5. Lectura de xlsx (plantilla vacía y matriz de sitio, si se pasa por argumento)
(async () => {
  const buf = fs.readFileSync(path.join(R, 'plantillas/Plantilla_Ficha_SUM_VEN.xlsx'));
  const H = await SUM.leerXlsx(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  t('xlsx hojas', !!H.Ficha && !!H.Fuentes, Object.keys(H).join(','));
  t('xlsx celdas', H.Ficha.B6 === 'id' && H.Ficha.G2 === 'VEN-XXX-01', H.Ficha.B6 + ' / ' + H.Ficha.G2);
  H.Ficha.G2 = 'VEN-PRU-09'; H.Ficha.C2 = 'Prueba'; H.Ficha.F7 = 'dato'; H.Ficha.G7 = 'Ventana de prueba';
  const f = SUM.fichaDesdePlantilla(H, DIC);
  t('plantilla → ficha', f.meta.id === 'VEN-PRU-09' && f.campos.name.valor === 'Ventana de prueba' && SUM.validarFicha(f, DIC, LISTAS).length === 0);
  for (const a of process.argv.slice(2)) {
    const b = fs.readFileSync(a), M = await SUM.leerXlsx(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
    const S = SUM.sitioDesdeMatriz(M, PAR, path.basename(a)), C = SUM.calcularSitio(S, PAR, ZONAS);
    console.log('Matriz', path.basename(a), '→', S.sitio.nombre, '|', SUM.COD.map(c => C.niveles[c]).join(''), '|', C.pesos.map(p => p.peso.toFixed(4)).join(' '));
  }
  console.log(`\n${ok} comprobaciones correctas · ${mal} fallidas`);
  process.exit(mal ? 1 : 0);
})();
