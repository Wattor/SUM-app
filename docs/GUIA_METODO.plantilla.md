# SUM · Guía de método, corrección y mejora

**Selección y Uso de Materiales** · Maestría en Arquitectura Tropical, Universidad de Costa Rica · Curso Materiales y Técnicas Avanzadas
Versión 1.1 · noviembre de 2026 · Mag. Arq. Minor Martin Aguilar

Esta guía acompaña a la aplicación SUM. Explica qué calcula, de dónde sale cada regla, qué se corrigió en la versión 1.1, qué debe corregir cada autor de ficha y qué falta calibrar. El uso paso a paso está en la pestaña **Tutorial** de la app.

---

## 1. Propósito y alcance

SUM cruza el clima de un sitio con las fichas de sistemas constructivos del curso y ordena las alternativas de cada componente (cimentaciones, pisos, paredes, cubiertas, cielos, puertas, ventanas) según seis dimensiones: térmica, higrotérmica, mecánico-estructural, durabilidad y mantenimiento, ambiental / ACV y constructibilidad.

Es una herramienta docente. Su resultado es un argumento para discutir en taller, no una especificación. Quedan fuera del alcance los precios, proveedores y disponibilidad de mercado: los campos de costo de las fichas no entran al puntaje.

## 2. Cadena de cálculo

### 2.1 Del clima a las exigencias

Cada variable climática se clasifica en un nivel de 0 a 3 con los umbrales de la tabla. El microclima suma o resta un nivel; el resultado siempre queda entre 0 y 3.

| Código | Exigencia | Variable | Nivel 1 | Nivel 2 | Nivel 3 |
|---|---|---|---|---|---|
| E_CAL | Calor | T máx media (°C) ≥ | 27 | 30 | 32 |
| E_FRIO | Frío | T mín media (°C) ≤ | 18 | 15 | 12 |
| E_LLUV | Lluvia | Precipitación anual (mm) ≥ | 2000 | 3000 | 4000 |
| E_PERS | Persistencia de humedad | Días con lluvia al año ≥ | 120 | 160 | 200 |
| E_SECA | Estacionalidad seca | Meses secos ≥ | 2 | 3 | 5 |
| E_AMPL | Amplitud térmica | T máx − T mín (°C) ≥ | 8 | 10 | 12 |
| E_SAL | Ambiente salino | Distancia a la costa (km) ≤ | 10 | 3 | 1 |
| E_SIS | Sismicidad | Zona CSCR-2010 | II | III | IV |
| E_VIE | Viento | Zona CFIA 2023 | I–II | III–IV | V |

Ajustes de microclima: sombra alta sobre la envolvente, −1 a E_CAL; sitio protegido del viento, −1 a E_VIE; sitio expuesto, +1 a E_VIE. Si las temperaturas vienen de una estación a otra altitud, se corrigen con 6,5 °C por cada 1000 m. Si no hay distancia a la costa, E_SAL toma 3 cuando la subregión es costera y 0 cuando no lo es.

De un archivo EPW se obtienen: T máx y T mín medias (promedio de máximas y mínimas diarias), T media, lluvia anual, días con lluvia (≥ 1 mm), meses secos (< 75 mm, criterio IMN), humedad relativa, radiación global y viento. **Un EPW no trae** zona sísmica, zona de viento CFIA ni distancia a la costa. Muchos EPW tampoco traen lluvia: la app lo detecta y hereda la subregión.

### 2.2 De las exigencias a los pesos

Para cada dimensión *d*:

- Factor climático: F_d = 1 + Σ(sensibilidad_e,d × nivel_e) / (3 × Σ sensibilidad_e,d), entre 1,00 y 2,00.
- Peso: W_d = base_d × F_d / Σ(base × F).

La sensibilidad (0, 1 o 2) dice cuánto influye cada exigencia en cada dimensión. El peso base lo decide el proyecto; por defecto todas las dimensiones valen 1. La dimensión ambiental no tiene sensibilidad climática: en un sitio exigente pierde peso relativo, y esa es una decisión que el proyecto debe tomar a conciencia.

### 2.3 De la ficha al puntaje 0–3 por dimensión

El puntaje de una dimensión es el promedio de sus indicadores activos que tienen dato:

