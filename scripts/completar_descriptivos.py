"""Síntesis de integración de campos descriptivos obligatorios (errores E05) y evidencia faltante (E07). Idempotente.

Uso:  python scripts/completar_descriptivos.py [--simular]

Solo toca campos obligatorios en estado «pendiente». No redacta contenido nuevo: ARMA cada texto con datos que el autor
ya escribió en otros campos de la misma ficha (capas, fijación, escalas con su justificación, restricciones, fallas,
bibliografía). Cada campo sintetizado cita la fuente INT-SIN, lleva evidencia E1 y una nota que pide al autor revisarlo
y reescribirlo. Lo que no se puede derivar de la ficha (tipo de tradición, fotografías y detalles) queda «pendiente».

E07: un dato sin evidencia que no cita fuente, o que cita PROPIO, se marca E1 (criterio propio), que es lo que el
estándar define para ese caso. Si cita otra fuente, no se toca: el tipo de evidencia lo conoce el autor.
"""
import csv, json, pathlib, re, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SIMULAR = "--simular" in sys.argv
DIC = {r["clave"]: r for r in csv.DictReader(open(RAIZ / "estandar" / "diccionario_campos.csv", encoding="utf-8"))}
MARCA = "Síntesis de integración (nov. 2026) armada con datos de esta misma ficha ({de}); pendiente de revisar y reescribir por el autor."
FUENTE = {"id": "INT-SIN", "tipo": "elaboracion_propia", "cita": "Síntesis de integración (noviembre de 2026): texto armado automáticamente a partir de otros campos de la misma ficha. No es fuente externa."}
NORMA_CR = re.compile(r"CSCR|Código Sísmico|\bINTE\b|INTECO|Reglamento de Construcciones|Ley 7600|CFIA|RESET|Código de Cimentaciones|Bomberos", re.I)
POS = ["moisture_resistance", "corrosion_resistance", "uv_resistance", "cleanability", "repairability", "replaceability", "national_availability"]
INV = ["condensation_risk", "labor_specialization", "installation_complexity", "installation_time", "installation_waste"]
BOO = ["marine_environment", "healthcare_use", "renewable", "reusable", "recyclable", "wet_area_use", "walkability", "accessible_route", "safety_glass"]


def dato(C, k):
    c = C.get(k)
    return c if c and c.get("estado") == "dato" and c.get("valor") not in (None, "", []) else None


def txt(C, k):
    c = dato(C, k)
    if not c:
        return ""
    v = c["valor"]
    return (" → ".join(v) if k == "layers" else "; ".join(map(str, v))) if isinstance(v, list) else str(v)


def num(C, k):
    c = dato(C, k)
    return c["valor"] if c and isinstance(c["valor"], (int, float)) else None


def lab(k):
    return DIC[k]["campo"]


