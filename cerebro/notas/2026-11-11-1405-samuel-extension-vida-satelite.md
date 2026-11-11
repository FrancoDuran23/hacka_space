---
titulo: Extensión de vida de satélites — existe, es comercial en GEO, y qué le cambia al bono de OrbitClear
autor: samuel
fecha: 2026-11-11 14:05
tema: orbitclear
tags: [life-extension, mev, servicing, geo, diseño-contrato]
tipo: dato
fuentes:
  - https://news.northropgrumman.com/launch/northrop-grummans-mission-robotic-vehicle-launches-ushering-in-a-new-era-of-in-space-servicing
  - https://news.northropgrumman.com/civil-space/northrop-grumman-continues-in-space-industry-leadership-second-mission-extension-vehicle-undocking
  - https://news.northropgrumman.com/satellites/northrop-grumman-selected-for-in-space-demonstration-of-refueling-technologies
  - https://www.northropgrumman.com/what-we-do/space/space-logistics-services/space-industrial-revolution
relacionadas: [2026-11-11-1350-samuel-decisiones-orbitclear.md, 2026-11-11-1142-samuel-satelites-sin-maniobra.md]
---

## Qué es

Respuesta a "¿una empresa puede alargar la vida útil de un satélite?": sí, ya es servicio comercial rutinario en GEO. Implica diseño adicional para OrbitClear.

## Lo importante

- **MEV (Northrop/SpaceLogistics)**: MEV-1 se acopló a Intelsat-901 (2020, primera extensión comercial), MEV-2 a Intelsat 10-02 (2021). El servicio se acopla y presta su propulsión. Ago-2026: MEV-1 se desacopló de Optus D3 tras segunda misión — ya es rutina, ~10 años de servicio combinado.
- **MRV + MEPs (lanzado jul-2026)**: vehículo con brazos robóticos (DARPA/NRL) que instala "mochilas" de propulsión en satélites clientes + estándar de reabastecimiento PRM (aprobado Space Force). También hace inspección, reparación, relocalización **y remoción de debris**.
- **Reabastecimiento**: Orbit Fab (RAFTI), demo Space Force "Elixir" (Northrop, abr-2025). China: demos de acople/remolque (SJ-21/25).
- **Sin servicio externo**: racionar combustible, modo "inclined orbit" en GEO (años extra sin corrección de inclinación), redundancia.

## Implicancias para OrbitClear

1. **El fin de misión puede postergarse**: si el operador contrata extensión de vida, el bono no debe confiscarse → considerar `extenderPlazo(noradId, nuevaFecha, evidencia)` o la respuesta al jurado "la extensión no mata el bono, lo posterga".
2. **Quienes extienden vida también remueven**: MRV/Astroscale/ClearSpace son los cobradores naturales de `pagarRemocion`. El mercado de remoción ya existe; OrbitClear le crea el fondo.
3. **GEO ≠ LEO**: extensión comercial es GEO; ahí "retiro" = órbita cementerio, no reingreso → `DECAY_DATE` no verifica cumplimiento en GEO (habría que verificar cambio de altura). MVP sigue siendo todo LEO; en pitch: "v1 LEO".

## Preguntas abiertas

- ¿La verificación de "remoción a órbita cementerio" en GEO se puede hacer con el mismo SATCAT (cambio de PERIGEE/APOGEE) o necesita otra fuente?
