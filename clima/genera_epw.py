#!/usr/bin/env python3
"""Genera un EPW sintético (año típico, 8760 h) para Tierra Blanca de Cartago.

Método: generación estocástica a partir de normales mensuales (como hacen
Meteonorm o WeatherMaker), calibrada a estaciones IMN cercanas:
  - Temperatura: perfil mensual de Linda Vista (El Guarco, 1400 msnm, 1951–2017),
    desplazado al nivel anual del sitio (Finca #3 Llano Grande, 2220 msnm,
    corregido a 2080 msnm con 6,5 °C/km).
  - Lluvia: perfil y días con lluvia de Linda Vista, escalado a 1450 mm/año.
  - Humedad relativa: perfil de Linda Vista + 3 puntos por altitud (sitio más nuboso).
  - Radiación global: ITCR Cartago (1360 msnm, 1997–2017), medias mensuales.
  - Viento: perfil de Linda Vista (dirección predominante Este).
Componentes horarias: Collares-Pereira & Rabl (GHI), Erbs (difusa), Walton (IR cielo).
"""
import math
import random
import sys

random.seed(20261103)

LAT, LON, TZ, ELEV = 9.9307, -83.8894, -6.0, 2080
YEAR = 2026  # año de etiqueta (1 ene 2026 = jueves)

MESES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

# --- Linda Vista (IMN, Descripción del clima, cantón El Guarco) ---
LV_TMAX = [22.7, 23.5, 24.6, 25.4, 25.6, 25.2, 24.5, 25.0, 25.3, 24.9, 23.7, 22.8]
LV_TMIN = [13.2, 13.0, 13.2, 13.9, 14.5, 14.7, 14.7, 14.5, 14.2, 14.3, 14.3, 13.8]
LV_PREC = [32.7, 19.7, 16.0, 45.3, 191.9, 202.5, 130.9, 152.1, 250.1, 262.0, 119.0, 58.1]
LV_DIAS = [7, 7, 3, 6, 13, 17, 13, 14, 17, 17, 12, 8]
LV_HR = [84.3, 82.7, 82.7, 82.9, 86.3, 87.0, 87.3, 86.3, 86.3, 87.9, 88.2, 86.4]
LV_VIENTO_KMH = [15.0, 14.6, 14.3, 13.1, 11.0, 9.25, 10.8, 9.6, 7.6, 8.0, 10.3, 13.5]
ITCR_H_MJ = [13.6, 15.8, 17.3, 16.8, 14.1, 13.3, 13.2, 14.1, 14.8, 13.3, 12.0, 12.4]

# --- Nivel anual del sitio (valores que también van a la ficha) ---
TMAX_SITIO = float(sys.argv[1]) if len(sys.argv) > 1 else 19.3
TMIN_SITIO = float(sys.argv[2]) if len(sys.argv) > 2 else 11.1
PREC_SITIO = 1450.0
HR_EXTRA = 3.0
TMAX_SESGO = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0  # compensa enfriamiento por lluvia
GHI_CAL = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0     # compensa recortes horarios

def media(x):
    return sum(x) / len(x)

TMAX = [t - (media(LV_TMAX) - TMAX_SITIO) for t in LV_TMAX]
TMIN = [t - (media(LV_TMIN) - TMIN_SITIO) for t in LV_TMIN]
PREC = [p * PREC_SITIO / sum(LV_PREC) for p in LV_PREC]
HR = [min(h + HR_EXTRA, 95.0) for h in LV_HR]
VIENTO = [v / 3.6 for v in LV_VIENTO_KMH]

# --- Geometría solar ---
def solar(doy, hora_std):
    """Devuelve (cos_zenit, G0n W/m²) para la hora estándar local (centro de la hora)."""
    g = 2 * math.pi / 365 * (doy - 1 + (hora_std - 12) / 24)
    decl = (0.006918 - 0.399912 * math.cos(g) + 0.070257 * math.sin(g)
            - 0.006758 * math.cos(2 * g) + 0.000907 * math.sin(2 * g)
            - 0.002697 * math.cos(3 * g) + 0.00148 * math.sin(3 * g))
    eot = 229.18 * (0.000075 + 0.001868 * math.cos(g) - 0.032077 * math.sin(g)
                    - 0.014615 * math.cos(2 * g) - 0.040849 * math.sin(2 * g))
    t_solar = hora_std * 60 + eot + 4 * LON - 60 * TZ
    ha = math.radians(t_solar / 4 - 180)
    lat = math.radians(LAT)
    cz = math.sin(lat) * math.sin(decl) + math.cos(lat) * math.cos(decl) * math.cos(ha)
    g0n = 1367 * (1 + 0.033 * math.cos(2 * math.pi * doy / 365))
    return cz, g0n, decl

