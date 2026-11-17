"""Complemento de integración de las fichas SUM (nov. 2026). Idempotente.

Uso:  python scripts/complementar.py            # aplica y escribe reportes/complemento_integracion.md
      python scripts/complementar.py --simular  # solo muestra qué cambiaría

Hace dos cosas, y solo estas dos:

A. CONVERSIÓN (errores E04). Pasa a valor / mín–máx / lista lo que el autor ya había escrito como texto.
   No agrega información: el texto original se conserva en la nota. No asigna certeza (la declara el autor).

B. COMPLEMENTO DE NORMA. Llena densidad, conductividad, calor específico y factor μ del MATERIAL PRINCIPAL
   cuando el campo estaba «pendiente» o «no disponible», con los valores de diseño genéricos del
   Catálogo de Elementos Constructivos del CTE (IETcc, 2010, sección 3; valores según UNE-EN ISO 10456).
   Cada dato lleva la fuente INT-CEC, certeza «rango_literatura» o «estimado_analogia» y una nota que lo
   identifica como complemento pendiente de validar por el autor. Nunca sustituye un dato del autor.

Los datos agregados se reconocen porque citan una fuente cuyo id empieza con «INT-».
"""
import json, pathlib, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SIMULAR = "--simular" in sys.argv
MARCA = "Complemento de integración (nov. 2026), pendiente de validar por el autor. "
FUENTE = {"id": "INT-CEC", "tipo": "informe_institucional", "fecha_consulta": "2026-11-16",
          "url": "https://www.codigotecnico.org/Recursos/Aplicaciones/CatalogoElementosConstructivos.html",
          "cita": "Instituto Eduardo Torroja de Ciencias de la Construcción, CEPCO y AICIA. (2010). Catálogo de Elementos "
                  "Constructivos del CTE (versión 6.3, marzo de 2010), sección 3: Materiales y productos. Ministerio de Vivienda, "
                  "España. Valores de diseño obtenidos según UNE-EN ISO 10456."}
COND = ("Valor de diseño genérico del material principal (fila «{fila}», {sec}), no del producto ni del sistema; referido a 10 °C y "
        "humedad de equilibrio a 23 °C y 50 % HR: no describe el desempeño en servicio en trópico húmedo.")

