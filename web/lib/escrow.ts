import "server-only";
import { Contract, Interface, JsonRpcProvider, Network, formatUnits, type Result } from "ethers";
import { ORBITCLEAR_ESCROW_ABI, USDC_DECIMALS } from "./abi";
import { refreshTles } from "./celestrak";
import { loadContractConfig, loadEscrowsFile, SNOWTRACE, type ContractConfig, type EscrowsFile } from "./config";
import { CelestrakError, currentTle, rememberOrbital, satcatRecord, storedOrbital } from "./celestrak";
import { cacheVersion, demoEpoch, reentries, registeredHere } from "./live-store";
import { db } from "./db";
import { satelliteRegistrations } from "./db/schema";
import { OBJECT_KIND } from "./registration";
import { computeStats, netBalanceAt } from "./status";
import type { Band, DebrisObject, EscrowSnapshot, EscrowStatus, HistoryItem, HistoryType, Stats } from "./types";

const CACHE_MS = 15_000;
const RPC_TIMEOUT_MS = 9_000;
const TLE_TIMEOUT_MS = 6_000;
/** Fuji's public RPC caps eth_getLogs at 100 blocks per request, and rejects them in JSON-RPC batches. */
const LOG_WINDOW = 100;
/** Windows scanned per refresh, one request at a time (the public RPC rate-limits bursts). */
const LOG_WINDOWS = 12;

let cache: { at: number; version: number; snap: EscrowSnapshot } | null = null;

export async function getEscrows(): Promise<EscrowSnapshot> {
  if (cache && Date.now() - cache.at < CACHE_MS && cache.version === cacheVersion()) return cache.snap;
  const file = await loadEscrowsFile();
  const cfg = await loadContractConfig();
  let snap: EscrowSnapshot;
  if (!cfg) {
    snap = demoSnapshot(file, "no contract configured");
  } else {
    try {
      snap = await withTimeout(readChain(cfg, file), RPC_TIMEOUT_MS);
    } catch (e) {
      // A rate-limited refresh keeps the last live ledger instead of flipping the console to demo data.
      snap = cache && cache.snap.source !== "demo" && cache.snap.contract === cfg.address
        ? cache.snap
        : demoSnapshot(file, `fuji unreachable: ${(e as Error).message?.slice(0, 120)}`);
    }
  }
  // Swap baked TLEs for the freshest CelesTrak elements, whatever the escrow source. Bounded: if CelesTrak is
  // slow the page goes out with the elements it already has, and the refresh finishes for the next request.
  const tles = refreshTles(snap.objects);
  try {
    snap.tle = await withTimeout(tles, TLE_TIMEOUT_MS);
  } catch {
    tles.catch(() => {});
    snap.tle = cache?.snap.tle ?? snap.tle;
  }
  cache = { at: Date.now(), version: cacheVersion(), snap };
  return snap;
}

export async function getStats(): Promise<Stats> {
  const snap = await getEscrows();
  return computeStats(snap.objects, Date.now());
}

// ───────────────────────────── demo (mock JSON) ─────────────────────────────

type FileObject = EscrowsFile["objects"][number];

const shiftISO = (iso: string | null, ms: number) => (iso ? new Date(Date.parse(iso) + ms).toISOString() : null);
/** Re-base the dataset so the demo always looks "live" relative to today. */
const demoShift = (file: EscrowsFile) => demoEpoch() - Date.parse(file.snapshotAt);

function demoObject(o: FileObject, shift: number, now: number): DebrisObject {
  const obj: DebrisObject = {
    ...o,
    createdAt: shiftISO(o.createdAt, shift)!,
    deadline: shiftISO(o.deadline, shift)!,
    settledAt: shiftISO(o.settledAt, shift),
    status: o.status === "EXPIRING" ? "ACTIVE" : o.status,
    onChain: false,
    history: o.history.map((h) => ({ ...h, at: shiftISO(h.at, shift)! })),
  };
  applyLocalReentry(obj);
  obj.netBalance = netBalanceAt(obj, now);
  return obj;
}

function demoSnapshot(file: EscrowsFile, reason: string): EscrowSnapshot {
  const now = Date.now();
  const shift = demoShift(file);
  const objects = file.objects.map((o) => demoObject(o, shift, now));
  return {
    source: "demo",
    contract: null,
    explorer: SNOWTRACE,
    fetchedAt: new Date(now).toISOString(),
    reason,
    tle: { live: 0, total: objects.length, oldestEpoch: null, fetchedAt: "" },
    objects,
  };
}

