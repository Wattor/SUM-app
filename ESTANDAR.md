# Ficha SUM v1.0 — Estándar de datos para la Selección y Uso de Materiales

Taller de Diseño · Materiales y Técnicas Avanzadas · TP1
Versión 1.0 · octubre 2026 · Mag. Arq. Minor Martin Aguilar

---

## 1. Por qué un estándar

Las 38 fichas del TP1 partieron de la misma plantilla (`FICHA ESTANDARIZADA DE MATERIALES Y SISTEMAS`, 10 columnas, 75 claves comunes). El contenido técnico es bueno, pero cada estudiante resolvió de forma distinta lo que la plantilla dejaba abierto. El resultado no se puede consolidar en una aplicación sin intervención manual.

### 1.1 Diagnóstico de los siete formatos

| Componente | Estudiante | Fichas | Bloque final | Fuentes | Problema dominante |
|---|---|---:|---|---|---|
| Cimentaciones | M. Pardo | 5 | Geotecnia + Costa Rica + Síntesis (25 claves propias, sin «Específico») | Siglas con localizador (`CC §4.1.1`); hoja de referencias inexistente | 122 de 317 datos (38 %) sin fuente; 11 % sin evidencia |
| Cubiertas | J. Rodríguez | 7 | Específico (10) | Texto libre; 249 celdas «Elaboración propia» | Rangos y precios escritos como texto |
| Ventanas | J. Sandoval | 5 | Específico (13) + bibliografía F1–F20 pegada al pie de cada pestaña | Códigos F1…F20 | 60 de 76 números escritos como texto (≈, rangos, dos valores en una celda) |
| Cielos | Sebastián | 5 | Específico (9) | Cita con página | 254 de 420 campos en «No disponible»: baja cobertura, pero ningún puntaje 1–5 asignado sin respaldo (buena práctica) |
| Puertas | Verónica | 4 | Específico (11) | Cita al reporte propio, con página | 35 de 35 números como texto; «No disponible» escrito en la columna Fuente |
| Paredes | Ó. Quesada | 5 | Específico (10) | Códigos S0…F3 en la hoja Instrucciones | Encabezados G–J borrados en 4 pestañas |
| Pisos | A. Sáenz | 7 | Específico de pisos (9) + ★Sistema constructivo + ★Costa Rica + ★Síntesis | Hoja Referencias APA 7 | 77 de 84 números como texto; matriz 3-2-1-0 anexa |

### 1.2 Divergencias estructurales

1. **El bloque «Específico» no es comparable** entre componentes, y dos estudiantes (Pardo, Sáenz) añadieron por su cuenta el mismo bloque de 15 campos sobre sistema constructivo, contexto costarricense y síntesis.
2. **Unidades mezcladas con el dato**: `weight_density` admitía «kg/m² o kg/m³»; `price_range` aparece en CRC, ₡, USD y MXN; `embodied_carbon` en tres unidades funcionales distintas; `rain_noise` en dB y en escala 1–5.
3. **Sinónimos**: `airtightness` (Puertas) y `air_tightness` (Ventanas); `national_or_imported` duplica `origin`; `regional_availability` duplica `national_availability`; `surface_weight` (Cielos) duplica `weight_density`.
4. **Cuatro estrategias de citación** incompatibles entre sí (texto libre, códigos en otra hoja, códigos al pie, siglas con localizador).
5. **Estados de dato ambiguos**: celda vacía, «No disponible», «No aplica», «—» y «PENDIENTE» conviven con significados distintos según el estudiante.
6. **Listas controladas usadas como texto libre**: «Condicionado: bajo la capa activa…», «Ambos (uso predominante en interior…)».
7. **No existe atributo de certeza** (verificado / rango de literatura / estimado por analogía), exigido por el protocolo de trazabilidad del curso.

---

## 2. Principios de diseño

| Principio | Decisión |
|---|---|
| Una ficha = un archivo | `data/<componente>/<ID>.json`. Minimiza conflictos en GitHub: cada estudiante edita solo sus archivos. |
| Fuente única de verdad | `estandar/diccionario_campos.csv`. El JSON Schema y las plantillas Excel se **generan** desde él. |
| Núcleo + módulo | 92 campos comunes a todos los componentes + 7 módulos específicos (9 a 13 campos). |
| El dato y su trazabilidad viajan juntos | Cada campo es un objeto: valor, unidad, fuentes, evidencia, certeza, nota. |
| Nada se inventa | El migrador nunca asigna certeza ni convierte un texto ambiguo: lo deja marcado para que el estudiante decida. |
| Ficha ≠ evaluación | La ficha describe el material. La matriz multicriterio 0–3 (43 indicadores) es una capa aparte que la referencia. |

---

## 3. Estructura de una ficha

