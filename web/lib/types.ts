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
  /** keccak256 del registro crudo de CelesTrak que adjuntó el relayer (solo on-chain). */
  dataHash?: string;
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

/** Public addresses the browser needs to talk to the deployed escrow (never keys). */
export interface PublicChain {
  chainId: number;
  rpcUrl: string;
  explorer: string | null;
  escrow: string;
  usdc: string;
  /** The deposit token is MockUSDC (open mint), so the dashboard can offer a testnet faucet. */
  mockUsdc: boolean;
}

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
  totalRefunded: number;
  totalForfeited: number;
  active: number;
  expiring: number;
  forfeited: number;
  refunded: number;
  operators: { name: string; amount: number }[];
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
