import "server-only";
import { Contract, JsonRpcProvider, Network, formatUnits, type EventLog, type Log } from "ethers";
import { ORBITCLEAR_ESCROW_ABI, USDC_DECIMALS } from "./abi";
import { loadContractConfig, loadEscrowsFile, SNOWTRACE, type ContractConfig, type EscrowsFile } from "./config";
import { cacheVersion, demoEpoch, reentries } from "./live-store";
import { computeStats, netBalanceAt } from "./status";
import type { Band, DebrisObject, EscrowSnapshot, EscrowStatus, HistoryItem, HistoryType, Stats } from "./types";

const CACHE_MS = 15_000;
const RPC_TIMEOUT_MS = 9_000;
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
  return { source: "demo", contract: null, explorer: SNOWTRACE, fetchedAt: new Date(now).toISOString(), reason, objects };
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

  const now = Date.now();
  const shift = demoShift(file);
  let registered = 0;
  const objects = rows.map(({ o, e }) => {
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
    objects,
  };
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

/** Scans forward from the deploy block (or the last scanned one), up to LOG_WINDOWS windows per call. */
function contractEvents(cfg: ContractConfig, provider: JsonRpcProvider): Promise<Map<number, ChainEvent[]>> {
  scanning ??= (async () => {
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
        const item = toHistory(log, times.get(log.blockNumber) ?? Date.now());
        if (item) st.events.set(`${log.transactionHash}:${log.index}`, item);
      }
      st.from = from = to + 1;
    }
    return st.byObject();
  })().finally(() => (scanning = null));
  return scanning;
}

function toHistory(log: EventLog | Log, at: number): { id: number; h: ChainEvent } | null {
  if (!("fragment" in log) || !log.fragment) return null;
  const a = log.args;
  const map: Record<string, () => { type: HistoryType; amount: number }> = {
    Registered: () => ({ type: "REGISTERED", amount: usd(a[5]) }),
    ReentryAttested: () => ({ type: "REENTRY_ATTESTED", amount: 0 }),
    Refunded: () => ({ type: "REFUNDED", amount: usd(a[2]) }),
    Forfeited: () => ({ type: "FORFEITED", amount: usd(a[2]) }),
  };
  const fn = map[log.fragment.name];
  if (!fn) return null;
  return { id: Number(a[0]), h: { at: new Date(at).toISOString(), txHash: log.transactionHash, ...fn() } };
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
