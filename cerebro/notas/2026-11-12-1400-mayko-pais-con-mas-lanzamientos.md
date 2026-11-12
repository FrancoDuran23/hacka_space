---
titulo: Qué país lanza más satélites — EE.UU. por lejos, empujado por Starlink; China segundo y creciendo
autor: mayko
fecha: 2026-11-12 14:00
tema: orbitclear
tags: [lanzamientos, paises, starlink, china, celestrak, pitch]
tipo: dato
fuentes:
  - https://celestrak.org/pub/satcat.csv (descargado el 2026-11-11, cálculo propio por campo OWNER)
  - https://payloadspace.com/2025-orbital-launch-attempts-by-country/ (datos de Jonathan McDowell)
  - https://www.brycetech.com/reports/report-documents/global-orbital-activity-2025/BryceTech_Orbital_Launches_2025.pdf
  - https://spacenews.com/spacex-china-drive-new-record-for-orbital-launches-in-2025/
relacionadas: [2026-11-11-1626-mayko-avance-basura-espacial-y-proyecciones.md, 2026-11-11-1607-mauricio-numeros-economia-pitch.md]
---

## Qué es
Ranking de países por volumen de lanzamientos, separando dos métricas que se suelen mezclar: **satélites puestos en órbita** (cargas útiles) y **lanzamientos de cohetes**. En las dos gana Estados Unidos, por mucho.

## Lo importante

### Satélites lanzados por país dueño (SATCAT, cálculo propio)
| Año | Total | EE.UU. | China | Rusia | Starlink |
|---|---|---|---|---|---|
| 2024 | 2.804 | 2.234 (80%) | 266 (9%) | 89 (3%) | 1.964 |
| 2025 | 4.495 | 3.703 (82%) | 371 (8%) | 60 (1%) | 3.169 |
| 2026 (al 11-nov) | 3.696 | 2.885 (78%) | 438 (12%) | 60 (2%) | 2.275 |

- Satélites **operativos hoy**: 17.403. EE.UU. 13.121 (75%), China 1.607 (9%), Reino Unido 700 (4%, OneWeb), Rusia 375 (2%). Starlink sola: 11.195 operativos, casi dos de cada tres satélites activos del mundo.
- "Dueño" es el campo OWNER de SATCAT (país u organización que registra el objeto). Starlink figura como "US", no como SpaceX.

### Lanzamientos de cohetes en 2025 (fuentes externas)
- BryceTech: EE.UU. 193 (59% del total), China 93, Rusia 17, Europa 7, India 5, Japón 4.
- McDowell vía Payload Space: 329 intentos en el mundo; EE.UU. 181 (SpaceX 170) más 18 de Rocket Lab (17 desde Nueva Zelanda); China 92 (+35% contra 2024, por las constelaciones Guowang y Qianfan).
- Las cifras difieren unos pocos lanzamientos según cómo se cuente a Rocket Lab y los intentos fallidos.

### Lectura para el pitch
- **Interpretación:** el problema de la basura es, en volumen, un problema de pocos actores. Una sola empresa (SpaceX) pone ~70% de los satélites nuevos por año, y EE.UU. y China juntos superan el 90%. Por eso una garantía exigida por un solo regulador grande ya cubre la mayor parte del flujo nuevo (refuerza el argumento de Nature 2026 de que un país puede aplicarlo solo).
- La FCC (EE.UU.) es el regulador con más palanca: licencia la gran mayoría de lo que se lanza.

## No usar / dudoso
- No mezclar "satélites lanzados" (miles) con "lanzamientos" (cientos): un Falcon 9 lleva ~20–29 Starlink.
- Mi conteo de lanzamientos por sitio a partir de SATCAT subestima a China (varios sitios con códigos propios) y omite fallidos: usar BryceTech o McDowell para lanzamientos.
- 2026 es parcial (hasta el 11-nov).
