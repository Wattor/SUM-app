# SUM · Selección y Uso de Materiales

Base de datos de fichas técnicas de materiales y sistemas constructivos para el trópico húmedo costarricense.
Taller de Diseño · Materiales y Técnicas Avanzadas.

```
estandar/                     ← definición del estándar (no editar sin PR aprobado)
  diccionario_campos.csv      fuente única de verdad: 159 campos (92 núcleo + 7 módulos)
  listas.json                 dominios controlados
  ficha_sum.schema.json       JSON Schema (generado)
  indicadores_matriz.csv      43 indicadores de la matriz multicriterio 0–3
  mapa_ids_migracion.csv      equivalencia ID legado → ID nuevo
data/<componente>/<ID>.json   una ficha por archivo
plantillas/                   Excel de captura, una por componente (generadas)
scripts/
  validar.py                  valida fichas y calcula el índice de trazabilidad
  importar_plantilla.py       Excel llenado → JSON
  migrar_xlsx.py              fichas TP1 legadas → JSON (uso único)
  exportar.py                 consolidados para la app (salidas/)
  generar_schema.py           diccionario → schema
  generar_plantillas.py       diccionario → plantillas Excel
reportes/                     reportes de validación
```

## App SUM (versión integrada, nov. 2026)

Cruza el clima de un sitio con las fichas de sistemas constructivos, componente por componente.

- **Abrir:** doble clic en `SUM_app.html` (un solo archivo, funciona sin internet) o en `app/index.html`.
- **Sitio:** elegir uno de `data/sitios/`, subir un `.epw` de cualquier lugar, o importar una `Matriz_Clima_Sitio.xlsx`.
- **Gráficos de clima:** un gráfico por variable del EPW y rosa de los vientos, exportables como PNG, lámina 16:9 o CSV.
- **Evaluación:** ranking por componente con los pesos del sitio, alertas clima × material, trazabilidad de cada dato y sensibilidad del resultado.
- **Sistemas nuevos:** plantilla Excel llena, ficha `.json` o formulario desde una ficha técnica.

```bash
python scripts/sitio_a_json.py "Matriz_Clima_Sitio_X.xlsx" --id vc1_mi_sitio   # Excel de clima → data/sitios/
python scripts/construir_app.py          # regenera app/datos.js y SUM_app.html tras cambiar fichas, sitios o estandar/
python scripts/complementar.py          # conversión E04 y complemento de norma (idempotente; ver reportes/complemento_integracion.md)
python scripts/completar_descriptivos.py  # síntesis de campos descriptivos E05 desde la propia ficha (idempotente)
python scripts/anexos_guia.py            # regenera GUIA_METODO.md desde docs/GUIA_METODO.plantilla.md
node app/pruebas/prueba_motor.js         # comprueba el motor contra los libros de los estudiantes
node app/pruebas/prueba_interfaz.js      # prueba de humo de la interfaz
```

Archivos nuevos: `app/` (motor.js, ui.js, estilos.css, index.html), `data/sitios/`, `clima/` (EPW de prueba),
`estandar/clima_zonas.json`, `estandar/clima_parametros.json`, `estandar/indicadores_app.json`
(reglas de puntaje y alertas: **propuesta metodológica a calibrar**).

Método, correcciones y hoja de ruta: [GUIA_METODO.md](GUIA_METODO.md). Uso paso a paso: pestaña Tutorial de la app.

## Plantillas para agregar sistemas

En `plantillas/`, tres por componente; las tres se descargan también desde la pestaña Fichas de la app y, llenas, se suben con sus botones:

| Plantilla | Para qué | Botón en la app |
|---|---|---|
| `Plantilla_Rapida_SUM_<COMP>.xlsx` | Transcribir una ficha técnica: solo los campos que la app evalúa | Subir plantilla llena |
| `Plantilla_Ficha_SUM_<COMP>.xlsx` | Ficha SUM completa (la que va al repositorio) | Subir plantilla llena |
| `Plantilla_Ficha_SUM_<COMP>.json` | Ficha en blanco en JSON | Subir ficha .json |

Se regeneran con `python scripts/generar_plantillas.py`; se prueban con `python app/pruebas/llenar_plantillas_de_prueba.py && node app/pruebas/prueba_plantillas.js`.

## Uso rápido

```bash
pip install openpyxl jsonschema
python scripts/validar.py                         # todas las fichas
python scripts/validar.py data/pisos/PIS-CER-01.json
python scripts/validar.py --reporte reportes/validacion.md
python scripts/exportar.py                        # salidas/materiales_<COMP>.json, registro_app.csv, matriz_<COMP>.csv
```

El estándar completo está en [ESTANDAR.md](ESTANDAR.md). Cómo contribuir: [CONTRIBUTING.md](CONTRIBUTING.md).