def h0_diaria(doy):
    """Radiación extraterrestre diaria sobre horizontal (MJ/m²)."""
    lat = math.radians(LAT)
    decl = math.radians(23.45) * math.sin(2 * math.pi * (284 + doy) / 365)
    ws = math.acos(-math.tan(lat) * math.tan(decl))
    dr = 1 + 0.033 * math.cos(2 * math.pi * doy / 365)
    return 24 * 3600 * 1367 / math.pi * dr * (
        math.cos(lat) * math.cos(decl) * math.sin(ws) + ws * math.sin(lat) * math.sin(decl)) / 1e6, ws

def presion_pa(z):
    return 101325 * (1 - 2.25577e-5 * z) ** 5.25588

def psat(t):
    return 611.2 * math.exp(17.62 * t / (243.12 + t))

def rocio(t, hr):
    a = math.log(max(hr, 1) / 100) + 17.62 * t / (243.12 + t)
    return 243.12 * a / (17.62 - a)

# --- Días de lluvia por mes (sorteo estable) ---
def dias_lluvia(m):
    n = MESES[m]
    k = LV_DIAS[m]
    dias = sorted(random.sample(range(n), k))
    # montos con distribución exponencial, normalizados al total mensual
    w = [random.expovariate(1.0) for _ in dias]
    s = sum(w)
    return {d: PREC[m] * wi / s for d, wi in zip(dias, w)}