/** Reentries attested while this server runs (the simulated ones only live here). */
function applyLocalReentry(obj: DebrisObject) {
  const r = reentries().get(obj.objectId);
  if (!r) return;
  if (obj.status !== "REFUNDED") {
    obj.status = "REFUNDED";
    obj.settledAt = r.at;
  }
  if (!obj.history.some((h) => h.txHash.toLowerCase() === r.txHash.toLowerCase())) {
    obj.history.push({ type: "REFUNDED", at: r.at, amount: r.refund, by: r.operator, txHash: r.txHash });
  }
}

// ───────────────────────────── live (Fuji) ─────────────────────────────

interface ChainEscrow {
  operator: string;
  launchedAt: bigint;
  missionEndsAt: bigint;
  deadline: bigint;
  deposit: bigint;
  band: bigint;
  state: bigint;
}

type ChainEvent = Omit<HistoryItem, "by">;

const usd = (v: bigint) => Number(formatUnits(v, USDC_DECIMALS));
const CHAIN_STATUS: Record<number, EscrowStatus> = { 1: "ACTIVE", 2: "REFUNDED", 3: "FORFEITED" };

async function readChain(cfg: ContractConfig, file: EscrowsFile): Promise<EscrowSnapshot> {
  const net = Network.from(cfg.chainId);
  // eth_call goes out as one JSON-RPC batch; logs go on their own provider, one call at a time.
  const reader = new JsonRpcProvider(cfg.rpcUrl, net, { staticNetwork: net });
  const logReader = new JsonRpcProvider(cfg.rpcUrl, net, { staticNetwork: net, batchMaxCount: 1 });
  const c = new Contract(cfg.address!, ORBITCLEAR_ESCROW_ABI, reader);

  // The contract has no enumeration: ask for every object the console tracks.
  const [rows, events] = await Promise.all([
    Promise.all(file.objects.map(async (o) => ({ o, e: (await c.getFunction("escrowOf")(o.objectId)) as unknown as ChainEscrow }))),
    contractEvents(cfg, logReader).catch(() => scanned(cfg).byObject()),
  ]);

  // Satellites registered on-chain that the demo dataset does not list (e.g. given of alta from the operator panel).
  // Registrations made here are also in the database, with their transaction: their Registered event comes
  // from the receipt, so the panel does not depend on the indexer catching up.
  const stored = await storedRegistrations(cfg);
  await Promise.all(
    stored.map(async (r) => {
      if ((events.get(r.norad) ?? []).some((h) => h.txHash.toLowerCase() === r.txHash.toLowerCase())) return;
      for (const item of await receiptEvents(logReader, r.txHash)) events.set(item.id, [...(events.get(item.id) ?? []), item.h]);
    }),
  );
  const listed = new Set(file.objects.map((o) => o.objectId));
  const extraIds = [...new Set([...events.keys(), ...registeredHere(), ...stored.map((r) => r.norad)])].filter((id) => !listed.has(id));
  const extras = (
    await Promise.all(
      extraIds.map(async (id) => {
        const [e, o] = await Promise.all([c.getFunction("escrowOf")(id) as Promise<ChainEscrow>, chainListedObject(id)]);
        return o ? { o, e } : null;
      }),
    )
  ).filter((x) => x !== null);

  const now = Date.now();
  const shift = demoShift(file);
  let registered = 0;
  const objects = [...rows, ...extras].map(({ o, e }) => {
    const status = CHAIN_STATUS[Number(e.state)];
    if (!status) return demoObject(o, shift, now);
    registered++;
    const by: Record<HistoryType, string> = { REGISTERED: o.owner, REENTRY_ATTESTED: "Relayer", REFUNDED: o.owner, FORFEITED: file.fund };
    const history = (events.get(o.objectId) ?? []).map((h) => ({ ...h, by: by[h.type] })).sort((a, b) => a.at.localeCompare(b.at));
    const settled = [...history].reverse().find((h) => h.type === "REFUNDED" || h.type === "FORFEITED");
    const obj: DebrisObject = {
      ...o,
      band: Number(e.band) as Band,
      createdAt: history.find((h) => h.type === "REGISTERED")?.at ?? new Date(now).toISOString(),
      deadline: new Date(Number(e.deadline) * 1000).toISOString(),
      missionEndsAt: new Date(Number(e.missionEndsAt) * 1000).toISOString(),
      status,
      deposit: usd(e.deposit),
      settledAt: status === "ACTIVE" ? null : (settled?.at ?? new Date(now).toISOString()),
      onChain: true,
      history,
    };
    applyLocalReentry(obj);
    obj.netBalance = netBalanceAt(obj, now);
    return obj;
  });
  if (registered === 0) throw new Error("none of the tracked objects is registered in the contract");

  return {
    source: cfg.chainId === 43113 ? "fuji" : "local",
    contract: cfg.address,
    explorer: cfg.explorer ?? (cfg.chainId === 43113 ? SNOWTRACE : ""),
    fetchedAt: new Date(now).toISOString(),
    tle: { live: 0, total: objects.length, oldestEpoch: null, fetchedAt: "" },
    objects,
  };
}

