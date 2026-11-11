---
name: avalanche
description: Trabajar en Avalanche: red de prueba Fuji (C-Chain), faucet, explorer, wallet y L1 propia, con los datos de red para el hackathon. Usar al desplegar contratos o decidir entre C-Chain y una L1.
---

# Avalanche para el hackathon

## Fuji (testnet de la C-Chain)

| Dato | Valor |
|---|---|
| Nombre | Avalanche Fuji C-Chain |
| chainId | 43113 (`0xA869`) |
| Moneda | AVAX (18 decimales) |
| RPC | `https://api.avax-test.network/ext/bc/C/rpc` |
| Explorer | `https://explorer-test.avax.network/c-chain` |
| Faucet | `https://build.avax.network/console/primary-network/faucet` |

La C-Chain es **EVM**: Solidity, Hardhat, ethers y las wallets de Ethereum funcionan igual. Solo cambia la red.

Cuidado: Fuji es **testnet**. Los tokens no valen nada y la red puede reiniciarse o cambiar. Verificá los datos en la documentación oficial antes de entregar: https://build.avax.network.

## Camino rápido

1. Instalá **Core Wallet** (o MetaMask) y activá el modo testnet.
2. Creá una cuenta de Builder Hub y pedí AVAX de prueba en el faucet. Puede pedir verificación y tener límite diario: hacelo temprano y con más de una persona del equipo.
3. Agregá Fuji a la wallet (la skill `wallet-abi` lo hace por código).
4. Desplegá el contrato con la skill `hardhat`.
5. Abrí la dirección en el explorer y guardá el link.
6. Hacé una transacción real y guardá su link para el video.

## Seguridad

- Usá una **wallet descartable** solo para el hackathon. Nunca tu wallet con fondos reales.
- La clave privada va en el keystore de Hardhat o en `.env` (ignorado por git). Nunca en el repo.
- Si una clave se subió a GitHub, considerala perdida: generá otra.
- Los secretos nunca llevan `NEXT_PUBLIC_`.

## C-Chain o L1 propia

El track permite **contrato en Fuji o en la L1 del equipo**, y justifica L1 dedicadas. Una L1 es tu propia blockchain: reglas, validadores y token de gas propios.

Conviene L1 cuando:
- Necesitás **validadores propios** (por ejemplo, instituciones que validan el dato) y eso es parte de tu justificación de blockchain.
- Querés gas propio o permisos (quién puede escribir).
- El proyecto necesita reglas que la C-Chain pública no da.

Conviene C-Chain (Fuji) cuando:
- Querés minimizar riesgo y tiempo: ya está funcionando, con faucet y explorer.
- Tu justificación es transparencia y pagos, no gobernanza propia.

Las L1 se crean desde la **Avalanche Console** (build.avax.network/console), con la herramienta de crear L1 en testnet. Es un proceso guiado. Guardá: chainId, RPC, y el explorer de tu L1. Para los pasos exactos, leé la documentación oficial vigente, porque el flujo cambia.

Si desplegás en una L1 propia, el `hardhat.config.ts` solo cambia `url` y `chainId`, y la wallet necesita agregar esa red con su RPC y la moneda de gas.

## Patrón de proyecto recomendado

```
Dato público (API)  →  relayer (script, servidor)  →  contrato en Fuji  →  evento  →  UI
                                 │
                                 └─ hash del dato crudo, para auditar
```

Un solo contrato, una sola función clave, un evento claro.

## Oráculos (para la pregunta "¿qué pasa si el dato miente?")

- Relayer propio: simple, es un punto de confianza.
- Varios relayers que deben coincidir.
- Chainlink Functions: trae datos de una API a un contrato. Verificá si está disponible en Fuji y sus costos antes de depender de él.
- Commit del hash del dato: cualquiera lo verifica contra la fuente.
- L1 con validadores propios.

Elegí uno, explicalo en la slide "por qué blockchain" y no prometas más de lo que construís.

## Entrega: lo que tiene que quedar

- Dirección del contrato en el explorer (Fuji o L1).
- Una transacción de ejemplo con su link.
- Video de 1 a 3 min con una acción on-chain visible.
- Slide "por qué blockchain".
- Repo o link del proyecto.

## Errores comunes

- `insufficient funds`: falta AVAX de prueba en esa cuenta.
- Red equivocada en la wallet: validá `chainId === 43113`.
- `nonce too low` o transacciones trabadas: reiniciá la cuenta en la wallet (avanzado > borrar datos de actividad).
- Gas: en Fuji es barato, pero igual conviene probar en local con Hardhat antes de gastar.
- RPC público saturado: reintentá y evitá polling agresivo.

Esta skill no se probó contra Fuji real; los datos de red vienen de la página de Fuji de build.avax.network.
