import "server-only";

export interface ReentryRecord {
  objectId: number;
  txHash: string;
  at: string;
  operator: string;
  refund: number;
  simulated: boolean;
}

// Survives hot reloads in dev; resets when the server restarts (the chain is the source of truth).
const g = globalThis as unknown as { __orbitclearReentries?: Map<number, ReentryRecord>; __orbitclearBust?: number; __orbitclearEpoch?: number };
g.__orbitclearEpoch ??= Date.now();
g.__orbitclearReentries ??= new Map();
g.__orbitclearBust ??= 0;

export function recordReentry(r: ReentryRecord) {
  g.__orbitclearReentries!.set(r.objectId, r);
  g.__orbitclearBust = (g.__orbitclearBust ?? 0) + 1;
}

export function reentries(): Map<number, ReentryRecord> {
  return g.__orbitclearReentries!;
}

export function cacheVersion(): number {
  return g.__orbitclearBust ?? 0;
}

/** Instant the demo dataset is re-based to (fixed per server process). */
export function demoEpoch(): number {
  return g.__orbitclearEpoch!;
}
