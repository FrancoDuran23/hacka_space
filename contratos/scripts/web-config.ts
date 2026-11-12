import { readFileSync, writeFileSync } from "node:fs";

// Escribe web/lib/contract.json a partir de deployments/<red>.json, para que el
// frontend lea el escrow desplegado. Solo datos publicos: direcciones y RPC, nunca claves.
//
// Uso:  NETWORK=fuji npm run web:config
//       DEMO=1 npm run web:config      (deja el frontend en modo demo)

const NETWORKS: Record<string, { rpcUrl: string; explorer: string | null }> = {
  fuji: { rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc", explorer: "https://testnet.snowtrace.io" },
  local: { rpcUrl: "http://127.0.0.1:8545", explorer: null },
};

const target = new URL("../../web/lib/contract.json", import.meta.url);
const networkName = process.env.NETWORK ?? "fuji";

let config: Record<string, unknown>;
if (process.env.DEMO === "1") {
  config = { network: networkName, address: null };
} else {
  const net = NETWORKS[networkName];
  if (!net) throw new Error(`Red "${networkName}" sin RPC publico conocido`);
  const d = JSON.parse(readFileSync(`deployments/${networkName}.json`, "utf8"));
  config = {
    network: d.network,
    chainId: d.chainId,
    rpcUrl: net.rpcUrl,
    explorer: net.explorer,
    address: d.escrow,
    usdc: d.usdc,
    mode: d.mode,
    relayer: d.relayer,
    fund: d.fund,
    deployBlock: d.deployBlock ?? null,
    deployedAt: d.deployedAt,
  };
}

writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Escrito ${target.pathname}`);
