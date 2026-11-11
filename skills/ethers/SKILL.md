---
name: ethers
description: Usar ethers v6 (6.17.0) para hablar con contratos EVM en Avalanche: providers, signers, contratos, eventos, unidades y errores. No existe una v7 estable. Usar al escribir scripts o frontend con ethers.
---

# Ethers v6

## Versión

- Última estable: **ethers 6.17.0**. No hay v7 estable al 10/11/2026: no instales `ethers@7` ni `@next`.
- Instalar exacto: `npm i --save-exact ethers@6.17.0`.
- Si un tutorial usa `ethers.providers.Web3Provider`, `ethers.utils.*` o `BigNumber`, es **v5**. No lo copies.

## Diferencias v5 a v6 que rompen código

| v5 | v6 |
|---|---|
| `new ethers.providers.Web3Provider(w)` | `new BrowserProvider(w)` |
| `new ethers.providers.JsonRpcProvider(url)` | `new JsonRpcProvider(url)` |
| `ethers.utils.parseEther` | `parseEther` (import directo) |
| `ethers.utils.formatUnits` | `formatUnits` |
| `ethers.utils.keccak256` | `keccak256` |
| `BigNumber` | `bigint` nativo (`1n`, `10n ** 18n`) |
| `provider.getSigner()` | `await provider.getSigner()` (es async) |
| `contract.deployed()` | `await contract.waitForDeployment()` |
| `contract.address` | `await contract.getAddress()` |
| `tx.wait()` | igual, devuelve `ContractTransactionReceipt \| null` |
| `contract.on(...)` | igual, más `queryFilter` para histórico |

## Imports

```ts
import {
  BrowserProvider, JsonRpcProvider, Contract, Interface, Wallet,
  parseEther, formatEther, formatUnits, keccak256, toUtf8Bytes,
} from "ethers";
```

## Lectura sin wallet

```ts
const provider = new JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
const c = new Contract(address, abi, provider);
const r = await c.readings(0);          // función view
const bal = formatEther(await provider.getBalance(address));
```

## Escritura con wallet del navegador

```ts
const provider = new BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();
const c = new Contract(address, abi, signer);
const tx = await c.publish(hash, 7, ts);
const receipt = await tx.wait();        // espera 1 confirmación
console.log(receipt?.hash);
```

## Escritura desde un script (relayer)

```ts
const provider = new JsonRpcProvider(process.env.FUJI_RPC!);
const wallet = new Wallet(process.env.FUJI_PRIVATE_KEY!, provider);
const c = new Contract(address, abi, wallet);
```

Clave privada solo de testnet, de una wallet descartable, en `.env`. Nunca en el repo ni en `NEXT_PUBLIC_*`.

## Eventos

```ts
const past = await c.queryFilter(c.filters.ThresholdCrossed(), -2000); // últimos 2000 bloques
c.on("ThresholdCrossed", (id, value) => { /* ... */ });                 // en vivo
```

Para leer eventos de un receipt: `new Interface(abi).parseLog(log)`.

## Cosas que muerden

- **bigint**: nunca mezcles `number` y `bigint`. `JSON.stringify` rompe con bigint: convertí con `.toString()`.
- **Unidades**: AVAX tiene 18 decimales. `parseEther("0.1")` para entrar, `formatEther` para mostrar.
- **ABI human-readable**: sirve para pocas funciones (`"function x(uint256) view returns (uint256)"`). Para el contrato completo usá el JSON de `artifacts/`.
- **Chain**: validá `(await provider.getNetwork()).chainId === 43113n` antes de enviar.
- **Errores**: en v6 mirá `error.code` (`ACTION_REJECTED` = el usuario canceló, `CALL_EXCEPTION` = revert) y `error.reason`.
- **Un RPC público tiene límites**: no hagas polling agresivo, usá eventos o intervalos de 10 s o más.
- **SSR (Next.js)**: `window.ethereum` solo existe en el cliente. Usá `"use client"` y accedé dentro de handlers o `useEffect`.

## Verificación

Los snippets de esta skill pasan `tsc --strict` contra ethers 6.17.0. No se ejecutaron contra Fuji real.
