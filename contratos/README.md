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
| `register(noradId, operator, launchedAt, band, dataHash)` | relayer | Crea el escrow, calcula `deadline = launchedAt + años(band)`, cobra el depósito con `SafeERC20` |
| `attestReentry(noradId, decayDate, dataHash)` | relayer | Si `decayDate <= deadline` devuelve al operador; si no, decomisa al fondo |
| `closeExpired(noradId)` | cualquiera | Plazo vencido sin reingreso → decomisa al fondo. No depende del relayer |
| `escrowOf(noradId)` / `isExpired(noradId)` / `deadlineFor(launchedAt, band)` | vista | Lectura para el relayer y la UI |

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

Desplegado y verificado el 2026-11-11, `MODE=mock`:

| Qué | Dirección |
|---|---|
| `OrbitClearEscrow` | [`0xA5aeCF58Fac272e9E4CC5D473A2767C56019CbB2`](https://explorer-test.avax.network/c-chain/address/0xA5aeCF58Fac272e9E4CC5D473A2767C56019CbB2) |
| `MockUSDC` | [`0xD8A34cF239aD17d50a912044E38B15d08D5Befa9`](https://explorer-test.avax.network/c-chain/address/0xD8A34cF239aD17d50a912044E38B15d08D5Befa9) |
| Relayer | `0xdE2d066e6f1831783C1aC43f865EdE88c0d7b9b0` |
| Fondo de remoción | `0xdE2d066e6f1831783C1aC43f865EdE88c0d7b9b0` |

La clave del relayer está en `~/.config/orbitclear/fuji-demo-wallet.txt` (permisos 600).
**No la borres**: el relayer es inmutable en el contrato, y sin esa clave el contrato
desplegado no acepta más registros ni acreditaciones.

## Los dos casos reales, en cadena

| Caso | Satélite | Plazo | Transacciones |
|---|---|---|---|
| Decomiso por vencimiento | **ENVISAT** · NORAD 27386 · 762 km · lanzado 2002-03-01 | 2012-02-27 | [`register`](https://explorer-test.avax.network/c-chain/tx/0x63dbb9d9437dd95a69ddbd132a714cf008bfa06c18148793efe37fa05e08fe6d) → [`closeExpired`](https://explorer-test.avax.network/c-chain/tx/0x5febad4954b6e586ebbd628d954745f1f52d6aa51b7445d6dfbdf141081af190) |
| Decomiso por reingreso tardío | **THORAD AGENA D DEB** · NORAD 4133 · 209 km · lanzado 1969-09-30, decayó 2026-10-31 | 1974-12-31 | [`register`](https://explorer-test.avax.network/c-chain/tx/0xf0529f9e7bf49ff09d83b4fe869987692496de66128f459b1fb0a15af3ed0acd) → [`attestReentry`](https://explorer-test.avax.network/c-chain/tx/0x1ff6672e2fe6aa1cd94f443cddfa3375a2a81b7ba1714306c0c97b74ca311704) |

Estado leído de la cadena después de las cuatro transacciones: los dos escrows en
`Forfeited`, `totalDeposited` 400.000, `totalForfeited` 400.000, y el contrato retiene 0.

**Falta un caso de devolución con datos reales.** Hace falta un objeto que haya decayado
DENTRO de su propio plazo, o sea lanzado y caído dentro de la ventana de su banda (un
Starlink que falló y cayó en menos de 5 años sirve). Con el plazo anclado al lanzamiento,
casi todo lo que decae en el catálogo lo hace tarde. La devolución está cubierta por los
tests (`reingreso dentro del plazo devuelve el deposito`) pero todavía no por un objeto
real. Candidato a buscar antes de grabar el video.

## Estado de verificación

Verificado: `compile` limpio, **14 tests en verde**, `tsc --noEmit` limpio, deploy real en
Fuji y **cuatro transacciones con datos de CelesTrak**, estado final confirmado con una
lectura independiente del RPC.

**No verificado**: el código fuente verificado en el explorer (`npx hardhat verify`), y el
camino de devolución contra un objeto real.
