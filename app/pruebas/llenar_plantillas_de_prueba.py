"""Simula a un usuario que llena las plantillas Excel (completa y rápida) de cada componente. Escribe en app/pruebas/tmp/."""
import pathlib, openpyxl
R = pathlib.Path(__file__).resolve().parents[2]; T = pathlib.Path(__file__).resolve().parent / "tmp"; T.mkdir(exist_ok=True)
for p in sorted((R / "plantillas").glob("Plantilla_*_SUM_*.xlsx")):
    wb = openpyxl.load_workbook(p); ws = wb["Ficha"]; comp = p.stem.split("_")[-1]
    ws["C2"] = "Persona de prueba"; ws["G2"] = f"{comp}-PRU-9{'8' if 'Rapida' in p.name else '9'}"
    fila = {ws.cell(r, 2).value: r for r in range(6, ws.max_row + 1)}
    def pon(k, valor, unidad=None, cert=None, just=None):
        r = fila[k]; ws.cell(r, 6, "dato"); ws.cell(r, 7, valor); ws.cell(r, 12, "FT01"); ws.cell(r, 13, "p. 2"); ws.cell(r, 14, "E2")
        if unidad: ws.cell(r, 11, unidad)
        if cert: ws.cell(r, 15, cert)
        if just: ws.cell(r, 16, just)
    pon("name", "Sistema de prueba"); pon("moisture_resistance", 4, just="Ensayo de prueba"); pon("durability_years", 30, "años", "verificado")
    wf = wb["Fuentes"]; wf.cell(3, 1, "FT01"); wf.cell(3, 2, "Fabricante de prueba. (2026). Ficha técnica del sistema."); wf.cell(3, 4, "ficha_tecnica")
    wb.save(T / (p.stem + "_llena.xlsx"))
print("plantillas llenas de prueba en", T)
