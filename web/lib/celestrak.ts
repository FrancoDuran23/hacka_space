import "server-only";

/**
 * CelesTrak, the public source the relayer attests from. Its usage policy blocks an IP after repeated
 * errors, so a non-200 is reported and never retried, and every answer is cached.
 */
const SATCAT_URL = "https://celestrak.org/satcat/records.php";
const GP_URL = "https://celestrak.org/NORAD/elements/gp.php";
const HEADERS = { "User-Agent": "orbitclear/1.0 (Argentina Space hackathon)" };
const TIMEOUT_MS = 20_000;
const CACHE_MS = 6 * 3_600_000;

/** One raw SATCAT record, exactly as CelesTrak returns it (its keccak256 is what goes on-chain). */
export interface SatcatRecord {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  NORAD_CAT_ID: number;
  OBJECT_TYPE: "PAY" | "R/B" | "DEB" | "UNK";
  OPS_STATUS_CODE: string;
  OWNER: string;
  LAUNCH_DATE: string;
  DECAY_DATE: string;
  APOGEE: number;
  PERIGEE: number;
  [field: string]: unknown;
}

export class CelestrakError extends Error {}

const cache = new Map<string, { at: number; value: unknown }>();

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

async function get(url: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, { headers: HEADERS, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new CelestrakError("CelesTrak no respondió a tiempo. Probá de nuevo en un rato.");
  }
  return res;
}

/** The SATCAT record of a NORAD id, or null when the catalogue has no such object. */
export function satcatRecord(norad: number): Promise<SatcatRecord | null> {
  return cached(`satcat:${norad}`, async () => {
    const res = await get(`${SATCAT_URL}?CATNR=${norad}&FORMAT=JSON`);
    if (!res.ok) throw new CelestrakError(`CelesTrak respondió ${res.status} al catálogo SATCAT.`);
    const body = (await res.json().catch(() => null)) as SatcatRecord[] | SatcatRecord | null;
    const record = Array.isArray(body) ? body[0] : body;
    return record?.NORAD_CAT_ID ? record : null;
  });
}

/**
 * Current two-line elements of a NORAD id, or null. CelesTrak answers 404 when the object has no
 * current elements (it re-entered or is lost): that is data, not an error to retry.
 */
export function currentTle(norad: number): Promise<[string, string] | null> {
  return cached(`tle:${norad}`, async () => {
    const res = await get(`${GP_URL}?CATNR=${norad}&FORMAT=TLE`);
    if (res.status === 404) return null;
    if (!res.ok) throw new CelestrakError(`CelesTrak respondió ${res.status} a los elementos orbitales.`);
    const lines = (await res.text()).split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean);
    const l1 = lines.find((l) => l.startsWith("1 "));
    const l2 = lines.find((l) => l.startsWith("2 "));
    return l1 && l2 ? [l1, l2] : null;
  });
}
