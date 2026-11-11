# OrbitClear · web

Consola orbital de OrbitClear (Argentina Space 2026): garantía de desorbitado por satélite, sobre el contrato `OrbitClearEscrow` de [`../contratos/`](../contratos/README.md). Vocabulario en [`../GLOSSARY.md`](../GLOSSARY.md).
Next.js (App Router) + TypeScript + Tailwind v4 + Three.js (WebGPURenderer con fallback a WebGL 2).

## Correr

```bash
npm install
npm run dev:demo   # DEMO MODE: lee data/escrows.json, no necesita blockchain
npm run dev        # usa lib/contract.json si hay contrato; si la red falla cae a DEMO MODE
```

`lib/contract.json` apunta al escrow desplegado en Fuji. Se regenera desde `contratos/` con `npm run web:config` (`DEMO=1 npm run web:config` lo deja sin contrato).

Abrí http://localhost:3000. Parámetros útiles: `?boot=0` saltea la boot sequence, `?gl=webgl` fuerza el fallback a WebGL 2.

## Qué hay

| Ruta | Qué es |
|---|---|
| `components/scene/` | Escena 3D: cielo (nebulosa horneada, 10.000 estrellas, meteoros), Tierra, objetos en órbita, vista de detalle, efecto DEORBIT, cámara y post-procesado |
| `components/hud/` | HUD: boot sequence, header, panel lateral, panel de detalle, controles |
| `lib/store.ts` | Estado de la UI y reloj de simulación (WARP TIME) |
| `lib/escrow.ts`, `app/api/escrows` | Datos: `escrowOf` de cada NORAD del dataset contra el contrato; lo que no está registrado se muestra con datos de demo |
| `lib/reentry.ts`, `app/api/relayer` | Botón DEORBIT: verifica el reingreso con SGP4 y llama a `attestReentry` firmado por el relayer (`RELAYER_PRIVATE_KEY`, ver `.env.example`). Sin clave, o si el objeto no está on-chain, el reingreso es simulado |
| `data/escrows.json` | 24 objetos con TLE reales y escrows de ejemplo (banda y depósito según el apogeo, como en el contrato) |

## Notas

- Todo se muestra en USD. Los hashes solo llevan link al explorer cuando el escrow existe on-chain; los de demo son simulados y no enlazan.
- Estados: `ACTIVE`, `EXPIRING` (menos de 24 h al plazo), `REFUNDED` (reingreso verificado, el depósito vuelve al operador) y `FORFEITED` (plazo vencido, el depósito va al fondo de remoción). Pasado el plazo, el contrato permite que cualquiera llame a `closeExpired`.
- El contrato no enumera escrows: la consola consulta los NORAD de `data/escrows.json`. En Fuji hoy solo ENVISAT (27386) está registrado; THORAD AGENA D DEB (4133) también, pero ya reingresó y no tiene TLE para dibujarlo.
- El RPC público de Fuji rechaza `eth_getLogs` en batch y limita ráfagas: los eventos se escanean de a una ventana de 100 bloques, de forma incremental desde `deployBlock`.
- El post-procesado usa el pipeline de nodos de three (bloom, blur de foco, aberración cromática, viñeta) porque `@react-three/postprocessing` solo funciona con WebGLRenderer, no con WebGPURenderer.
- El sol es "cinematográfico": al cargar se ubica para que sea de noche sobre Salta (luces de ciudades visibles) y después queda fijo en el espacio inercial, así WARP TIME muestra ciclos día/noche.
- El balance neto es un modelo de la demo: depósito que respalda la remoción − riesgo de colisión acumulado por día mientras el objeto sigue en órbita.
- Texturas de la Tierra en `public/textures/`: confirmar origen y licencia antes de publicar.
- Screenshots en `docs/screenshots/`.
