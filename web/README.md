# OrbitClear · web

Consola orbital de OrbitClear (Argentina Space 2026): escrow para limpiar basura espacial.
Next.js (App Router) + TypeScript + Tailwind v4 + Three.js (WebGPURenderer con fallback a WebGL 2).

## Correr

```bash
npm install
npm run dev:demo   # DEMO MODE: lee data/escrows.json, no necesita blockchain
npm run dev        # usa lib/contract.json si hay contrato; si la red falla cae a DEMO MODE
```

Abrí http://localhost:3000. Parámetros útiles: `?boot=0` saltea la boot sequence, `?gl=webgl` fuerza el fallback a WebGL 2.

## Qué hay

| Ruta | Qué es |
|---|---|
| `components/scene/` | Escena 3D: cielo (nebulosa horneada, 10.000 estrellas, meteoros), Tierra, objetos en órbita, vista de detalle, efecto DEORBIT, cámara y post-procesado |
| `components/hud/` | HUD: boot sequence, header, panel lateral, panel de detalle, controles |
| `lib/store.ts` | Estado de la UI y reloj de simulación (WARP TIME) |
| `lib/escrow.ts`, `app/api/` | Datos: contrato en Fuji o mock, y el oráculo simulado |
| `data/escrows.json` | 24 objetos con TLE reales y escrows de ejemplo |

## Notas

- Todo se muestra en USD. Los hashes solo llevan link al explorer cuando la transacción existe on-chain; en DEMO MODE son simulados y no enlazan.
- El post-procesado usa el pipeline de nodos de three (bloom, blur de foco, aberración cromática, viñeta) porque `@react-three/postprocessing` solo funciona con WebGLRenderer, no con WebGPURenderer.
- El sol es "cinematográfico": al cargar se ubica para que sea de noche sobre Salta (luces de ciudades visibles) y después queda fijo en el espacio inercial, así WARP TIME muestra ciclos día/noche.
- El balance neto es un modelo de la demo: fondos comprometidos − riesgo de colisión acumulado por día.
- Texturas de la Tierra en `public/textures/`: confirmar origen y licencia antes de publicar.
- Screenshots en `docs/screenshots/`.
