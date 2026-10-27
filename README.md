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

## Uso rápido

```bash
pip install openpyxl jsonschema
python scripts/validar.py                         # todas las fichas
python scripts/validar.py data/pisos/PIS-CER-01.json
python scripts/validar.py --reporte reportes/validacion.md
python scripts/exportar.py                        # salidas/materiales_<COMP>.json, registro_app.csv, matriz_<COMP>.csv
```

El estándar completo está en [ESTANDAR.md](ESTANDAR.md). Cómo contribuir: [CONTRIBUTING.md](CONTRIBUTING.md).