| Tipo de dato | Regla |
|---|---|
| Escala 1–5 | (v − 1) / 4 × 3; se invierte si menor es mejor |
| Sí / Condicionado / No | 3 / 1,5 / 0 |
| Listas de aptitud o procedencia | Tabla de equivalencia declarada en el indicador |
| Número con unidad | Relativo al conjunto comparado del mismo componente: proporcional (v / máx, o mín / v) × 3, o mín–máx. Un rango entra por su punto medio. Solo se comparan valores con la misma unidad y hacen falta al menos dos |
| Clase o texto («PEI 4», «Clase A») | No se puntúa solo: se muestra y la dimensión admite puntaje manual |

Un indicador puede estar condicionado al clima (por ejemplo, la reflectancia solar solo puntúa si hay exigencia de calor) o al componente.

Tres reglas evitan sesgos conocidos:

- **Solape.** Los indicadores que miden lo mismo cuentan una sola vez dentro de la dimensión: transmitancia U, resistencia R y conductividad λ forman el grupo «aislamiento»; reflectancia, emisividad y SRI, el grupo «respuesta solar». Se promedia el grupo y luego los grupos.
- **Analogías.** Un dato de complemento con certeza «estimado por analogía» se muestra pero no puntúa.
- **Valores cero o negativos** (posibles en carbono incorporado de madera): la normalización proporcional no aplica y se usa mín–máx.

El promedio simple de indicadores implica pesos iguales entre los que tienen dato. Es una convención, no un resultado: cambia si se activa o desactiva un indicador.

### 2.4 Puntaje en el sitio, ranking y alertas

- Puntaje genérico = promedio de las dimensiones con dato ÷ 3.
- Puntaje en el sitio = Σ(puntaje_d × W_d) ÷ 3, renormalizado sobre las dimensiones con dato.
- Una ficha con menos de 3 dimensiones con dato no entra al ranking.
- **Cobertura de datos** de cada puntaje: alta desde 70 % de indicadores con dato, media desde 40 %, baja por debajo; con cobertura baja la app indica «evidencia insuficiente para recomendar». Promediar solo lo disponible puede favorecer a una ficha incompleta. La cobertura mide cantidad de datos, no su calidad: esa se lee en la evidencia (E1–E5) y la certeza de cada dato.
- **No recomendable:** una alternativa con alerta crítica conserva su puntaje pero no se propone como mejor opción. Una incompatibilidad con el clima no se compensa con otras dimensiones.
- **Alerta crítica:** puntaje 0 en una dimensión cuyo peso es ≥ 20 %.
- **Alertas clima × material:** reglas que cruzan una exigencia con un dato de la ficha (ver anexo B).
- **Sensibilidad:** el primer lugar se recalcula sin clima, duplicando el peso de cada dimensión y quitándola. Un margen menor a 3 puntos se lee como empate.

## 3. Qué es fuente y qué es propuesta

| Elemento | Origen | Estado |
|---|---|---|
| 27 subregiones IMN y sus valores | Solano y Villalobos (1996), vía la base Clima × Materiales del curso | Preliminar: verificar contra el documento original |
| Umbrales 0–3, microclima, zona de viento → nivel | Matriz de Clima de Sitio v1.0 | Propuesta del curso, a calibrar |
| Sensibilidad exigencia × dimensión | Matriz de Clima de Sitio v1.0, hoja PESOS | Propuesta del curso, a calibrar |
| Qué indicadores puntúan, en qué sentido, y reglas de alerta | `estandar/indicadores_app.json` (integración, nov. 2026) | Propuesta nueva: validar con el grupo |
| Mínimo de 3 dimensiones para entrar al ranking | `estandar/clima_parametros.json` | Propuesta nueva |
| Datos de cada sistema | Fichas TP1 de cada estudiante | Según evidencia y certeza de cada dato |
| Datos de complemento (fuente INT-CEC) | Catálogo de Elementos Constructivos del CTE, sección 3 | Valor genérico de norma; pendiente de validar por el autor |

## 4. Qué cambió en la versión 1.1

### 4.1 Conversión de textos del autor (errores E04)

Los 70 errores E04 quedaron resueltos. Eran datos que el autor había escrito como texto («≈ 200 (aluminio); ≈ 1,0 (vidrio)», «Supera los 35 años») y que el estándar pide como número, rango o valor de lista. La conversión no agrega información: el texto original se conserva en la nota del campo y no se asignó certeza, que debe declarar el autor. Cuando el texto no correspondía al campo (por ejemplo, volumen de concreto donde se pide masa superficial), el campo pasó a «no disponible» con la explicación. Dos resistencias a flexión de pisos, escritas como texto, pasaron a número para que puedan compararse.

