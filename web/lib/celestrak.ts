import "server-only";
import { ommToTle, type Omm } from "./omm";
import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db } from "./db";
import { catalogObject, orbitalSatcat, orbitalTle } from "./db/schema";
import { tleEpochISO } from "./orbit";
import type { CatalogKind, CatalogObject, CatalogSnapshot, DebrisObject, TleInfo } from "./types";

const CELESTRAK_GP = "https://celestrak.org/NORAD/elements/gp.php";
const SATCAT_CSV = "https://celestrak.org/pub/satcat.csv";

/**
 * Los datos de la API viven en Neon: cada fila se sirve hasta que vence su TTL
 * y recién ahí se refresca desde CelesTrak. La memoria solo evita SELECTs en
 * caliente (el poll del escrow corre cada ~15 s). Si la DB falla, se degrada
 * a fetch directo — la demo no depende de que la base esté sana.
 */
const TLE_TTL_MS = 60 * 60_000; // CelesTrak actualiza TLEs unas pocas veces al día
const SATCAT_TTL_MS = 12 * 60 * 60_000; // OPS_STATUS / DECAY_DATE cambian rara vez
const MEM_MS = 5 * 60_000;
const CONCURRENCY = 6;

interface LiveTle {
  tle: [string, string];
  /** TLE epoch (cols 18–32 of line 1) as ISO. */
  epoch: string | null;
}

const mem = new Map<number, { at: number; v: LiveTle | null }>();

// ───────────────────────────── remote fetch (sin cache: la cache es la DB) ─────────────────────────────

