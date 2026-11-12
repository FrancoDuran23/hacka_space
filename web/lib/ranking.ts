import { statusAt } from "./status";
import type { DebrisObject } from "./types";

export interface OperatorRank {
  operator: string;
  /** USD sent to the removal fund: deposits of satellites that missed their deadline. */
  forfeited: number;
  forfeitedCount: number;
  refunded: number;
  refundedCount: number;
  locked: number;
  openCount: number;
  /** Refunded over settled escrows (null while none is settled). */
  compliance: number | null;
  onChain: number;
  total: number;
}

/** Operators ranked by how much deposit they lost to the removal fund (the debris they left in orbit). */
export function rankOperators(objects: DebrisObject[], now: number): OperatorRank[] {
  const by = new Map<string, OperatorRank>();
  for (const o of objects) {
    const r = by.get(o.owner) ?? {
      operator: o.owner,
      forfeited: 0,
      forfeitedCount: 0,
      refunded: 0,
      refundedCount: 0,
      locked: 0,
      openCount: 0,
      compliance: null,
      onChain: 0,
      total: 0,
    };
    const st = statusAt(o, now);
    if (st === "FORFEITED") (r.forfeited += o.deposit), r.forfeitedCount++;
    else if (st === "REFUNDED") (r.refunded += o.deposit), r.refundedCount++;
    else (r.locked += o.deposit), r.openCount++;
    if (o.onChain) r.onChain++;
    r.total++;
    by.set(o.owner, r);
  }
  for (const r of by.values()) {
    const settled = r.forfeitedCount + r.refundedCount;
    r.compliance = settled ? r.refundedCount / settled : null;
  }
  return [...by.values()].sort((a, b) => b.forfeited - a.forfeited || b.forfeitedCount - a.forfeitedCount || a.operator.localeCompare(b.operator));
}
