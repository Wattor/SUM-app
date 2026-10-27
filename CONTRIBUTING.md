# Cómo contribuir

## Reglas

1. Cada estudiante trabaja en **su rama** y modifica **solo** los archivos de `data/<su componente>/`.
2. Nunca se edita `estandar/` directamente: los cambios al estándar se proponen en un Pull Request aparte, con justificación técnica.
3. Ningún Pull Request se integra con errores del validador (la verificación automática lo bloquea).
4. Un dato sin fuente identificable no se escribe: se declara `no_disponible`.

## Paso a paso

```bash
git checkout -b pisos/saenz-certeza          # rama: <componente>/<apellido>-<tema>
# editar data/pisos/*.json  (o llenar la plantilla Excel y convertirla)
python scripts/importar_plantilla.py plantillas/mi_ficha.xlsx   # solo si usaste Excel
python scripts/validar.py data/pisos/
git add data/pisos/
git commit -m "PIS-CER-01: certeza en datos térmicos y conversión de rangos"
git push -u origin pisos/saenz-certeza
# abrir Pull Request en GitHub y asignar al docente como revisor
```

## Prioridad de la semana de migración

1. Resolver todos los **E04**: cada `valor_texto_original` se convierte en `valor` o `min`/`max` + `unidad`, o en un valor de lista + `nota`. Luego se borra el atributo.
2. Agregar `certeza` a cada dato numérico (**A02**).
3. Escribir la `justificacion` de cada escala 1–5 (**A03**), o pasarla a `no_disponible`.
4. Completar los campos nuevos del núcleo (**E05**): Sistema constructivo, Contexto Costa Rica, Síntesis.
5. Completar la referencia APA de las siglas (**A05**).

## Revisión docente

El revisor cambia `meta.estado_revision` a `revisado` (con comentarios en el PR) y luego a `aprobado`. Solo las fichas `aprobado` entran a la matriz multicriterio.