# ---------- B. Materiales genéricos (CEC-CTE v6.3, sección 3) ----------
# rho: kg/m³ (número o (mín, máx)) · lam: W/(m·K) · cp: J/(kg·K) · mu: adimensional (None = el catálogo da ∞: no se escribe)
MAT = {
    "acero":      dict(fila="Acero", sec="§3.2", rho=7800, lam=50, cp=450, mu=None),
    "aluminio":   dict(fila="Aluminio, aleaciones de", sec="§3.2", rho=2800, lam=160, cp=880, mu=None),
    "pvc":        dict(fila="Cloruro de polivinilo (PVC)", sec="§3.9.1", rho=1390, lam=0.17, cp=900, mu=50000),
    "pyl":        dict(fila="Placa de yeso laminado (PYL)", sec="§3.6.2", rho=(750, 900), lam=0.25, cp=1000, mu=4),
    "h_armado":   dict(fila="Hormigón armado 2300 < ρ ≤ 2500", sec="§3.4.1", rho=(2300, 2500), lam=2.30, cp=1000, mu=80),
    "h_masa":     dict(fila="Hormigón en masa 2300 ≤ ρ ≤ 2600", sec="§3.4.1", rho=(2300, 2600), lam=2.00, cp=1000, mu=80),
    "bloque":     dict(fila="Bloque de hormigón convencional", sec="§3.4.2", rho=None, lam=1.18, cp=1000, mu=10),
    "azulejo":    dict(fila="Azulejo cerámico", sec="§3.14", rho=2300, lam=1.30, cp=840, mu=None),
    "gres":       dict(fila="Plaqueta o baldosa de gres", sec="§3.14", rho=2500, lam=2.30, cp=1000, mu=30),
    "teja":       dict(fila="Teja de arcilla cocida", sec="§3.14", rho=2000, lam=1.00, cp=800, mu=30),
    "frondosa":   dict(fila="Frondosas (madera)", sec="§3.3.1", rho=None, lam=None, cp=1600, mu=50),
    "epoxi":      dict(fila="Resina epoxi", sec="§3.9.1", rho=1200, lam=0.20, cp=1400, mu=10000),
    "betun":      dict(fila="Betún fieltro o lámina", sec="§3.12", rho=1100, lam=0.23, cp=1000, mu=50000),
    "tab_cem":    dict(fila="Tablero de partículas con cemento", sec="§3.3.2", rho=None, lam=0.23, cp=1500, mu=30),
}
# ficha → (material, certeza, analogía explícita si la hay)
ASIGNA = {
    "CIE-MET-05": ("acero", "rango_literatura", ""), "CUB-MET-01": ("acero", "rango_literatura", ""),
    "CUB-MET-02": ("acero", "rango_literatura", ""), "CUB-MET-03": ("acero", "rango_literatura", ""),
    "CUB-MET-07": ("acero", "rango_literatura", ""), "PUE-ACE-04": ("acero", "rango_literatura", ""),
    "PUE-ALV-02": ("aluminio", "rango_literatura", ""), "VEN-ALU-01": ("aluminio", "rango_literatura", ""),
    "VEN-ALU-02": ("aluminio", "rango_literatura", ""), "VEN-ALU-03": ("aluminio", "rango_literatura", ""),
    "VEN-ALU-04": ("aluminio", "rango_literatura", ""),
    "CIE-PVC-04": ("pvc", "rango_literatura", ""), "VEN-PVC-05": ("pvc", "rango_literatura", ""),
    "CIE-GYP-01": ("pyl", "rango_literatura", ""),
    "CIM-LOS-04": ("h_armado", "rango_literatura", ""), "CIM-PAI-02": ("h_armado", "rango_literatura", ""),
    "CIM-PCO-01": ("h_armado", "rango_literatura", ""), "PAR-PRE-02": ("h_armado", "rango_literatura", ""),
    "PIS-CON-03": ("h_masa", "rango_literatura", ""),
    "PAR-MAM-01": ("bloque", "estimado_analogia", "Analogía: bloque de hormigón europeo del catálogo frente a la unidad N-15 (INTE) de la ficha. "),
    "PIS-CER-01": ("azulejo", "rango_literatura", ""), "PIS-POR-02": ("gres", "rango_literatura", ""),
    "CUB-TBA-05": ("teja", "rango_literatura", ""),
    "PIS-MAD-05": ("frondosa", "rango_literatura", ""), "PUE-MAD-01": ("frondosa", "rango_literatura", ""),
    "PIS-EPO-06": ("epoxi", "rango_literatura", ""),
    "CUB-TAS-06": ("betun", "estimado_analogia", "Analogía: lámina bituminosa del catálogo frente a la teja asfáltica con velo de fibra de vidrio. "),
    "CIE-FBC-02": ("tab_cem", "estimado_analogia", "Analogía: el catálogo no trae fibrocemento; se usa el tablero de partículas con cemento. "),
}
CAMPOS = {"rho": ("density", "kg/m³"), "lam": ("thermal_conductivity", "W/(m·K)"), "cp": ("specific_heat", "J/(kg·K)"),
          "mu": ("vapor_permeability", "adimensional")}

