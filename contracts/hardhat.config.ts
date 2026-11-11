import { defineConfig, configVariable } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

// Carga contracts/.env (gitignored) sin dependencias extra. Si no existe, seguimos:
// FUJI_PRIVATE_KEY también puede venir del entorno o del keystore de Hardhat.
try {
  process.loadEnvFile(".env");
} catch {}

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: "0.8.28",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    // `npx hardhat node` en otra terminal. Sin `accounts`: usa las cuentas del nodo.
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    fuji: {
      type: "http",
      chainType: "l1",
      url: process.env.FUJI_RPC ?? "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [configVariable("FUJI_PRIVATE_KEY")],
    },
  },
});