async function fetchTleRemote(catnr: number): Promise<LiveTle | null> {
  try {
    // bounded: a CelesTrak that hangs must not hang the page (a miss is remembered in `mem` for MEM_MS)
    const res = await fetch(`${CELESTRAK_GP}?CATNR=${catnr}&FORMAT=tle`, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const lines = (await res.text())
      .split("\n")
      .map((l) => l.trimEnd())
      .filter((l) => l.startsWith("1 ") || l.startsWith("2 "));
    const l1 = lines.find((l) => l.startsWith("1 "));
    const l2 = lines.find((l) => l.startsWith("2 "));
    return l1 && l2 ? { tle: [l1.slice(0, 69), l2.slice(0, 69)], epoch: tleEpochISO(l1) } : null;
  } catch {
    return null;
  }
}

// ───────────────────────────── orbital_tle ─────────────────────────────

async function readTleRows(ids: number[]): Promise<Map<number, { line1: string; line2: string; epoch: string | null; fetchedAt: Date }>> {
  const out = new Map<number, { line1: string; line2: string; epoch: string | null; fetchedAt: Date }>();
  if (!ids.length) return out;
  try {
    const rows = await db.select().from(orbitalTle).where(inArray(orbitalTle.catnr, ids));
    for (const r of rows) out.set(r.catnr, { line1: r.line1, line2: r.line2, epoch: r.epoch, fetchedAt: r.fetchedAt });
  } catch {
    /* DB opcional */
  }
  return out;
}

async function writeTle(catnr: number, name: string, v: LiveTle) {
  try {
    await db
      .insert(orbitalTle)
      .values({ catnr, name, line1: v.tle[0], line2: v.tle[1], epoch: v.epoch, fetchedAt: new Date() })
      .onConflictDoUpdate({ target: orbitalTle.catnr, set: { name, line1: v.tle[0], line2: v.tle[1], epoch: v.epoch, fetchedAt: new Date() } });
  } catch {
    /* DB opcional */
  }
}

/**
 * Swaps each object's baked TLE for the freshest one CelesTrak has (mutates `objects`).
 * The DB row wins while it's under TLE_TTL; stale rows trigger a remote refetch and
 * still serve as fallback if CelesTrak is down.
 */
export async function refreshTles(objects: DebrisObject[]): Promise<TleInfo> {
  const now = Date.now();
  const stored = await readTleRows(objects.map((o) => o.objectId));

  const needsFetch = objects.filter((o) => {
    const m = mem.get(o.objectId);
    if (m && now - m.at < MEM_MS) return false;
    const r = stored.get(o.objectId);
    return !(r && now - r.fetchedAt.getTime() < TLE_TTL_MS);
  });
  for (let i = 0; i < needsFetch.length; i += CONCURRENCY) {
    await Promise.all(
      needsFetch.slice(i, i + CONCURRENCY).map(async (o) => {
        const v = await fetchTleRemote(o.objectId);
        mem.set(o.objectId, { at: now, v });
        if (v) await writeTle(o.objectId, o.name, v);
      }),
    );
  }

  let live = 0;
  let oldest: string | null = null;
  for (const o of objects) {
    const m = mem.get(o.objectId);
    const r = stored.get(o.objectId);
    const v: LiveTle | null = (m && now - m.at < MEM_MS ? m.v : null) ?? m?.v ?? (r ? { tle: [r.line1, r.line2], epoch: r.epoch } : null);
    if (!v) continue;
    o.tle = v.tle;
    o.tleEpoch = v.epoch ?? undefined;
    live++;
    if (v.epoch && (!oldest || v.epoch < oldest)) oldest = v.epoch;
  }
  return { live, total: objects.length, oldestEpoch: oldest, fetchedAt: new Date(now).toISOString() };
}

// ───────────────────────────── orbital_satcat ─────────────────────────────

interface SatcatMeta {
  objectType: string;
  opsStatus: string;
  owner: string;
  decayDate: string;
  intlDes: string;
  launchDate: string;
  launchSite: string;
  /** radar cross-section en m², NaN si el CSV no lo trae */
  rcs: number;
}

const satcatMem = new Map<number, { at: number; v: SatcatMeta | null }>();

/** One CSV row, honoring quoted fields ("a,b" stays one field, "" is an escaped quote). */
function csvRow(row: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < row.length; i++) {
    const c = row[i];
    if (q) {
      if (c === '"') {
        if (row[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/** Full SATCAT (~71k rows) in one request: OBJECT_TYPE, OPS_STATUS_CODE, OWNER, DECAY_DATE per NORAD id. */
async function fetchSatcatRemote(): Promise<Map<number, SatcatMeta> | null> {
  try {
    const res = await fetch(SATCAT_CSV, { cache: "no-store" });
    if (!res.ok) return null;
    const lines = (await res.text()).split("\n");
    const map = new Map<number, SatcatMeta>();
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;
      const f = csvRow(lines[i]);
      const id = Number(f[2]);
      if (id > 0)
        map.set(id, {
          objectType: f[3],
          opsStatus: f[4],
          owner: f[5],
          decayDate: f[8],
          intlDes: f[1],
          launchDate: f[6],
          launchSite: f[7],
          rcs: Number(f[13]),
        });
    }
    return map.size ? map : null;
  } catch {
    return null;
  }
}

async function readSatcatRows(ids: number[]): Promise<Map<number, SatcatMeta & { fetchedAt: Date }>> {
  const out = new Map<number, SatcatMeta & { fetchedAt: Date }>();
  if (!ids.length) return out;
  try {
    const rows = await db.select().from(orbitalSatcat).where(inArray(orbitalSatcat.catnr, ids));
    for (const r of rows)
      out.set(r.catnr, {
        objectType: r.objectType ?? "",
        opsStatus: r.opsStatus ?? "",
        owner: r.owner ?? "",
        decayDate: r.decayDate ?? "",
        intlDes: r.intlDes ?? "",
        launchDate: r.launchDate ?? "",
        launchSite: r.launchSite ?? "",
        rcs: r.rcs ?? NaN,
        fetchedAt: r.fetchedAt,
      });
  } catch {
    /* DB opcional */
  }
  return out;
}

async function writeSatcatRows(rows: { catnr: number } & SatcatMeta) {
  try {
    await db
      .insert(orbitalSatcat)
      .values({
        catnr: rows.catnr,
        objectType: rows.objectType,
        opsStatus: rows.opsStatus,
        owner: rows.owner,
        decayDate: rows.decayDate,
        intlDes: rows.intlDes,
        launchDate: rows.launchDate,
        launchSite: rows.launchSite,
        rcs: Number.isFinite(rows.rcs) ? rows.rcs : null,
        fetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: orbitalSatcat.catnr,
        set: {
          objectType: rows.objectType,
          opsStatus: rows.opsStatus,
          owner: rows.owner,
          decayDate: rows.decayDate,
          intlDes: rows.intlDes,
          launchDate: rows.launchDate,
          launchSite: rows.launchSite,
          rcs: Number.isFinite(rows.rcs) ? rows.rcs : null,
          fetchedAt: new Date(),
        },
      });
  } catch {
    /* DB opcional */
  }
}

/** OPS_STATUS_CODE families that mean the payload still works. */
const ACTIVE_OPS = new Set(["+", "P", "B", "S", "X"]);

/**
 * Activo: payload with an operational status.
 * Fuera de órbita: DECAY_DATE set or status D.
 * Basura: everything else in orbit (dead payloads, rocket bodies, fragments, unknowns).
 */
function catalogKind(m: SatcatMeta | undefined): CatalogKind {
  if (!m) return "debris";
  if (m.decayDate || m.opsStatus === "D") return "out";
  if (m.objectType === "PAY" && ACTIVE_OPS.has(m.opsStatus)) return "active";
  return "debris";
}

/** SATCAT meta for the tracked ids: mem → DB (<12 h) → full CSV once → upsert subset. */
async function getSatcat(ids: number[]): Promise<Map<number, SatcatMeta>> {
  const now = Date.now();
  const out = new Map<number, SatcatMeta>();
  const need: number[] = [];
  for (const id of ids) {
    const m = satcatMem.get(id);
    if (m && now - m.at < SATCAT_TTL_MS) {
      if (m.v) out.set(id, m.v);
    } else need.push(id);
  }
  if (!need.length) return out;

  const stored = await readSatcatRows(need);
  const remoteIds: number[] = [];
  for (const id of need) {
    const r = stored.get(id);
    if (r && now - r.fetchedAt.getTime() < SATCAT_TTL_MS) {
      out.set(id, r);
      satcatMem.set(id, { at: now, v: r });
    } else remoteIds.push(id);
  }
  if (!remoteIds.length) return out;

  // one CSV for all missing/stale ids; stale DB rows remain the fallback
  const fresh = await fetchSatcatRemote();
  for (const id of remoteIds) {
    const v = fresh?.get(id) ?? null;
    const fallback = stored.get(id);
    const meta = v ?? (fallback ? { objectType: fallback.objectType, opsStatus: fallback.opsStatus, owner: fallback.owner, decayDate: fallback.decayDate, intlDes: fallback.intlDes, launchDate: fallback.launchDate, launchSite: fallback.launchSite, rcs: fallback.rcs } : null);
    satcatMem.set(id, { at: now, v: meta });
    if (meta) out.set(id, meta);
    if (v) await writeSatcatRows({ catnr: id, ...v });
  }
  return out;
}

// ───────────────────────────── catalog_object ─────────────────────────────

/** Groups the console may render: one request each, cached. */
const CATALOG_GROUPS = new Set([
  "visual",
  "stations",
  "weather",
  "goes",
  "gps-ops",
  "galileo",
  "beidou",
  "iridium",
  "last-30-days",
  "iridium-33-debris",
  "cosmos-2251-debris",
  "fengyun-1c-debris",
]);

const catalogMem = new Map<string, { at: number; v: CatalogObject[] }>();

function parseCatalog(text: string): CatalogObject[] {
  const lines = text
    .split("\n")
    .map((l) => l.trimEnd())
    .filter(Boolean);
  const out: CatalogObject[] = [];
  let name = "";
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("1 ") && i + 1 < lines.length && lines[i + 1].startsWith("2 ")) {
      const l2 = lines[i + 1];
      const objectId = Number(l.slice(2, 7).trim());
      const sameId = objectId > 0 && l.slice(2, 7).trim() === l2.slice(2, 7).trim();
      if (sameId)
        out.push({ objectId, name: name || `NORAD ${objectId}`, tle: [l.slice(0, 69), l2.slice(0, 69)], tleEpoch: tleEpochISO(l) ?? undefined });
      name = "";
      i++;
    } else if (!l.startsWith("2 ")) {
      name = l.trim();
    }
  }
  return out;
}

async function readCatalogRows(g: string): Promise<{ objects: CatalogObject[]; fetchedAt: number } | null> {
  try {
    const rows = await db.select().from(catalogObject).where(eq(catalogObject.groupName, g));
    if (!rows.length) return null;
    return {
      fetchedAt: Math.max(...rows.map((r) => r.fetchedAt.getTime())),
      objects: rows.map((r) => ({
        objectId: r.catnr,
        name: r.name,
        tle: [r.line1, r.line2],
        tleEpoch: r.epoch ?? undefined,
        kind: (r.kind as CatalogKind) ?? undefined,
        objectType: r.objectType ?? undefined,
        opsStatus: r.opsStatus ?? undefined,
        owner: r.owner ?? undefined,
        intlDes: r.intlDes ?? undefined,
        launchDate: r.launchDate ?? undefined,
        launchSite: r.launchSite ?? undefined,
        rcs: r.rcs ?? undefined,
        source: r.source,
      })),
    };
  } catch {
    return null;
  }
}

async function writeCatalogRows(g: string, objects: CatalogObject[]) {
  try {
    const now = new Date();
    await db
      .insert(catalogObject)
      .values(
        objects.map((o) => ({
          groupName: g,
          catnr: o.objectId,
          name: o.name,
          line1: o.tle[0],
          line2: o.tle[1],
          epoch: o.tleEpoch ?? null,
          kind: o.kind ?? null,
          objectType: o.objectType ?? null,
          opsStatus: o.opsStatus ?? null,
          owner: o.owner ?? null,
          intlDes: o.intlDes ?? null,
          launchDate: o.launchDate ?? null,
          launchSite: o.launchSite ?? null,
          rcs: o.rcs ?? null,
          source: o.source ?? "celestrak",
          fetchedAt: now,
        })),
      )
      .onConflictDoUpdate({
        target: [catalogObject.groupName, catalogObject.catnr],
        set: {
          name: sql`excluded.name`,
          line1: sql`excluded.line1`,
          line2: sql`excluded.line2`,
          epoch: sql`excluded.epoch`,
          kind: sql`excluded.kind`,
          objectType: sql`excluded.object_type`,
          opsStatus: sql`excluded.ops_status`,
          owner: sql`excluded.owner`,
          intlDes: sql`excluded.intl_des`,
          launchDate: sql`excluded.launch_date`,
          launchSite: sql`excluded.launch_site`,
          rcs: sql`excluded.rcs`,
          source: sql`excluded.source`,
          fetchedAt: sql`excluded.fetched_at`,
        },
      });
    // drop objects that left the group
    await db.delete(catalogObject).where(and(eq(catalogObject.groupName, g), notInArray(catalogObject.catnr, objects.map((o) => o.objectId))));
  } catch {
    /* DB opcional */
  }
}

/** Fresh TLE set for a whole CelesTrak group: DB copy while under TTL, remote refetch after. */
export async function getCatalog(group: string): Promise<CatalogSnapshot> {
  const g = CATALOG_GROUPS.has(group) ? group : "visual";
  const now = Date.now();
  const hit = catalogMem.get(g);
  if (hit && now - hit.at < MEM_MS) return { group: g, fetchedAt: new Date(hit.at).toISOString(), objects: hit.v };

  const stored = await readCatalogRows(g);
  if (stored && now - stored.fetchedAt < TLE_TTL_MS) {
    catalogMem.set(g, { at: now, v: stored.objects });
    return { group: g, fetchedAt: new Date(stored.fetchedAt).toISOString(), objects: stored.objects };
  }

  let objects = stored?.objects ?? [];
  const res = await fetch(`${CELESTRAK_GP}?GROUP=${g}&FORMAT=tle`, { cache: "no-store" }).catch(() => null);
  if (res?.ok) {
    const parsed = parseCatalog(await res.text());
    if (parsed.length) {
      const satcat = await getSatcat(parsed.map((o) => o.objectId));
      for (const o of parsed) {
        const m = satcat.get(o.objectId);
        o.kind = catalogKind(m);
        o.objectType = m?.objectType;
        o.opsStatus = m?.opsStatus;
        o.owner = m?.owner;
        o.intlDes = m?.intlDes;
        o.launchDate = m?.launchDate;
        o.launchSite = m?.launchSite;
        o.rcs = m && Number.isFinite(m.rcs) ? m.rcs : undefined;
        o.source = "celestrak";
      }
      objects = parsed;
      await writeCatalogRows(g, parsed);
    }
  }
  catalogMem.set(g, { at: now, v: objects });
  return { group: g, fetchedAt: new Date().toISOString(), objects };
}

// ──────────── relayer: alta de satélites (SATCAT record + TLE actual) ────────────

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
 * Current two-line elements of a NORAD id, or null. Asked as OMM (JSON) because CelesTrak no longer serves
 * TLE for catalog numbers above 99999; lib/omm rebuilds the TLE (Alpha-5). A 404 or an empty answer means
 * the object has no current elements (it re-entered or is lost): that is data, not an error to retry.
 */
export function currentTle(norad: number): Promise<[string, string] | null> {
  return cached(`tle:${norad}`, async () => {
    const res = await get(`${GP_URL}?CATNR=${norad}&FORMAT=JSON`);
    if (res.status === 404) return null;
    if (!res.ok) throw new CelestrakError(`CelesTrak respondió ${res.status} a los elementos orbitales.`);
    const body = (await res.json().catch(() => null)) as Omm[] | null;
    const omm = Array.isArray(body) ? body[0] : null;
    return omm?.NORAD_CAT_ID ? ommToTle(omm) : null;
  });
}

/**
 * Name, owner, kind and elements of a satellite, kept in the orbital tables so a registered satellite
 * outside the dataset can still be listed while CelesTrak is slow or refusing requests.
 */
export async function rememberOrbital(record: SatcatRecord, tle: [string, string]): Promise<void> {
  const catnr = record.NORAD_CAT_ID;
  await writeTle(catnr, record.OBJECT_NAME, { tle, epoch: tleEpochISO(tle[0]) });
  await writeSatcatRows({
    catnr,
    objectType: record.OBJECT_TYPE,
    opsStatus: record.OPS_STATUS_CODE,
    owner: record.OWNER,
    decayDate: record.DECAY_DATE,
    intlDes: record.OBJECT_ID,
    launchDate: record.LAUNCH_DATE,
    launchSite: String(record.LAUNCH_SITE ?? ""),
    rcs: Number(record.RCS),
  });
}

export async function storedOrbital(norad: number): Promise<{ name: string; owner: string; objectType: string; tle: [string, string] } | null> {
  const [tles, metas] = await Promise.all([readTleRows([norad]), readSatcatRows([norad])]);
  const t = tles.get(norad);
  if (!t) return null;
  const rows = await db.select({ name: orbitalTle.name }).from(orbitalTle).where(eq(orbitalTle.catnr, norad)).catch(() => []);
  const m = metas.get(norad);
  return { name: rows[0]?.name ?? `NORAD ${norad}`, owner: m?.owner ?? "—", objectType: m?.objectType ?? "PAY", tle: [t.line1, t.line2] };
}

