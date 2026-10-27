"""Consolida las fichas para la aplicación y para revisión docente.

Uso:  python scripts/exportar.py
Genera en salidas/:
  * registro_app.csv            formato largo (una fila = un campo de una ficha) — sucesor de la hoja Registro_APP
  * materiales_<componente>.json  todas las fichas de un componente en un solo arreglo (lo que lee la app)
  * matriz_<componente>.csv     formato ancho (una fila por ficha) para comparar alternativas
"""
import csv, json, pathlib, collections

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DIC = {r["clave"]: r for r in csv.DictReader(open(RAIZ / "estandar" / "diccionario_campos.csv", encoding="utf-8"))}
OUT = RAIZ / "salidas"


def texto_valor(c):
    if "valor" in c:
        v = c["valor"]
        return " | ".join(map(str, v)) if isinstance(v, list) else v
    if "min" in c:
        return f"{c['min']}–{c['max']}"
    return c.get("valor_texto_original", "")


def main():
    OUT.mkdir(exist_ok=True)
    fichas = [json.load(open(p, encoding="utf-8")) for p in sorted((RAIZ / "data").glob("*/*.json"))]
    cols = ["solution_id", "component", "author", "section", "field_key", "field_label", "status", "value", "min", "max",
            "qualifier", "unit", "sources", "evidence_level", "certainty", "justification", "notes", "review_status"]
    with open(OUT / "registro_app.csv", "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh); w.writerow(cols)
        for f in fichas:
            m = f["meta"]
            for k, c in f["campos"].items():
                d = DIC[k]
                w.writerow([m["id"], m["componente"], m["autor"], d["seccion"], k, d["campo"], c["estado"],
                            texto_valor(c), c.get("min", ""), c.get("max", ""), c.get("calificador", ""), c.get("unidad", ""),
                            "; ".join(r["ref"] + (f" ({r['loc']})" if r.get("loc") else "") for r in c.get("fuentes", [])),
                            c.get("evidencia", ""), c.get("certeza", ""), c.get("justificacion", ""), c.get("nota", ""),
                            m["estado_revision"]])
    por_comp = collections.defaultdict(list)
    for f in fichas:
        por_comp[f["meta"]["componente"]].append(f)
    for comp, fs in por_comp.items():
        json.dump(fs, open(OUT / f"materiales_{comp}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        claves = [k for k in DIC if any(k in f["campos"] for f in fs)]
        with open(OUT / f"matriz_{comp}.csv", "w", newline="", encoding="utf-8-sig") as fh:
            w = csv.writer(fh)
            w.writerow(["campo", "unidad"] + [f["meta"]["id"] for f in fs])
            for k in claves:
                fila = [DIC[k]["campo"], DIC[k]["unidad"]]
                for f in fs:
                    c = f["campos"].get(k, {})
                    fila.append(texto_valor(c) if c.get("estado") == "dato" else c.get("estado", ""))
                w.writerow(fila)
    print(f"{len(fichas)} fichas · {len(por_comp)} componentes → {OUT}")


if __name__ == "__main__":
    main()