P = presion_pa(ELEV)
filas = []
doy = 0
anom_t = 0.0
for m in range(12):
    lluvia = dias_lluvia(m)
    # temperaturas diarias con persistencia (AR1)
    for d in range(MESES[m]):
        doy += 1
        anom_t = 0.6 * anom_t + random.gauss(0, 0.7)
        llueve = d in lluvia
        h0, ws = h0_diaria(doy)
        kt_med = ITCR_H_MJ[m] / h0
        kt = kt_med + random.gauss(0, 0.08) - (0.06 if llueve else -0.02)
        kt = max(0.12, min(0.72, kt))
        H = kt * h0 * GHI_CAL  # MJ/m² día
        tmax_d = TMAX[m] + TMAX_SESGO + anom_t + (kt - kt_med) * 5
        tmin_d = TMIN[m] + 0.5 * anom_t + (0.6 if llueve else -0.3)
        if tmax_d - tmin_d < 3:
            tmax_d = tmin_d + 3
        hr_obj = HR[m] + (4 if llueve else -2) + random.gauss(0, 2)
        # dew point diario aproximado a partir de la HR media objetivo y T media
        tmed_d = (tmax_d + tmin_d) / 2
        td_d = rocio(tmed_d, min(hr_obj, 97)) + 1.0
        td_d = min(td_d, tmin_d + 0.3)
        # siguiente mínimo (para el descenso nocturno)
        H_sum_weights = []
        horas = []
        for h in range(24):
            hc = h + 0.5
            cz, g0n, decl = solar(doy, hc)
            # temperatura horaria: seno entre mín (5:30) y máx (13:30)
            if 5.5 <= hc <= 13.5:
                f = (1 - math.cos(math.pi * (hc - 5.5) / 8)) / 2
                t = tmin_d + (tmax_d - tmin_d) * f
            else:
                dt = (hc - 13.5) if hc > 13.5 else (hc + 24 - 13.5)
                f = math.exp(-dt / 4.5)
                t = tmin_d + (tmax_d - tmin_d) * (0.25 + 0.75 * f) - 0.25 * (tmax_d - tmin_d) * (dt / 16)
            td = td_d + 0.4 * math.sin(math.pi * (hc - 6) / 12) if 6 < hc < 18 else td_d
            td = min(td, t)
            hr = 100 * psat(td) / psat(t)
            horas.append([h + 1, t, td, hr, cz, g0n])
        # distribución horaria de la radiación (Collares-Pereira & Rabl)
        a = 0.409 + 0.5016 * math.sin(ws - math.pi / 3)
        b = 0.6609 - 0.4767 * math.sin(ws - math.pi / 3)
        rts = []
        for hh in horas:
            hc = hh[0] - 0.5
            cz = hh[4]
            if cz <= 0.01:
                rts.append(0)
                continue
            # ángulo horario aproximado desde cz
            cz_, _, decl = solar(doy, hc)
            lat = math.radians(LAT)
            cosw = (cz - math.sin(lat) * math.sin(decl)) / (math.cos(lat) * math.cos(decl))
            w = math.acos(max(-1, min(1, cosw)))
            rt = math.pi / 24 * (a + b * math.cos(w)) * (math.cos(w) - math.cos(ws)) / (
                math.sin(ws) - ws * math.cos(ws))
            rts.append(max(rt, 0))
        srt = sum(rts) or 1
        # lluvia por la tarde (régimen Pacífico)
        lluvia_h = [0.0] * 24
        if llueve:
            ini = random.choice([12, 13, 14, 15])
            dur = random.choice([2, 3, 4])
            for k in range(dur):
                lluvia_h[min(ini + k, 23)] = lluvia[d] / dur
        for i, hh in enumerate(horas):
            hora, t, td, hr, cz, g0n = hh
            ghi = H * 1e6 / 3600 * rts[i] / srt * (srt / sum(rts) if sum(rts) else 0)
            ghi = H * 1e6 / 3600 * rts[i] / srt
            if lluvia_h[i] > 0:
                ghi *= 0.45
                t -= 1.2
                td = min(td, t)
                hr = 100 * psat(td) / psat(t)
                hr = max(hr, 92)
                td = rocio(t, hr)
            ext_h = max(0, g0n * cz) if cz > 0 else 0
            if ext_h > 0:
                ghi = min(ghi, 0.8 * ext_h)
                kth = ghi / ext_h if ext_h > 0 else 0
                # Erbs
                if kth <= 0.22:
                    fd = 1 - 0.09 * kth
                elif kth <= 0.8:
                    fd = 0.9511 - 0.1604 * kth + 4.388 * kth ** 2 - 16.638 * kth ** 3 + 12.336 * kth ** 4
                else:
                    fd = 0.165
                dhi = ghi * fd
                dni = (ghi - dhi) / cz if cz > 0.05 else 0
                dni = min(dni, 0.9 * g0n)
            else:
                ghi = dhi = dni = 0
                kth = 0
            # nubosidad (décimas) desde kt horario; de noche, desde kt diario
            kref = kth if ext_h > 30 else kt
            nub = max(0, min(10, round(10 * (1 - (kref - 0.15) / 0.6))))
            # IR de cielo (Walton / Clark-Allen)
            tk = t + 273.15
            eps_clear = 0.787 + 0.764 * math.log((td + 273.15) / 273.15)
            n = nub / 10
            eps = eps_clear * (1 + 0.0224 * n - 0.0035 * n ** 2 + 0.00028 * n ** 3)
            ir = eps * 5.6697e-8 * tk ** 4
            # viento: diurno más fuerte por la tarde
            v = VIENTO[m] * (0.7 + 0.6 * max(0, math.sin(math.pi * (hora - 7) / 12))) + random.gauss(0, 0.6)
            v = max(0.0, round(v, 1))
            dirv = int((90 + random.gauss(0, 35 if m in (0, 1, 2, 3, 11) else 60)) % 360)
            mes, dia = m + 1, d + 1
            filas.append(dict(mes=mes, dia=dia, hora=hora, t=t, td=td, hr=min(100, hr),
                              ext_h=ext_h, ext_n=g0n if cz > 0 else 0, ir=ir, ghi=ghi,
                              dni=dni, dhi=dhi, wd=dirv, ws=v, nub=nub, p=lluvia_h[i]))

assert len(filas) == 8760, len(filas)

# --- Escritura del EPW ---
def mensual(clave, f=media):
    out = []
    for m in range(1, 13):
        out.append(f([r[clave] for r in filas if r["mes"] == m]))
    return out

t_mens = mensual("t")
suelo = []
# Temperaturas del terreno (Kusuda simplificado): media anual y amortiguación
tmed_anual = media(t_mens)
for prof, amort, desfase in ((0.5, 0.8, 1), (2.0, 0.45, 2), (4.0, 0.2, 3)):
    vals = [tmed_anual + amort * (t_mens[(i - desfase) % 12] - tmed_anual) for i in range(12)]
    suelo.append((prof, vals))

