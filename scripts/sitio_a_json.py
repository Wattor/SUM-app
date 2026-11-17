"""Convierte una Matriz_Clima_Sitio_*.xlsx (hoja SITIO llena) a data/sitios/<id>.json (esquema sum.sitio/1.0).

Uso:  python scripts/sitio_a_json.py "Matriz_Clima_Sitio_La_Cruz.xlsx" [--id pn2_la_cruz]

Lee SOLO las celdas de entrada (amarillas) y recalcula exigencias y pesos con
estandar/clima_parametros.json y estandar/clima_zonas.json, igual que la hoja.
Si el libro trae pesos base o sensibilidades distintos de los del estándar, se conservan en el JSON.
"""
import json, sys, re, pathlib, datetime, unicodedata
import openpyxl

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PAR = json.load(open(RAIZ / "estandar" / "clima_parametros.json", encoding="utf-8"))
ZONAS = {z["id"]: z for z in json.load(open(RAIZ / "estandar" / "clima_zonas.json", encoding="utf-8"))["zonas"]}
COD = [e["codigo"] for e in PAR["exigencias"]]
VARS = [(16, "precipitacion_anual", "mm"), (17, "t_max_media", "°C"), (18, "t_min_media", "°C"), (19, "t_media", "°C"),
        (20, "dias_con_lluvia", "días"), (21, "meses_secos", "meses"), (22, "zona_sismica_cscr", "II/III/IV"),
        (23, "hr_media_anual", "%"), (24, "radiacion_global", "kWh/m²·día")]


def num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def slug(s):
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")


def nivel_umbral(cod, x):
    if x is None:
        return 0
    u = PAR["umbrales"][cod]
    if u["sentido"] == "≥":
        return 3 if x >= u["n3"] else 2 if x >= u["n2"] else 1 if x >= u["n1"] else 0
    return 3 if x <= u["n3"] else 2 if x <= u["n2"] else 1 if x <= u["n1"] else 0


def calcular(clima, micro, zona, pesos_base=None, sens=None):
    """clima: {var: valor usado}; micro: dict. Devuelve exigencias y pesos (misma lógica que PERFIL y PESOS)."""
    g = lambda k: num(clima.get(k))
    tmax, tmin = g("t_max_media"), g("t_min_media")
    ampl = round(tmax - tmin, 1) if tmax is not None and tmin is not None else None
    dist = num(micro.get("distancia_costa_km"))
    s = PAR["salinidad_km"]
    if dist is not None:
        sal, dsal = (3 if dist <= s["n3"] else 2 if dist <= s["n2"] else 1 if dist <= s["n1"] else 0), f"{dist:g} km"
    else:
        cost = (zona or {}).get("costera")
        sal, dsal = (3 if cost == "S" else 0), (f"Costera: {cost}" if cost else "sin dato")
    zs = clima.get("zona_sismica_cscr")
    zv = micro.get("zona_viento_cfia")
    base = {"E_CAL": nivel_umbral("E_CAL", tmax), "E_FRIO": nivel_umbral("E_FRIO", tmin),
            "E_LLUV": nivel_umbral("E_LLUV", g("precipitacion_anual")), "E_PERS": nivel_umbral("E_PERS", g("dias_con_lluvia")),
            "E_SECA": nivel_umbral("E_SECA", g("meses_secos")), "E_AMPL": nivel_umbral("E_AMPL", ampl),
            "E_SAL": sal, "E_SIS": PAR["sismica_cscr"].get(zs, 0), "E_VIE": PAR["viento_cfia"].get(zv, 0)}
    dato = {"E_CAL": tmax, "E_FRIO": tmin, "E_LLUV": g("precipitacion_anual"), "E_PERS": g("dias_con_lluvia"),
            "E_SECA": g("meses_secos"), "E_AMPL": ampl, "E_SAL": dsal, "E_SIS": zs, "E_VIE": f"Zona {zv}" if zv else "(sin zona)"}
    aj = dict.fromkeys(COD, 0)
    if micro.get("sombra_envolvente") == "Alta":
        aj["E_CAL"] = PAR["ajuste_sombra_alta"]
    elif micro.get("sombra_envolvente") == "Baja":
        aj["E_CAL"] = PAR["ajuste_sombra_baja"]
    if micro.get("exposicion_viento") == "Protegido":
        aj["E_VIE"] = PAR["ajuste_viento_protegido"]
    elif micro.get("exposicion_viento") == "Expuesto":
        aj["E_VIE"] = PAR["ajuste_viento_expuesto"]
    nombres = {e["codigo"]: e["nombre"] for e in PAR["exigencias"]}
    exig = {c: {"nombre": nombres[c], "dato": dato[c], "nivel_clima": base[c], "ajuste_microclima": aj[c],
                "nivel": max(0, min(3, base[c] + aj[c]))} for c in COD}
    dims = PAR["dimensiones"]
    pb = pesos_base or [d["peso_base"] for d in dims]
    S = sens or {c: PAR["sensibilidad"][c]["valores"] for c in COD}
    fac = []
    for j in range(len(dims)):
        ss = sum(S[c][j] for c in COD)
        fac.append(1 if ss == 0 else 1 + sum(S[c][j] * exig[c]["nivel"] for c in COD) / (3 * ss))
    den = sum(b * f for b, f in zip(pb, fac))
    pesos = [b * f / den for b, f in zip(pb, fac)]
    orden = sorted(pesos, reverse=True)
    pd = {d["id"]: {"nombre": d["nombre"], "peso_base": pb[j], "factor_climatico": round(fac[j], 4), "peso": round(pesos[j], 4),
                    "prioridad": orden.index(pesos[j]) + 1} for j, d in enumerate(dims)}
    mx = max(e["nivel"] for e in exig.values())
    faltan = sum(1 for k in ("precipitacion_anual", "t_max_media", "t_min_media", "dias_con_lluvia", "meses_secos") if g(k) is None) \
        + (0 if zs else 1) + (0 if zv else 1)
    return {"exigencias": exig, "exigencia_total": sum(e["nivel"] for e in exig.values()),
            "exigencias_dominantes": [c for c in COD if exig[c]["nivel"] == mx] if mx else [],
            "datos_pendientes": faltan, "pesos_dimension": pd}


