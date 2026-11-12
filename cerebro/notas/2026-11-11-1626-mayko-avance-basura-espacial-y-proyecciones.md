---
titulo: Avance de la basura espacial 2024–2026 y proyecciones sin normativa — cifras con fuente para el pitch
autor: mayko
fecha: 2026-11-11 16:26
tema: orbitclear
tags: [datos, esa, nasa, celestrak, kessler, cumplimiento, pitch, proyeccion]
tipo: resumen
fuentes:
  - https://sdup.esoc.esa.int/discosweb/statistics/ (ESA, estadísticas vigentes al 02-nov-2026)
  - https://www.esa.int/ga/articles/esa-space-environment-report-2025
  - https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2026
  - https://www.sdo.esoc.esa.int/publications/Space_Environment_Report_I10R0_20260501.pdf
  - https://www.sdo.esoc.esa.int/environment_report/Space_Environment_Report_I9R1_20251021.pdf
  - https://www.orbitaldebris.jsc.nasa.gov/quarterly-news/pdfs/ODQNv28i4.pdf
  - https://www.orbitaldebris.jsc.nasa.gov/quarterly-news/pdfs/ODQNv29i1.pdf
  - https://conference.sdo.esoc.esa.int/proceedings/sdc6/paper/199/sdc6-paper199.pdf (estudio IADC, 6 modelos)
  - http://hdl.handle.net/2060/20100000157 (NASA LEGEND)
  - https://celestrak.org/pub/satcat.csv (descargado el 11-nov-2026, cálculo propio)
relacionadas: [2026-11-11-1245-samuel-verificaciones-orbitclear.md, 2026-11-11-1455-franco-linea-de-tiempo-con-y-sin-orbitclear.md, 2026-11-11-1607-mauricio-numeros-economia-pitch.md]
---

## Qué es
Cifras verificadas sobre cuánto creció la basura espacial en los últimos dos años y qué dicen los modelos de largo plazo sobre seguir sin una obligación de retiro. Responde la pregunta abierta de la nota de Franco (línea de tiempo con y sin OrbitClear). Conclusión principal: **ninguna fuente primaria da un año a partir del cual la órbita deja de ser usable.** Hay que presentarlo con los horizontes que sí dan las fuentes.

## Lo importante

### 1. Avance en dos años, según ESA
| Fecha | Objetos rastreados | Satélites activos | Fuente |
|---|---|---|---|
| fin 2024 | ~40.000 | ~11.000 | ESA Space Environment Report 2025 |
| 02-nov-2026 | ~47.370 | ~15.800 | ESA estadísticas DISCOS |

- +~18% de objetos rastreados en menos de dos años. ESA aclara que parte del aumento se debe a mejor detección (Space Fence), no solo a más objetos.
- Modelo MASTER-8 de ESA (feb-2026): 68.450 objetos >10 cm, 1,5 millones entre 1 y 10 cm, 230 millones entre 1 mm y 1 cm. Más de 660 fragmentaciones desde 1957 y más de 17.500 t en órbita.
- En 2024 se sumaron más de 3.000 fragmentos catalogados. El mayor caso fue la etapa CZ-6A del lanzamiento Qianfan (07-ago-2024, ~800 km), con más de 650 catalogados según NASA ODQN v28i4. Otros: Resurs P1 (jun-2024) e Intelsat 33E (oct-2024, GEO).

### 2. Avance en dos años, según el catálogo público (cálculo propio, CelesTrak SATCAT)
Gráfico: [`../adjuntos/2026-11-11-1626-mayko-grafico-objetos-en-orbita.svg`](../adjuntos/2026-11-11-1626-mayko-grafico-objetos-en-orbita.svg) · datos: [`../adjuntos/2026-11-11-1626-mayko-satcat-serie-2024-2026.csv`](../adjuntos/2026-11-11-1626-mayko-satcat-serie-2024-2026.csv)

