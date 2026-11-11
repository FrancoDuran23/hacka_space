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

## Aporte de samuel (2026-11-11 14:20)

**¿Se actualiza el smart contract cuando se contrata extensión de vida?** Aclaración para el rol escrow:

- El **código** del contrato no se actualiza (inmutable; un proxy upgradeable sería anti-pattern: mata "las reglas quedan fijadas al depositar").
- El **estado** sí: el plazo es un dato en storage. Basta una función `extenderPlazo(noradId, nuevoPlazo, evidenciaHash)` que solo firma el oráculo y emite evento.
- El bono sigue bloqueado durante la extensión.
- Riesgo: extensiones infinitas = el bono nunca se ejecuta. Mitigar exigiendo evidencia por extensión o `PLAZO_MAXIMO`. En MVP: evidencia requerida alcanza.

## Aporte de samuel (2026-11-11 14:40) — cuánto extendieron de verdad

Aclaración: ninguna extensión comercial fue por **recarga** de combustible. El MEV se acopla y reemplaza la propulsión del cliente. La recarga real solo existe como demo.

| Satélite (operador) | Lanzado | Servicio | Período | Extensión |
|---|---|---|---|---|
| Intelsat 901 (Intelsat) | 2001 | MEV-1 | feb-2020 a abr-2025 | **+5 años** (24 años en total); al terminar, el MEV lo dejó en órbita cementerio |
| Intelsat 10-02 (Intelsat) | 2004 | MEV-2 | abr-2021 a 2030 | **~9 años**: contrato inicial de 5 + ampliación de 4 firmada en may-2024 |
| Optus D3 (Optus) | 2009, diseñado para 15 años | MEV-1 (2.º cliente) | may-2025 a ago-2026 | **+1 año** |
| Optus D3, fase 2 | | MEP instalado por el MRV | desde fines de 2027 | **hasta +6 años** (planeado) |

- Northrop cuenta **~10 años de extensión acumulada** en 3 clientes con 2 vehículos (TechCrunch, ago-2026).
- Un mismo servicio ya se reutilizó: MEV-1 atendió a 2 satélites. Un contrato ya se amplió una vez (IS-10-02).
- Recarga real: Orbital Express (DARPA, 2007, LEO, entre naves propias) y China SJ-25→SJ-21 (GEO, jul-nov 2025, ~142 kg de hidracina según COSMIC; China no lo confirmó). Ninguna publicó años de vida ganados.
- **Interpretación para OrbitClear**: una extensión típica va de **5 a 9 años por satélite**, con cada tramo respaldado por un contrato de servicio que sirve de evidencia. Es la referencia para un `PLAZO_MAXIMO` por extensión. El caso IS-901 muestra que el servicio puede terminar con el retiro responsable del satélite, que es justo lo que el bono busca.
- Fuentes: space.com (undocking IS-901), Northrop (may-2024, ago-2026), SpaceNews (Intelsat extiende hasta 2030), Via Satellite y Polaris (Optus Aurora), TechCrunch (ago-2026), Ars Technica y COSMIC (SJ-25).
