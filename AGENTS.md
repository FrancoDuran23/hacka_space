# hacka_space

Repo del equipo para la Argentina Space hackathon.

## Investigación previa → segundo cerebro

El documento principal del proyecto (OrbitClear) es `docs/planning.md`.

Estamos en la etapa de investigación y varias personas commitean al mismo tiempo. Cada vez que alguien comparta o encuentre algo (link, paper, archivo, dato, idea, conclusión), **leé y seguí `skills/segundo-cerebro/SKILL.md`**: se guarda en `cerebro/`, se indexa y se sube a `main` sin pisar lo de los demás. Antes de investigar un tema, revisá `cerebro/INDEX.md` y `cerebro/en-curso/` para no duplicar trabajo de otro.

## Parte blockchain → skills de skills-track

Para todo lo de blockchain (Avalanche, contratos, wallet, demo on-chain) usamos las skills de [blastonyz/skills-track](https://github.com/blastonyz/skills-track), copiadas en este repo en `skills/` (índice: `skills/INDEX.md`). Antes de trabajar en una de estas tareas, leé `skills/<ruta>/SKILL.md` y seguilo.

| Tarea | Skill (`<ruta>`) |
|---|---|
| Elegir el problema y el dato real | `idea/research-con-contexto` |
| Validar la idea, go / no-go | `idea/validacion-idea` |
| Modelo de negocio y pitch | `idea/modelo-de-negocio` |
| Red Fuji, faucet, explorer, L1 propia | `avalanche` |
| Contratos: compilar, testear, desplegar | `hardhat` |
| Scripts y frontend con ethers v6 | `ethers` |
| Conectar wallet y usar el ABI | `wallet-abi` |
| APIs de satélite, clima, sismos, incendios | `geoespacial` |
| UI de la demo | `frontend` |

Orden: `idea/*` → `avalanche` + `hardhat` → `geoespacial` → `ethers` + `wallet-abi` + `frontend`.

Lo que salga de las skills `idea/*` (problemas candidatos, veredictos, modelo de negocio) se guarda en el segundo cerebro con `skills/segundo-cerebro/SKILL.md`, como cualquier otro aporte.

## Estructura y verificación

- `contratos/`: el único contrato es `OrbitClearEscrow` (garantía de desorbitado del operador), desplegado en Fuji (ver `contratos/README.md`). Verificar con `npm test` y `npm run typecheck`. `npm run web:config` regenera `web/lib/contract.json`.
- `web/`: una sola app Next.js con dos root layouts. `app/(console)/` es la consola que lee ese contrato (`npm run dev:demo` corre sin blockchain). `app/(cuenta)/` es el login con Neon Auth y la cuenta (wallets verificadas y registro de contratos, persistidos en Neon con Drizzle); setup en `web/README.md`, variables en `web/.env.example`.
- Verificar `web/` con `npm run typecheck`, `npm run lint` y `npm run build`. Base de datos: `npm run db:generate` (genera en `web/drizzle/`) y `npm run db:migrate` (aplica contra `DATABASE_URL`).
- Los modelos 3D de `web/public/assets/modelos-3d/` van por **Git LFS**. Después de clonar o hacer pull verificá que los `.glb` no sean punteros de ~1 KB (`file web/public/assets/modelos-3d/sac-c.glb` debe decir "data", no ASCII). Si `git lfs` no existe, instalalo (`apt install git-lfs` o el binario oficial en `~/.local/bin`), después `git lfs install && git lfs pull`.
- El RPC público de Fuji rechaza `eth_getLogs` en batch y corta ráfagas con 429: nada de scans en paralelo.
