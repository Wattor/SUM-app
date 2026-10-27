"""Genera estandar/ficha_sum.schema.json a partir de diccionario_campos.csv y listas.json.

Uso:  python scripts/generar_schema.py
El diccionario es la fuente única de verdad: para cambiar un campo se edita el CSV
y se vuelve a correr este script (nunca se edita el schema a mano).
"""
import csv, json, pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent
EST = RAIZ / "estandar"


def cargar():
    dic = list(csv.DictReader(open(EST / "diccionario_campos.csv", encoding="utf-8")))
    listas = json.load(open(EST / "listas.json", encoding="utf-8"))
    return dic, listas


def dominio(listas, nombre):
    v = listas[nombre]
    return list(v.keys()) if isinstance(v, dict) else v


def schema_valor(row, listas):
    """Sub-schema del atributo 'valor' según el tipo del campo."""
    t = row["tipo"]
    dom = dominio(listas, row["dominio"]) if row["dominio"] else None
    if t == "numero":
        return {"type": "number"}
    if t == "entero":
        return {"type": "integer"}
    if t == "escala":
        return {"type": "integer", "minimum": 1, "maximum": 5}
    if t in ("lista", "booleano"):
        return {"type": "string", "enum": dom} if dom else {"type": "string"}
    if t == "lista_multiple":
        item = {"type": "string", "enum": dom} if dom else {"type": "string"}
        return {"type": "array", "items": item, "minItems": 1}
    if t == "valor_o_clase":
        return {"type": ["number", "string"]}
    return {"type": "string", "minLength": 1}


def schema_campo(row, listas):
    unidades = [u for u in [row["unidad"]] + row["unidades_alternativas"].split("|") if u]
    s = {
        "type": "object",
        "title": row["campo"],
        "description": f"[{row['seccion']}] {row['regla']}".strip(),
        "required": ["estado"],
        "additionalProperties": False,
        "properties": {
            "estado": {"$ref": "#/$defs/estado"},
            "valor": schema_valor(row, listas),
            "min": {"type": "number"},
            "max": {"type": "number"},
            "calificador": {"$ref": "#/$defs/calificador"},
            "unidad": {"type": "string", "enum": unidades} if unidades else {"type": "string"},
            "fuentes": {"$ref": "#/$defs/refs_fuente"},
            "evidencia": {"$ref": "#/$defs/evidencia"},
            "certeza": {"$ref": "#/$defs/certeza"},
            "justificacion": {"type": "string"},
            "nota": {"type": "string"},
            "valor_texto_original": {"type": "string",
                                     "description": "Texto legado que el migrador no pudo convertir; debe resolverse y eliminarse"},
        },
        # Si el estado es 'dato', exige valor (o rango) y evidencia
        "if": {"properties": {"estado": {"const": "dato"}}},
        "then": {"anyOf": [{"required": ["valor"]}, {"required": ["min", "max"]}, {"required": ["valor_texto_original"]}]},
    }
    return s


def main():
    dic, listas = cargar()
    comps = list(listas["component"].keys())
    defs = {
        "estado": {"type": "string", "enum": listas["estado"]},
        "calificador": {"type": "string", "enum": listas["calificador"]},
        "evidencia": {"type": "string", "enum": list(listas["evidencia"].keys())},
        "certeza": {"type": "string", "enum": list(listas["certeza"].keys())},
        "refs_fuente": {"type": "array", "items": {
            "type": "object", "required": ["ref"], "additionalProperties": False,
            "properties": {"ref": {"type": "string"}, "loc": {"type": "string", "description": "página, tabla, sección"}}}},
        "fuente": {"type": "object", "required": ["id", "cita"], "additionalProperties": False, "properties": {
            "id": {"type": "string", "pattern": "^[A-Za-z0-9_.\\-]{1,24}$"},
            "cita": {"type": "string", "minLength": 3, "description": "Referencia en formato APA 7"},
            "url": {"type": "string"},
            "tipo": {"type": "string", "enum": listas["tipo_fuente"]},
            "fecha_consulta": {"type": "string"}}},
    }
    campos_props = {}
    for row in dic:
        defs["campo_" + row["clave"]] = schema_campo(row, listas)
        campos_props[row["clave"]] = {"$ref": "#/$defs/campo_" + row["clave"]}

    nucleo_oblig = [r["clave"] for r in dic if r["componentes"] == "TODOS" and r["obligatorio"] == "Sí"]
    # Reglas por componente: obligatorios del módulo + prohibición de campos de otros módulos
    reglas = []
    for c in comps:
        propios = [r["clave"] for r in dic if c in r["componentes"].split("|")]
        ajenos = [r["clave"] for r in dic if r["componentes"] != "TODOS" and c not in r["componentes"].split("|")]
        oblig = [r["clave"] for r in dic if c in r["componentes"].split("|") and r["obligatorio"] == "Sí"]
        reglas.append({
            "if": {"properties": {"meta": {"properties": {"componente": {"const": c}}}}},
            "then": {"properties": {"campos": {"required": oblig,
                                                "not": {"anyOf": [{"required": [k]} for k in ajenos]}}}}})

    schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://github.com/<organizacion>/sum-materiales/estandar/ficha_sum.schema.json",
        "title": "Ficha SUM v1.0 — Selección y Uso de Materiales",
        "description": "Una ficha por material o sistema. Generado desde diccionario_campos.csv; no editar a mano.",
        "type": "object",
        "required": ["schema_version", "meta", "campos", "fuentes"],
        "additionalProperties": False,
        "properties": {
            "schema_version": {"const": "1.0"},
            "meta": {
                "type": "object", "additionalProperties": False,
                "required": ["id", "componente", "autor", "estado_revision", "fecha_actualizacion"],
                "properties": {
                    "id": {"type": "string", "pattern": "^(CIM|PIS|PAR|CUB|CIE|PUE|VEN)-[A-Z0-9]{2,4}-[0-9]{2}$"},
                    "componente": {"type": "string", "enum": comps},
                    "autor": {"type": "string"},
                    "revisor": {"type": "string"},
                    "estado_revision": {"type": "string", "enum": listas["estado_revision"]},
                    "fecha_actualizacion": {"type": "string", "format": "date"},
                    "id_legado": {"type": "string"},
                    "origen_migracion": {"type": "object"}
                }},
            "campos": {"type": "object", "required": nucleo_oblig, "additionalProperties": False,
                       "properties": campos_props},
            "fuentes": {"type": "array", "items": {"$ref": "#/$defs/fuente"}},
        },
        "allOf": reglas,
        "$defs": defs,
    }
    out = EST / "ficha_sum.schema.json"
    json.dump(schema, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"Schema generado: {out.name} · {len(dic)} campos · {len(nucleo_oblig)} obligatorios en el núcleo")


if __name__ == "__main__":
    main()
