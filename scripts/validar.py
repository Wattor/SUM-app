"""Valida fichas SUM v1.0 contra el schema y contra las reglas de trazabilidad del curso.

Uso:
    python scripts/validar.py                      # todas las fichas en data/
    python scripts/validar.py data/pisos/PIS-CER-01.json
    python scripts/validar.py --reporte reportes/validacion.md

Niveles:
    ERROR  bloquea la integración (Pull Request) — la app no puede leer el dato.
    AVISO  se puede integrar, pero debe resolverse antes de la entrega final.

Índice de trazabilidad (IT): % de campos con estado 'dato' que tienen fuente + evidencia
(+ certeza si son numéricos). Es el indicador pedagógico central del TP1.
"""
import csv, json, sys, pathlib, argparse, collections, datetime

RAIZ = pathlib.Path(__file__).resolve().parent.parent
EST = RAIZ / "estandar"
DIC = {r["clave"]: r for r in csv.DictReader(open(EST / "diccionario_campos.csv", encoding="utf-8"))}
NUMERICOS = {"numero", "entero"}
SIN_EVIDENCIA = {"id", "component", "country", "record_type", "subcategory", "keywords"}  # identificación interna

try:
    import jsonschema
    SCHEMA = json.load(open(EST / "ficha_sum.schema.json", encoding="utf-8"))
    VALIDADOR = jsonschema.Draft7Validator(SCHEMA)
except ImportError:  # el validador funciona sin jsonschema, con las reglas propias
    VALIDADOR = None


def validar_ficha(ruta):
    f = json.load(open(ruta, encoding="utf-8"))
    errores, avisos = [], []
    E = lambda cod, msg: errores.append((cod, msg))
    A = lambda cod, msg: avisos.append((cod, msg))

    if VALIDADOR:
        for e in sorted(VALIDADOR.iter_errors(f), key=lambda e: list(e.path)):
            ruta_e = "/".join(str(p) for p in e.path)
            if "valor_texto_original" in ruta_e:
                continue
            E("E01", f"schema · {ruta_e or '(raíz)'}: {e.message[:160]}")

    meta, campos = f.get("meta", {}), f.get("campos", {})
    ids_fuente = {s["id"] for s in f.get("fuentes", [])}
    comp = meta.get("componente")
    n_dato = n_traz = 0

    for clave, c in campos.items():
        d = DIC.get(clave)
        if not d:
            E("E02", f"{clave}: clave no existe en el diccionario"); continue
        est = c.get("estado")
        aplica = d["componentes"] == "TODOS" or comp in d["componentes"].split("|")
        if not aplica:
            E("E03", f"{clave}: campo de otro componente ({d['componentes']})")
        if "valor_texto_original" in c:
            E("E04", f"{clave}: '{c['valor_texto_original'][:70]}' → convertir a valor/min–max + unidad, o a un valor de la lista")
        if est == "pendiente" and d["obligatorio"] == "Sí":
            E("E05", f"{clave}: obligatorio sin completar")
        for r in c.get("fuentes", []):
            if r["ref"] not in ids_fuente:
                E("E06", f"{clave}: cita la fuente '{r['ref']}' que no está en la bibliografía")
        if est == "dato" and clave in SIN_EVIDENCIA:
            continue
        if est == "dato":
            n_dato += 1
            if not c.get("evidencia"):
                E("E07", f"{clave}: dato sin nivel de evidencia E1–E5")
            if c.get("evidencia") == "E1" and c.get("certeza") == "verificado":
                E("E08", f"{clave}: evidencia E1 (criterio propio) no puede declararse 'verificado'")
            if d["tipo"] in NUMERICOS and ("valor" in c or "min" in c) and not c.get("unidad") and d["unidad"]:
                E("E09", f"{clave}: número sin unidad")
            if "min" in c and "max" in c and c["min"] > c["max"]:
                E("E10", f"{clave}: rango invertido")
            sin_fuente = not c.get("fuentes")
            if sin_fuente:
                A("A01", f"{clave}: dato sin fuente")
            if d["tipo"] in NUMERICOS and not c.get("certeza") and "valor_texto_original" not in c:
                A("A02", f"{clave}: falta certeza (verificado / rango_literatura / estimado_analogia)")
            if d["tipo"] == "escala" and not c.get("justificacion"):
                A("A03", f"{clave}: puntaje {c.get('valor')} sin justificación")
            ok = not sin_fuente and c.get("evidencia") and (d["tipo"] not in NUMERICOS or c.get("certeza"))
            n_traz += bool(ok)
        if est == "pendiente" and d["obligatorio"] != "Sí":
            A("A04", f"{clave}: campo opcional sin completar (usar no_disponible o no_aplica si corresponde)")

    for s in f.get("fuentes", []):
        if "Sigla usada por el estudiante" in s.get("cita", ""):
            A("A05", f"fuente {s['id']}: completar la referencia APA")

    it = round(100 * n_traz / n_dato, 1) if n_dato else 0.0
    return {"id": meta.get("id", ruta.stem), "autor": meta.get("autor", ""), "componente": comp,
            "errores": errores, "avisos": avisos, "n_dato": n_dato, "it": it,
            "n_campos": len(campos), "ruta": str(ruta.relative_to(RAIZ)) if ruta.is_relative_to(RAIZ) else str(ruta)}


def reporte_md(res):
    L = [f"# Reporte de validación · Ficha SUM v1.0", f"Generado: {datetime.date.today().isoformat()}", "",
         "| Ficha | Autor | Datos | IT % | Errores | Avisos |", "|---|---|---:|---:|---:|---:|"]
    for r in res:
        L.append(f"| {r['id']} | {r['autor']} | {r['n_dato']} | {r['it']} | {len(r['errores'])} | {len(r['avisos'])} |")
    L += ["", "IT = índice de trazabilidad: % de datos con fuente + evidencia (+ certeza si son numéricos).", ""]
    tot = collections.Counter(c for r in res for c, _ in r["errores"] + r["avisos"])
    L += ["## Frecuencia de problemas", "", "| Código | Casos |", "|---|---:|"] + [f"| {k} | {v} |" for k, v in sorted(tot.items())]
    L.append("")
    for r in res:
        L += [f"## {r['id']} — {r['autor']}", f"`{r['ruta']}`", ""]
        for cod, msg in r["errores"]:
            L.append(f"- **{cod}** {msg}")
        agr = collections.defaultdict(list)
        for cod, msg in r["avisos"]:
            agr[cod].append(msg.split(":")[0])
        for cod, ks in agr.items():
            L.append(f"- {cod} ({len(ks)}): {', '.join(ks[:25])}{' …' if len(ks) > 25 else ''}")
        L.append("")
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("rutas", nargs="*")
    ap.add_argument("--reporte")
    a = ap.parse_args()
    rutas = [pathlib.Path(p) for p in a.rutas] or sorted((RAIZ / "data").glob("*/*.json"))
    rutas = [p for p in rutas if p.name != "materiales.json"]
    res = [validar_ficha(p.resolve()) for p in rutas]
    for r in res:
        estado = "OK " if not r["errores"] else "ERR"
        print(f"{estado} {r['id']:12s} datos={r['n_dato']:3d}  IT={r['it']:5.1f}%  errores={len(r['errores']):3d}  avisos={len(r['avisos']):3d}")
    if a.reporte:
        pathlib.Path(a.reporte).parent.mkdir(parents=True, exist_ok=True)
        open(a.reporte, "w", encoding="utf-8").write(reporte_md(res))
        print(f"\nReporte: {a.reporte}")
    sys.exit(1 if any(r["errores"] for r in res) else 0)


if __name__ == "__main__":
    main()
