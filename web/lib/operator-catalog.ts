import "server-only";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * The full SATCAT, to list an operator's satellites: CelesTrak's records endpoint does not filter by OWNER.
 * About 7 MB, downloaded at most once a day and kept on disk. CelesTrak answers 403 to repeated downloads of
 * its files, so a refused download falls back to the last copy and is not retried for RETRY_MS.
 */
const SATCAT_CSV = "https://celestrak.org/pub/satcat.csv";
const TTL_MS = 24 * 3_600_000;
const RETRY_MS = 2 * 3_600_000;
const TIMEOUT_MS = 60_000;
// Vercel functions can only write to /tmp (and it does not survive cold starts); elsewhere, next to the app
const CACHE_FILE = path.join(process.env.VERCEL ? "/tmp" : process.cwd(), ".cache", "satcat.csv");

export interface OwnedSatellite {
  norad: number;
  name: string;
  launchDate: string;
  apogeeKm: number;
  /** SATCAT operational status: "+" operational, "-" non-operational, "P" partial, "B" backup, "S" spare, "X" extended. */
  ops: string;
}

type Row = Record<string, string>;

let cache: { at: number; rows: Promise<Row[]> } | null = null;
/** Do not ask CelesTrak again before this instant (after a refused download). */
let blockedUntil = 0;

/** RFC 4180: quoted fields may hold commas and doubled quotes. */
function parseCsv(text: string): Row[] {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") record.push(field), (field = "");
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      record.push(field);
      if (record.some((f) => f !== "")) records.push(record);
      (record = []), (field = "");
    } else field += ch;
  }
  if (field || record.length) record.push(field), records.push(record);
  const [header, ...rest] = records;
  return rest.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

async function diskCopy(): Promise<{ text: string; age: number } | null> {
  try {
    const [info, text] = await Promise.all([stat(CACHE_FILE), readFile(CACHE_FILE, "utf8")]);
    return { text, age: Date.now() - info.mtimeMs };
  } catch {
    return null;
  }
}

async function loadSatcat(): Promise<Row[]> {
  const disk = await diskCopy();
  if (disk && (disk.age < TTL_MS || Date.now() < blockedUntil)) return parseCsv(disk.text);
  try {
    const res = await fetch(SATCAT_CSV, {
      headers: { "User-Agent": "orbitclear/1.0 (Argentina Space hackathon)" },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`CelesTrak respondió ${res.status} al catálogo completo.`);
    const text = await res.text();
    await mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await writeFile(CACHE_FILE, text);
    return parseCsv(text);
  } catch (e) {
    blockedUntil = Date.now() + RETRY_MS;
    if (disk) return parseCsv(disk.text);
    throw new Error(`${(e as Error).message} Se reintenta en 2 horas.`);
  }
}

function satcat(): Promise<Row[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows;
  const rows = loadSatcat();
  cache = { at: Date.now(), rows };
  // a failed load is retried on a later request (loadSatcat itself waits RETRY_MS before asking CelesTrak)
  rows.catch(() => {
    if (cache?.rows === rows) cache = null;
  });
  return rows;
}

/** Payloads of `owner` (SATCAT OWNER code) still in Earth orbit and with current elements. */
export async function satellitesOwnedBy(owner: string): Promise<OwnedSatellite[]> {
  const rows = await satcat();
  return rows
    .filter((r) => r.OWNER === owner && r.OBJECT_TYPE === "PAY" && r.ORBIT_CENTER === "EA" && !r.DECAY_DATE && r.DATA_STATUS_CODE !== "NEA")
    .map((r) => ({ norad: Number(r.NORAD_CAT_ID), name: r.OBJECT_NAME, launchDate: r.LAUNCH_DATE, apogeeKm: Number(r.APOGEE), ops: r.OPS_STATUS_CODE }));
}
