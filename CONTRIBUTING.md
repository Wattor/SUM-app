# Cómo contribuir

## Reglas

1. Cada estudiante trabaja en **su rama** y modifica **solo** los archivos de `data/<su componente>/`.
2. Nunca se edita `estandar/` directamente: los cambios al estándar se proponen en un Pull Request aparte, con justificación técnica.
3. Ningún Pull Request se integra con errores del validador (la verificación automática lo bloquea).
4. Un dato sin fuente identificable no se escribe: se declara `no_disponible`.

## Ramas por componente

El repositorio cuenta con una rama dedicada para cada componente y plantilla:

| Componente | Rama | Plantilla Excel | Carpeta de datos | Estudiante asignado |
|---|---|---|---|---|
| Cielos | `cielos` | `plantillas/Plantilla_Ficha_SUM_CIE.xlsx` | `data/cielos/` | Sebastián |
| Cimentaciones | `cimentaciones` | `plantillas/Plantilla_Ficha_SUM_CIM.xlsx` | `data/cimentaciones/` | M. Pardo |
| Cubiertas | `cubiertas` | `plantillas/Plantilla_Ficha_SUM_CUB.xlsx` | `data/cubiertas/` | J. Rodríguez |
| Paredes | `paredes` | `plantillas/Plantilla_Ficha_SUM_PAR.xlsx` | `data/paredes/` | Ó. Quesada |
| Pisos | `pisos` | `plantillas/Plantilla_Ficha_SUM_PIS.xlsx` | `data/pisos/` | A. Sáenz |
| Puertas | `puertas` | `plantillas/Plantilla_Ficha_SUM_PUE.xlsx` | `data/puertas/` | Verónica |
| Ventanas | `ventanas` | `plantillas/Plantilla_Ficha_SUM_VEN.xlsx` | `data/ventanas/` | J. Sandoval |

## Paso a paso

```bash
git checkout pisos                           # cambiarse a la rama de su componente
# editar data/pisos/*.json  (o llenar la plantilla Excel y convertirla)
python scripts/importar_plantilla.py plantillas/Plantilla_Ficha_SUM_PIS.xlsx   # solo si usaste Excel
python scripts/validar.py data/pisos/
git add data/pisos/
git commit -m "PIS-CER-01: certeza en datos térmicos y conversión de rangos"
git push -u origin pisos
# abrir Pull Request hacia 'main' en GitHub y asignar al docente como revisor
```

## Prioridad de la semana de migración

1. Resolver todos los **E04**: cada `valor_texto_original` se convierte en `valor` o `min`/`max` + `unidad`, o en un valor de lista + `nota`. Luego se borra el atributo.
2. Agregar `certeza` a cada dato numérico (**A02**).
3. Escribir la `justificacion` de cada escala 1–5 (**A03**), o pasarla a `no_disponible`.
4. Completar los campos nuevos del núcleo (**E05**): Sistema constructivo, Contexto Costa Rica, Síntesis.
5. Completar la referencia APA de las siglas (**A05**).

## Revisión docente

El revisor cambia `meta.estado_revision` a `revisado` (con comentarios en el PR) y luego a `aprobado`. Solo las fichas `aprobado` entran a la matriz multicriterio.
