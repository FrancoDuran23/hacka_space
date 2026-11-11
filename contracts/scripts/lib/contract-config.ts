// Lectura/escritura de web/lib/contract.json (lo que consume el frontend).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import hre from "hardhat";

export const CONTRACT_JSON = fileURLToPath(new URL("../../../web/lib/contract.json", import.meta.url));
export const ESCROWS_JSON = fileURLToPath(new URL("../../../web/data/escrows.json", import.meta.url));

export type NetworkKey = "fuji" | "localhost";

/** RPC y explorer PÚBLICOS que van al frontend (nunca el FUJI_RPC del .env). */
export const NETWORKS: Record<NetworkKey, { chainId: number; rpcUrl: string; explorer: string | null }> = {
  fuji: { chainId: 43113, rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc", explorer: "https://testnet.snowtrace.io" },
  localhost: { chainId: 31337, rpcUrl: "http://127.0.0.1:8545", explorer: null },
};

export interface ContractConfig {
  network: NetworkKey;
  chainId: number;
  rpcUrl: string;
  explorer: string | null;
  address: string | null;
  usdc: string | null;
  oracle: string | null;
  deployBlock: number | null;
  deployTx: string | null;
  deployedAt: string | null;
  abi: unknown[];
  usdcAbi: unknown[];
}

export function asNetworkKey(name: string): NetworkKey {
  if (name !== "fuji" && name !== "localhost") {
    throw new Error(`Red "${name}" no soportada: usá --network fuji o --network localhost`);
  }
  return name;
}

export async function readAbis(): Promise<{ abi: unknown[]; usdcAbi: unknown[] }> {
  const escrow = await hre.artifacts.readArtifact("DebrisEscrow");
  const usdc = await hre.artifacts.readArtifact("MockUSDC");
  return { abi: [...escrow.abi], usdcAbi: [...usdc.abi] };
}

/** Config "modo demo": sin dirección, con los ABI reales. */
export async function demoConfig(): Promise<ContractConfig> {
  const net = NETWORKS.fuji;
  return {
    network: "fuji",
    chainId: net.chainId,
    rpcUrl: net.rpcUrl,
    explorer: net.explorer,
    address: null,
    usdc: null,
    oracle: null,
    deployBlock: null,
    deployTx: null,
    deployedAt: null,
    ...(await readAbis()),
  };
}

export async function readContractConfig(): Promise<ContractConfig> {
  return JSON.parse(await readFile(CONTRACT_JSON, "utf8")) as ContractConfig;
}

export async function writeContractConfig(cfg: ContractConfig): Promise<void> {
  await mkdir(dirname(CONTRACT_JSON), { recursive: true });
  await writeFile(CONTRACT_JSON, JSON.stringify(cfg, null, 2) + "\n");
}
