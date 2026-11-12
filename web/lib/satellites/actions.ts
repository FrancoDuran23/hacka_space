"use server";

import { and, eq } from "drizzle-orm";
import { Contract, JsonRpcProvider, Network, Wallet, formatUnits, getAddress, isAddress, isError } from "ethers";
import { ERC20_ABI, ORBITCLEAR_ESCROW_ABI, USDC_DECIMALS } from "@/lib/abi";
import { requireUser } from "@/lib/auth/session";
import { CelestrakError, currentTle, satcatRecord } from "@/lib/celestrak";
import { FUJI_CHAIN_ID } from "@/lib/chain";
import { loadContractConfig, type ContractConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { wallets } from "@/lib/db/schema";
import { recordRegistration } from "@/lib/live-store";
import { satellitesOwnedBy, type OwnedSatellite } from "@/lib/operator-catalog";
import { registrationTerms } from "@/lib/registration";
import type { Band } from "@/lib/types";

const YEAR_S = 365 * 86_400;
const TX_TIMEOUT_MS = 60_000;

export interface SatelliteQuote {
  norad: number;
  name: string;
  objectType: string;
  owner: string;
  launchDate: string;
  apogeeKm: number;
  band: Band;
  bandYears: number;
  /** USDC units (6 decimals), as a string: bigint does not cross the action boundary. */
  deposit: string;
  depositUsd: number;
  /** Launch as the contract stores it (seconds; anchored to the epoch before 1970). */
  launchedAt: number;
}

export interface WalletFunds {
  address: string;
  label: string | null;
  balance: string;
  allowance: string;
}

type Fail = { ok: false; code: "auth" | "input" | "data" | "chain"; error: string };
export type QuoteResult = { ok: true; quote: SatelliteQuote; wallets: WalletFunds[] } | Fail;
export type RegisterResult = { ok: true; txHash: string; explorerUrl: string | null } | Fail;

const fail = (code: Fail["code"], error: string): Fail => ({ ok: false, code, error });

async function sessionUser() {
  try {
    return await requireUser();
  } catch {
    return null;
  }
}

function chainParts(cfg: ContractConfig) {
  const net = Network.from(cfg.chainId);
  const provider = new JsonRpcProvider(cfg.rpcUrl, net, { staticNetwork: net });
  return { provider, escrow: new Contract(cfg.address!, ORBITCLEAR_ESCROW_ABI, provider), usdc: new Contract(cfg.usdc!, ERC20_ABI, provider) };
}

/** Everything the contract and CelesTrak say about registering `norad`, checked server-side. */
async function prepare(norad: number) {
  if (!Number.isInteger(norad) || norad <= 0 || norad > 0xffffffff) return fail("input", "Ingresá un número NORAD válido.");
  const cfg = await loadContractConfig();
  if (!cfg?.address || !cfg.usdc) return fail("chain", "No hay un contrato configurado.");

  let record, tle;
  try {
    [record, tle] = await Promise.all([satcatRecord(norad), currentTle(norad)]);
  } catch (e) {
    return fail("data", e instanceof CelestrakError ? e.message : "No se pudo consultar CelesTrak.");
  }
  if (!record) return fail("data", `CelesTrak no tiene ningún objeto con NORAD ${norad}.`);
  if (record.DECAY_DATE) return fail("data", `${record.OBJECT_NAME} ya reingresó el ${record.DECAY_DATE}: no hay nada que garantizar.`);
  if (!tle) return fail("data", `CelesTrak no publica elementos orbitales actuales de ${record.OBJECT_NAME}.`);

  const { escrow, usdc, provider } = chainParts(cfg);
  const terms = registrationTerms(record);
  const [state, years, amount] = await Promise.all([
    escrow.getFunction("escrowOf")(norad).then((e: { state: bigint }) => e.state),
    escrow.getFunction("bandYears")(terms.band) as Promise<bigint>,
    escrow.getFunction("bandAmount")(terms.band) as Promise<bigint>,
  ]);
  if (state !== 0n) return fail("data", `${record.OBJECT_NAME} ya tiene un escrow en el contrato.`);

  const quote: SatelliteQuote = {
    norad,
    name: record.OBJECT_NAME,
    objectType: record.OBJECT_TYPE,
    owner: record.OWNER,
    launchDate: record.LAUNCH_DATE,
    apogeeKm: Number(record.APOGEE),
    band: terms.band,
    bandYears: Number(years),
    deposit: amount.toString(),
    depositUsd: Number(formatUnits(amount, USDC_DECIMALS)),
    launchedAt: Number(terms.launchedAt),
  };
  return { ok: true as const, cfg, quote, terms, amount, escrow, usdc, provider };
}

export type OperatorSatellitesResult = { ok: true; satellites: OwnedSatellite[] } | Fail;

const ACTIVE_OPS = new Set(["+", "P", "B", "S", "X"]);

/**
 * The operator's satellites (SATCAT OWNER code) that have no escrow yet, to pick one instead of typing its
 * NORAD. Operational ones first, newest launch first.
 */
export async function operatorSatellites(owner: string): Promise<OperatorSatellitesResult> {
  if (!/^[A-Z0-9]{1,6}$/.test(owner)) return fail("input", "Código de operadora inválido.");
  const cfg = await loadContractConfig();
  if (!cfg?.address) return fail("chain", "No hay un contrato configurado.");
  let owned: OwnedSatellite[];
  try {
    owned = await satellitesOwnedBy(owner);
  } catch (e) {
    return fail("data", (e as Error).message || "No se pudo leer el catálogo de CelesTrak.");
  }
  // which of them already have an escrow; Fuji's public RPC answers 500 to batches of ~100 calls, so 20 per batch
  const net = Network.from(cfg.chainId);
  const escrow = new Contract(cfg.address, ORBITCLEAR_ESCROW_ABI, new JsonRpcProvider(cfg.rpcUrl, net, { staticNetwork: net, batchMaxCount: 20 }));
  let states: bigint[];
  try {
    states = await Promise.all(owned.map((o) => escrow.getFunction("escrowOf")(o.norad).then((e: { state: bigint }) => e.state)));
  } catch {
    return fail("chain", "No se pudo consultar el contrato en Fuji. Probá de nuevo en unos segundos.");
  }
  const free = owned.filter((_, i) => states[i] === 0n);
  free.sort((a, b) => Number(ACTIVE_OPS.has(b.ops)) - Number(ACTIVE_OPS.has(a.ops)) || b.launchDate.localeCompare(a.launchDate));
  return { ok: true, satellites: free };
}

/** Max declared mission length: past this a declaration only stretches the deadline. */
const MAX_MISSION_YEARS = 50;

/** The declared end of mission (ADR 0004) as contract seconds, or the reason it is not acceptable. */
function missionEndFrom(isoDate: string, launchedAt: bigint): bigint | string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "Ingresá la fecha de fin de misión.";
  const at = BigInt(Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / 1000));
  if (at < launchedAt) return "El fin de misión no puede ser anterior al lanzamiento.";
  if (at > launchedAt + BigInt(MAX_MISSION_YEARS * YEAR_S)) return `El fin de misión no puede pasar los ${MAX_MISSION_YEARS} años desde el lanzamiento.`;
  return at;
}