| Fecha | Satélites | Etapas de cohete | Desechos catalogados | Total en órbita |
|---|---|---|---|---|
| 2024-11-11 | 13.753 | 2.238 | 13.328 | 29.356 |
| 2025-11-11 | 16.758 | 2.259 | 12.740 | 31.770 |
| 2026-11-11 | 20.341 | 2.306 | 12.534 | 35.189 |

- Los satélites en órbita crecieron **+48% en dos años**, y Starlink pasó de 6.613 a 11.196. Se lanzaron 2.794 satélites en 2024, 4.483 en 2025 y 3.686 en lo que va de 2026.
- Los desechos del catálogo **público** bajaron un 6%. **No es buena noticia ni contradice a ESA**: el catálogo público de EE.UU. es más chico que el total rastreado de ESA (35 mil contra 47 mil), y en el período reingresaron muchos fragmentos bajos (991 desechos en 2024 y 662 en 2025). **Interpretación (sin fuente todavía):** el máximo solar del ciclo 25 aumenta el frenado atmosférico. No decir en el pitch "la basura bajó".
- Método: un objeto cuenta como "en órbita" en una fecha si ya estaba catalogado y no había reingresado. A los desechos se les estima la fecha de catalogación por su número NORAD, porque SATCAT les asigna la fecha de lanzamiento del objeto padre. Es una aproximación.

### 3. Hasta cuándo se puede seguir sin normativa: lo que dicen las fuentes
- **ESA 2025 y 2026:** "Even if no new satellites were launched, the debris population would continue to increase because fragmentation events generate debris faster than they can naturally reenter the atmosphere." Hace falta remoción activa para evitar el síndrome de Kessler. Según ESA, el comportamiento actual no es sostenible a largo plazo.
- **IADC (6 modelos de 5 agencias, 200 años):** aun con **90% de cumplimiento** de retiro y **cero explosiones**, la población en LEO crece ~30% y hay una **colisión catastrófica cada 5 a 9 años**.
- **NASA LEGEND:** sin ningún lanzamiento nuevo, **después de ~2055** la población crece por colisiones; con lanzamientos, es peor.
- **Cumplimiento real (ESA 2026, datos a fin de 2025):** solo **57%** de los satélites de más de 1.000 kg cumple la regla de 25 años, contra 86–99% de los chicos.

### Frases seguras para el pitch
1. "Hay 47.000 objetos rastreados y 15.800 satélites activos (ESA, noviembre de 2026)."
2. "En dos años los satélites en órbita crecieron casi 50% (catálogo CelesTrak)."
3. "Incluso si mañana no se lanzara nada más, la basura seguiría creciendo (ESA 2026)."
4. "Con 90% de cumplimiento, los modelos de seis agencias igual proyectan una colisión catastrófica cada 5 a 9 años (IADC)."
5. "Solo 57% de los satélites grandes cumple hoy la regla de retiro (ESA 2026)."

## No usar / dudoso
- **Un año concreto de "órbita inutilizable":** no existe en fuentes primarias. Si el jurado pregunta, la respuesta es: "las simulaciones ya muestran inestabilidad con el comportamiento actual; NASA ubica el punto en que las colisiones superan a los reingresos hacia 2055 aun sin lanzar nada".
- "705 fragmentos del CZ-6A" (LinkedIn) → usar "más de 650 catalogados" (NASA).
- "500 fragmentos de Intelsat 33E" (ExoAnalytic vía SpaceNews) → son observaciones comerciales, no catálogo oficial.
- No comparar el catálogo NASA o CelesTrak (~30–35 mil) con el total rastreado de ESA (~47 mil) como si fueran la misma métrica.
- `docs/planning.md` §2 todavía dice "40.000 / 57.000": son cifras de fin de 2024. Las vigentes son 47.370 y 68.450 (ya lo había marcado Samuel).

## Preguntas abiertas
- Confirmar con fuente primaria el efecto del máximo solar en la tasa de reingresos 2024–2025.
- Los rangos de cumplimiento del estándar de 5 años (5–35% satélites, 30–80% etapas) vienen de un resumen secundario: verificarlos en el PDF de ESA I10R1 antes de usarlos.
