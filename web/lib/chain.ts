export const FUJI_CHAIN_ID = 43113;

export const FUJI = {
  chainId: "0xA869", // 43113
  chainName: "Avalanche Fuji C-Chain",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
  blockExplorerUrls: ["https://explorer-test.avax.network/c-chain"],
} as const;

const EXPLORER = FUJI.blockExplorerUrls[0];

export const explorerAddressUrl = (addr: string) =>
  `${EXPLORER}/address/${addr}`;

export const explorerTxUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
