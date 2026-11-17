/* Prueba de humo de la interfaz sin navegador: carga datos.js + motor.js + ui.js en un DOM mínimo simulado,
   recorre las 6 pestañas, los 7 componentes y los 4 sitios, y reporta cualquier error de ejecución.
   Uso:  node app/pruebas/prueba_interfaz.js   (después de python scripts/construir_app.py) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const A = path.resolve(__dirname, '..');
const els = {}, manej = { click: [], change: [], keydown: [] };
const el = id => els[id] || (els[id] = { id, innerHTML: '', textContent: '', value: '', files: [], dataset: {}, classList: { add() { }, remove() { } }, addEventListener() { }, click() { } });
const document = { querySelector: s => el(s.replace('#', '')), getElementById: el, addEventListener: (t, f) => manej[t].push(f), createElement: () => ({ click() { }, remove() { }, style: {} }), body: { appendChild() { } } };
const mem = {}; const win = { document, scrollTo() { }, print() { }, localStorage: { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } }, console, setTimeout, clearTimeout, URL: { createObjectURL: () => 'blob:', revokeObjectURL() { } }, Blob: function () { }, FileReader: function () { } };
win.window = win; win.self = win;
const ctx = vm.createContext(win);
['datos.js', 'motor.js', 'ui.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(A, f), 'utf8'), ctx, { filename: f }));
let n = 0;
const clic = d => { manej.click.forEach(f => f({ target: { closest: s => s === '[data-a]' ? { dataset: d } : null } })); n++; };
const cambio = (d, value, checked) => { manej.change.forEach(f => f({ target: { dataset: d, value, checked } })); n++; };
const html = () => els.app.innerHTML.replace(/url\(data:[^)]*\)/g, '');
const debe = (c, m) => { if (!c) { console.log('✗ ' + m); process.exitCode = 1; } };
const D = win.SUM_DATOS;
debe(html().includes('Selección y Uso de Materiales') && html().includes('class="hero"'), 'portada');
D.sitios.forEach(j => {
  cambio({ a: 'sel-sitio' }, 'b:' + j.sitio.id);
  ['inicio', 'sitio', 'perfil', 'eval', 'edif', 'fichas', 'tutorial'].forEach(t => { clic({ a: 'ir', t }); debe(html().length > 800 && !/undefined|NaN|\[object Object\]/.test(html().replace(/<input[^>]*>/g, '')), `pestaña ${t} en ${j.sitio.id}: ` + (html().match(/.{40}(undefined|NaN|\[object Object\]).{40}/) || [''])[0]); });
  Object.keys(D.listas.component).forEach(c => { clic({ a: 'ir', t: 'eval' }); clic({ a: 'comp', c }); const id = (html().match(/data-a="abrir" data-id="([^"]+)"/) || [])[1]; debe(id, 'filas en ' + c); clic({ a: 'abrir', id }); debe(html().includes('Indicador') || html().includes('Sin indicadores activos'), 'detalle ' + id); debe(!/undefined|NaN/.test(html().replace(/<input[^>]*>/g, '')), `detalle ${id} en ${j.sitio.id}: ` + (html().match(/.{50}(undefined|NaN).{30}/) || [''])[0]); });
});
// ajustes: normalización, criterio, puntaje manual, pesos, umbral, ficha completa, formulario
cambio({ b: 'norm' }, 'minmax'); cambio({ a: 'ind-act', k: 'thermal_conductivity' }, '', false); cambio({ a: 'ind-sen', k: 'u_value' }, 'mayor');
cambio({ a: 'manual', id: 'PIS-CER-01', d: 'mecanico' }, '2,5'); clic({ a: 'comp', c: 'PIS' }); clic({ a: 'abrir', id: 'PIS-CER-01' }); debe(html().includes('man.'), 'puntaje manual visible');
cambio({ b: 'manualAutor', t: 'chk' }, '', true); cambio({ b: 'conComp', t: 'chk' }, '', false); debe(!html().includes('tag comp'), 'sin complemento'); cambio({ b: 'conComp', t: 'chk' }, '', true); clic({ a: 'comp', c: 'CUB' }); clic({ a: 'abrir', id: 'CUB-TBA-05' }); debe(html().includes('tag comp'), 'etiqueta complemento');
clic({ a: 'ir', t: 'perfil' }); cambio({ b: 'S.pesos_base.4', t: 'num0' }, '2'); cambio({ b: 'PAR.umbrales.E_CAL.n1', t: 'num0' }, '26'); clic({ a: 'reset-par' }); clic({ a: 'reset-sens' }); clic({ a: 'reset-aj' });
clic({ a: 'ver-ficha', id: 'CUB-MET-04' }); debe(html().includes('Índice de trazabilidad'), 'ficha completa');
clic({ a: 'ir', t: 'fichas' }); debe(html().includes('Descargar plantilla rápida .xlsx') && html().includes('Descargar plantilla .json'), 'plantillas en la app'); cambio({ b: 'plComp' }, 'VEN'); debe(html().includes('VEN-XXX-01'), 'componente de plantilla'); clic({ a: 'nuevo-form' }); debe(html().includes('Sistema nuevo desde una ficha técnica'), 'formulario');
cambio({ b: 'form.comp' }, 'PAR'); cambio({ b: 'form.id' }, 'PAR-BAM-06'); cambio({ b: 'form.cita' }, 'Fabricante de prueba. (2026). Ficha técnica.');
cambio({ b: 'form.campos.name.valor' }, 'Panel de prueba'); cambio({ b: 'form.campos.moisture_resistance.valor' }, '4'); cambio({ b: 'form.campos.moisture_resistance.nota' }, 'Ensayo de prueba'); cambio({ b: 'form.campos.surface_mass.valor' }, '32,5'); cambio({ b: 'form.campos.surface_mass.certeza' }, 'verificado');
clic({ a: 'guardar-form' }); debe(html().includes('PAR-BAM-06') && html().includes('Panel de prueba'), 'ficha nueva en el ranking');
clic({ a: 'ver-ficha', id: 'PAR-BAM-06' }); debe(html().includes('32,5 kg/m²'), 'dato numérico de la ficha nueva: ' + (html().match(/Masa superficial[\s\S]{0,160}/) || [''])[0]);
clic({ a: 'borrar-ficha', id: 'PAR-BAM-06' });
// v1.2: limpiar clima, fecha dd-mm-aaaa, tablero
clic({ a: 'ir', t: 'sitio' }); cambio({ b: 'S.sitio.fecha', t: 'fecha' }, '05-03-2027'); debe(html().includes('value="05-03-2027"') && html().includes('value="2027-03-05"'), 'fecha dd-mm-aaaa');
cambio({ a: 'fecha-pick' }, '2027-04-09'); debe(html().includes('value="09-04-2027"'), 'fecha desde calendario');
clic({ a: 'limpiar-clima' }); debe(html().includes('Deshacer'), 'limpiar clima'); clic({ a: 'deshacer-clima' }); debe(!html().includes('data-a="deshacer-clima"'), 'deshacer');
clic({ a: 'ir', t: 'eval' }); debe(html().includes('Tablero de recomendación') && html().includes('Material recomendado') && html().includes('Material no recomendado') && html().includes('Síntesis técnica'), 'tablero y síntesis'); clic({ a: 'dash', k: 'sit' }); debe(html().includes('En el sitio</text>'), 'tablero en el sitio'); clic({ a: 'dash', k: 'gen' });
// corrección de una ficha en la app
clic({ a: 'ver-ficha', id: 'CIE-GYP-01' }); clic({ a: 'editar', id: 'CIE-GYP-01' }); debe(html().includes('Corregir CIE-GYP-01') && html().includes('E05'), 'editor de corrección');
cambio({ b: 'ed.campos.tradition_type._v' }, 'Contemporáneo'); cambio({ b: 'ed.campos.tradition_type._ref' }, 'PROPIO'); cambio({ b: 'ed.campos.tradition_type.evidencia' }, 'E1'); cambio({ b: 'ed.campos.graphics.estado' }, 'no_disponible');
clic({ a: 'ed-ver', k: 'todos' }); cambio({ b: 'ed.campos.minimum_plenum._v' }, '150'); cambio({ b: 'ed.campos.minimum_plenum.unidad' }, 'mm'); cambio({ b: 'ed.campos.minimum_plenum._ref' }, 'PROPIO'); cambio({ b: 'ed.campos.minimum_plenum.evidencia' }, 'E1');
clic({ a: 'ed-guardar' }); { const g = JSON.parse(mem.sum_app_v1).editadas['CIE-GYP-01']; debe(g && g.campos.tradition_type.estado === 'dato' && g.campos.tradition_type.valor === 'Contemporáneo' && g.campos.graphics.estado === 'no_disponible' && g.campos.minimum_plenum.valor === 150 && g.campos.minimum_plenum.unidad === 'mm' && !('_v' in g.campos.name) && g.campos.name.valor.length > 5, 'correcciones guardadas: ' + JSON.stringify(g && g.campos.minimum_plenum)); }
debe(html().includes('Restaurar la ficha original'), 'ficha corregida visible'); clic({ a: 'ed-restaurar', id: 'CIE-GYP-01' });
// sitio en blanco y fuera de Costa Rica
clic({ a: 'sitio-nuevo' }); ['sitio', 'perfil', 'eval', 'edif'].forEach(t => { clic({ a: 'ir', t }); debe(!/undefined|NaN/.test(html().replace(/<input[^>]*>/g, '')), 'sitio en blanco, pestaña ' + t + ': ' + (html().match(/.{50}(undefined|NaN).{30}/) || [''])[0]); });
cambio({ b: 'S.micro.nivel_vie_manual' }, '3'); cambio({ b: 'S.vars.t_max_media.entrada', t: 'num' }, '33,5'); clic({ a: 'ir', t: 'perfil' }); debe(/E_CAL[\s\S]*?■■■/.test(html()), 'calor nivel 3 con 33,5 °C');
clic({ a: 'guardar-sitio' }); cambio({ b: 'S.sitio.nombre' }, 'Sitio de prueba'); clic({ a: 'guardar-sitio' }); debe(JSON.parse(mem.sum_app_v1).sitiosUsuario.length === 1, 'sitio guardado');
console.log(`${n} interacciones simuladas · ${process.exitCode ? 'CON ERRORES' : 'sin errores de ejecución'}`);