```json
{
  "schema_version": "1.0",
  "meta": {
    "id": "PIS-CER-01",
    "componente": "PIS",
    "autor": "Alejandro Sáenz Castro",
    "estado_revision": "borrador",
    "fecha_actualizacion": "2026-10-26",
    "id_legado": "PIS-CR-01"
  },
  "campos": {
    "thermal_conductivity": {
      "estado": "dato",
      "valor": 1.3,
      "calificador": "=",
      "unidad": "W/(m·K)",
      "fuentes": [{ "ref": "ISO10456", "loc": "tabla 3" }],
      "evidencia": "E3",
      "certeza": "verificado",
      "nota": "Valor de diseño en seco; no describe desempeño en servicio en clima húmedo."
    },
    "total_thickness": {
      "estado": "dato", "min": 15, "max": 20, "calificador": "rango", "unidad": "mm",
      "fuentes": [{ "ref": "R01" }], "evidencia": "E1", "certeza": "estimado_analogia"
    },
    "cleanability": {
      "estado": "dato", "valor": 4, "evidencia": "E2", "fuentes": [{ "ref": "R05" }],
      "justificacion": "Superficie esmaltada no porosa; la junta cementicia es el punto débil."
    },
    "embodied_carbon": { "estado": "no_disponible", "nota": "Sin EPD del producto comercializado en CR." }
  },
  "fuentes": [
    { "id": "ISO10456", "cita": "International Organization for Standardization. (2007). ISO 10456:2007…", "tipo": "norma" }
  ]
}
```

### 3.1 Atributos de cada campo

| Atributo | Uso | Regla |
|---|---|---|
| `estado` | `dato` · `no_disponible` · `no_aplica` · `pendiente` | Obligatorio. Nunca una celda vacía ni un cero para dato ausente. |
| `valor` | Número, texto, elemento de lista o arreglo (listas múltiples) | Tipo según diccionario. Sin unidades ni comentarios dentro. |
| `min`, `max` | Rangos | Con `calificador: "rango"`. |
| `calificador` | `=` · `≈` · `≥` · `≤` · `rango` | Reemplaza «≈ 16», «20+», «> 420». |
| `unidad` | SI, de la lista permitida para el campo | Obligatoria en números. |
| `fuentes` | `[{ref, loc}]` | `ref` apunta a la bibliografía de la ficha; `loc` = página, tabla o sección. |
| `evidencia` | E1 criterio propio · E2 fabricante · E3 norma/ensayo · E4 independiente · E5 varias | Tipo de fuente. |
| `certeza` | `verificado` · `rango_literatura` · `estimado_analogia` | Calidad del número. Obligatoria en números. E1 nunca es `verificado`. |
| `justificacion` | Texto | Obligatoria en escalas 1–5: un puntaje sin criterio no entra a la matriz. |
| `nota` | Texto | Condiciones, alcance, diferencia laboratorio / servicio. |
| `valor_texto_original` | Solo en fichas migradas | Texto que el migrador no pudo convertir. Debe resolverse y eliminarse. |

---

## 4. Núcleo común (92 campos, 14 secciones)

| Sección | Campos | Cambios respecto de la plantilla original |
|---|---:|---|
| Identificación | 10 | `component` pasa a código (CIM, PIS, PAR, CUB, CIE, PUE, VEN) |
| Configuración | 11 | `weight_density` se separa en `density` (kg/m³) y `surface_mass` (kg/m²); `total_thickness_mm` → `total_thickness` |
| Sistema constructivo | 3 | **Nuevo en el núcleo** (aporte de Cimentaciones y Pisos) |
| Aplicación | 13 | `imn_subregions` (códigos IMN, enlaza con BD_Clima); absorbe `climate_zone` y `regional_availability` |
| Desempeño físico | 4 | `mechanical_resistance` exige unidad o sistema de clase |
| Agua y ambiente | 7 | + `vapor_permeability` (μ) |
| Térmico | 7 | + `specific_heat`, `thermal_emittance` (marco de 6 dimensiones) |
| Acústico | 2 | Unidades explícitas dB (Rw) / dB (STC); NRC / αw |
| Fuego | 3 | Citar sistema de clasificación (EN 13501-1, ASTM E84…) |
| Salud y seguridad | 5 | — |
| Mantenimiento | 7 | — |
| Ambiental | 12 | Absorbe `national_or_imported` en `origin`; + `embodied_carbon_modules` (A1–A3…) |
| Contexto Costa Rica | 5 | **Nuevo en el núcleo**: región, sismicidad, tradición, normativa CR, requisitos en planos |
| Síntesis | 3 | **Nuevo en el núcleo**: ventajas, limitaciones, gráficos |

38 campos del núcleo son obligatorios. El detalle de cada campo (tipo, unidad, dominio, dimensión del marco de análisis, clave legada) está en `estandar/diccionario_campos.csv`.

## 5. Módulos por componente

