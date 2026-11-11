import type { DebrisObject, EscrowStatus, Stats } from "./types";

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

/** Status at a given (possibly simulated) instant. */
export function statusAt(o: DebrisObject, now: number): EscrowStatus {
  if (o.status === "CLEANED") return "CLEANED";
  if (o.status === "EXPIRED") return "EXPIRED";
  const left = Date.parse(o.deadline) - now;
  if (left <= 0) return "EXPIRED";
  if (left < DAY) return "EXPIRING";
  return "ACTIVE";
}

/** USD credited to the object's cleanup at instant t (refunded escrows credit 0). */
function creditedAt(o: DebrisObject, t: number, status: EscrowStatus): number {
  if (status === "EXPIRED") {
    const end = o.settledAt ? Date.parse(o.settledAt) : Date.parse(o.deadline);
    if (t >= end) return 0;
  }
  let sum = 0;
  for (const h of o.history) {
    if ((h.type === "ESCROW_CREATED" || h.type === "FUNDS_ADDED") && Date.parse(h.at) <= t) sum += h.amount;
  }
  return sum;
}

/**
 * Net balance = USD committed to remove the object − collision risk accrued while it stays up.
 * Cleaned objects stop accruing risk at settlement; expired escrows are refunded, so only the risk remains.
 */
export function netBalanceAt(o: DebrisObject, now: number): number {
  const status = statusAt(o, now);
  const start = Date.parse(o.createdAt);
  const end = status === "CLEANED" && o.settledAt ? Date.parse(o.settledAt) : now;
  const credited = status === "CLEANED" ? o.collected : creditedAt(o, now, status);
  return Math.round(credited - (o.riskPerDay * Math.max(0, end - start)) / DAY);
}

export function balanceSeries(o: DebrisObject, now: number, points = 48): { t: number; v: number }[] {
  const start = Date.parse(o.createdAt);
  const status = statusAt(o, now);
  const end = Math.max(start + HOUR, now);
  const stopRisk = status === "CLEANED" && o.settledAt ? Date.parse(o.settledAt) : Infinity;
  const out: { t: number; v: number }[] = [];
  for (let i = 0; i <= points; i++) {
    const t = start + ((end - start) * i) / points;
    const riskEnd = Math.min(t, stopRisk);
    const credited = creditedAt(o, t, status);
    out.push({ t, v: Math.round(credited - (o.riskPerDay * (riskEnd - start)) / DAY) });
  }
  return out;
}

export function computeStats(objects: DebrisObject[], now: number): Stats {
  const s: Stats = { totalLocked: 0, totalPaid: 0, active: 0, expiring: 0, expired: 0, cleaned: 0, funders: [] };
  const byFunder = new Map<string, Stats["funders"][number]>();
  for (const o of objects) {
    const st = statusAt(o, now);
    if (st === "ACTIVE") s.active++;
    else if (st === "EXPIRING") s.expiring++;
    else if (st === "EXPIRED") s.expired++;
    else s.cleaned++;
    if (st === "ACTIVE" || st === "EXPIRING") s.totalLocked += o.locked;
    if (st === "CLEANED") s.totalPaid += o.collected;
    for (const f of o.funders) {
      const cur = byFunder.get(f.name) ?? { name: f.name, kind: f.kind, amount: 0 };
      cur.amount += f.amount;
      byFunder.set(f.name, cur);
    }
  }
  s.funders = [...byFunder.values()].sort((a, b) => b.amount - a.amount);
  return s;
}

export const STATUS_LABEL: Record<EscrowStatus, string> = {
  ACTIVE: "Activo",
  EXPIRING: "Por vencer",
  EXPIRED: "Vencido",
  CLEANED: "Limpiado",
};

/** Neon state colors (linear-ish hex used by both CSS and three). */
export const STATUS_COLOR: Record<EscrowStatus, string> = {
  ACTIVE: "#39ff88",
  EXPIRING: "#ffb627",
  EXPIRED: "#ff3355",
  CLEANED: "#38e8ff",
};
