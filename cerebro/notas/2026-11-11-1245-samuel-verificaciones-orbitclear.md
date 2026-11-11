---
titulo: Verificaciones OrbitClear — CelesTrak, casos demo, cifras de papers, marco legal AR y EU Space Act
autor: samuel
fecha: 2026-11-11 12:45
tema: orbitclear
tags: [celestrak, demo, nature, eu-space-act, argentina, verificacion, slides]
tipo: resumen
fuentes:
  - https://celestrak.org/satcat/records.php (probado en vivo, JSONs en sample-data/)
  - https://doi.org/10.1038/s41467-026-77660-4 (Nature Communications, 15-sep-2026)
  - https://spacenews.com/clearspace-contract-signed/ (costo remoción ESA/ClearSpace)
  - https://www.argentina.gob.ar/ciencia/conae/institucional/legislacion
  - https://www.argentina.gob.ar/ciencia/conae/institucional/registro-de-satelites
  - https://defence-industry-space.ec.europa.eu/eu-space-act_en
  - https://www.eh.at/en/sustainability-in-orbit-part-1-how-the-council-compromise-turns-the-eu-space-acts-debris-and-traffic-rules-into-real-operator-duties/
  - https://table.media/en/europe/news/eu-space-act-agreement-reached-in-european-parliaments-committee-on-industry-research-and-energy
  - https://avalanche-track.vercel.app/ (reglas del track)
  - https://leo.space/articles/researchers-propose-200k-satellite-bond-to-incentivize-deorbiting-and-fund-debri
relacionadas: [docs/planning.md, 2026-11-11-1300-franco-bono-deorbitado-quien-multa.md, 2026-11-11-1142-samuel-satelites-sin-maniobra.md]
---

## Qué es

Verificación de los pendientes de `docs/planning.md` §13 y de las preguntas abiertas de la nota de Franco. Casi todo quedó resuelto con fuente primaria o respuesta de API real.

## 1. CelesTrak y casos de la demo — RESUELTO

**Campo de decay**: `DECAY_DATE` en el SATCAT. Endpoint probado en vivo:

```
GET https://celestrak.org/satcat/records.php?CATNR=<norad>&FORMAT=json
DECAY_DATE = ""       → sigue en órbita
DECAY_DATE = fecha    → ya reingresó (éxito del bono)
OPS_STATUS_CODE       → "+" operativo, "-" no operativo
```

Posiciones en vivo: `gp.php?CATNR=<norad>&FORMAT=json` (elementos orbitales para satellite.js).

**Trío de la demo confirmado** (JSONs guardados en `sample-data/`):

| Rol | Satélite | NORAD | Evidencia |
|---|---|---|---|
| Reingresó (cumplió) | TIANGONG-1 | 37820 | `DECAY_DATE: 2018-04-02` |
| Muerto en órbita (incumple) | ENVISAT | 27386 | `DECAY_DATE: ""`, `OPS: "-"` (ESA, ~761 km, RCS 18,6) |
| Activo (monitoreo normal) | ISS | 25544 | `DECAY_DATE: ""`, `OPS: "+"` |

Nota: el número de catálogo confirma Envisat como candidato de planning.md. Cuidado con rate-limit de CelesTrak: cachear en `sample-data/` (ya está el set inicial).

## 2. Discrepancia de cifras Nature — RESUELTO: eran dos métricas distintas

Paper: Brownhall et al., "Bonds improve post mission disposal compliance and the sustainability of LEO", **Nature Communications, 15-sep-2026**.

- **Bono USD 200k** → reduce >1/3 la **masa** de derelicts por año + bienestar **hasta 27%** (lo que citó Franco ✓)
- **Cobertura del 20% del mercado** → ~18% menos derelicts (lo que dice planning.md ✓)
- **Dato nuevo para slides**: "solo el 40% de los satélites en órbitas no-naturalmente-cumplidoras se desorbitó entre 2010-2024" — cifra peer-reviewed, usar esta en vez de "60% queda" (que viene de la misma fuente vía prensa)
- Bonus contra el argumento "frena la industria": el modelo muestra que el bono **aumenta** la cantidad de satélites lanzados (órbita más segura → más negocio)
- Bonos > USD 1M: retornos marginales decrecientes → **USD 200k fijo está justificado por el paper** (resuelve la decisión fijo vs. variable)

