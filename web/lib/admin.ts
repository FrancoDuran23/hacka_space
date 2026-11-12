import "server-only";

import { asc, count, eq } from "drizzle-orm";

import { getCatalog } from "@/lib/celestrak";
import { db } from "@/lib/db";
import {
  contractAddresses,
  regulatorOperators,
  regulators,
  wallets,
  type ContractAddress,
} from "@/lib/db/schema";
import { getEscrows } from "@/lib/escrow";
import { utcClock, utcDate } from "@/lib/format";
import { computeStats } from "@/lib/status";
import type {
  DataSource,
  DebrisObject,
  EscrowSnapshot,
  Stats,
} from "@/lib/types";

/** Emails admin, separados por coma (case-insensitive). */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}

export interface HealthCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface AdminRegulator {
  agency: string;
  agencyCode: string;
  /** Códigos de operador (owner) que el regulador tiene adjudicados. */
  operators: string[];
  createdAt: Date;
}

export interface AdminOverview {
  stats: Stats;
  objects: DebrisObject[];
  regulators: AdminRegulator[];
  walletCount: number;
  contracts: ContractAddress[];
  snapshot: { source: DataSource; fetchedAt: string; explorer: string };
}

const errMsg = (e: unknown) =>
  (e instanceof Error ? e.message : String(e)).slice(0, 200);

async function attempt<T>(
  p: Promise<T>,
): Promise<{ v: T | null; err: string | null }> {
  try {
    return { v: await p, err: null };
  } catch (e) {
    return { v: null, err: errMsg(e) };
  }
}

const fail = (name: string, err: string | null): HealthCheck => ({
  name,
  ok: false,
  detail: err ?? "sin datos",
});

async function databaseCheck(): Promise<HealthCheck> {
  const name = "Base de datos";
  const t0 = Date.now();
  try {
    const rows = await db.select({ n: count() }).from(regulators);
    return {
      name,
      ok: true,
      detail: `${rows[0]?.n ?? 0} reguladores · ${Date.now() - t0} ms`,
    };
  } catch (e) {
    return { name, ok: false, detail: errMsg(e) };
  }
}

/** Fuji es lo esperado; "local"/"demo" son degradados conocidos, no errores. */
function blockchainCheck(snap: EscrowSnapshot): HealthCheck {
  const name = "Blockchain";
  if (snap.source === "fuji") {
    return { name, ok: true, detail: "Leyendo Avalanche Fuji" };
  }
  if (snap.source === "local") {
    return {
      name,
      ok: true,
      detail: "Red local (entorno de desarrollo; degradado conocido)",
    };
  }
  return {
    name,
    ok: true,
    detail: `Datos simulados${snap.reason ? ` — ${snap.reason}` : ""} (degradado conocido)`,
  };
}

/**
 * Checks de funcionamiento de cada parte de la app, en orden fijo.
 * Nunca lanza: cualquier error se reporta como un check con ok:false.
 */
export async function runChecks(): Promise<HealthCheck[]> {
  // Un solo snapshot alimenta los checks de escrows, TLEs y blockchain.
  const [database, snap, catalog] = await Promise.all([
    databaseCheck(),
    attempt(getEscrows()),
    attempt(getCatalog("visual")),
  ]);

  const s = snap.v;
  const c = catalog.v;
  return [
    database,
    s
      ? {
          name: "Escrows (API/console)",
          ok: s.objects.length > 0,
          detail: `${s.objects.length} objetos · fuente ${s.source}`,
        }
      : fail("Escrows (API/console)", snap.err),
    s
      ? {
          name: "TLEs CelesTrak",
          ok: s.tle.live > 0,
          detail:
            `${s.tle.live}/${s.tle.total} TLEs frescos` +
            (s.tle.oldestEpoch
              ? ` · epoch más vieja ${utcDate(Date.parse(s.tle.oldestEpoch))}`
              : ""),
        }
      : fail("TLEs CelesTrak", snap.err),
    c
      ? {
          name: "Catálogo CelesTrak",
          ok: c.objects.length > 0,
          detail: `${c.objects.length} objetos (grupo visual) · ${utcDate(Date.parse(c.fetchedAt))} ${utcClock(Date.parse(c.fetchedAt))} UTC`,
        }
      : fail("Catálogo CelesTrak", catalog.err),
    s ? blockchainCheck(s) : fail("Blockchain", snap.err),
    {
      name: "Sesión admin",
      ok: true,
      detail: "El check corre bajo sesión de administrador",
    },
  ];
}

/** Todos los reguladores con sus operadores adjudicados ([] si la tabla no existe todavía). */
async function overviewRegulators(): Promise<AdminRegulator[]> {
  try {
    const rows = await db
      .select({
        id: regulators.id,
        agency: regulators.agency,
        agencyCode: regulators.agencyCode,
        createdAt: regulators.createdAt,
        operator: regulatorOperators.operator,
      })
      .from(regulators)
      .leftJoin(
        regulatorOperators,
        eq(regulatorOperators.regulatorId, regulators.id),
      )
      .orderBy(asc(regulators.agency), asc(regulatorOperators.operator));

    const byId = new Map<string, AdminRegulator>();
    for (const r of rows) {
      let g = byId.get(r.id);
      if (!g) {
        g = {
          agency: r.agency,
          agencyCode: r.agencyCode,
          operators: [],
          createdAt: r.createdAt,
        };
        byId.set(r.id, g);
      }
      if (r.operator) g.operators.push(r.operator);
    }
    return [...byId.values()];
  } catch {
    return [];
  }
}

async function overviewWalletCount(): Promise<number> {
  try {
    const rows = await db.select({ n: count() }).from(wallets);
    return rows[0]?.n ?? 0;
  } catch {
    return 0;
  }
}

async function overviewContracts(): Promise<ContractAddress[]> {
  try {
    return await db
      .select()
      .from(contractAddresses)
      .orderBy(asc(contractAddresses.name));
  } catch {
    return [];
  }
}

/** Todo el sistema sin filtrar: escrows, operadores, reguladores, wallets y contratos. */
export async function adminOverview(): Promise<AdminOverview> {
  const snap = await getEscrows();
  const [regs, walletCount, contracts] = await Promise.all([
    overviewRegulators(),
    overviewWalletCount(),
    overviewContracts(),
  ]);

  return {
    stats: computeStats(snap.objects, Date.now()),
    objects: snap.objects,
    regulators: regs,
    walletCount,
    contracts,
    snapshot: {
      source: snap.source,
      fetchedAt: snap.fetchedAt,
      explorer: snap.explorer,
    },
  };
}
