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

## App web (web/)

La app Next.js vive en `web/` (login Neon Auth + Drizzle; setup en `web/README.md`). Comandos, siempre desde `web/`:

```bash
cd web
npm run dev          # dev server
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build        # build de producción (requiere las env de .env.example)
npm run db:generate  # drizzle-kit generate → web/drizzle/
npm run db:migrate   # drizzle-kit migrate contra DATABASE_URL
```

Las variables de entorno están documentadas en `web/.env.example`.
