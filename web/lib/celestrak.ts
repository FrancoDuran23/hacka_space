import "server-only";
import { tleEpochISO } from "./orbit";
import type { DebrisObject, TleInfo } from "./types";

const CELESTRAK_GP = "https://celestrak.org/NORAD/elements/gp.php";
/** CelesTrak updates TLEs a few times a day: an hour of shared cache is fresh enough and polite. */
const REVALIDATE_S = 3600;
/** Extra in-process cache so dev reloads / bypassed data-cache don't re-hit CelesTrak. */
const MEM_MS = 30 * 60_000;
/** Requests in flight at once, to stay a good API citizen. */
const CONCURRENCY = 6;

interface LiveTle {
  tle: [string, string];
  /** TLE epoch (cols 18–32 of line 1) as ISO. */
  epoch: string | null;
}

const mem = new Map<number, { at: number; v: LiveTle | null }>();

async function fetchTle(catnr: number): Promise<LiveTle | null> {
  const hit = mem.get(catnr);
  if (hit && Date.now() - hit.at < MEM_MS) return hit.v;
  let v: LiveTle | null = null;
  try {
    const res = await fetch(`${CELESTRAK_GP}?CATNR=${catnr}&FORMAT=tle`, { next: { revalidate: REVALIDATE_S } });
    if (res.ok) {
      const lines = (await res.text())
        .split("\n")
        .map((l) => l.trimEnd())
        .filter((l) => l.startsWith("1 ") || l.startsWith("2 "));
      const l1 = lines.find((l) => l.startsWith("1 "));
      const l2 = lines.find((l) => l.startsWith("2 "));
      if (l1 && l2) v = { tle: [l1.slice(0, 69), l2.slice(0, 69)], epoch: tleEpochISO(l1) };
    }
  } catch {
    /* unreachable: keep the baked TLE */
  }
  mem.set(catnr, { at: Date.now(), v });
  return v;
}

/**
 * Swaps each object's baked TLE for the freshest one CelesTrak has (mutates `objects`).
 * Objects with no live element (decayed or fetch failed) keep the file TLE, so the
 * console degrades to the snapshot instead of losing points.
 */
export async function refreshTles(objects: DebrisObject[]): Promise<TleInfo> {
  let live = 0;
  let oldest: string | null = null;
  for (let i = 0; i < objects.length; i += CONCURRENCY) {
    const rows = await Promise.all(objects.slice(i, i + CONCURRENCY).map(async (o) => ({ o, v: await fetchTle(o.objectId) })));
    for (const { o, v } of rows) {
      if (!v) continue;
      o.tle = v.tle;
      o.tleEpoch = v.epoch ?? undefined;
      live++;
      if (v.epoch && (!oldest || v.epoch < oldest)) oldest = v.epoch;
    }
  }
  return { live, total: objects.length, oldestEpoch: oldest, fetchedAt: new Date().toISOString() };
}
