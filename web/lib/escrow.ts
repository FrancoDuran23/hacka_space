import "server-only";
import { Contract, JsonRpcProvider, Network, formatUnits, type EventLog, type Log } from "ethers";
import { DEBRIS_ESCROW_ABI, USDC_DECIMALS } from "./abi";
import { loadContractConfig, loadEscrowsFile, SNOWTRACE, type ContractConfig, type EscrowsFile } from "./config";
import { cacheVersion, demoEpoch, deorbits } from "./live-store";
import { computeStats, netBalanceAt } from "./status";
import type { DebrisObject, EscrowSnapshot, EscrowStatus, HistoryItem, HistoryType, Stats } from "./types";

const CACHE_MS = 15_000;
const RPC_TIMEOUT_MS = 9_000;
/** Fuji's public RPC caps eth_getLogs at 100 blocks per request. */
const LOG_WINDOW = 100;
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
      snap = demoSnapshot(file, `fuji unreachable: ${(e as Error).message?.slice(0, 120)}`);
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

const shiftISO = (iso: string | null, ms: number) => (iso ? new Date(Date.parse(iso) + ms).toISOString() : null);

function demoSnapshot(file: EscrowsFile, reason: string): EscrowSnapshot {
  const now = Date.now();
  // Re-base the snapshot so the demo always looks "live" relative to today.
  const shift = demoEpoch() - Date.parse(file.snapshotAt);
  const objects = file.objects.map((o) => {
    const obj: DebrisObject = {
      ...o,
      createdAt: shiftISO(o.createdAt, shift)!,
      deadline: shiftISO(o.deadline, shift)!,
      settledAt: shiftISO(o.settledAt, shift),
      status: o.status === "EXPIRING" ? "ACTIVE" : o.status,
      history: o.history.map((h) => ({ ...h, at: shiftISO(h.at, shift)! })),
      funders: o.funders.map((f) => ({ ...f })),
    };
    applyLocalDeorbit(obj);
    obj.netBalance = netBalanceAt(obj, now);
    return obj;
  });
  return { source: "demo", contract: null, explorer: SNOWTRACE, fetchedAt: new Date(now).toISOString(), reason, objects };
}

function applyLocalDeorbit(obj: DebrisObject) {
  const d = deorbits().get(obj.objectId);
  if (!d) return;
  if (obj.status !== "CLEANED") {
    obj.status = "CLEANED";
    obj.collected = obj.locked || obj.collected;
    obj.locked = 0;
    obj.settledAt = d.at;
    obj.cleaner = d.cleaner;
  }
  if (!obj.history.some((h) => h.txHash.toLowerCase() === d.txHash.toLowerCase())) {
    obj.history.push({ type: "DEBRIS_DEORBITED", at: d.at, amount: d.payout, by: d.cleaner, txHash: d.txHash });
  }
}

// ───────────────────────────── live (Fuji) ─────────────────────────────

interface ChainEscrow {
  owner: string;
  createdAt: bigint;
  deadline: bigint;
  status: bigint;
  locked: bigint;
  totalFunded: bigint;
  cleaner: string;
  paidOut: bigint;
}

const usd = (v: bigint) => Number(formatUnits(v, USDC_DECIMALS));
const CHAIN_STATUS: Record<number, EscrowStatus> = { 1: "ACTIVE", 2: "CLEANED", 3: "EXPIRED" };