lineas = []
lineas.append(f"LOCATION,Tierra Blanca,Cartago,CRI,Sintetico IMN Linda Vista-Llano Grande-ITCR,999999,{LAT:.4f},{LON:.4f},{TZ:.1f},{ELEV:.1f}")
lineas.append("DESIGN CONDITIONS,0")
lineas.append("TYPICAL/EXTREME PERIODS,0")
g = ",".join(f"{p:.1f},,,," + ",".join(f"{v:.1f}" for v in vals) for p, vals in suelo)
lineas.append(f"GROUND TEMPERATURES,3,{g}")
lineas.append("HOLIDAYS/DAYLIGHT SAVINGS,No,0,0,0")
lineas.append("COMMENTS 1,EPW sintetico (ano tipico generado estocasticamente) para Tierra Blanca de Cartago 2080 msnm. "
              "Temperatura: perfil IMN Linda Vista (1400 msnm 1951-2017) llevado al nivel de Finca 3 Llano Grande (2220 msnm) corregido 6.5 C/km. "
              "Lluvia: perfil Linda Vista escalado a 1450 mm. Radiacion: IMN ITCR Cartago 1997-2017. Viento y HR: Linda Vista. No es un registro medido.")
lineas.append("COMMENTS 2,Generado el 2026-11-03 para la Matriz de Clima de Sitio (app SUM). Uso: analisis bioclimatico y comparativo; no sustituye un TMY medido. Certeza: estimado por analogia.")
lineas.append("DATA PERIODS,1,1,Data,Thursday, 1/ 1,12/31")

for r in filas:
    t = round(r["t"], 1)
    td = round(min(r["td"], r["t"]), 1)
    hr = int(round(r["hr"]))
    ghi = int(round(r["ghi"]))
    dni = int(round(r["dni"]))
    dhi = int(round(r["dhi"]))
    ilum = (int(ghi * 110), int(dni * 100), int(dhi * 120), int(dhi * 10) if dhi else 0)
    precip = round(r["p"], 1)
    pw = 1 if precip > 0 else 9
    codes = "600000000" if precip > 0 else "999999999"
    campos = [YEAR, r["mes"], r["dia"], r["hora"], 60, "?9?9?9?9E0?9?9?9?9?9?9?9?9?9?9?9?9?9?9?9*9*9?9?9?9",
              t, td, hr, int(P), int(round(r["ext_h"])), int(round(r["ext_n"])), int(round(r["ir"])),
              ghi, dni, dhi, *ilum, r["wd"], r["ws"], r["nub"], max(0, r["nub"] - 2), 15.0 if precip == 0 else 4.0,
              77777 if r["nub"] < 6 else 1500, pw, codes, 25, 0.06, 0, 88, 0.17, precip, 1.0 if precip > 0 else 0.0]
    lineas.append(",".join(str(c) for c in campos))

out = "TierraBlanca_Cartago_CRI_sintetico.epw"
with open(out, "w", newline="\r\n") as fh:
    fh.write("\n".join(lineas) + "\n")

# --- Resumen para la ficha ---
ghi_dia = mensual("ghi", lambda x: sum(x) / (len(x) / 24) / 1000)
hr_m = mensual("hr")
print("OK", out)
def dmax(m):
    vals = {}
    for r in filas:
        if r["mes"] == m:
            vals.setdefault(r["dia"], []).append(r["t"])
    return media([max(v) for v in vals.values()]), media([min(v) for v in vals.values()])
tx = [dmax(m)[0] for m in range(1, 13)]
tn = [dmax(m)[1] for m in range(1, 13)]
print("Tmax media diaria anual %.2f | Tmin %.2f | Tmed %.2f" % (media(tx), media(tn), media(t_mens)))
print("HR media anual %.1f %%" % media([r["hr"] for r in filas]))
print("GHI media diaria anual %.2f kWh/m2.dia (%.2f MJ)" % (media(ghi_dia), media(ghi_dia) * 3.6))
print("Lluvia anual %.0f mm, dias con lluvia %d" % (sum(r["p"] for r in filas),
      len({(r['mes'], r['dia']) for r in filas if r['p'] > 0})))
print("Mensual Tmax", [round(x, 1) for x in tx])
print("Mensual Tmin", [round(x, 1) for x in tn])
print("Mensual HR", [round(x, 1) for x in hr_m])
print("Mensual GHI kWh", [round(x, 2) for x in ghi_dia])
print("Mensual lluvia", [round(sum(r['p'] for r in filas if r['mes'] == m)) for m in range(1, 13)])
print("Viento medio %.2f m/s" % media([r["ws"] for r in filas]))
print("Presion %d Pa" % P)
