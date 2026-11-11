import "server-only";

export interface DeorbitRecord {
  objectId: number;
  txHash: string;
  at: string;
  cleaner: string;
  payout: number;
  simulated: boolean;
}

// Survives hot reloads in dev; resets when the server restarts (the chain is the source of truth).
const g = globalThis as unknown as { __orbitclearDeorbits?: Map<number, DeorbitRecord>; __orbitclearBust?: number; __orbitclearEpoch?: number };
g.__orbitclearEpoch ??= Date.now();
g.__orbitclearDeorbits ??= new Map();
g.__orbitclearBust ??= 0;

export function recordDeorbit(r: DeorbitRecord) {
  g.__orbitclearDeorbits!.set(r.objectId, r);
  g.__orbitclearBust = (g.__orbitclearBust ?? 0) + 1;
}

export function deorbits(): Map<number, DeorbitRecord> {
  return g.__orbitclearDeorbits!;
}

export function cacheVersion(): number {
  return g.__orbitclearBust ?? 0;
}

/** Instant the demo dataset is re-based to (fixed per server process). */
export function demoEpoch(): number {
  return g.__orbitclearEpoch!;
}
