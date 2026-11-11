---
titulo: Proporción de satélites que no pueden maniobrar para evitar colisiones
autor: samuel
fecha: 2026-11-11 11:42
tema: satelites
tags: [colisiones, maniobrabilidad, debris, leo, estadisticas]
tipo: dato
fuentes:
  - https://theworlddata.com/space-debris-statistics/ (cita GCAT de McDowell, 12-oct-2026)
  - https://thethirdattractor.org/studies/keys-to-orbit/ (cita GCAT, 8-jul-2026)
  - https://sdup.esoc.esa.int/discosweb/statistics/ (ESA, 02-nov-2026)
  - https://sidc.be/article/what-floats-around-comes-around (SIDC, datos GCAT abr-2026)
  - Catálogo primario: GCAT de Jonathan McDowell, planet4589.org
relacionadas: []
---

## Qué es

Cuántos de los satélites actuales **no pueden ejecutar una maniobra de evasión** ante una conjunción por no tener propulsión (ESA lo llama falta de "OCC", Orbit Control Capacity). Dato central para dimensionar el problema: los objetos no maniobrables dependen de que el otro esquive.

## Lo importante

- **~13% de los satélites ACTIVOS no puede maniobrar**: 2.229 no maniobrables de 16.988 activos (GCAT vía The World Data, 12-oct-2026).
- Desglose GCAT 12-oct-2026: 11.114 Starlinks activos (65,4% del total, todos maniobrables) + 3.644 otros activos maniobrables + 2.229 activos no maniobrables.
- **Contando TODOS los payloads en órbita** (activos + muertos): ~26% no puede esquivar (2.229 no maniobrables + 3.066 payloads muertos = 5.295 de 20.079). Un satélite muerto no puede maniobrar por definición.
- **Contando todo lo trackeado** (~47.370 objetos catalogados, ESA nov-2026): solo ~1/3 son satélites activos; el resto es debris inerte → aprox. **2/3 de los objetos en órbita no pueden esquivar nada**.
- **Evolución**: en 2021 era ~31% de los activos (1.400 de 4.500, charla de McDowell). La baja a ~13% se debe a que Starlink (toda maniobrable) diluyó la proporción, aunque el número absoluto de no maniobrables creció.
- El paper "Who Holds the Keys to Orbit" llama a estos ~2.100 objetos la "burden-shift population": trasladan la carga de esquivar a los satélites maniobrables. GCAT 8-jul-2026: 2.113 no maniobrables de 16.234 activos.
- **Discrepancia de conteo**: ESA/DISCOS dice ~15.800 satélites funcionando (02-nov-2026); GCAT dice ~17.000 activos. Criterios distintos de "activo"; la proporción de no maniobrables queda en ~12-14% en ambos.
- Contexto ESA (02-nov-2026): ~28.570 satélites lanzados en la historia, ~19.610 aún en órbita.
- **Interpretación**: para la hackatón conviene definir el denominador (activos / todos los payloads / todo lo trackeado) porque la respuesta cambia de ~13% a ~26% a ~66%.

## Preguntas abiertas

- Desglose por altitud: el Space Environment Report de ESA (fig. 4) muestra que por debajo de ~600 km domina lo maniobrable; entre 600-1.100 km conviven mucho debris y no maniobrables. Importa si el proyecto se enfoca en una banda específica.
- Conviene rechequear los números en GCAT (planet4589.org) cerca de la fecha de presentación, cambian semana a semana.
