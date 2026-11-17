"""Rellena los anexos A, B y C de GUIA_METODO.md con el estado real del repositorio.

Uso:  python scripts/anexos_guia.py   (lee docs/GUIA_METODO.plantilla.md y escribe GUIA_METODO.md)
"""
import csv, json, pathlib, sys, collections

RAIZ = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))
import validar  # noqa: E402

DIC = {r["clave"]: r for r in csv.DictReader(open(RAIZ / "estandar" / "diccionario_campos.csv", encoding="utf-8"))}
CFG = json.load(open(RAIZ / "estandar" / "indicadores_app.json", encoding="utf-8"))
PAR = json.load(open(RAIZ / "estandar" / "clima_parametros.json", encoding="utf-8"))
LIS = json.load(open(RAIZ / "estandar" / "listas.json", encoding="utf-8"))
DIM = {d["id"]: d["nombre"] for d in PAR["dimensiones"]}

a = ["| Dimensión | Indicador | Tipo | Sentido | Activo por defecto | Condición |", "|---|---|---|---|---|---|"]
for i in CFG["indicadores"]:
    d = DIC[i["clave"]]
    cond = "; ".join(x for x in [("clima " + i["si"]) if i.get("si") else "", ("solo " + ", ".join(i["componentes"])) if i.get("componentes") else "",
                                 ("si " + i["sentido_alterno"]["si"] + ": " + i["sentido_alterno"]["sentido"] + " es mejor") if i.get("sentido_alterno") else ""] if x)
    a.append(f"| {DIM[i['dim']]} | {d['campo']} (`{i['clave']}`) | {d['tipo']} | {'mayor' if i['sentido'] == 'mayor' else 'menor'} es mejor | {'sí' if i['activo'] else 'no'} | {cond or '—'} |")
b = ["| Código | Se activa si | Componentes | Campo | Prueba | Severidad |", "|---|---|---|---|---|---|"]
for x in CFG["alertas"]:
    p = x["prueba"]
    pr = "sin dato" if p.get("sin_dato") else f"= {p['igual']}" if "igual" in p else f"≤ {p['menor_igual']}" if "menor_igual" in p else f"≥ {p['mayor_igual']}"
    b.append(f"| {x['id']} | {x['si']} | {', '.join(x.get('componentes', [])) or 'todos'}{' (solo exterior)' if x.get('solo_exterior') else ''} | {DIC[x['campo']]['campo']} | {pr} | {x['severidad']} |")
c = ["| Componente | Fichas | Sin errores | IT medio | E05 | E07 | Números con certeza | Datos de complemento |", "|---|---:|---:|---:|---:|---:|---:|---:|"]
T = collections.defaultdict(lambda: collections.Counter())
for p in sorted((RAIZ / "data").glob("*/*.json")):
    if p.parent.name == "sitios":
        continue
    f = json.load(open(p, encoding="utf-8")); v = validar.validar_ficha(p); t = T[f["meta"]["componente"]]
    t["n"] += 1; t["ok"] += not v["errores"]; t["it"] += v["it"]
    t["e05"] += sum(1 for e in v["errores"] if e[0] == "E05"); t["e07"] += sum(1 for e in v["errores"] if e[0] == "E07")
    for x in f["campos"].values():
        if x.get("estado") == "dato" and (isinstance(x.get("valor"), (int, float)) and not isinstance(x.get("valor"), bool) or "min" in x):
            t["num"] += 1; t["cert"] += bool(x.get("certeza"))
        t["comp"] += any(r["ref"].startswith("INT-") for r in x.get("fuentes", []))
tot = collections.Counter()
for k in LIS["component"]:
    t = T[k]; tot.update(t)
    c.append(f"| {LIS['component'][k]['nombre']} | {t['n']} | {t['ok']} | {t['it'] / t['n']:.0f} % | {t['e05']} | {t['e07']} | {t['cert']} de {t['num']} | {t['comp']} |")
c.append(f"| **Total** | {tot['n']} | {tot['ok']} | {tot['it'] / tot['n']:.0f} % | {tot['e05']} | {tot['e07']} | {tot['cert']} de {tot['num']} | {tot['comp']} |")
src = (RAIZ / "docs" / "GUIA_METODO.plantilla.md").read_text(encoding="utf-8")
out = src.replace("{{TABLA_INDICADORES}}", "\n".join(a)).replace("{{TABLA_ALERTAS}}", "\n".join(b)).replace("{{TABLA_FICHAS}}", "\n".join(c))
(RAIZ / "GUIA_METODO.md").write_text(out, encoding="utf-8")
print("GUIA_METODO.md actualizado ·", c[-1])