# ---------- A. Conversiones del texto del autor (E04) ----------
N = lambda v, u, cal="=", **k: dict(valor=v, unidad=u, calificador=cal, **k)          # número puntual
R = lambda a, b, u, **k: dict(min=a, max=b, unidad=u, calificador="rango", **k)       # rango
L = lambda v, **k: dict(valor=v, **k)                                                 # lista o texto
X = lambda estado, **k: dict(estado=estado, **k)                                      # sin dato utilizable
CONV = {
    "CIE-GYP-01": {"wet_area_use": L("No")},
    "CIM-LOS-04": {"angular_distortion": X("no_aplica"), "liquefiable_soil": L("No admitido")},
    "CIM-PAI-02": {"angular_distortion": R(0.0025, 0.004, "adimensional"), "collapsible_soil": L("No admitido"),
                   "surface_mass": X("no_disponible", porque="El autor dio volumen de concreto por placa (m³), no masa superficial en kg/m².")},
    "CIM-PCO-01": {"angular_distortion": R(0.001, 0.002, "adimensional"), "liquefiable_soil": L("No admitido"),
                   "surface_mass": X("no_disponible", porque="El autor dio volumen de concreto y acero por metro lineal, no masa superficial en kg/m².")},
    "CIM-PIL-05": {"angular_distortion": X("no_disponible", porque="Depende de la superestructura."), "liquefiable_soil": L("Recomendado")},
    "CIM-PRS-03": {"settlement_limit": X("no_disponible", porque="Depende de la placa que soporta."),
                   "angular_distortion": X("no_disponible", porque="Depende de la placa que soporta."), "liquefiable_soil": L("No admitido")},
    "CUB-MET-01": {"origin": L("Mixto")}, "CUB-TBA-05": {"origin": L("Mixto")},
    "CUB-MET-02": {"surface_mass": R(3.9, 4.0, "kg/m²"), "solar_reflectance": N(0.68, "0–1", porque="Se registra el valor inicial; el envejecido que cita el autor es 0,55."),
                   "sri": N(68, "adimensional", porque="Se registra el valor inicial; el envejecido a 3 años que cita el autor es 26.")},
    "PAR-FVE-05": {"water_absorption": X("no_aplica"), "origin": L("Mixto"), "end_of_life": L(["Reciclaje", "Otro"])},
    "PAR-LIV-03": {"origin": L("Mixto"), "end_of_life": L(["Reciclaje", "Vertedero"])},
    "PAR-MAM-01": {"end_of_life": L(["Reciclaje", "Vertedero"])},
    "PAR-MCO-04": {"origin": L("Mixto"), "end_of_life": L(["Reciclaje", "Otro"])},
    "PAR-PRE-02": {"end_of_life": L(["Reciclaje", "Vertedero"])},
    "PUE-ACE-04": {"surface_mass": X("no_disponible", porque="El autor dio el peso de la hoja (kg), no masa superficial en kg/m²."),
                   "price_range": R(32800, 140000, "CRC/unidad"), "durability_years": N(35, "años", "≥"),
                   "thermal_conductivity": R(45, 55, "W/(m·K)"), "sound_insulation": X("no_disponible", porque="Descripción cualitativa, sin valor en dB."),
                   "fire_resistance": R(30, 60, "min"), "clear_width": R(850, 950, "mm")},
    "PUE-ALV-02": {"total_thickness": X("no_disponible", porque="El autor dio el espesor de pared del perfil (1,10–1,90 mm), no el espesor total del elemento."),
                   "density": N(2700, "kg/m³", "≈"), "price_range": R(93750, 238574.49, "CRC/unidad"), "durability_years": N(40, "años", "≥"),
                   "thermal_conductivity": R(160, 200, "W/(m·K)"), "u_value": R(5.6, 7.0, "W/(m²·K)"),
                   "sound_insulation": X("no_disponible", porque="Descripción cualitativa, sin valor en dB.")},
    "PUE-MAD-01": {"density": R(380, 620, "kg/m³"), "price_range": R(18900, 99950, "CRC/unidad"), "durability_years": R(10, 35, "años", porque="El autor distingue 10–15 años (laurel o pino tratados) y 35 o más (cedro o teca)."),
                   "thermal_conductivity": R(0.12, 0.17, "W/(m·K)"), "thermal_resistance": N(0.28, "m²·K/W", "≈"), "u_value": R(1.8, 2.9, "W/(m²·K)"),
                   "sound_insulation": R(25, 30, "dB (Rw)"), "fire_resistance": X("no_disponible", porque="El sistema descrito no alcanza una clasificación certificada."),
                   "clear_width": R(750, 950, "mm")},
    "PUE-WPC-03": {"price_range": N(119124.04, "CRC/unidad", "≈"), "durability_years": N(30, "años", "≥"),
                   "sound_insulation": X("no_disponible", porque="Descripción cualitativa, sin valor en dB."), "clear_width": R(600, 900, "mm")},
    "VEN-ALU-01": {"thermal_conductivity": N(200, "W/(m·K)", "≈", porque="Valor del aluminio del marco; el autor da ≈ 1,0 para el vidrio."),
                   "sound_insulation": R(20, 25, "dB (Rw)"), "transport_distance": R(40, 250, "km")},
    "VEN-ALU-02": {"thermal_conductivity": N(200, "W/(m·K)", "≈", porque="Valor del aluminio del marco; el autor da ≈ 1,0 para el vidrio."),
                   "sound_insulation": R(22, 26, "dB (Rw)"), "transport_distance": R(40, 250, "km")},
    "VEN-ALU-03": {"thermal_conductivity": N(200, "W/(m·K)", "≈", porque="Valor del aluminio del marco; el autor da ≈ 1,0 para el vidrio."),
                   "sound_insulation": R(25, 28, "dB (Rw)"), "transport_distance": R(40, 250, "km")},
    "VEN-ALU-04": {"thermal_conductivity": N(200, "W/(m·K)", "≈", porque="Valor del aluminio del marco; el autor da ≈ 1,0 para el vidrio."),
                   "u_value": N(3.7, "W/(m²·K)", "≈"), "transport_distance": R(40, 250, "km"),
                   "glass_thickness": R(6, 12, "mm", porque="Vidrio monolítico; con DVH el autor indica 24–30 mm.")},
    "VEN-PVC-05": {"sound_insulation": N(45, "dB (Rw)", "≤")},
}
# valor_o_clase que el autor escribió como texto con un número comparable (no es E04, pero no puntuaba)
CLASE_A_NUM = {
    "PIS-CER-01": {"mechanical_resistance": (22, "MPa", "≥", "Módulo de rotura a flexión")},
    "PIS-POR-02": {"mechanical_resistance": (35, "MPa", "≥", "Módulo de rotura a flexión")},
}


