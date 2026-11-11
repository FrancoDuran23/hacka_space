import type { DebrisObject, EscrowStatus, Stats } from "./types";

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

/** Status at a given (possibly simulated) instant. Past the deadline the deposit is forfeitable by anyone. */
export function statusAt(o: DebrisObject, now: number): EscrowStatus {
  if (o.status === "REFUNDED") return "REFUNDED";
  if (o.status === "FORFEITED") return "FORFEITED";
  const left = Date.parse(o.deadline) - now;
  if (left <= 0) return "FORFEITED";
  if (left < DAY) return "EXPIRING";
  return "ACTIVE";
}

/** Instant the object stops accruing collision risk: only a verified reentry takes it out of orbit. */
function riskEnd(o: DebrisObject, status: EscrowStatus): number {
  return status === "REFUNDED" && o.settledAt ? Date.parse(o.settledAt) : Infinity;
}

/**
 * Net balance = deposit guaranteeing the removal − collision risk accrued while the object stays up.
 * A forfeited deposit still backs the removal (it goes to the fund), so only a reentry stops the risk.
 */
function balance(o: DebrisObject, t: number, status: EscrowStatus): number {
  const start = Date.parse(o.createdAt);
  const credited = t >= start ? o.deposit : 0;
  const end = Math.min(t, riskEnd(o, status));
  return Math.round(credited - (o.riskPerDay * Math.max(0, end - start)) / DAY);
}

export function netBalanceAt(o: DebrisObject, now: number): number {
  return balance(o, now, statusAt(o, now));
}

export function balanceSeries(o: DebrisObject, now: number, points = 48): { t: number; v: number }[] {
  const start = Date.parse(o.createdAt);
  const status = statusAt(o, now);
  const end = Math.max(start + HOUR, now);
  return Array.from({ length: points + 1 }, (_, i) => {
    const t = start + ((end - start) * i) / points;
    return { t, v: balance(o, t, status) };
  });
}

export function computeStats(objects: DebrisObject[], now: number): Stats {
  const s: Stats = { totalLocked: 0, totalRefunded: 0, totalForfeited: 0, active: 0, expiring: 0, forfeited: 0, refunded: 0, operators: [] };
  const byOperator = new Map<string, number>();
  for (const o of objects) {
    const st = statusAt(o, now);
    if (st === "ACTIVE") s.active++;
    else if (st === "EXPIRING") s.expiring++;
    else if (st === "FORFEITED") s.forfeited++;
    else s.refunded++;
    if (st === "ACTIVE" || st === "EXPIRING") s.totalLocked += o.deposit;
    if (st === "REFUNDED") s.totalRefunded += o.deposit;
    if (st === "FORFEITED") s.totalForfeited += o.deposit;
    byOperator.set(o.owner, (byOperator.get(o.owner) ?? 0) + o.deposit);
  }
  s.operators = [...byOperator].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  return s;
}

export const STATUS_LABEL: Record<EscrowStatus, string> = {
  ACTIVE: "Activo",
  EXPIRING: "Por vencer",
  FORFEITED: "Decomisado",
  REFUNDED: "Devuelto",
};

/** Neon state colors (linear-ish hex used by both CSS and three). */
export const STATUS_COLOR: Record<EscrowStatus, string> = {
  ACTIVE: "#a6e9ff",
  EXPIRING: "#58a6ff",
  FORFEITED: "#6a5cff",
  REFUNDED: "#38e8ff",
};
