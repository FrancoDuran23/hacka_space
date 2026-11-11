/** Human-readable ABI of contratos/contracts/OrbitClearEscrow.sol (public, not a secret). */
export const ORBITCLEAR_ESCROW_ABI = [
  "function usdc() view returns (address)",
  "function relayer() view returns (address)",
  "function fund() view returns (address)",
  "function register(uint32 noradId, address operator, uint64 launchedAt, uint8 band, bytes32 dataHash)",
  "function attestReentry(uint32 noradId, uint64 decayDate, bytes32 dataHash)",
  "function closeExpired(uint32 noradId)",
  "function escrowOf(uint32 noradId) view returns (tuple(address operator, uint64 launchedAt, uint64 deadline, uint128 deposit, uint8 band, uint8 state))",
  "function isExpired(uint32 noradId) view returns (bool)",
  "event Registered(uint32 indexed noradId, address indexed operator, uint8 band, uint64 launchedAt, uint64 deadline, uint128 deposit, bytes32 dataHash)",
  "event ReentryAttested(uint32 indexed noradId, uint64 decayDate, bytes32 dataHash)",
  "event Refunded(uint32 indexed noradId, address indexed operator, uint128 amount)",
  "event Forfeited(uint32 indexed noradId, address indexed fund, uint128 amount, uint8 reason)",
] as const;

/** 1 USD = 1 USDC = 10^6 units. */
export const USDC_DECIMALS = 6;