async function readChain(cfg: ContractConfig, file: EscrowsFile): Promise<EscrowSnapshot> {
  const net = Network.from(cfg.chainId);
  const provider = new JsonRpcProvider(cfg.rpcUrl, net, { staticNetwork: net });
  const c = new Contract(cfg.address!, DEBRIS_ESCROW_ABI, provider);

  const ids = ((await c.getFunction("getObjectIds")()) as bigint[]).map(Number);
  const [rows, recent] = await Promise.all([
    Promise.all(
      ids.map(async (id) => {
        const [e, f] = await Promise.all([c.getFunction("getEscrow")(id), c.getFunction("getFunders")(id)]);
        return { id, e: e as unknown as ChainEscrow, funders: f[0] as string[], amounts: f[1] as bigint[] };
      }),
    ),
    recentEvents(c, provider).catch(() => new Map<number, HistoryItem[]>()),
  ]);

  const names = new Map<string, string>();
  for (const f of file.funderDirectory) if (f.address) names.set(f.address.toLowerCase(), f.name);
  for (const f of file.cleanerDirectory ?? []) names.set(f.address.toLowerCase(), f.name);
  const kinds = new Map(file.funderDirectory.map((f) => [f.name, f] as const));
  const meta = new Map(file.objects.map((o) => [o.objectId, o] as const));
  const label = (a: string) => names.get(a.toLowerCase()) ?? `${a.slice(0, 6)}…${a.slice(-4)}`;

  const now = Date.now();
  const shift = file.seeded ? Date.parse(file.seeded.at) - Date.parse(file.snapshotAt) : 0;

  const objects: DebrisObject[] = [];
  for (const { id, e, funders, amounts } of rows) {
    const m = meta.get(id);
    if (!m) continue;
    const status = CHAIN_STATUS[Number(e.status)] ?? "ACTIVE";
    const history = mergeHistory(
      m.history.map((h) => ({ ...h, at: shiftISO(h.at, shift)! })),
      recent.get(id) ?? [],
      label,
    );
    const settled = [...history].reverse().find((h) => h.type === "DEBRIS_DEORBITED" || h.type === "ESCROW_EXPIRED");
    const obj: DebrisObject = {
      ...m,
      createdAt: shiftISO(m.createdAt, shift)!,
      deadline: new Date(Number(e.deadline) * 1000).toISOString(),
      status,
      locked: usd(e.locked),
      collected: usd(e.totalFunded),
      cleaner: status === "CLEANED" ? label(e.cleaner) : null,
      settledAt: status === "ACTIVE" ? null : (settled?.at ?? shiftISO(m.settledAt, shift) ?? new Date(now).toISOString()),
      funders: funders.map((a, i) => {
        const name = label(a);
        const k = kinds.get(name);
        return { name, kind: k?.kind ?? "company", country: k?.country ?? "—", address: a, amount: usd(amounts[i]) };
      }),
      history,
    };
    const d = deorbits().get(id);
    if (d && !obj.history.some((h) => h.txHash.toLowerCase() === d.txHash.toLowerCase())) {
      obj.history.push({ type: "DEBRIS_DEORBITED", at: d.at, amount: d.payout, by: d.cleaner, txHash: d.txHash });
    }
    obj.netBalance = netBalanceAt(obj, now);
    objects.push(obj);
  }
  if (objects.length === 0) throw new Error("contract has no escrows yet");

  return {
    source: cfg.chainId === 43113 ? "fuji" : "local",
    contract: cfg.address,
    explorer: cfg.explorer ?? (cfg.chainId === 43113 ? SNOWTRACE : ""),
    fetchedAt: new Date(now).toISOString(),
    objects,
  };
}

function mergeHistory(base: HistoryItem[], recent: HistoryItem[], label: (a: string) => string): HistoryItem[] {
  const seen = new Set(base.map((h) => h.txHash.toLowerCase()));
  const out = [...base];
  for (const h of recent) {
    if (seen.has(h.txHash.toLowerCase())) continue;
    out.push({ ...h, by: h.by.startsWith("0x") ? label(h.by) : h.by });
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

/** Scan the last LOG_WINDOWS × 100 blocks for fresh events (deorbits made during the demo, etc). */
async function recentEvents(c: Contract, provider: JsonRpcProvider): Promise<Map<number, HistoryItem[]>> {
  const latest = await provider.getBlockNumber();
  const ranges = Array.from({ length: LOG_WINDOWS }, (_, i) => {
    const to = latest - i * LOG_WINDOW;
    return [Math.max(0, to - LOG_WINDOW + 1), to] as const;
  });
  const logs = (await Promise.all(ranges.map(([from, to]) => c.queryFilter("*", from, to)))).flat();
  const blocks = new Map<number, number>();
  await Promise.all(
    [...new Set(logs.map((l) => l.blockNumber))].map(async (b) => {
      const blk = await provider.getBlock(b);
      if (blk) blocks.set(b, blk.timestamp * 1000);
    }),
  );
  const out = new Map<number, HistoryItem[]>();
  for (const log of logs) {
    const item = toHistory(log, blocks.get(log.blockNumber) ?? Date.now());
    if (!item) continue;
    const list = out.get(item.id) ?? [];
    list.push(item.h);
    out.set(item.id, list);
  }
  return out;
}

function toHistory(log: EventLog | Log, at: number): { id: number; h: HistoryItem } | null {
  if (!("fragment" in log) || !log.fragment) return null;
  const a = log.args;
  const base = { at: new Date(at).toISOString(), txHash: log.transactionHash };
  const map: Record<string, () => { type: HistoryType; amount: number; by: string }> = {
    EscrowCreated: () => ({ type: "ESCROW_CREATED", amount: usd(a[3]), by: String(a[2]) }),
    FundsAdded: () => ({ type: "FUNDS_ADDED", amount: usd(a[2]), by: String(a[1]) }),
    DebrisDeorbited: () => ({ type: "DEBRIS_DEORBITED", amount: usd(a[2]), by: String(a[1]) }),
    EscrowExpired: () => ({ type: "ESCROW_EXPIRED", amount: usd(a[1]), by: "protocol" }),
  };
  const fn = map[log.fragment.name];
  if (!fn) return null;
  return { id: Number(a[0]), h: { ...base, ...fn() } };
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