const META_WAIT_MS = 3_000;
const META_RETRY_MS = 10 * 60_000;
const metaCache = new Map<number, Promise<FileObject | null>>();

/**
 * Metadata for a registered satellite outside the dataset, from CelesTrak (cached in lib/celestrak).
 * A slow answer does not hold up the snapshot: the object shows up on a later refresh. A miss or a
 * CelesTrak error is retried after META_RETRY_MS, never on every refresh.
 */
function chainListedObject(norad: number): Promise<FileObject | null> {
  let pending = metaCache.get(norad);
  if (!pending) {
    pending = loadChainListedObject(norad).catch(() => null);
    pending.then((o) => o || setTimeout(() => metaCache.delete(norad), META_RETRY_MS));
    metaCache.set(norad, pending);
  }
  return Promise.race([pending, new Promise<null>((r) => setTimeout(() => r(null), META_WAIT_MS))]);
}

async function loadChainListedObject(norad: number): Promise<FileObject | null> {
  let meta: { name: string; owner: string; objectType: string; tle: [string, string] } | null = null;
  try {
    const [record, tle] = await Promise.all([satcatRecord(norad), currentTle(norad)]);
    if (record && tle) {
      meta = { name: record.OBJECT_NAME, owner: record.OWNER, objectType: record.OBJECT_TYPE, tle };
      rememberOrbital(record, tle).catch(() => {});
    }
  } catch (e) {
    if (!(e instanceof CelestrakError)) throw e;
  }
  // CelesTrak slow or refusing: use the copy kept when it last answered
  meta ??= await storedOrbital(norad).catch(() => null);
  // without elements there is nothing to draw (it re-entered or is lost)
  if (!meta) return null;
  return {
    objectId: norad,
    name: meta.name,
    kind: OBJECT_KIND[meta.objectType as keyof typeof OBJECT_KIND] ?? "fragment",
    owner: meta.owner,
    country: meta.owner,
    massKg: 0,
    tle: meta.tle,
    band: 0,
    createdAt: new Date().toISOString(),
    deadline: new Date().toISOString(),
    status: "ACTIVE",
    deposit: 0,
    netBalance: 0,
    riskPerDay: 0,
    settledAt: null,
    fromChain: true,
    history: [],
  };
}

async function storedRegistrations(cfg: ContractConfig): Promise<{ norad: number; txHash: string }[]> {
  try {
    const rows = await db.select({ norad: satelliteRegistrations.norad, txHash: satelliteRegistrations.txHash, escrow: satelliteRegistrations.escrow }).from(satelliteRegistrations);
    return rows.filter((r) => r.escrow.toLowerCase() === cfg.address!.toLowerCase());
  } catch {
    return [];
  }
}

/** A transaction's escrow events, read from its receipt (immutable once mined, so cached for good). */
const receiptCache = new Map<string, Promise<{ id: number; h: ChainEvent }[]>>();

function receiptEvents(provider: JsonRpcProvider, txHash: string): Promise<{ id: number; h: ChainEvent }[]> {
  let pending = receiptCache.get(txHash);
  if (!pending) {
    pending = (async () => {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt) throw new Error("receipt not mined yet");
      const at = ((await provider.getBlock(receipt.blockNumber))?.timestamp ?? Date.now() / 1000) * 1000;
      return receipt.logs.flatMap((log) => {
        const parsed = escrowInterface.parseLog({ topics: [...log.topics], data: log.data });
        const item = parsed && toHistory(parsed.name, parsed.args, at, txHash);
        return item ? [item] : [];
      });
    })();
    // a receipt that is not there yet is asked again on the next refresh
    pending.catch(() => receiptCache.delete(txHash));
    receiptCache.set(txHash, pending);
  }
  return pending.catch(() => []);
}

/** Events already read from the contract. Logs never change, so each refresh only scans the new blocks. */
interface EventScan {
  address: string;
  /** Next block to scan. */
  from: number | null;
  events: Map<string, { id: number; h: ChainEvent }>;
  byObject(): Map<number, ChainEvent[]>;
}

