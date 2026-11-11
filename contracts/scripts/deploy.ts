// Despliega MockUSDC + DebrisEscrow(usdc, oracle = deployer) y escribe web/lib/contract.json.
//   npx hardhat run scripts/deploy.ts --network fuji
//   npx hardhat run scripts/deploy.ts --network localhost   (con `npx hardhat node` corriendo)
import { network } from "hardhat";
import { CONTRACT_JSON, NETWORKS, asNetworkKey, readAbis, writeContractConfig } from "./lib/contract-config.ts";

const { ethers, networkName } = await network.create();
const key = asNetworkKey(networkName);
const net = NETWORKS[key];

const chainId = Number((await ethers.provider.getNetwork()).chainId);
if (chainId !== net.chainId) throw new Error(`chainId ${chainId} != ${net.chainId} esperado para ${key}`);

const [deployer] = await ethers.getSigners();
const balance = await ethers.provider.getBalance(deployer.address);
console.log(`Red: ${key} (chainId ${chainId})`);
console.log(`Deployer/oráculo: ${deployer.address}  saldo: ${ethers.formatEther(balance)}`);
if (balance === 0n) throw new Error("El deployer no tiene saldo para gas. En Fuji: pedí AVAX en el faucet.");

const usdc = await ethers.deployContract("MockUSDC");
await usdc.waitForDeployment();
const usdcAddress = await usdc.getAddress();
console.log(`MockUSDC:     ${usdcAddress}`);

const escrow = await ethers.deployContract("DebrisEscrow", [usdcAddress, deployer.address]);
await escrow.waitForDeployment();
const address = await escrow.getAddress();
const deployTx = escrow.deploymentTransaction();
const receipt = deployTx ? await deployTx.wait() : null;
if (!deployTx || !receipt) throw new Error("No se encontró el receipt del deploy");
console.log(`DebrisEscrow: ${address}  (bloque ${receipt.blockNumber})`);

await writeContractConfig({
  network: key,
  chainId,
  rpcUrl: net.rpcUrl,
  explorer: net.explorer,
  address,
  usdc: usdcAddress,
  oracle: deployer.address,
  deployBlock: receipt.blockNumber,
  deployTx: receipt.hash,
  deployedAt: new Date().toISOString(),
  ...(await readAbis()),
});
console.log(`Escrito ${CONTRACT_JSON}`);
if (net.explorer) {
  console.log(`Contrato: ${net.explorer}/address/${address}`);
  console.log(`Tx:       ${net.explorer}/tx/${receipt.hash}`);
}
