export type EscrowStatus = "ACTIVE" | "EXPIRING" | "EXPIRED" | "CLEANED";
export type ObjectKind = "rocket-body" | "satellite" | "fragment";
export type FunderKind = "insurer" | "agency" | "company";
export type HistoryType = "ESCROW_CREATED" | "FUNDS_ADDED" | "DEBRIS_DEORBITED" | "ESCROW_EXPIRED";

export interface Funder {
  name: string;
  kind: FunderKind;
  country: string;
  address: string | null;
  /** USD (1 USD = 1 USDC on-chain) */
  amount: number;
}

export interface HistoryItem {
  type: HistoryType;
  at: string;
  amount: number;
  by: string;
  txHash: string;
}

export interface DebrisObject {
  objectId: number;
  name: string;
  kind: ObjectKind;
  owner: string;
  country: string;
  massKg: number;
  tle: [string, string];
  createdAt: string;
  deadline: string;
  /** Settled status. EXPIRING is derived from the clock, never stored on-chain. */
  status: EscrowStatus;
  locked: number;
  collected: number;
  netBalance: number;
  /** Estimated collision-risk cost per day while the object stays in orbit (USD). */
  riskPerDay: number;
  cleaner: string | null;
  settledAt: string | null;
  funders: Funder[];
  history: HistoryItem[];
}

export type DataSource = "fuji" | "local" | "demo";

export interface EscrowSnapshot {
  source: DataSource;
  contract: string | null;
  explorer: string;
  fetchedAt: string;
  reason?: string;
  objects: DebrisObject[];
}

export interface Stats {
  totalLocked: number;
  totalPaid: number;
  active: number;
  expiring: number;
  expired: number;
  cleaned: number;
  funders: { name: string; kind: FunderKind; amount: number }[];
}

export interface OracleResult {
  ok: boolean;
  objectId: number;
  simulated: boolean;
  txHash: string | null;
  explorerUrl: string | null;
  payout: number;
  cleaner: string;
  evidence: {
    perigeeBeforeKm: number;
    perigeeAfterKm: number;
    reentryThresholdKm: number;
    evidenceHash: string;
  };
  error?: string;
}
