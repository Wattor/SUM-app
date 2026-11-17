"""Empaqueta los datos del repositorio para la app SUM.

Uso:  python scripts/construir_app.py

Lee   data/<componente>/*.json   fichas de sistemas (Ficha SUM v1.0)
      data/sitios/*.json         sitios climáticos (sum.sitio/1.0)
      estandar/                  diccionario, listas, zonas IMN, parámetros de clima, indicadores de la app
Genera app/datos.js              datos para app/index.html (abrir con doble clic o publicar con GitHub Pages)
       SUM_app.html              la app completa en UN solo archivo, para compartir sin el repositorio

Correlo cada vez que cambie una ficha, un sitio o un archivo de estandar/.
"""
import csv, json, pathlib, datetime, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))
import validar  # noqa: E402  (mismo validador del estándar: el IT de la app es el del reporte)

J = lambda p: json.load(open(RAIZ / p, encoding="utf-8"))


def main():
    dic = {r["clave"]: r for r in csv.DictReader(open(RAIZ / "estandar" / "diccionario_campos.csv", encoding="utf-8"))}
    fichas = []
    for p in sorted((RAIZ / "data").glob("*/*.json")):
        if p.parent.name == "sitios":
            continue
        f = json.load(open(p, encoding="utf-8"))
        v = validar.validar_ficha(p)
        f["_val"] = {"it": v["it"], "datos": v["n_dato"], "errores": len(v["errores"]), "avisos": len(v["avisos"])}
        fichas.append(f)
    sitios = [json.load(open(p, encoding="utf-8")) for p in sorted((RAIZ / "data" / "sitios").glob("*.json"))]
    datos = {"generado": datetime.date.today().isoformat(), "plantillas": True, "dic": dic, "listas": J("estandar/listas.json"),
             "zonas": J("estandar/clima_zonas.json")["zonas"], "param": J("estandar/clima_parametros.json"),
             "cfg": J("estandar/indicadores_app.json"), "fichas": fichas, "sitios": sitios}
    img = RAIZ / "app" / "portada.jpg"
    if img.exists():
        import base64
        datos["portada"] = "data:image/jpeg;base64," + base64.b64encode(img.read_bytes()).decode()
    import base64 as _b64
    datos["plantillas_b64"] = {c: {t: _b64.b64encode(q.read_bytes()).decode() for t, q in (("completa", RAIZ / "plantillas" / f"Plantilla_Ficha_SUM_{c}.xlsx"), ("rapida", RAIZ / "plantillas" / f"Plantilla_Rapida_SUM_{c}.xlsx")) if q.exists()} for c in datos["listas"]["component"]}
    faltan = [i["clave"] for i in datos["cfg"]["indicadores"] if i["clave"] not in dic] + \
             [a["campo"] for a in datos["cfg"]["alertas"] if a["campo"] not in dic]
    if faltan:
        sys.exit(f"indicadores_app.json usa claves que no están en el diccionario: {faltan}")
    app = RAIZ / "app"
    txt = json.dumps(datos, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    (app / "datos.js").write_text("window.SUM_DATOS=" + txt + ";\n", encoding="utf-8")
    # versión de un solo archivo
    datos["plantillas"] = False
    txt1 = json.dumps(datos, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = (app / "index.html").read_text(encoding="utf-8")
    lee = lambda n: (app / n).read_text(encoding="utf-8").replace("</script", "<\\/script")
    html = html.replace('<link rel="stylesheet" href="estilos.css">', "<style>\n" + (app / "estilos.css").read_text(encoding="utf-8") + "</style>")
    html = html.replace('<script src="datos.js"></script>', "<script>window.SUM_DATOS=" + txt1 + ";</script>")
    html = html.replace('<script src="motor.js"></script>', "<script>\n" + lee("motor.js") + "</script>")
    html = html.replace('<script src="ui.js"></script>', "<script>\n" + lee("ui.js") + "</script>")
    (RAIZ / "SUM_app.html").write_text(html, encoding="utf-8")
    kb = lambda p: f"{p.stat().st_size / 1024:.0f} kB"
    print(f"{len(fichas)} fichas · {len(sitios)} sitios → app/datos.js ({kb(app / 'datos.js')}) · SUM_app.html ({kb(RAIZ / 'SUM_app.html')})")


if __name__ == "__main__":
    main()
