export type EscrowStatus = "ACTIVE" | "EXPIRING" | "FORFEITED" | "REFUNDED";
export type ObjectKind = "rocket-body" | "satellite" | "fragment";
export type HistoryType = "REGISTERED" | "REENTRY_ATTESTED" | "REFUNDED" | "FORFEITED";
/** Banda orbital del contrato: 0 baja, 1 media, 2 alta. */
export type Band = 0 | 1 | 2;

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
  /** Operador responsable, dueño del depósito. */
  owner: string;
  country: string;
  massKg: number;
  tle: [string, string];
  /** Epoch of the TLE currently driving the position (ISO). Absent when using the baked file TLE. */
  tleEpoch?: string;
  band: Band;
  /** Registro del escrow. */
  createdAt: string;
  /** Plazo de retiro. */
  deadline: string;
  /** Settled status. EXPIRING (and FORFEITED once the deadline passes) are derived from the clock. */
  status: EscrowStatus;
  /** Depósito de desorbitado, USD (1 USD = 1 USDC on-chain). */
  deposit: number;
  netBalance: number;
  /** Estimated collision-risk cost per day while the object stays in orbit (USD). */
  riskPerDay: number;
  settledAt: string | null;
  /** The escrow exists in the deployed contract (its transactions link to the explorer). */
  onChain: boolean;
  history: HistoryItem[];
}

export type DataSource = "fuji" | "local" | "demo";

/** Orbital data provenance: how many objects got a fresh TLE from CelesTrak this refresh. */
export interface TleInfo {
  live: number;
  total: number;
  oldestEpoch: string | null;
  fetchedAt: string;
}

export interface EscrowSnapshot {
  source: DataSource;
  contract: string | null;
  explorer: string;
  fetchedAt: string;
  reason?: string;
  tle: TleInfo;
  objects: DebrisObject[];
}

export interface Stats {
  totalLocked: number;
  totalRefunded: number;
  totalForfeited: number;
  active: number;
  expiring: number;
  forfeited: number;
  refunded: number;
  operators: { name: string; amount: number }[];
}

/** Object from a live CelesTrak group — tracked on the globe but not escrowed. */
export interface CatalogObject {
  objectId: number;
  name: string;
  tle: [string, string];
  tleEpoch?: string;
}

export interface CatalogSnapshot {
  group: string;
  fetchedAt: string;
  objects: CatalogObject[];
}

export interface ReentryResult {
  ok: boolean;
  objectId: number;
  simulated: boolean;
  txHash: string | null;
  explorerUrl: string | null;
  refund: number;
  operator: string;
  evidence: {
    perigeeBeforeKm: number;
    perigeeAfterKm: number;
    reentryThresholdKm: number;
    evidenceHash: string;
  };
  error?: string;
}
