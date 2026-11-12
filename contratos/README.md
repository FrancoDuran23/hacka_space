# OrbitClear — contratos

Escrow de garantía de desorbitado sobre Avalanche Fuji. Un escrow por satélite, sin
custodio humano: el operador deposita USDC, el relayer acredita el reingreso con datos
de CelesTrak, y el contrato devuelve o decomisa solo.

Contexto de dominio en [`../GLOSSARY.md`](../GLOSSARY.md) y las decisiones en
[`../docs/adr/`](../docs/adr/).

## Stack

Hardhat 3 (ESM) · solc 0.8.28 · OpenZeppelin 5.6.1 · ethers 6.17.0 · Mocha + chai.
Node 22 o superior.

## Comandos

```bash
npm install
npm run compile
npm test          # 14 tests
npx hardhat build && npx tsc --noEmit   # typecheck
```

## Contratos

### `contracts/OrbitClearEscrow.sol`

Un solo deploy. Cada NORAD tiene su propio escrow aislado dentro del contrato.

| Función | Quién | Qué hace |
|---|---|---|
| `register(noradId, operator, launchedAt, missionEndsAt, band, dataHash)` | relayer | Crea el escrow, calcula `deadline = missionEndsAt + años(band)` (fin de misión declarado, ADR 0004), cobra el depósito con `SafeERC20` |
| `attestReentry(noradId, decayDate, dataHash)` | relayer | Si `decayDate <= deadline` devuelve al operador; si no, decomisa al fondo |
| `closeExpired(noradId)` | cualquiera | Plazo vencido sin reingreso → decomisa al fondo. No depende del relayer |
| `escrowOf(noradId)` / `isExpired(noradId)` / `deadlineFor(missionEndsAt, band)` | vista | Lectura para el relayer y la UI |

Inmutables: `usdc`, `relayer`, `fund`. Las reglas quedan fijadas en el constructor y no
hay `owner` que las cambie: es a propósito.

Bandas orbitales (parámetros del constructor, no constantes):

| Banda | Apogeo | Plazo | Depósito (modo mock) |
|---|---|---|---|
| 0 | < 600 km | 5 años | 100.000 USDC |
| 1 | 600–900 km | 10 años | 300.000 USDC |
| 2 | > 900 km | 25 años | 800.000 USDC |

Montos tomados del rango del paper ESA/UCL 2025 (USD 100.000 a 800.000 por satélite).

### `contracts/MockUSDC.sol`

USDC de mentira, 6 decimales, `mint` abierto. Existe porque **el faucet de Circle entrega
20 USDC cada 2 horas** y los montos del paper son de cientos de miles: con USDC real no se
puede hacer una demo con montos creíbles.

## Deploy

```bash
npx hardhat keystore set FUJI_PRIVATE_KEY     # wallet descartable, solo testnet
npm run deploy:fuji                           # MODE=mock por defecto
```

Salida: `deployments/fuji.json` con las direcciones, más los links del explorer.

Variables de entorno (no hay `.env` versionado; la clave va al keystore):

| Variable | Default | Para qué |
|---|---|---|
| `FUJI_PRIVATE_KEY` | — | Cuenta que deploya. **Solo testnet, descartable** |
| `MODE` | `mock` | `mock` = MockUSDC con montos del paper · `usdc` = USDC real de Circle con montos escalados |
| `RELAYER_ADDRESS` | cuenta que deploya | Dirección con permiso de acreditar |
| `FUND_ADDRESS` | cuenta que deploya | Dirección del fondo de remoción |
| `NETWORK` | `fuji` | Cambia de red para el ensayo en seco |
| `NORAD` | `27386` | Satélite que procesa el relayer |
| `OPERATOR_ADDRESS` | relayer | Operador dueño del depósito |

USDC de Circle en Fuji: `0x5425890298aed601595a70AB815c96711a31Bc65` (6 decimales).
**Mainnet usa otra dirección.** No compartas la constante entre redes.

## Frontend

La consola de [`../web/`](../web/README.md) lee este contrato. `npm run web:config` escribe
`../web/lib/contract.json` a partir de `deployments/<red>.json` (solo datos públicos: direcciones,
RPC y `deployBlock`). `DEMO=1 npm run web:config` deja la web en modo demo. Para que el botón
DEORBIT de la web firme `attestReentry`, la web necesita la clave del relayer en
`RELAYER_PRIVATE_KEY` (`web/.env.local`).

