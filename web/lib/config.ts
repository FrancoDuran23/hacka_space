import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DebrisObject } from "./types";

export interface ContractConfig {
  network: string;
  chainId: number;
  rpcUrl: string;
  explorer: string | null;
  address: string | null;
  usdc: string | null;
  relayer: string | null;
  fund: string | null;
  deployBlock: number | null;
}

export interface EscrowsFile {
  snapshotAt: string;
  source: string;
  /** Nombre del fondo de remoción, para las etiquetas. */
  fund: string;
  objects: Omit<DebrisObject, "onChain">[];
}

export const FUJI_RPC_DEFAULT = "https://api.avax-test.network/ext/bc/C/rpc";
export const SNOWTRACE = "https://testnet.snowtrace.io";

export async function loadContractConfig(): Promise<ContractConfig | null> {
  // ORBITCLEAR_DEMO=1 fuerza el modo demo aunque haya un contrato configurado.
  if (process.env.ORBITCLEAR_DEMO === "1") return null;
  try {
    const raw = await readFile(path.join(process.cwd(), "lib", "contract.json"), "utf8");
    const c = JSON.parse(raw) as Partial<ContractConfig>;
    if (!c.address) return null;
    const rpcUrl = c.network === "fuji" ? (process.env.FUJI_RPC ?? c.rpcUrl ?? FUJI_RPC_DEFAULT) : (c.rpcUrl ?? FUJI_RPC_DEFAULT);
    return {
      network: c.network ?? "fuji",
      chainId: c.chainId ?? 43113,
      rpcUrl,
      explorer: c.explorer ?? (c.chainId === 43113 ? SNOWTRACE : null),
      address: c.address,
      usdc: c.usdc ?? null,
      relayer: c.relayer ?? null,
      fund: c.fund ?? null,
      deployBlock: c.deployBlock ?? null,
    };
  } catch {
    return null;
  }
}

export async function loadEscrowsFile(): Promise<EscrowsFile> {
  const raw = await readFile(path.join(process.cwd(), "data", "escrows.json"), "utf8");
  return JSON.parse(raw) as EscrowsFile;
}
