"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { regulatorOperators, regulators } from "@/lib/db/schema";
import { getEscrows } from "@/lib/escrow";
import { computeStats } from "@/lib/status";
import { listMyWallets } from "@/lib/wallets/actions";

import type {
  OperatorSummary,
  Regulator,
  RegulatorDashboard,
  RegulatorResult,
} from "./types";

const REGULATOR_PATH = "/regulador";
const AGENCY_CODE_RE = /^[A-Z0-9-]{2,20}$/;
const OPERATOR_MAX_LENGTH = 40;

type RegulatorRow = typeof regulators.$inferSelect;

async function currentUser() {
  try {
    return await requireUser();
  } catch {
    return null;
  }
}

function toRegulator(row: RegulatorRow): Regulator {
  return {
    id: row.id,
    agency: row.agency,
    agencyCode: row.agencyCode,
    createdAt: row.createdAt.toISOString(),
  };
}

async function myRegulatorRow(userId: string): Promise<RegulatorRow | null> {
  const [row] = await db
    .select()
    .from(regulators)
    .where(eq(regulators.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function getMyRegulator(): Promise<Regulator | null> {
  const user = await currentUser();
  if (!user) return null;
  const row = await myRegulatorRow(user.id);
  return row ? toRegulator(row) : null;
}

export async function registerAsRegulator(
  agency: string,
  agencyCode: string,
): Promise<RegulatorResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const name = agency.trim();
  if (name.length < 2 || name.length > 120) {
    return {
      ok: false,
      error: "La agencia debe tener entre 2 y 120 caracteres",
    };
  }
  const code = agencyCode.trim().toUpperCase();
  if (!AGENCY_CODE_RE.test(code)) {
    return {
      ok: false,
      error: "El código de agencia debe tener 2-20 caracteres (A-Z, 0-9 y guiones)",
    };
  }

  if (await myRegulatorRow(user.id)) {
    return { ok: false, error: "Ya estás dado de alta como regulador" };
  }
  const [taken] = await db
    .select({ id: regulators.id })
    .from(regulators)
    .where(eq(regulators.agencyCode, code))
    .limit(1);
  if (taken) {
    return { ok: false, error: "Ese código de agencia ya está registrado" };
  }

  try {
    await db
      .insert(regulators)
      .values({ userId: user.id, agency: name, agencyCode: code });
  } catch (e) {
    // Carrera contra otro alta: la unique constraint define el mensaje.
    const msg = String(e instanceof Error ? e.message : e);
    if (msg.includes("user")) {
      return { ok: false, error: "Ya estás dado de alta como regulador" };
    }
    return { ok: false, error: "Ese código de agencia ya está registrado" };
  }

  revalidatePath(REGULATOR_PATH);
  return { ok: true };
}

export async function listMyOperators(): Promise<string[]> {
  const user = await currentUser();
  if (!user) return [];
  const regulator = await myRegulatorRow(user.id);
  if (!regulator) return [];
  const rows = await db
    .select({ operator: regulatorOperators.operator })
    .from(regulatorOperators)
    .where(eq(regulatorOperators.regulatorId, regulator.id))
    .orderBy(asc(regulatorOperators.operator));
  return rows.map((r) => r.operator);
}

export async function claimOperator(
  operator: string,
): Promise<RegulatorResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "No autenticado" };
  const op = operator.trim();
  if (!op || op.length > OPERATOR_MAX_LENGTH) {
    return { ok: false, error: "Código de operador inválido" };
  }
  const regulator = await myRegulatorRow(user.id);
  if (!regulator) {
    return {
      ok: false,
      error: "Primero tenés que darte de alta como regulador",
    };
  }

  await db
    .insert(regulatorOperators)
    .values({ regulatorId: regulator.id, operator: op })
    .onConflictDoNothing({
      target: [regulatorOperators.regulatorId, regulatorOperators.operator],
    });

  revalidatePath(REGULATOR_PATH);
  return { ok: true };
}

export async function unclaimOperator(
  operator: string,
): Promise<RegulatorResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "No autenticado" };
  const op = operator.trim();
  if (!op || op.length > OPERATOR_MAX_LENGTH) {
    return { ok: false, error: "Código de operador inválido" };
  }
  const regulator = await myRegulatorRow(user.id);
  if (!regulator) {
    return { ok: false, error: "No estás dado de alta como regulador" };
  }

  await db
    .delete(regulatorOperators)
    .where(
      and(
        eq(regulatorOperators.regulatorId, regulator.id),
        eq(regulatorOperators.operator, op),
      ),
    );

  revalidatePath(REGULATOR_PATH);
  return { ok: true };
}

export async function availableOperators(): Promise<string[]> {
  const user = await currentUser();
  if (!user) return [];
  const snap = await getEscrows();
  // Puede incluir operadores ya adjudicados; la UI los marca.
  return [...new Set(snap.objects.map((o) => o.owner))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export async function regulatorDashboard(): Promise<RegulatorDashboard | null> {
  const user = await currentUser();
  if (!user) return null;
  const row = await myRegulatorRow(user.id);
  if (!row) return null;

  const [snap, operatorRows, myWallets] = await Promise.all([
    getEscrows(),
    db
      .select({ operator: regulatorOperators.operator })
      .from(regulatorOperators)
      .where(eq(regulatorOperators.regulatorId, row.id))
      .orderBy(asc(regulatorOperators.operator)),
    listMyWallets(),
  ]);

  const now = Date.now();
  const operators: OperatorSummary[] = operatorRows.map(({ operator }) => {
    const objects = snap.objects.filter((o) => o.owner === operator);
    return { operator, stats: computeStats(objects, now), objects };
  });

  return {
    regulator: toRegulator(row),
    operators,
    snapshot: {
      source: snap.source,
      fetchedAt: snap.fetchedAt,
      explorer: snap.explorer,
    },
    wallets: myWallets.map((w) => ({
      address: w.address,
      label: w.label,
      verifiedAt: w.verifiedAt,
    })),
  };
}