Antes había un segundo contrato, `DebrisEscrow` (bounties a limpiadores), en `contracts/`. Se
unificó acá porque contradecía `docs/planning.md` §11 ("Queda afuera: recompensas a
removedores"). Sigue en el historial de git.

## Relayer

```bash
NORAD=27386 npx hardhat run scripts/relayer.ts --network fuji
```

Qué hace, en orden:

1. Baja el registro crudo de SATCAT: `celestrak.org/satcat/records.php?CATNR=<norad>&FORMAT=JSON`.
2. Calcula `keccak256` del registro y lo manda como `dataHash`, para que cualquiera lo audite.
3. Deriva la banda del apogeo.
4. `register` si el escrow no existe; después `attestReentry` si `DECAY_DATE` tiene fecha.
5. Si el objeto se lanzó **antes de 1970** (como 4133, de 1969), el timestamp queda negativo
   y no entra en `uint64`: se ancla al epoch y el script avisa por consola. El hash del
   registro crudo conserva la fecha real, así que sigue siendo auditable.

Ante cualquier respuesta que no sea 200 de CelesTrak, el script **corta** en lugar de
reintentar: la política de CelesTrak manda bloquear la IP tras 50 errores en 2 horas.

## Ensayo en seco, sin clave ni AVAX

```bash
NETWORK=local npx hardhat run scripts/deploy.ts --network local
```

Usa la red simulada `local` (`edr-simulated`) y escribe `deployments/local.json`.

## Deploy actual en Fuji

Desplegado el 2026-11-12, `MODE=mock`, con el plazo desde el fin de misión declarado (ADR 0004):

| Qué | Dirección |
|---|---|
| `OrbitClearEscrow` | [`0xeE7C5D5C0D7103C220d640EEb7B2788ab27CEf59`](https://explorer-test.avax.network/c-chain/address/0xeE7C5D5C0D7103C220d640EEb7B2788ab27CEf59) |
| `MockUSDC` | [`0x8fA9BF84D9C89966dd95e85672412eaA2B6C47EC`](https://explorer-test.avax.network/c-chain/address/0x8fA9BF84D9C89966dd95e85672412eaA2B6C47EC) |
| Relayer | `0xdE2d066e6f1831783C1aC43f865EdE88c0d7b9b0` |
| Fondo de remoción | `0xdE2d066e6f1831783C1aC43f865EdE88c0d7b9b0` |

El deploy anterior (plazo anclado al lanzamiento, ADR 0001) queda como histórico en
`deployments/fuji-v1.json`: escrow `0xA5aeCF58Fac272e9E4CC5D473A2767C56019CbB2`.

La clave del relayer está en `~/.config/orbitclear/fuji-demo-wallet.txt` (permisos 600).
**No la borres**: el relayer es inmutable en el contrato, y sin esa clave el contrato
desplegado no acepta más registros ni acreditaciones.

## Los dos casos reales, en cadena

| Caso | Satélite | Fin de misión declarado | Plazo | Transacciones |
|---|---|---|---|---|
| Decomiso por vencimiento | **ENVISAT** · NORAD 27386 · 762 km · lanzado 2002-03-01 | 2012-05-09 (ESA da por terminada la misión) | 2022-05-07 | [`register`](https://explorer-test.avax.network/c-chain/tx/0x99a0244f4bd88951dc264affd15ddc6f347dfc92be7fda9b251e694532b5ce4f) → [`closeExpired`](https://explorer-test.avax.network/c-chain/tx/0xdeb93fd2beb87ea0304b22daf90a31dca18d398df80a30c968e332f7f2c7ed75) |
| Decomiso por reingreso tardío | **THORAD AGENA D DEB** · NORAD 4133 · 209 km · lanzado 1969-09-30, decayó 2026-10-31 | el lanzamiento (etapa de cohete) | 1974-12-31 | [`register`](https://explorer-test.avax.network/c-chain/tx/0xf8740c323efe8099407e11f2f53f999462ce80c75a21109815db3ffc4eba2058) → [`attestReentry`](https://explorer-test.avax.network/c-chain/tx/0xb7f8954c81e8b8bfd942e133b0ba63010edfc1d954acbae91864f8891d2ba59f) |

El plazo se corre dos días respecto de "10 años exactos" porque el contrato cuenta años de 365 días.

**Falta un caso de devolución con datos reales.** Hace falta un objeto que haya decayado
DENTRO de su propio plazo, o sea lanzado y caído dentro de la ventana de su banda (un
Starlink que falló y cayó en menos de 5 años sirve). Con el fin de misión declarado, un satélite que reingresa dentro de su banda después de dejar de operar sirve. La devolución está cubierta por los
tests (`reingreso dentro del plazo devuelve el deposito`) pero todavía no por un objeto
real. Candidato a buscar antes de grabar el video.

## Estado de verificación

Verificado: `compile` limpio, **14 tests en verde**, `tsc --noEmit` limpio, deploy real en
Fuji y **cuatro transacciones con datos de CelesTrak**, estado final confirmado con una
lectura independiente del RPC.

**No verificado**: el código fuente verificado en el explorer (`npx hardhat verify`), y el
camino de devolución contra un objeto real.