def nota(c, extra):
    c["nota"] = (c.get("nota", "").rstrip() + " " + extra).strip()


def main():
    log, n_conv, n_comp = [], 0, 0
    for p in sorted((RAIZ / "data").glob("*/*.json")):
        if p.parent.name == "sitios":
            continue
        f = json.load(open(p, encoding="utf-8")); fid = f["meta"]["id"]; C = f["campos"]; cambio = False
        for k, n in CONV.get(fid, {}).items():
            c = C.get(k)
            if not c or "valor_texto_original" not in c:
                continue
            orig = c.pop("valor_texto_original"); n = dict(n); porque = n.pop("porque", "")
            for a in ("valor", "min", "max", "calificador", "unidad"):
                c.pop(a, None)
            if "estado" in n:
                c["estado"] = n.pop("estado")
                for a in ("evidencia", "certeza"):
                    c.pop(a, None)
            c.update(n)
            nota(c, f"{porque} Texto original del autor: «{orig}».".strip())
            log.append(f"| {fid} | `{k}` | conversión | {orig[:70]} | {c.get('valor', c.get('estado') if c['estado'] != 'dato' else str(c.get('min')) + '–' + str(c.get('max')))} {c.get('unidad', '')} |")
            n_conv += 1; cambio = True
        for k, (v, u, cal, que) in CLASE_A_NUM.get(fid, {}).items():
            c = C.get(k)
            if c and c.get("estado") == "dato" and isinstance(c.get("valor"), str):
                orig = c["valor"]; c.update(valor=v, unidad=u, calificador=cal)
                nota(c, f"{que}. Texto original del autor: «{orig}».")
                log.append(f"| {fid} | `{k}` | clase → número | {orig[:70]} | {cal} {v} {u} |"); n_conv += 1; cambio = True
        if fid in ASIGNA:
            mk, cert, analog = ASIGNA[fid]; m = MAT[mk]
            for prop, (k, u) in CAMPOS.items():
                v = m[prop]; c = C.get(k)
                if v is None or c is None or c.get("estado") not in ("pendiente", "no_disponible"):
                    continue
                previa = c.get("nota", "")
                nuevo = {"estado": "dato", "unidad": u, "fuentes": [{"ref": "INT-CEC", "loc": m["sec"]}], "evidencia": "E4", "certeza": cert}
                if isinstance(v, tuple):
                    nuevo.update(min=v[0], max=v[1], calificador="rango")
                else:
                    nuevo.update(valor=v, calificador="=")
                nuevo["nota"] = MARCA + analog + COND.format(fila=m["fila"], sec=m["sec"]) + (f" Nota previa del autor: «{previa}»." if previa and "Campo nuevo" not in previa else "")
                C[k] = nuevo
                log.append(f"| {fid} | `{k}` | complemento CEC ({cert}) | {m['fila']} {m['sec']} | {v if not isinstance(v, tuple) else str(v[0]) + '–' + str(v[1])} {u} |")
                n_comp += 1; cambio = True
            if any(r.get("ref") == "INT-CEC" for c in C.values() for r in c.get("fuentes", [])) and not any(s["id"] == "INT-CEC" for s in f["fuentes"]):
                f["fuentes"].append(FUENTE); cambio = True
        if cambio and not SIMULAR:
            json.dump(f, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"{n_conv} conversiones del texto del autor · {n_comp} datos complementados desde el CEC-CTE" + (" (simulación)" if SIMULAR else ""))
    if log and not SIMULAR:
        (RAIZ / "reportes").mkdir(exist_ok=True)
        (RAIZ / "reportes" / "complemento_integracion.md").write_text(
            "# Complemento de integración · noviembre 2026\n\n" + __doc__.split("Hace dos cosas")[1].split("Los datos agregados")[0].replace("\n   ", " ").strip()
            + "\n\nCada fila es un cambio aplicado a una ficha. El autor de la ficha debe revisarlo y, si lo acepta, declararlo en su Pull Request.\n\n"
            "| Ficha | Campo | Tipo de cambio | Origen (texto del autor o fila del catálogo) | Valor que queda |\n|---|---|---|---|---|\n" + "\n".join(log) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
