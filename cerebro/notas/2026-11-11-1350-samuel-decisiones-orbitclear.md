---
titulo: Decisiones del equipo — alcance MVP de OrbitClear cerrado
autor: samuel
fecha: 2026-11-11 13:50
tema: orbitclear
tags: [decisiones, mvp, alcance, escrow, demo]
tipo: conclusion
fuentes:
  - conversación del equipo 2026-11-11
relacionadas: [docs/planning.md, 2026-11-11-1300-franco-bono-deorbitado-quien-multa.md, 2026-11-11-1245-samuel-verificaciones-orbitclear.md]
---

## Qué es

Las diferencias entre `docs/planning.md` y la nota de Franco quedaron resueltas en conversación del equipo. Esto fija el alcance del MVP.

## Decisiones tomadas

1. **`pagarRemocion` entra al MVP.** El fondo paga la remoción del satélite incumplidor. Cierra el ciclo bono → confiscación → limpieza. (Planning la dejaba afuera; gana la propuesta de Franco.)
2. **Demo de 3 casos** con datos reales ya guardados en `sample-data/`:
   - TIANGONG-1 (NORAD 37820): reingresó 2018-04-02 → cumplió → devolución
   - ISS (NORAD 25544): activo (`OPS +`) → monitoreo normal
   - ENVISAT (NORAD 27386): muerto (`OPS -`), sigue en órbita → incumple → confiscación/remoción
3. **Bono variable** (gana sobre fijo 200k). El detalle —fórmula continua con densidad por franja vs. tabla de tramos por altura— **lo define un compañero del equipo asignado a eso**.
4. **Al pitch/deck entran las 4 ideas de Franco**: oráculo 2-de-3, consentimiento previo, aseguradora emisora, rendimiento del escrow.
   - Ojo: **consentimiento previo además va al contrato** — con `pagarRemocion` activa, el operador autoriza la remoción al depositar (respuesta legal al Tratado del Espacio).
5. **ABI congelado** (consecuencia de 1): `registrarSatelite`, `reportarReentrada`, `declararIncumplimiento`, `pagarRemocion`. Con esto frontend, relayer y escrow trabajan en paralelo.

## Pendientes que quedaron (ya no son conflictos, son tareas)

- README desactualizado (vende slots+bounties descartados): reescribir o marcar eso como "fase 2". Dueño sugerido: rol integración.
- Modo "tiempo acelerado" de la demo: rol integración propone mecanismo (flag en contrato / deploy separado / mock-oráculo).
- Oráculo MVP recomendado y sin objeción: relayer propio + hash-commit del dato; el 2-de-3 queda como respuesta al jurado.
- Cálculo de densidad por franja (si el bono va con fórmula): dueño = el compañero asignado al detalle del bono.

## Preguntas abiertas

- Ninguna de alcance. Lo que queda es ejecutar y verificar `hardhat compile`/`test` + faucet Fuji (pendientes técnicos, no de investigación).
