/* Comprueba que las tres plantillas, una vez llenas, entran a la app por el mismo camino que usan los botones.
   Uso:  python3 app/pruebas/llenar_plantillas_de_prueba.py && node app/pruebas/prueba_plantillas.js */
const fs = require('fs'), path = require('path'), SUM = require('../motor.js');
const R = path.resolve(__dirname, '..', '..'), T = path.join(__dirname, 'tmp');
global.window = {}; eval(fs.readFileSync(path.join(R, 'app/datos.js'), 'utf8')); const D = global.window.SUM_DATOS;
let mal = 0; const t = (n, c, x) => { if (!c) { mal++; console.log('  ✗ ' + n + (x ? ' → ' + x : '')); } };
(async () => {
  const C = SUM.calcularSitio(SUM.sitioDesdeJson(D.sitios[0], D.param), D.param, D.zonas);
  for (const comp of Object.keys(D.listas.component)) {
    for (const tipo of ['Ficha', 'Rapida']) {
      const b = fs.readFileSync(path.join(T, `Plantilla_${tipo}_SUM_${comp}_llena.xlsx`));
      const f = SUM.fichaDesdePlantilla(await SUM.leerXlsx(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)), D.dic);
      t(`${comp} ${tipo}: válida`, SUM.validarFicha(f, D.dic, D.listas).length === 0, SUM.validarFicha(f, D.dic, D.listas).join(' '));
      t(`${comp} ${tipo}: datos leídos`, f.campos.name.valor === 'Sistema de prueba' && f.campos.moisture_resistance.valor === 4 && f.campos.durability_years.valor === 30 && f.campos.durability_years.unidad === 'años' && f.campos.durability_years.certeza === 'verificado' && f.campos.moisture_resistance.justificacion === 'Ensayo de prueba' && f.fuentes.some(x => x.id === 'FT01'), JSON.stringify(f.campos.durability_years));
      t(`${comp} ${tipo}: todos los campos del componente`, Object.keys(D.dic).filter(k => SUM.aplica(D.dic[k], comp)).every(k => f.campos[k]));
      const E = SUM.evaluar(D.fichas.concat([f]), comp, C, D.param, D.cfg, D.dic, {}), fila = E.filas.find(x => x.id === f.meta.id);
      t(`${comp} ${tipo}: aparece en la evaluación con puntaje`, fila && Math.abs(fila.dims.higrotermico.auto - 2.25) < 1.6 && fila.det.moisture_resistance.s === 2.25, fila && JSON.stringify(fila.det.moisture_resistance));
    }
    const j = JSON.parse(fs.readFileSync(path.join(R, `plantillas/Plantilla_Ficha_SUM_${comp}.json`), 'utf8'));
    t(`${comp} json en blanco: válida`, SUM.validarFicha(j, D.dic, D.listas).length === 0);
    j.meta.id = j.campos.id.valor = comp + '-PRU-97'; j.campos.moisture_resistance = { estado: 'dato', valor: 5, fuentes: [{ ref: 'PROPIO' }], evidencia: 'E1', justificacion: 'Prueba' };
    const E = SUM.evaluar(D.fichas.concat([j]), comp, C, D.param, D.cfg, D.dic, {});
    t(`${comp} json lleno: puntúa`, E.filas.find(x => x.id === comp + '-PRU-97').dims.higrotermico.s === 3);
  }
  console.log(mal ? mal + ' fallas' : 'Plantillas: 21 archivos comprobados, todos entran a la app y puntúan');
  process.exit(mal ? 1 : 0);
})();