Toda conversión es una interpretación y el autor debe confirmarla. Tres casos requieren su atención: los valores «supera los N años» se registraron como «≥ N», no como valor puntual; «no permitido, salvo estudio muy cuidadoso» se registró como «No admitido», con la salvedad en la nota (el autor debe decidir si corresponde «No recomendado»); y de la reflectancia solar con valor inicial y envejecido se registró el inicial, con el envejecido en la nota.

### 4.2 Complemento desde norma

Se llenaron 76 datos de densidad, conductividad térmica, calor específico y factor de resistencia al vapor (μ) del **material principal** en 28 fichas, solo donde el campo estaba «pendiente» o «no disponible». Fuente única: Catálogo de Elementos Constructivos del CTE (IETcc, 2010), sección 3, cuyos valores de diseño se obtienen según UNE-EN ISO 10456.

Cada dato de complemento:

- cita la fuente `INT-CEC` con la sección del catálogo;
- lleva evidencia E4 y certeza `rango_literatura`, o `estimado_analogia` cuando el catálogo no trae el material exacto (bloque de concreto N-15, teja asfáltica, fibrocemento);
- declara en su nota que es un valor genérico del material, no del producto ni del sistema, referido a 10 °C y humedad de equilibrio a 23 °C y 50 % HR;
- aparece en la app con la etiqueta «complemento» y puede excluirse del cálculo con una casilla.

No se usa una norma costarricense porque no se localizó una tabla nacional pública de propiedades higrotérmicas de diseño; el catálogo español es la referencia iberoamericana más cercana y está en español. Si INTECO o el CFIA publican valores propios, deben prevalecer.

Discrepancia que el autor debe resolver: la ficha de porcelanato declara λ = 1,3 W/(m·K), mientras el catálogo da 2,30 para baldosa de gres; se respetó el dato del autor y los demás valores de esa ficha provienen del catálogo, de modo que no forman un conjunto homogéneo.

El detalle, ficha por ficha, está en `reportes/complemento_integracion.md`. El procedimiento es reproducible: `python scripts/complementar.py`.

### 4.3 Lo que no se completó, y por qué

