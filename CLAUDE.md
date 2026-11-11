# hacka_space

Repo del equipo para la Argentina Space hackathon.

## Investigación previa → segundo cerebro

Estamos en la etapa de investigación y varias personas commitean al mismo tiempo. Cada vez que alguien comparta o encuentre algo (link, paper, archivo, dato, idea, conclusión), **leé y seguí `skills/segundo-cerebro/SKILL.md`**: se guarda en `cerebro/`, se indexa y se sube a `main` sin pisar lo de los demás. Antes de investigar un tema, revisá `cerebro/INDEX.md` y `cerebro/en-curso/` para no duplicar trabajo de otro.

## Parte blockchain → skills de skills-track

Para todo lo de blockchain (Avalanche, contratos, wallet, demo on-chain) usamos las skills de **https://github.com/blastonyz/skills-track**. Antes de trabajar en una de estas tareas, leé el `SKILL.md` que corresponde y seguilo. La URL raw es `https://raw.githubusercontent.com/blastonyz/skills-track/main/<ruta>/SKILL.md`.

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
