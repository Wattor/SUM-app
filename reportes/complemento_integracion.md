# Complemento de integración · noviembre 2026

, y solo estas dos:

A. CONVERSIÓN (errores E04). Pasa a valor / mín–máx / lista lo que el autor ya había escrito como texto. No agrega información: el texto original se conserva en la nota. No asigna certeza (la declara el autor).

B. COMPLEMENTO DE NORMA. Llena densidad, conductividad, calor específico y factor μ del MATERIAL PRINCIPAL cuando el campo estaba «pendiente» o «no disponible», con los valores de diseño genéricos del Catálogo de Elementos Constructivos del CTE (IETcc, 2010, sección 3; valores según UNE-EN ISO 10456). Cada dato lleva la fuente INT-CEC, certeza «rango_literatura» o «estimado_analogia» y una nota que lo identifica como complemento pendiente de validar por el autor. Nunca sustituye un dato del autor.

Cada fila es un cambio aplicado a una ficha. El autor de la ficha debe revisarlo y, si lo acepta, declararlo en su Pull Request.

| Ficha | Campo | Tipo de cambio | Origen (texto del autor o fila del catálogo) | Valor que queda |
|---|---|---|---|---|
| CIE-FBC-02 | `thermal_conductivity` | complemento CEC (estimado_analogia) | Tablero de partículas con cemento §3.3.2 | 0.23 W/(m·K) |
| CIE-FBC-02 | `specific_heat` | complemento CEC (estimado_analogia) | Tablero de partículas con cemento §3.3.2 | 1500 J/(kg·K) |
| CIE-FBC-02 | `vapor_permeability` | complemento CEC (estimado_analogia) | Tablero de partículas con cemento §3.3.2 | 30 adimensional |
| CIE-GYP-01 | `wet_area_use` | conversión | No para exposición continua o excesiva a humedad. | No  |
| CIE-GYP-01 | `density` | complemento CEC (rango_literatura) | Placa de yeso laminado (PYL) §3.6.2 | 750–900 kg/m³ |
| CIE-GYP-01 | `thermal_conductivity` | complemento CEC (rango_literatura) | Placa de yeso laminado (PYL) §3.6.2 | 0.25 W/(m·K) |
| CIE-GYP-01 | `specific_heat` | complemento CEC (rango_literatura) | Placa de yeso laminado (PYL) §3.6.2 | 1000 J/(kg·K) |
| CIE-GYP-01 | `vapor_permeability` | complemento CEC (rango_literatura) | Placa de yeso laminado (PYL) §3.6.2 | 4 adimensional |
| CIE-MET-05 | `density` | complemento CEC (rango_literatura) | Acero §3.2 | 7800 kg/m³ |
| CIE-MET-05 | `thermal_conductivity` | complemento CEC (rango_literatura) | Acero §3.2 | 50 W/(m·K) |
| CIE-MET-05 | `specific_heat` | complemento CEC (rango_literatura) | Acero §3.2 | 450 J/(kg·K) |
| CIE-PVC-04 | `density` | complemento CEC (rango_literatura) | Cloruro de polivinilo (PVC) §3.9.1 | 1390 kg/m³ |
| CIE-PVC-04 | `thermal_conductivity` | complemento CEC (rango_literatura) | Cloruro de polivinilo (PVC) §3.9.1 | 0.17 W/(m·K) |
| CIE-PVC-04 | `specific_heat` | complemento CEC (rango_literatura) | Cloruro de polivinilo (PVC) §3.9.1 | 900 J/(kg·K) |
| CIE-PVC-04 | `vapor_permeability` | complemento CEC (rango_literatura) | Cloruro de polivinilo (PVC) §3.9.1 | 50000 adimensional |
| CIM-LOS-04 | `angular_distortion` | conversión | No gobierna en losa rígida | no_aplica  |
| CIM-LOS-04 | `liquefiable_soil` | conversión | No admitido con alto potencial demostrado | No admitido  |
| CIM-LOS-04 | `density` | complemento CEC (rango_literatura) | Hormigón armado 2300 < ρ ≤ 2500 §3.4.1 | 2300–2500 kg/m³ |
| CIM-LOS-04 | `thermal_conductivity` | complemento CEC (rango_literatura) | Hormigón armado 2300 < ρ ≤ 2500 §3.4.1 | 2.3 W/(m·K) |
| CIM-LOS-04 | `specific_heat` | complemento CEC (rango_literatura) | Hormigón armado 2300 < ρ ≤ 2500 §3.4.1 | 1000 J/(kg·K) |
| CIM-LOS-04 | `vapor_permeability` | complemento CEC (rango_literatura) | Hormigón armado 2300 < ρ ≤ 2500 §3.4.1 | 80 adimensional |
| CIM-PAI-02 | `angular_distortion` | conversión | 0,0025–0,004 l (marcos de concreto reforzado) | 0.0025–0.004 adimensional |
| CIM-PAI-02 | `collapsible_soil` | conversión | No permitido, salvo estudio muy cuidadoso de asentamiento diferencial | No admitido  |
| CIM-PAI-02 | `surface_mass` | conversión | 0,175 m³ (zona II-III) · 0,300 m³ (zona IV) de concreto por placa | no_disponible  |
| CIM-PAI-02 | `density` | complemento CEC (rango_literatura) | Hormigón armado 2300 < ρ ≤ 2500 §3.4.1 | 2300–2500 kg/m³ |
| CIM-PAI-02 | `specific_heat` | complemento CEC (rango_literatura) | Hormigón armado 2300 < ρ ≤ 2500 §3.4.1 | 1000 J/(kg·K) |
| CIM-PAI-02 | `vapor_permeability` | complemento CEC (rango_literatura) | Hormigón armado 2300 < ρ ≤ 2500 §3.4.1 | 80 adimensional |
| CIM-PCO-01 | `angular_distortion` | conversión | 0,001 l (fisuración de repellos) · 0,001–0,002 l (muros de ladrillo, u | 0.001–0.002 adimensional |
| CIM-PCO-01 | `liquefiable_soil` | conversión | No admitido con alto potencial demostrado: usar cimentación profunda o | No admitido  |
| CIM-PCO-01 | `surface_mass` | conversión | 0,070 m³/ml y 2,69 kg/ml de acero (un piso) · 0,110 m³/ml y 5,88 kg/ml | no_disponible  |
| CIM-PCO-01 | `density` | complemento CEC (rango_literatura) | Hormigón armado 2300 < ρ ≤ 2500 §3.4.1 | 2300–2500 kg/m³ |
| CIM-PCO-01 | `specific_heat` | complemento CEC (rango_literatura) | Hormigón armado 2300 < ρ ≤ 2500 §3.4.1 | 1000 J/(kg·K) |
| CIM-PCO-01 | `vapor_permeability` | complemento CEC (rango_literatura) | Hormigón armado 2300 < ρ ≤ 2500 §3.4.1 | 80 adimensional |
| CIM-PIL-05 | `angular_distortion` | conversión | Según la superestructura | no_disponible  |
| CIM-PIL-05 | `liquefiable_soil` | conversión | Recomendado, con estabilidad garantizada por capas no licuables dentro | Recomendado  |
| CIM-PRS-03 | `settlement_limit` | conversión | Según la placa que soporta | no_disponible  |
| CIM-PRS-03 | `angular_distortion` | conversión | Según la placa que soporta | no_disponible  |
| CIM-PRS-03 | `liquefiable_soil` | conversión | No admitido con alto potencial demostrado | No admitido  |
| CUB-MET-01 | `origin` | conversión | Nacional | Importado | Mixto  |
| CUB-MET-01 | `density` | complemento CEC (rango_literatura) | Acero §3.2 | 7800 kg/m³ |
| CUB-MET-01 | `specific_heat` | complemento CEC (rango_literatura) | Acero §3.2 | 450 J/(kg·K) |
| CUB-MET-02 | `surface_mass` | conversión | ≈3,9–4,0 (cal. 26); menor en cal. 28 | 3.9–4.0 kg/m² |
| CUB-MET-02 | `solar_reflectance` | conversión | 0,68 inicial; 0,55 envejecida | 0.68 0–1 |
| CUB-MET-02 | `sri` | conversión | 68 inicial; 26 envejecido (3 años) | 68 adimensional |
| CUB-MET-02 | `density` | complemento CEC (rango_literatura) | Acero §3.2 | 7800 kg/m³ |
| CUB-MET-02 | `specific_heat` | complemento CEC (rango_literatura) | Acero §3.2 | 450 J/(kg·K) |
| CUB-MET-03 | `density` | complemento CEC (rango_literatura) | Acero §3.2 | 7800 kg/m³ |
| CUB-MET-03 | `specific_heat` | complemento CEC (rango_literatura) | Acero §3.2 | 450 J/(kg·K) |
| CUB-MET-07 | `density` | complemento CEC (rango_literatura) | Acero §3.2 | 7800 kg/m³ |
| CUB-MET-07 | `thermal_conductivity` | complemento CEC (rango_literatura) | Acero §3.2 | 50 W/(m·K) |
| CUB-MET-07 | `specific_heat` | complemento CEC (rango_literatura) | Acero §3.2 | 450 J/(kg·K) |
| CUB-TAS-06 | `density` | complemento CEC (estimado_analogia) | Betún fieltro o lámina §3.12 | 1100 kg/m³ |
| CUB-TAS-06 | `thermal_conductivity` | complemento CEC (estimado_analogia) | Betún fieltro o lámina §3.12 | 0.23 W/(m·K) |
| CUB-TAS-06 | `specific_heat` | complemento CEC (estimado_analogia) | Betún fieltro o lámina §3.12 | 1000 J/(kg·K) |
| CUB-TAS-06 | `vapor_permeability` | complemento CEC (estimado_analogia) | Betún fieltro o lámina §3.12 | 50000 adimensional |
| CUB-TBA-05 | `origin` | conversión | Nacional | Importado | Mixto  |
| CUB-TBA-05 | `density` | complemento CEC (rango_literatura) | Teja de arcilla cocida §3.14 | 2000 kg/m³ |
| CUB-TBA-05 | `thermal_conductivity` | complemento CEC (rango_literatura) | Teja de arcilla cocida §3.14 | 1.0 W/(m·K) |
| CUB-TBA-05 | `specific_heat` | complemento CEC (rango_literatura) | Teja de arcilla cocida §3.14 | 800 J/(kg·K) |
| CUB-TBA-05 | `vapor_permeability` | complemento CEC (rango_literatura) | Teja de arcilla cocida §3.14 | 30 adimensional |
| PAR-FVE-05 | `water_absorption` | conversión | Paneles metálicos no absorben agua; la estanqueidad corresponde al res | no_aplica  |
| PAR-FVE-05 | `origin` | conversión | ACM: suministro local con componentes industrializados; acero patinabl | Mixto  |
| PAR-FVE-05 | `end_of_life` | conversión | Reciclaje de metales; ACM sujeto a separación y gestor; resto según tr | ['Reciclaje', 'Otro']  |
| PAR-LIV-03 | `origin` | conversión | Nacional y componentes importados | Mixto  |
| PAR-LIV-03 | `end_of_life` | conversión | Reciclaje parcial; vertedero según separación y gestor | ['Reciclaje', 'Vertedero']  |
| PAR-MAM-01 | `end_of_life` | conversión | Reciclaje; vertedero si no existe separación o recepción | ['Reciclaje', 'Vertedero']  |
| PAR-MAM-01 | `thermal_conductivity` | complemento CEC (estimado_analogia) | Bloque de hormigón convencional §3.4.2 | 1.18 W/(m·K) |
| PAR-MAM-01 | `specific_heat` | complemento CEC (estimado_analogia) | Bloque de hormigón convencional §3.4.2 | 1000 J/(kg·K) |
| PAR-MAM-01 | `vapor_permeability` | complemento CEC (estimado_analogia) | Bloque de hormigón convencional §3.4.2 | 10 adimensional |
| PAR-MCO-04 | `origin` | conversión | Fabricación local con componentes nacionales e importados | Mixto  |
| PAR-MCO-04 | `end_of_life` | conversión | Reciclaje parcial de aluminio y vidrio; otros residuos según gestor | ['Reciclaje', 'Otro']  |
| PAR-PRE-02 | `end_of_life` | conversión | Reciclaje; vertedero según separación y gestor | ['Reciclaje', 'Vertedero']  |
| PAR-PRE-02 | `density` | complemento CEC (rango_literatura) | Hormigón armado 2300 < ρ ≤ 2500 §3.4.1 | 2300–2500 kg/m³ |
| PAR-PRE-02 | `thermal_conductivity` | complemento CEC (rango_literatura) | Hormigón armado 2300 < ρ ≤ 2500 §3.4.1 | 2.3 W/(m·K) |
| PAR-PRE-02 | `specific_heat` | complemento CEC (rango_literatura) | Hormigón armado 2300 < ρ ≤ 2500 §3.4.1 | 1000 J/(kg·K) |
| PAR-PRE-02 | `vapor_permeability` | complemento CEC (rango_literatura) | Hormigón armado 2300 < ρ ≤ 2500 §3.4.1 | 80 adimensional |
| PIS-CER-01 | `mechanical_resistance` | clase → número | Módulo de rotura ≥ 22 N/mm²; fuerza de rotura ≥ 1 000 N (e ≥ 7,5 mm) | ≥ 22 MPa |
| PIS-CER-01 | `density` | complemento CEC (rango_literatura) | Azulejo cerámico §3.14 | 2300 kg/m³ |
| PIS-CER-01 | `specific_heat` | complemento CEC (rango_literatura) | Azulejo cerámico §3.14 | 840 J/(kg·K) |
| PIS-CON-03 | `specific_heat` | complemento CEC (rango_literatura) | Hormigón en masa 2300 ≤ ρ ≤ 2600 §3.4.1 | 1000 J/(kg·K) |
| PIS-CON-03 | `vapor_permeability` | complemento CEC (rango_literatura) | Hormigón en masa 2300 ≤ ρ ≤ 2600 §3.4.1 | 80 adimensional |
| PIS-EPO-06 | `density` | complemento CEC (rango_literatura) | Resina epoxi §3.9.1 | 1200 kg/m³ |
| PIS-EPO-06 | `specific_heat` | complemento CEC (rango_literatura) | Resina epoxi §3.9.1 | 1400 J/(kg·K) |
| PIS-EPO-06 | `vapor_permeability` | complemento CEC (rango_literatura) | Resina epoxi §3.9.1 | 10000 adimensional |
| PIS-MAD-05 | `specific_heat` | complemento CEC (rango_literatura) | Frondosas (madera) §3.3.1 | 1600 J/(kg·K) |
| PIS-MAD-05 | `vapor_permeability` | complemento CEC (rango_literatura) | Frondosas (madera) §3.3.1 | 50 adimensional |
| PIS-POR-02 | `mechanical_resistance` | clase → número | Módulo de rotura ≥ 35 N/mm²; fuerza de rotura ≥ 1 300 N (e ≥ 7,5 mm) | ≥ 35 MPa |
| PIS-POR-02 | `density` | complemento CEC (rango_literatura) | Plaqueta o baldosa de gres §3.14 | 2500 kg/m³ |
| PIS-POR-02 | `specific_heat` | complemento CEC (rango_literatura) | Plaqueta o baldosa de gres §3.14 | 1000 J/(kg·K) |
| PIS-POR-02 | `vapor_permeability` | complemento CEC (rango_literatura) | Plaqueta o baldosa de gres §3.14 | 30 adimensional |
| PUE-ACE-04 | `surface_mass` | conversión | Peso de la hoja acorazada: más de 100-120 kg | no_disponible  |
| PUE-ACE-04 | `price_range` | conversión | Modelos básicos de liquidación desde c32.800 (Casper); unidades multip | 32800–140000 CRC/unidad |
| PUE-ACE-04 | `durability_years` | conversión | Supera los 35 años | 35 años |
| PUE-ACE-04 | `thermal_conductivity` | conversión | Acero al carbono: aprox. 45-55 W/m.K (valor de referencia general del  | 45–55 W/(m·K) |
| PUE-ACE-04 | `sound_insulation` | conversión | Sobresaliente con núcleos internos de lana de roca o poliuretano rígid | no_disponible  |
| PUE-ACE-04 | `fire_resistance` | conversión | RF30 a RF60 (con núcleo de lana de roca o poliuretano rígido) | 30–60 min |
| PUE-ACE-04 | `clear_width` | conversión | Aprox. 850-950 mm | 850–950 mm |
| PUE-ACE-04 | `density` | complemento CEC (rango_literatura) | Acero §3.2 | 7800 kg/m³ |
| PUE-ACE-04 | `specific_heat` | complemento CEC (rango_literatura) | Acero §3.2 | 450 J/(kg·K) |
| PUE-ALV-02 | `total_thickness` | conversión | Espesor de pared de perfilería: 1,10-1,90 mm (Sistema Europa); sección | no_disponible  |
| PUE-ALV-02 | `density` | conversión | Densidad del aluminio (aleación serie 6000): aprox. 2.700 kg/m3 (valor | 2700 kg/m³ |
| PUE-ALV-02 | `price_range` | conversión | Mamparas serie Aqua: c93.750-c119.999; sistemas de terraza serie Europ | 93750–238574.49 CRC/unidad |
| PUE-ALV-02 | `durability_years` | conversión | Supera los 40 años | 40 años |
| PUE-ALV-02 | `thermal_conductivity` | conversión | Aluminio: aprox. 160-200 W/m.K (conductividad térmica intrínseca del m | 160–200 W/(m·K) |
| PUE-ALV-02 | `u_value` | conversión | Referencia general (no de esta ficha): perfiles de aluminio sin rotura | 5.6–7.0 W/(m²·K) |
| PUE-ALV-02 | `sound_insulation` | conversión | Bajo con vidrio monolítico; excelente con DVH de 24-33,5 mm (mitiga ru | no_disponible  |
| PUE-ALV-02 | `specific_heat` | complemento CEC (rango_literatura) | Aluminio, aleaciones de §3.2 | 880 J/(kg·K) |
| PUE-MAD-01 | `density` | conversión | Densidad básica de la madera (no del elemento fabricado): laurel (Cord | 380–620 kg/m³ |
| PUE-MAD-01 | `price_range` | conversión | Gama económica: c18.900 (puerta blanca interna) a c33.752 (pino interi | 18900–99950 CRC/unidad |
| PUE-MAD-01 | `durability_years` | conversión | 10-15 años (laurel/pino tratados); 35+ años (cedro/teca densos) | 10–35 años |
| PUE-MAD-01 | `thermal_conductivity` | conversión | Aprox. 0,12-0,17 W/m.K (rango típico de referencia para madera blanda/ | 0.12–0.17 W/(m·K) |
| PUE-MAD-01 | `thermal_resistance` | conversión | R aprox. 0,28 m2.K/W (hoja de 40 mm; calculado como e/lambda = 0,04 m  | 0.28 m²·K/W |
| PUE-MAD-01 | `u_value` | conversión | Referencia general (no de esta ficha): aprox. 1,8-2,9 W/m2.K para puer | 1.8–2.9 W/(m²·K) |
| PUE-MAD-01 | `sound_insulation` | conversión | 25-30 dB (Rw aprox.) en hojas de 45 mm | 25–30 dB (Rw) |
| PUE-MAD-01 | `fire_resistance` | conversión | El sistema descrito (sin núcleo cortafuego) no alcanza una clasificaci | no_disponible  |
| PUE-MAD-01 | `clear_width` | conversión | Aprox. 750-950 mm | 750–950 mm |
| PUE-MAD-01 | `specific_heat` | complemento CEC (rango_literatura) | Frondosas (madera) §3.3.1 | 1600 J/(kg·K) |
| PUE-MAD-01 | `vapor_permeability` | complemento CEC (rango_literatura) | Frondosas (madera) §3.3.1 | 50 adimensional |
| PUE-WPC-03 | `price_range` | conversión | Kit precolgado completo (marco + bisagras + juntas): aprox. c119.124,0 | 119124.04 CRC/unidad |
| PUE-WPC-03 | `durability_years` | conversión | Supera los 30 años | 30 años |
| PUE-WPC-03 | `sound_insulation` | conversión | Adecuado aislamiento termoacústico para dormitorios y oficinas, atribu | no_disponible  |
| PUE-WPC-03 | `clear_width` | conversión | Aprox. 600-900 mm | 600–900 mm |
| VEN-ALU-01 | `thermal_conductivity` | conversión | ≈ 200 (aluminio 6063); ≈ 1,0 (vidrio) | 200 W/(m·K) |
| VEN-ALU-01 | `sound_insulation` | conversión | ≈ 20 – 25 (sistema); vidrio 4 mm solo = 27–29 | 20–25 dB (Rw) |
| VEN-ALU-01 | `transport_distance` | conversión | ≈ 40 (GAM) – 250 (La Cruz) | 40–250 km |
| VEN-ALU-01 | `density` | complemento CEC (rango_literatura) | Aluminio, aleaciones de §3.2 | 2800 kg/m³ |
| VEN-ALU-01 | `specific_heat` | complemento CEC (rango_literatura) | Aluminio, aleaciones de §3.2 | 880 J/(kg·K) |
| VEN-ALU-02 | `thermal_conductivity` | conversión | ≈ 200 (aluminio 6063); ≈ 1,0 (vidrio) | 200 W/(m·K) |
| VEN-ALU-02 | `sound_insulation` | conversión | ≈ 22 – 26 (sistema); vidrio 6 mm solo = 30–32 | 22–26 dB (Rw) |
| VEN-ALU-02 | `transport_distance` | conversión | ≈ 40 (GAM) – 250 (La Cruz) | 40–250 km |
| VEN-ALU-02 | `density` | complemento CEC (rango_literatura) | Aluminio, aleaciones de §3.2 | 2800 kg/m³ |
| VEN-ALU-02 | `specific_heat` | complemento CEC (rango_literatura) | Aluminio, aleaciones de §3.2 | 880 J/(kg·K) |
| VEN-ALU-03 | `thermal_conductivity` | conversión | ≈ 200 (aluminio 6063); ≈ 1,0 (vidrio) | 200 W/(m·K) |
| VEN-ALU-03 | `sound_insulation` | conversión | ≈ 25 – 28 (sistema); vidrio 6 mm solo = 30–32 | 25–28 dB (Rw) |
| VEN-ALU-03 | `transport_distance` | conversión | ≈ 40 (GAM) – 250 (La Cruz) | 40–250 km |
| VEN-ALU-03 | `density` | complemento CEC (rango_literatura) | Aluminio, aleaciones de §3.2 | 2800 kg/m³ |
| VEN-ALU-03 | `specific_heat` | complemento CEC (rango_literatura) | Aluminio, aleaciones de §3.2 | 880 J/(kg·K) |
| VEN-ALU-04 | `thermal_conductivity` | conversión | ≈ 200 (aluminio 6063); ≈ 1,0 (vidrio) | 200 W/(m·K) |
| VEN-ALU-04 | `u_value` | conversión | ≈ 3,7 con DVH de aire (Ug ≈ 2,8; Uf metal sin RPT = 5,7) | 3.7 W/(m²·K) |
| VEN-ALU-04 | `transport_distance` | conversión | ≈ 40 (GAM) – 250 (La Cruz) | 40–250 km |
| VEN-ALU-04 | `glass_thickness` | conversión | 6 – 12 (monolítico); DVH 24 – 30 | 6–12 mm |
| VEN-ALU-04 | `density` | complemento CEC (rango_literatura) | Aluminio, aleaciones de §3.2 | 2800 kg/m³ |
| VEN-ALU-04 | `specific_heat` | complemento CEC (rango_literatura) | Aluminio, aleaciones de §3.2 | 880 J/(kg·K) |
| VEN-PVC-05 | `sound_insulation` | conversión | Hasta 44 – 45 | 45 dB (Rw) |
| VEN-PVC-05 | `density` | complemento CEC (rango_literatura) | Cloruro de polivinilo (PVC) §3.9.1 | 1390 kg/m³ |
| VEN-PVC-05 | `specific_heat` | complemento CEC (rango_literatura) | Cloruro de polivinilo (PVC) §3.9.1 | 900 J/(kg·K) |
| VEN-PVC-05 | `vapor_permeability` | complemento CEC (rango_literatura) | Cloruro de polivinilo (PVC) §3.9.1 | 50000 adimensional |