def leer(ruta, sid=None):
    wb = openpyxl.load_workbook(ruta, data_only=True)
    s = wb["SITIO"]
    zid = str(s["B9"].value or "").strip()
    zona = ZONAS.get(zid)
    fecha = s["B12"].value
    fecha = fecha.date().isoformat() if isinstance(fecha, datetime.datetime) else str(fecha or "")[:10]
    alt_s, alt_e = num(s["D28"].value), num(s["D29"].value)
    corr = (alt_e - alt_s) * PAR["gradiente_termico_C_por_km"] / 1000 if alt_s is not None and alt_e is not None else None
    clima, usado = {}, {}
    for r, k, u in VARS:
        d = s.cell(r, 4).value
        sub = (zona or {}).get(k)
        if k == "zona_sismica_cscr":
            d = d if d in ("II", "III", "IV") else None
            v, origen, aj = (d or sub), ("Estación o sitio" if d else "Subregión" if sub else "Sin dato"), False
        else:
            d = num(d)
            aj = d is not None and corr is not None and k.startswith("t_")
            v = round(d + corr, 1) if aj else d if d is not None else sub
            origen = "Estación ajustada por altitud" if aj else "Estación o sitio" if d is not None else "Subregión" if sub is not None else "Sin dato"
        usado[k] = v
        clima[k] = {"valor": v, "unidad": u, "origen": origen, "ajustado_por_altitud": bool(aj), "valor_subregion": sub,
                    "fuente": s.cell(r, 7).value, "certeza": s.cell(r, 8).value}
    op = lambda c, ok: (s[c].value if s[c].value in ok else None)
    micro = {"altitud_sitio_msnm": alt_s, "altitud_estacion_msnm": alt_e, "distancia_costa_km": num(s["D30"].value),
             "zona_viento_cfia": op("D31", ("I", "II", "III", "IV", "V")), "exposicion_viento": op("D32", ("Protegido", "Normal", "Expuesto")),
             "sombra_envolvente": op("D33", ("Alta", "Media", "Baja")), "orientacion_fachada": s["D34"].value or None}
    micro["fuentes"] = {str(s.cell(r, 1).value): {"fuente": s.cell(r, 7).value, "certeza": s.cell(r, 8).value}
                        for r in range(28, 35) if s.cell(r, 7).value}
    ps = wb["PESOS"]
    pb = [num(ps.cell(15, c).value) or 1 for c in range(3, 9)]
    sens = {c: [num(ps.cell(5 + i, j).value) or 0 for j in range(3, 9)] for i, c in enumerate(COD)}
    nombre = str(s["B5"].value or pathlib.Path(ruta).stem).strip()
    out = {"schema": "sum.sitio/1.0",
           "sitio": {"id": sid or slug(f"{zid}_{nombre}"), "nombre": nombre, "ubicacion": s["B6"].value, "lat": num(s["B7"].value),
                     "lon": num(s["B8"].value), "id_zona": zid, "subregion": (zona or {}).get("subregion"),
                     "region": (zona or {}).get("region"), "elaborado_por": s["B11"].value, "fecha": fecha},
           "clima": clima, "microclima": micro}
    out.update(calcular(usado, micro, zona, pb, sens))
    if pb != [d["peso_base"] for d in PAR["dimensiones"]]:
        out["pesos_base_del_autor"] = pb
    if sens != {c: PAR["sensibilidad"][c]["valores"] for c in COD}:
        out["sensibilidad_del_autor"] = sens
    se = wb["SELECCION"]
    manual = []
    for r in range(6, 16):
        n = se.cell(r, 2).value
        p = [num(se.cell(r, c).value) for c in range(4, 10)]
        if n and "EJEMPLO" not in str(n) and all(x is not None for x in p):
            manual.append({"material": n, "componente": se.cell(r, 3).value,
                           "puntajes": dict(zip([d["id"] for d in PAR["dimensiones"]], p))})
    if manual:
        out["seleccion_manual"] = manual
    out["regla_puntaje"] = "puntaje_sitio = sum(puntaje_dimension_0a3 * peso) / 3"
    out["origen_archivo"] = pathlib.Path(ruta).name
    return out


if __name__ == "__main__":
    args = sys.argv[1:]
    sid = None
    if "--id" in args:
        i = args.index("--id"); sid = args[i + 1]; del args[i:i + 2]
    for a in args:
        o = leer(a, sid)
        dest = RAIZ / "data" / "sitios" / f"{o['sitio']['id']}.json"
        dest.parent.mkdir(parents=True, exist_ok=True)
        json.dump(o, open(dest, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        print(f"→ {dest.relative_to(RAIZ)} · exigencia {o['exigencia_total']}/27 · dominantes {' '.join(o['exigencias_dominantes'])}")