## 3. Costo de remoción — RESUELTO

- ESA pagó **€86M (~USD 104M)** a ClearSpace por retirar **un solo objeto** (adaptador Vespa, 112 kg). Misión total ~€100M. Fuentes: SpaceNews, ESA.
- Reino Unido: £61M por remoción de dos satélites (ya en planning.md).
- Reemplaza la cifra sin fuente "USD 60-100M": usar **"la primera remoción de un solo objeto costó €86M (ESA, ClearSpace-1)"**.

## 4. Marco legal argentino — RESUELTO (con matiz)

- **Sí existe registro**: Registro Nacional de Objetos Lanzados al Espacio Ultraterrestre (Decreto 125/95, Resolución CONAE 260/1999), a cargo de CONAE (creada por Decreto 995/91).
- Argentina es parte de los 4 tratados espaciales de la ONU.
- **No existe ley espacial integral**: no hay régimen de licencias para operadores privados, ni obligaciones de mitigación/desorbitado, ni régimen de seguros.
- Formulación correcta para el pitch: "Argentina registra objetos pero **no tiene ley espacial integral**: no exige licencias ni desorbitado. OrbitClear es infraestructura lista para cuando llegue la regulación."

## 5. EU Space Act — RESUELTO y es oro para el pitch

- Propuesto 25-jun-2025, **en negociación ahora mismo**: voto en comisión ITRE del Parlamento el **19-nov-2026** (8 días después de la hackathon). Texto de compromiso irlandés 29-oct-2026; trilogos podrían empezar en diciembre.
- Contenido: arts. 59-74 mitigación de debris + **régimen de prioridad de maniobra** (quién esquiva) — sin precedente en derecho UE vinculante; maniobrabilidad obligatoria por encima de 400 km de apogeo (art. 63a); operadores extranjeros necesitan "verificación EUSA"; multas hasta 2% de la facturación mundial; aplicaría desde 1-ene-2030.
- Link de E+H (uno de los faltantes de Franco) encontrado: análisis del compromiso del Consejo.
- **Línea de pitch**: "Europa está votando su ley espacial la semana que viene; OrbitClear es la infraestructura de custodia que esa regulación va a necesitar."

## 6. Reglas del track — RESUELTO

Sitio oficial confirma: entrega **viernes 13/11/2026 09:00** (hora Argentina); entregables = contrato + explorer, video 1-3 min, deck 5-7 slides, repo; categorías Geoespacial/RWA/Agentes/Libre; 5 criterios con igual peso. Reglamento definitivo en competencia.argentinaspace.com/reglamento (borrador interino). **OrbitClear encaja en "Geoespacial"**: un dato del espacio (DECAY_DATE) decide un pago on-chain.

## 7. Cifras ESA a actualizar en slides

`planning.md` dice "40.000 catalogados / 57.000 >10 cm". Cifras oficiales ESA (02-nov-2026): **47.370 catalogados, 68.450 objetos >10 cm** (MASTER-8). Actualizar.

## Preguntas abiertas

- Links aún faltantes de la nota de Franco (Brussels Times, Broadband Breakfast, Regulus Charter, Courthouse News): prescindibles — los hechos ya están cubiertos por fuentes primarias (FCC/DISH vía Space.com, página oficial EC, Space Law Journal).
- Cumplimiento ~65% (SDC9) vs. 40% (Nature): métodos y poblaciones distintas; recomiendo usar 40% (peer-reviewed, 2026) y el 65% como complemento si preguntan.
- El satélite "que ya reingresó" podría ser uno más reciente que Tiangong-1 si se quiere frescura — cualquier `DECAY_DATE` no vacío sirve; para cambiarlo basta otro CATNR.