def sintetizar(f):
    C, out = f["campos"], {}
    partes = [(k, txt(C, k)) for k in ("layers", "support_system", "fastening", "joints_seals")]
    if partes[0][1]:
        out["installation_sequence"] = ("Capas del sistema en el orden declarado: " + partes[0][1].rstrip(".") + ". "
                                        + " ".join(f"{lab(k)}: {t.rstrip('.')}." for k, t in partes[1:] if t), "capas, soporte, fijación y juntas")
    p = []
    for k in ("labor_specialization", "installation_complexity", "installation_time"):
        c = dato(C, k)
        if c:
            j = c.get("justificacion") or c.get("nota") or ""
            p.append(f"{lab(k)} {c['valor']}/5" + (f": {j.rstrip('.')}" if j else "") + ".")
    if p:
        out["tools_labor"] = (" ".join(p), "escalas de mano de obra e instalación")
    if txt(C, "climates"):
        d = num(C, "national_availability")
        out["cr_region"] = ("Condiciones climáticas declaradas en la ficha: " + txt(C, "climates").rstrip(".") + "."
                            + (f" Disponibilidad nacional {d}/5." if d else ""), "condiciones climáticas y disponibilidad nacional")
    nor = [s for s in f.get("fuentes", []) if NORMA_CR.search(s.get("cita", ""))]
    if nor:
        out["cr_standard"] = ("Normativa y lineamientos costarricenses citados en la bibliografía de la ficha: "
                              + "; ".join(f"{s['cita'].split(' http')[0].rstrip('. ')[:140]} [{s['id']}]" for s in nor[:6]) + ".", "bibliografía de la ficha")
    p = []
    for k in ("total_thickness", "system_thickness", "minimum_slope", "glass_thickness", "clear_width", "installation_thickness"):
        c = C.get(k)
        if c and c.get("estado") == "dato" and (isinstance(c.get("valor"), (int, float)) or "min" in c):
            v = c["valor"] if "valor" in c else f"{c['min']}–{c['max']}"
            p.append(f"{lab(k).lower()} {v} {c.get('unidad', '')}".strip())
    for k in ("fastening", "joints_seals", "overlap_system", "moisture_barrier", "structural_connection", "glass_type", "hardware", "suspension_type", "adhesive", "joint_requirements"):
        if txt(C, k):
            p.append(f"{lab(k).lower()}: {txt(C, k).rstrip('.')}")
    if p:
        out["plan_requirements"] = ("Datos de la ficha que deben quedar indicados en planos y especificaciones: " + "; ".join(p[:9]) + ".", "espesores, fijaciones, juntas y campos específicos")
    a, l = [], []
    for k in POS:
        v = num(C, k)
        if v is not None:
            (a if v >= 4 else l if v <= 2 else []).append(f"{lab(k).lower()} {v}/5")
    for k in INV:
        v = num(C, k)
        if v is not None:
            (a if v <= 2 else l if v >= 4 else []).append(f"{lab(k).lower()} {v}/5 ({'bajo' if v <= 2 else 'alto'})")
    for k in BOO:
        c = dato(C, k)
        if c and c["valor"] in ("Sí", "No"):
            (a if c["valor"] == "Sí" else l).append(f"{lab(k).lower()}: {c['valor']}")
    if a:
        out["advantages"] = ("Fortalezas según los datos de la ficha: " + "; ".join(a) + ".", "escalas 1–5 y campos Sí/No")
    extra = [f"{lab(k)}: {txt(C, k).rstrip('.')}." for k in ("use_restrictions", "common_failures") if txt(C, k)]
    if l or extra:
        out["limitations"] = ((("Debilidades según los datos de la ficha: " + "; ".join(l) + ". ") if l else "") + " ".join(extra), "escalas 1–5, restricciones de uso y fallas frecuentes")
    return out


def main():
    n_sin = n_e07 = 0; filas = []
    for p in sorted((RAIZ / "data").glob("*/*.json")):
        if p.parent.name == "sitios":
            continue
        f = json.load(open(p, encoding="utf-8")); C = f["campos"]; fid = f["meta"]["id"]; cambio = False
        for k, (texto, de) in sintetizar(f).items():
            c = C.get(k)
            if not c or c.get("estado") != "pendiente" or DIC[k]["obligatorio"] != "Sí":
                continue
            C[k] = {"estado": "dato", "valor": texto.strip(), "fuentes": [{"ref": "INT-SIN"}], "evidencia": "E1", "nota": MARCA.format(de=de)}
            filas.append(f"| {fid} | `{k}` | síntesis | {de} |"); n_sin += 1; cambio = True
        for k, c in C.items():
            if c.get("estado") == "dato" and not c.get("evidencia") and k not in ("id", "component", "country", "record_type", "subcategory", "keywords"):
                refs = [r["ref"] for r in c.get("fuentes", [])]
                if not refs or refs == ["PROPIO"]:
                    c["evidencia"] = "E1"; filas.append(f"| {fid} | `{k}` | evidencia E1 | dato sin fuente externa |"); n_e07 += 1; cambio = True
        if cambio and any(r.get("ref") == "INT-SIN" for c in C.values() for r in c.get("fuentes", [])) and not any(s["id"] == "INT-SIN" for s in f["fuentes"]):
            f["fuentes"].append(FUENTE)
        if cambio and not SIMULAR:
            json.dump(f, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"{n_sin} campos descriptivos sintetizados · {n_e07} datos marcados E1" + (" (simulación)" if SIMULAR else ""))
    if filas and not SIMULAR:
        (RAIZ / "reportes" / "sintesis_descriptivos.md").write_text(
            "# Síntesis de campos descriptivos · noviembre 2026\n\n" + __doc__.split("Uso:")[1].split("\n", 2)[2].strip()
            + "\n\n| Ficha | Campo | Cambio | Armado con |\n|---|---|---|---|\n" + "\n".join(filas) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
