---
titulo: Unificación de contratos — queda solo OrbitClearEscrow (garantía del operador), se descarta DebrisEscrow (bounties)
autor: mayko
fecha: 2026-11-11 15:46
tema: orbitclear
tags: [contratos, escrow, frontend, decision, fuji]
tipo: conclusion
fuentes:
  - docs/planning.md §1, §5 y §11
  - contratos/README.md
  - Fuji, escrow 0xA5aeCF58Fac272e9E4CC5D473A2767C56019CbB2 (bloque de deploy 60903558)
relacionadas: []
---

## Qué es
Después del merge de `origin/main` había dos contratos con modelos de negocio distintos: `contratos/OrbitClearEscrow` (el operador deposita al lanzar; si reingresa en plazo, se le devuelve, y si no, va al fondo de remoción) y `contracts/DebrisEscrow` (financiadores juntan USDC por un objeto y se le paga a un limpiador). Quedó solo `OrbitClearEscrow` y la web se adaptó a ese modelo.

## Lo importante
- Motivo: `docs/planning.md` §11 deja afuera las "recompensas a removedores", que es justo lo que hacía `DebrisEscrow`. Las ADRs y `GLOSSARY.md` describen `OrbitClearEscrow`, y es el que está desplegado en Fuji con ENVISAT (decomiso por vencimiento) y 4133 (decomiso por reingreso tardío).
- `contracts/` se borró; queda en el historial de git. El contrato desplegado no cambió ni se redeployó.
- Web: financiadores/limpiador → operador/fondo de remoción. Estados `ACTIVE`, `EXPIRING`, `REFUNDED` y `FORFEITED`. El botón DEORBIT llama a `attestReentry` firmado por el relayer (`RELAYER_PRIVATE_KEY`), o simula si no hay clave.
- `OrbitClearEscrow` no enumera escrows: la web consulta `escrowOf` por cada NORAD de `web/data/escrows.json`. En Fuji hoy solo ENVISAT es dibujable; el resto se muestra como demo, sin links al explorer.
- El RPC público de Fuji rechaza `eth_getLogs` en batch y corta ráfagas con 429 (Cloudflare 1015). Los eventos se leen de a 100 bloques, de forma incremental.

## Preguntas abiertas
- `README.md` de la raíz todavía describe el pitch viejo (peaje espacial y bounties de limpieza). Hay que decidir si se reescribe según `docs/planning.md`.
- Para que la demo muestre más objetos on-chain, hay que registrarlos con `contratos/scripts/relayer.ts`. Los objetos del dataset vencieron hace años con el plazo anclado al lanzamiento, así que se registrarían ya decomisables.
