---
name: wallet-abi
description: Conectar una wallet (Core, MetaMask) a Avalanche Fuji desde el navegador y consumir un contrato con su ABI usando ethers v6. Usar al armar la parte on-chain del frontend.
---

# Wallet y consumo de ABI

Requiere la skill `ethers` (v6.17.0). Código para un componente cliente de React / Next.js.

## 1. Detectar la wallet (con cuidado)

`window.ethereum` puede no existir, o ser pisado por otro script (en un sitio, un elemento con `id="avalanche"` pisó `window.avalanche`). Validá siempre:

```ts
import type { Eip1193Provider } from "ethers";

function getEth(): Eip1193Provider | null {
  const e = (globalThis as unknown as { ethereum?: Eip1193Provider }).ethereum;
  return e && typeof e.request === "function" ? e : null;
}
```

Con varias wallets instaladas pueden pelearse por `window.ethereum`. Para elegir una, usá EIP-6963 (`eip6963:announceProvider`).

## 2. Conectar y forzar Fuji

```ts
import { BrowserProvider } from "ethers";

const FUJI = {
  chainId: "0xA869", // 43113
  chainName: "Avalanche Fuji C-Chain",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
  blockExplorerUrls: ["https://explorer-test.avax.network/c-chain"],
};

export async function connect() {
  const eth = getEth();
  if (!eth) throw new Error("Instalá Core Wallet");
  const provider = new BrowserProvider(eth);
  await provider.send("eth_requestAccounts", []);

  if ((await provider.getNetwork()).chainId !== 43113n) {
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: FUJI.chainId }] });
    } catch (e) {
      if ((e as { code?: number }).code === 4902) {
        await eth.request({ method: "wallet_addEthereumChain", params: [FUJI] });
      } else throw e;
    }
  }
  const signer = await new BrowserProvider(eth).getSigner(); // provider nuevo tras cambiar de red
  return { signer, address: await signer.getAddress() };
}
```

Crear un `BrowserProvider` nuevo después del cambio de red evita el error `network changed`.

## 3. Escuchar cambios

```ts
eth.on?.("accountsChanged", (a: string[]) => { /* actualizar o desconectar si a.length === 0 */ });
eth.on?.("chainChanged", () => window.location.reload());
```

## 4. ABI

Dos formas:

- **Human-readable** (pocas funciones):
  ```ts
  const ABI = [
    "function publish(bytes32 dataHash, uint32 value, uint64 timestamp)",
    "function readings(uint256) view returns (bytes32 dataHash, uint64 timestamp, uint32 value)",
    "event ThresholdCrossed(uint256 indexed id, uint32 value)",
  ] as const;
  ```
- **JSON completo**: copiá el campo `abi` de `artifacts/contracts/<Nombre>.sol/<Nombre>.json` a `lib/abi.ts` (`export const ABI = [...] as const`). Es público, no es secreto.

La dirección va en una variable pública: `NEXT_PUBLIC_CONTRACT_ADDRESS`. Es un dato público, no un secreto. Para clave privada, API keys, URI de base de datos: **nunca** `NEXT_PUBLIC_`.

## 5. Leer y escribir

```ts
import { Contract, JsonRpcProvider } from "ethers";

const ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

// Leer: sin wallet, sin gas
export async function leer(id: number) {
  const c = new Contract(ADDRESS, ABI, new JsonRpcProvider(FUJI.rpcUrls[0]));
  const r = await c.getFunction("readings")(id);
  return { hash: r[0] as string, ts: Number(r[1]), value: Number(r[2]) };
}

// Escribir: con signer, cuesta gas
export async function publicar(signer: import("ethers").Signer, hash: string, value: number, ts: number) {
  const c = new Contract(ADDRESS, ABI, signer);
  const tx = await c.getFunction("publish")(hash, value, ts);
  const rc = await tx.wait();
  return { hash: tx.hash as string, bloque: rc?.blockNumber, explorer: `${FUJI.blockExplorerUrls[0]}/tx/${tx.hash}` };
}
```

## 6. Eventos para la UI

```ts
const ro = new Contract(ADDRESS, ABI, new JsonRpcProvider(FUJI.rpcUrls[0]));
const ultimos = await ro.queryFilter(ro.filters.ThresholdCrossed(), -2000);
```

Fuji produce bloques rápido: 2000 bloques son pocos minutos. Si no encuentra nada, ampliá el rango o guardá el bloque de despliegue.

## 7. Estados de UI que no pueden faltar

1. Sin wallet: botón para instalarla.
2. Red equivocada: botón "Cambiar a Fuji".
3. Pendiente: spinner con el hash de la tx.
4. Confirmada: link al explorer.
5. Error: mensaje corto. `ACTION_REJECTED` = el usuario canceló (no es un error grave); `CALL_EXCEPTION` = revert, mostrá `error.reason`.

## 8. Guardar la wallet del usuario (opcional)

Si el sitio tiene perfil, registrá la dirección en el servidor solo si el campo está vacío y el usuario está conectado. Validá en el servidor con `isAddress` de ethers y que la sesión sea del dueño. No confíes en lo que manda el cliente.

## Pruebas rápidas

- Conseguí AVAX de prueba en el faucet (ver skill `avalanche`).
- Hacé una transacción real antes de grabar el video y guardá el link como respaldo.

## Verificación

Snippets verificados con `tsc --strict` contra ethers 6.17.0. No se probaron con una wallet real.
