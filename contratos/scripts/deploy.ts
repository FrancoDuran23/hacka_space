import { mkdirSync, writeFileSync } from "node:fs";
import { network } from "hardhat";

// USDC de Circle en Fuji. Mainnet usa OTRA direccion (0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E).
const USDC_FUJI = "0x5425890298aed601595a70AB815c96711a31Bc65";
const EXPLORER = "https://explorer-test.avax.network/c-chain/address";

const BAND_YEARS = [5, 10, 25];

// NETWORK=hardhat hace un ensayo en seco contra la red simulada, sin clave ni AVAX.
const NETWORK_NAME = process.env.NETWORK ?? "fuji";

const { ethers } = await network.create(NETWORK_NAME);

const mode = process.env.MODE ?? "mock";
const [deployer] = await ethers.getSigners();
const relayerAddress = process.env.RELAYER_ADDRESS ?? deployer.address;
const fundAddress = process.env.FUND_ADDRESS ?? deployer.address;

let usdcAddress: string;
let amounts: bigint[];

if (mode === "mock") {
  // Montos del paper ESA/UCL: 100k a 800k USD.
  const token = await ethers.deployContract("MockUSDC");
  await token.waitForDeployment();
  usdcAddress = await token.getAddress();
  amounts = [100_000n, 300_000n, 800_000n].map((n) => ethers.parseUnits(String(n), 6));
  console.log(`MockUSDC: ${usdcAddress}`);
} else {
  // El faucet de Circle entrega 20 USDC cada 2 horas: montos escalados.
  usdcAddress = USDC_FUJI;
  amounts = [ethers.parseUnits("0.1", 6), ethers.parseUnits("0.3", 6), ethers.parseUnits("0.8", 6)];
}

const escrow = await ethers.deployContract("OrbitClearEscrow", [
  usdcAddress,
  relayerAddress,
  fundAddress,
  BAND_YEARS,
  amounts,
]);
await escrow.waitForDeployment();

const escrowAddress = await escrow.getAddress();
const { chainId } = await ethers.provider.getNetwork();

const deployment = {
  network: NETWORK_NAME,
  chainId: Number(chainId),
  mode,
  usdc: usdcAddress,
  escrow: escrowAddress,
  relayer: relayerAddress,
  fund: fundAddress,
  bandYears: BAND_YEARS,
  bandAmounts: amounts.map((a) => a.toString()),
  deployedAt: new Date().toISOString(),
};

mkdirSync("deployments", { recursive: true });
writeFileSync(`deployments/${NETWORK_NAME}.json`, `${JSON.stringify(deployment, null, 2)}\n`);

console.log(`Escrow:   ${escrowAddress}`);
console.log(`USDC:     ${usdcAddress}`);
console.log(`Relayer:  ${relayerAddress}`);
console.log(`Fondo:    ${fundAddress}`);
console.log(`Red:      ${NETWORK_NAME} (chainId ${chainId})`);
if (NETWORK_NAME === "fuji") {
  console.log(`Explorer: ${EXPLORER}/${escrowAddress}`);
}
