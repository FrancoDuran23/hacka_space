import type { DataSource, DebrisObject, Stats } from "@/lib/types";

export interface Regulator {
  id: string;
  agency: string;
  agencyCode: string;
  createdAt: string;
}

export interface OperatorSummary {
  operator: string;
  stats: Stats;
  objects: DebrisObject[];
}

export interface RegulatorDashboard {
  regulator: Regulator;
  /** Solo operadores adjudicados, orden alfabético. */
  operators: OperatorSummary[];
  snapshot: { source: DataSource; fetchedAt: string; explorer: string };
  wallets: { address: string; label: string | null; verifiedAt: Date }[];
}

export type RegulatorResult = { ok: true } | { ok: false; error: string };