async function verifiedWallets(userId: string) {
  return db
    .select({ address: wallets.address, label: wallets.label })
    .from(wallets)
    .where(and(eq(wallets.userId, userId), eq(wallets.chainId, FUJI_CHAIN_ID)));
}

/** Looks up a satellite and the user's verified wallets (balance and allowance to the escrow). Sends nothing. */
export async function quoteSatellite(norad: number): Promise<QuoteResult> {
  const user = await sessionUser();
  if (!user) return fail("auth", "Iniciá sesión para dar de alta un satélite.");
  const p = await prepare(norad);
  if (!p.ok) return p;

  const mine = await verifiedWallets(user.id);
  const funds = await Promise.all(
    mine.map(async (w) => {
      const [balance, allowance] = await Promise.all([
        p.usdc.getFunction("balanceOf")(w.address) as Promise<bigint>,
        p.usdc.getFunction("allowance")(w.address, p.cfg.address) as Promise<bigint>,
      ]);
      return { address: w.address, label: w.label, balance: balance.toString(), allowance: allowance.toString() };
    }),
  );
  return { ok: true, quote: p.quote, wallets: funds };
}

/**
 * Registers `norad` on-chain, signed by the relayer. The deposit is pulled from `walletAddress`, which must be
 * one of the caller's verified wallets: otherwise anyone could spend an allowance someone else granted.
 */
export async function registerSatellite(norad: number, walletAddress: string, missionEnd: string): Promise<RegisterResult> {
  const user = await sessionUser();
  if (!user) return fail("auth", "Iniciá sesión para dar de alta un satélite.");
  if (!isAddress(walletAddress)) return fail("input", "Elegí una wallet válida.");
  const operator = getAddress(walletAddress);
  const mine = await verifiedWallets(user.id);
  if (!mine.some((w) => getAddress(w.address) === operator)) return fail("input", "Esa wallet no está verificada en tu cuenta.");

  const key = process.env.RELAYER_PRIVATE_KEY;
  if (!key) return fail("chain", "El servidor no tiene configurada la clave del relayer.");

  const p = await prepare(norad);
  if (!p.ok) return p;
  const missionEndsAt = missionEndFrom(missionEnd, p.terms.launchedAt);
  if (typeof missionEndsAt === "string") return fail("input", missionEndsAt);
  const [balance, allowance] = await Promise.all([
    p.usdc.getFunction("balanceOf")(operator) as Promise<bigint>,
    p.usdc.getFunction("allowance")(operator, p.cfg.address) as Promise<bigint>,
  ]);
  if (balance < p.amount) return fail("chain", "La wallet no tiene saldo suficiente para el depósito.");
  if (allowance < p.amount) return fail("chain", "Falta autorizar el depósito desde esa wallet.");

  try {
    const relayer = new Wallet(key, p.provider);
    const escrow = p.escrow.connect(relayer) as Contract;
    const args = [norad, operator, p.terms.launchedAt, missionEndsAt, p.terms.band, p.terms.dataHash] as const;
    // dry run first, so a revert comes back with its reason instead of a spent transaction
    await escrow.getFunction("register").staticCall(...args);
    const tx = await escrow.getFunction("register")(...args);
    // once sent it is the chain's call: a slow confirmation still returns the hash to follow it
    await Promise.race([tx.wait(), new Promise((r) => setTimeout(r, TX_TIMEOUT_MS))]);
    recordRegistration(norad);
    const explorer = p.cfg.explorer;
    return { ok: true, txHash: tx.hash, explorerUrl: explorer ? `${explorer}/tx/${tx.hash}` : null };
  } catch (e) {
    const reason = isError(e, "CALL_EXCEPTION") ? (e.reason ?? e.revert?.name ?? e.shortMessage) : (e as Error).message;
    return fail("chain", `El contrato rechazó el registro: ${String(reason).slice(0, 160)}`);
  }
}
