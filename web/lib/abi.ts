/** Human-readable ABI of contracts/contracts/DebrisEscrow.sol (public, not a secret). */
export const DEBRIS_ESCROW_ABI = [
  "function usdc() view returns (address)",
  "function oracle() view returns (address)",
  "function createEscrow(uint256 objectId, address owner, uint256 amount, uint64 deadline)",
  "function addFunds(uint256 objectId, uint256 amount)",
  "function confirmDeorbit(uint256 objectId, address cleaner)",
  "function expire(uint256 objectId)",
  "function getEscrow(uint256 objectId) view returns (tuple(address owner, uint64 createdAt, uint64 deadline, uint8 status, uint256 locked, uint256 totalFunded, address cleaner, uint256 paidOut))",
  "function getFunders(uint256 objectId) view returns (address[] funders, uint256[] amounts)",
  "function getObjectIds() view returns (uint256[])",
  "function escrowCount() view returns (uint256)",
  "event EscrowCreated(uint256 indexed objectId, address indexed owner, address indexed funder, uint256 amount, uint64 deadline)",
  "event FundsAdded(uint256 indexed objectId, address indexed funder, uint256 amount, uint256 totalLocked)",
  "event DebrisDeorbited(uint256 indexed objectId, address indexed cleaner, uint256 payout)",
  "event EscrowExpired(uint256 indexed objectId, uint256 refunded)",
] as const;

/** 1 USD = 1 USDC = 10^6 units. */
export const USDC_DECIMALS = 6;