| Pendiente | Motivo |
|---|---|
| 85 errores E05 que no se pudieron derivar: tipo de tradición (26), fotografías y detalles (26), normativa costarricense cuando la bibliografía de la ficha no cita ninguna (16) y otros 17 | Requieren criterio o material del autor. Se completan con el editor de la app (sección 4.5) |
| 1 error E07 | El dato cita una fuente externa: el tipo de evidencia solo lo conoce quien la consultó |
| Certeza de los números de los autores | El estándar impide que un tercero la asigne |
| Emisividad térmica | No se verificó una tabla de fuente primaria durante la integración |
| Carbono incorporado faltante | Las bases consultadas (ICE) no se pudieron verificar valor por valor; además las fichas usan tres unidades funcionales distintas |
| Resistencias mecánicas en texto (f'c, cargas admisibles por luz, clases) | Son propiedades distintas entre fichas: convertirlas a un número común compararía cosas no comparables |

### 4.4 Ajustes a los criterios

- La conductividad térmica del material dejó de puntuar en cubiertas, puertas y ventanas: en una lámina de 0,5 mm o en un marco, la λ no describe el elemento; ahí gobiernan U, R, reflectancia y SHGC.
- La resistencia mecánica puntúa cuando es un número con unidad comparable.
- La densidad **no** puntúa. La masa térmica útil depende del espesor, del calor específico, de la exposición de la masa y de que exista enfriamiento nocturno; premiar la densidad sola sería un error.
- La transmitancia visible y la disponibilidad de EPD quedan inactivas por defecto: más luz puede ser deslumbramiento, y una EPD acredita información, no menor impacto.
- Los datos de densidad, calor específico y μ agregados como complemento se muestran para apoyar el análisis por capas, pero no entran al puntaje.

### 4.5 Síntesis de campos descriptivos y editor de corrección

De los 240 errores E05, 155 se resolvieron por **síntesis**: el texto de cada campo obligatorio pendiente se armó con datos que el autor ya había escrito en otros campos de la misma ficha (capas y fijación para la secuencia de ejecución; escalas y su justificación para mano de obra, ventajas y limitaciones; bibliografía para la normativa costarricense). No hay redacción nueva ni información externa. Cada campo sintetizado cita la fuente `INT-SIN`, lleva evidencia E1 y una nota que pide al autor revisarlo y reescribirlo. Es un borrador ordenado, no la síntesis crítica que el campo pide. Diecisiete datos sin evidencia y sin fuente externa quedaron como E1 (criterio propio). Detalle en `reportes/sintesis_descriptivos.md`; procedimiento en `scripts/completar_descriptivos.py`.

Lo que no se puede derivar se corrige en la app: en la pestaña Fichas, cada ficha tiene el botón **Corregir faltantes y errores**, que lista los errores del validador con los campos para llenarlos, recalcula al guardar y permite descargar el .json corregido para el Pull Request. Declarar un campo como «no disponible» o «no aplica» también resuelve el error y es preferible a un dato sin respaldo.

## 5. Guía de corrección para autores de fichas

Orden de trabajo sugerido; el validador (`python scripts/validar.py data/<componente>/`) indica cada caso.

1. **Revisar las conversiones y complementos de su ficha** en `reportes/complemento_integracion.md`. Aceptar, corregir o reemplazar por el dato del producto. Un dato de ficha técnica del fabricante siempre es mejor que uno genérico.
2. **Declarar la certeza de cada número** (aviso A02). Hoy solo una fracción menor de los datos numéricos del catálogo tiene certeza, y casi toda proviene del complemento.
3. **Reescribir los campos sintetizados** (fuente INT-SIN) y completar los E05 restantes: tipo de tradición, gráficos y normativa costarricense.
4. **Confirmar la evidencia** de los datos marcados E1 por la integración.
5. **Justificar cada escala 1–5** (aviso A03). Un puntaje sin criterio escrito es una opinión.
6. **Sustituir clases y textos por valores ensayados** donde exista norma: absorción de agua, λ del producto, U del conjunto, resistencia a succión de viento, estanqueidad, reflectancia envejecida.
7. **Distinguir valor de laboratorio y desempeño en servicio**: anotar en la nota si el dato es en seco, inicial o envejecido.

Prioridad por componente, según lo que hoy limita el cálculo:

| Componente | Lo que más limita |
|---|---|
| Cielos | Más de la mitad de los campos en «no disponible»: solo 3 de 5 fichas entran al ranking |
| Cimentaciones | Pocos indicadores comparables; la aptitud por tipo de suelo domina |
| Paredes | Sin U ni R del sistema; sin absorción capilar |
| Cubiertas | Falta resistencia a succión de viento en 5 de 7 fichas |
| Puertas | Aislamiento acústico y hermeticidad solo cualitativos |
| Ventanas | Estanqueidad y carga de viento sin dato en 4 de 5 fichas |
| Pisos | Resistencia al deslizamiento como texto: no se compara |

## 6. Calibración pendiente (docente y grupo)

1. Verificar la equivalencia zona de viento CFIA → nivel 0–3 contra la Figura 3-1 de los Lineamientos.
2. Calibrar los cortes de salinidad por distancia: ISO 9223 clasifica por deposición de cloruros medida, no por kilómetros.
3. Calibrar la sensibilidad exigencia × dimensión con el grupo.
4. Verificar los valores de las 27 subregiones contra Solano y Villalobos (1996).
5. Validar el sentido de cada indicador (anexo A) y decidir si la masa del elemento debe puntuar en sismo.
8. Fijar una cobertura mínima común por componente (qué indicadores debe traer toda ficha para compararse).
6. Decidir el peso base de la dimensión ambiental.
7. Definir si la reflectancia y el SRI se registran en valor inicial o envejecido; para trópico húmedo, el envejecido representa mejor el servicio.

## 7. Hoja de ruta de mejora de la app

| Prioridad | Mejora | Qué resuelve |
|---|---|---|
| Alta | Calcular U y R del conjunto desde las capas (EN ISO 6946) | La dimensión térmica dejaría de depender de la λ de un solo material |
| Alta | Umbrales absolutos por indicador, con norma de respaldo | Elimina la dependencia del conjunto comparado |
| Alta | Separar requisitos obligatorios (cumple / no cumple) de preferencias puntuables | Evita que un incumplimiento se compense |
| Alta | Escalas de clases normalizadas (reacción al fuego, deslizamiento, abrasión) | Hace puntuables los datos que hoy son texto |
| Media | Verificación de condensación intersticial (método de Glaser, EN ISO 13788) con el clima mensual del EPW y la condición interior, incluido el edificio climatizado | Usa los μ y espesores que hoy solo se muestran |
| Media | Evaluación de la matriz de 43 indicadores del curso (0–3) como capa paralela | Enlaza con la matriz multicriterio original |
| Media | Carbono incorporado normalizado a una unidad funcional por componente | Hace comparable la dimensión ambiental |
| Media | Sugerencia de subregión IMN por coordenadas | Reduce un paso manual |
| Baja | Publicación con GitHub Pages y validación automática en cada Pull Request | Flujo de trabajo del grupo |

## 8. Revisión cruzada del método

La versión 1.1 pasó por dos rondas de revisión técnica externa asistida por IA (ChatGPT), además de la integración hecha con Claude. De esa revisión salieron las reglas de solape, la exclusión de analogías, el indicador de cobertura de datos, el bloqueo por alerta crítica y el retiro de la densidad, la transmitancia visible y la EPD del puntaje. La segunda ronda no dejó observaciones críticas abiertas para un uso docente, pero sí tres mejoras importantes: comparar prestaciones del conjunto (U, R, unidad funcional común) en lugar de propiedades del material, fijar un núcleo común de indicadores por componente para poder recomendar, y calibrar con referencias fijas y pruebas de estabilidad. Las observaciones que no se resolvieron en esta versión están recogidas como limitaciones (sección 9) y en la hoja de ruta (sección 7).

## 9. Limitaciones que conviene enseñar

- Un λ de catálogo en seco no describe el desempeño en servicio en trópico húmedo.
- Las propiedades del material principal no describen al sistema. Una ventana no es su aluminio ni una cubierta su acero: el desempeño del conjunto se mide con U, R, SHGC, estanqueidad y ensayos del sistema.
- El factor μ aislado no determina condensación ni secado: cuentan el espesor (s_d = μ·d), el orden de las capas, las juntas y las condiciones interiores. En un edificio climatizado puede haber condensación con clima exterior cálido; la app todavía no evalúa ese escenario.
- Sismo y viento se verifican comparando capacidad con demanda, con anclajes y fijaciones. Que la app prefiera un elemento liviano o una mayor resistencia declarada es una preferencia, no una verificación estructural.
- Los umbrales climáticos y las alertas son heurísticas docentes. Días con lluvia es un indicador indirecto del tiempo de humectación; meses secos, de la exposición UV; distancia a la costa, de la corrosividad. Los promedios no capturan extremos.
- En la dimensión ambiental, ser local, renovable o reciclable no garantiza menor impacto. La comparación rigurosa exige unidad funcional, vida de referencia y reposiciones comunes.
- La normalización relativa hace que el puntaje dependa de con quién se compara; no es una calificación absoluta.
- La dimensión mecánico-estructural casi no tiene indicadores numéricos comparables: suele quedar sin dato y debe puntuarse a mano.
- Las escalas 1–5 con evidencia E1 son criterio del autor.
- El puntaje no reemplaza la verificación normativa (CSCR, Reglamento de Construcciones, INTECO, Ley 7600) ni el diseño del detalle.
- Un EPW es un año típico o sintético: es un dato estimado, no una medición del sitio.

---

## Anexo A. Indicadores que puntúan

{{TABLA_INDICADORES}}

## Anexo B. Alertas clima × material

{{TABLA_ALERTAS}}

## Anexo C. Estado de las fichas tras el complemento

{{TABLA_FICHAS}}

---

## Fuentes y bibliografía

- Colegio Federado de Ingenieros y de Arquitectos. (2011). *Código Sísmico de Costa Rica 2010*, Tabla 2.1.
- Colegio Federado de Ingenieros y de Arquitectos. (2023). *Lineamientos para el diseño por viento de edificaciones en Costa Rica*. Alcance N.º 48, La Gaceta N.º 52, 21 de marzo de 2023.
- Instituto Eduardo Torroja de Ciencias de la Construcción, CEPCO y AICIA. (2010). *Catálogo de Elementos Constructivos del CTE* (versión 6.3, marzo de 2010), sección 3. Ministerio de Vivienda, España. https://www.codigotecnico.org/Recursos/Aplicaciones/CatalogoElementosConstructivos.html
- ISO 2533:1975. *Standard Atmosphere*.
- ISO 9223:2012. *Corrosion of metals and alloys — Corrosivity of atmospheres — Classification, determination and estimation*.
- Solano, J. y Villalobos, R. (1996). *Regiones y subregiones climáticas de Costa Rica*. Instituto Meteorológico Nacional.
- U.S. Department of Energy. *EnergyPlus Weather File (EPW) Data Dictionary*. Auxiliary Programs, EnergyPlus Documentation.
- UNE-EN ISO 10456. *Materiales y productos para la edificación. Propiedades higrotérmicas. Valores tabulados de diseño*.
- Fichas TP1 de sistemas constructivos y Matrices de Clima de Sitio de los estudiantes del curso (2026); la bibliografía de cada dato está en su ficha.