| Código | Componente | Campos | Notas |
|---|---|---:|---|
| CIM | Cimentaciones | 10 | Geotecnia; `excavation_safety` se mueve aquí desde Salud |
| PIS | Pisos | 9 | `slip_resistance` exige método (DCOF, PTV, R) |
| PAR | Paredes y cerramientos | 10 | `capillary_absorption` en kg/(m²·√h), EN ISO 15148 |
| CUB | Cubiertas | 10 | `rain_noise` corregido a dB |
| CIE | Cielos | 8 | `surface_weight` pasa al núcleo como `surface_mass` |
| PUE | Puertas | 11 | `air_tightness` unificado con Ventanas |
| VEN | Ventanas | 13 | `opening_type`, `frame_material`, `air_tightness` compartidos con Puertas |

El schema impide que una ficha use campos de otro módulo.

## 6. Identificadores

Formato `COMP-SUB-NN`: código de componente, subcategoría de 2–4 caracteres y consecutivo dentro del componente. Ejemplos: `PIS-CER-01`, `VEN-PVC-05`, `CIM-PIL-05`. El ID anterior se conserva en `meta.id_legado`. La tabla de equivalencias está en `estandar/mapa_ids_migracion.csv`.

## 7. Enlace con la base climática y con la matriz multicriterio

- `meta.componente` → `T_COMPONENTE` de *BD_Clima_Materiales_CR* (mapa en `listas.json`).
  **Provisional**: Cielos → C5 (Acabados) y Puertas/Ventanas → C9 (Elementos tipológicos). Confirmar.
- `campos.imn_subregions` → `T_ZONA` (27 subregiones IMN).
- La evaluación 0–3 se guardará aparte (`evaluaciones/<ID>.json`) con los 43 indicadores de `estandar/indicadores_matriz.csv`.

> **Discrepancia detectada.** `T_INDICADOR` de BD_Clima usa una distribución provisional por grupo (A5·B5·C7·D5·E5·F5·G6·H5). La matriz del curso, tal como la reproduce el anexo de Pisos, distribuye los 43 indicadores como **A3·B8·C9·D2·E5·F4·G7·H5**. `indicadores_matriz.csv` contiene los nombres reales y puede pegarse en `T_INDICADOR` (columnas B y D) para cerrar el pendiente (a) del LEEME.

## 8. Validación

`python scripts/validar.py` aplica el schema y las reglas de trazabilidad:

| Código | Nivel | Regla |
|---|---|---|
| E01 | Error | Violación del schema (tipo, lista, unidad, ID, campo de otro módulo) |
| E04 | Error | Queda texto legado sin convertir (`valor_texto_original`) |
| E05 | Error | Campo obligatorio en estado `pendiente` |
| E06 | Error | Cita una fuente que no está en la bibliografía |
| E07 | Error | Dato sin evidencia E1–E5 |
| E08 | Error | E1 declarado como `verificado` |
| E09 | Error | Número sin unidad |
| A01 | Aviso | Dato sin fuente |
| A02 | Aviso | Número sin certeza |
| A03 | Aviso | Escala 1–5 sin justificación |
| A04 | Aviso | Campo opcional sin completar |
| A05 | Aviso | Sigla de fuente sin referencia APA completa |

**Índice de trazabilidad (IT)**: porcentaje de datos con fuente y evidencia (y certeza, si son numéricos). Es el indicador que se reporta por ficha y por estudiante.

### 8.1 Estado tras la migración

| Componente | Fichas | IT medio | Números a convertir (E04) | Obligatorios pendientes (E05) | Escalas sin justificar (A03) |
|---|---:|---:|---:|---:|---:|
| Cielos | 5 | 92 % | 1 | 45 | 0 |
| Paredes | 5 | 97 % | 9 | 45 | 65 |
| Puertas | 4 | 84 % | 27 | 36 | 41 |
| Pisos | 7 | 80 % | 25 | 0 | 90 |
| Cubiertas | 7 | 79 % | 5 | 69 | 91 |
| Ventanas | 5 | 76 % | 14 | 45 | 65 |
| Cimentaciones | 5 | 61 % | 13 | 0 | 40 |

Los E05 de Cielos, Paredes, Puertas, Cubiertas y Ventanas corresponden casi en su totalidad a los campos nuevos del núcleo (Sistema constructivo, Contexto CR, Síntesis), que Cimentaciones y Pisos ya habían desarrollado. Ninguna ficha tiene todavía `certeza`: es el primer trabajo de la semana de migración.

## 9. Flujo de trabajo

Ver `CONTRIBUTING.md`. En síntesis: rama por estudiante → editar solo `data/<su componente>/` → `validar.py` sin errores → Pull Request → revisión docente → `estado_revision: aprobado`.

## 10. Cambios al estándar

Cualquier campo nuevo, unidad o valor de lista se propone por Pull Request que modifique **solo** `diccionario_campos.csv` o `listas.json`, y luego se regeneran schema y plantillas (`generar_schema.py`, `generar_plantillas.py`). Versionado: cambios compatibles → 1.x; cambios que rompen fichas existentes → 2.0.