let scan: EventScan | null = null;
let scanning: Promise<Map<number, ChainEvent[]>> | null = null;

function scanned(cfg: ContractConfig): EventScan {
  if (scan?.address === cfg.address) return scan;
  const events = new Map<string, { id: number; h: ChainEvent }>();
  scan = {
    address: cfg.address!,
    from: cfg.deployBlock,
    events,
    byObject() {
      const out = new Map<number, ChainEvent[]>();
      for (const { id, h } of events.values()) out.set(id, [...(out.get(id) ?? []), h]);
      return out;
    },
  };
  return scan;
}

/**
 * Routescan (the indexer behind Avalanche's explorer) returns every log of the contract in one call,
 * instead of thousands of 100-block eth_getLogs windows that trip the public RPC's rate limit.
 */
const INDEXER: Record<number, string> = {
  43113: "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan/api",
  43114: "https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan/api",
};
const INDEXER_TIMEOUT_MS = 6_000;
const escrowInterface = new Interface(ORBITCLEAR_ESCROW_ABI);

interface IndexedLog {
  topics: string[];
  data: string;
  timeStamp: string;
  transactionHash: string;
  logIndex: string;
}

async function indexedEvents(cfg: ContractConfig): Promise<Map<number, ChainEvent[]> | null> {
  const base = INDEXER[cfg.chainId];
  if (!base || cfg.deployBlock == null) return null;
  const url = `${base}?module=logs&action=getLogs&address=${cfg.address}&fromBlock=${cfg.deployBlock}&toBlock=latest`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(INDEXER_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`indexer responded ${res.status}`);
  const body = (await res.json()) as { message?: string; result?: IndexedLog[] | string };
  if (!Array.isArray(body.result)) {
    if (body.message === "No records found") return new Map();
    throw new Error(`indexer: ${body.message ?? "unexpected response"}`);
  }
  const st = scanned(cfg);
  for (const l of body.result) {
    const parsed = escrowInterface.parseLog({ topics: l.topics, data: l.data });
    const item = parsed && toHistory(parsed.name, parsed.args, Number(l.timeStamp) * 1000, l.transactionHash);
    if (item) st.events.set(`${l.transactionHash}:${Number(l.logIndex)}`, item);
  }
  return st.byObject();
}

/** Indexer first; if it is down, scan the RPC forward from the deploy block, up to LOG_WINDOWS windows per call. */
function contractEvents(cfg: ContractConfig, provider: JsonRpcProvider): Promise<Map<number, ChainEvent[]>> {
  scanning ??= (async () => {
    const indexed = await indexedEvents(cfg).catch(() => null);
    if (indexed) return indexed;
    const st = scanned(cfg);
    const c = new Contract(cfg.address!, ORBITCLEAR_ESCROW_ABI, provider);
    const latest = await provider.getBlockNumber();
    let from = st.from ?? Math.max(0, latest - LOG_WINDOW * LOG_WINDOWS + 1);
    for (let i = 0; i < LOG_WINDOWS && from <= latest; i++) {
      const to = Math.min(latest, from + LOG_WINDOW - 1);
      const logs = await c.queryFilter("*", from, to);
      const times = new Map<number, number>();
      for (const b of new Set(logs.map((l) => l.blockNumber))) {
        const blk = await provider.getBlock(b);
        if (blk) times.set(b, blk.timestamp * 1000);
      }
      for (const log of logs) {
        const item = "fragment" in log && log.fragment ? toHistory(log.fragment.name, log.args, times.get(log.blockNumber) ?? Date.now(), log.transactionHash) : null;
        if (item) st.events.set(`${log.transactionHash}:${log.index}`, item);
      }
      st.from = from = to + 1;
    }
    return st.byObject();
  })().finally(() => (scanning = null));
  return scanning;
}

function toHistory(name: string, a: Result, at: number, txHash: string): { id: number; h: ChainEvent } | null {
  const map: Record<string, () => { type: HistoryType; amount: number; dataHash?: string }> = {
    Registered: () => ({ type: "REGISTERED", amount: usd(a[6]), dataHash: String(a[7]) }),
    ReentryAttested: () => ({ type: "REENTRY_ATTESTED", amount: 0, dataHash: String(a[2]) }),
    Refunded: () => ({ type: "REFUNDED", amount: usd(a[2]) }),
    Forfeited: () => ({ type: "FORFEITED", amount: usd(a[2]) }),
  };
  const fn = map[name];
  if (!fn) return null;
  return { id: Number(a[0]), h: { at: new Date(at).toISOString(), txHash, ...fn() } };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout after ${ms} ms`)), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}
