import { readFileSync } from "node:fs";
import { network } from "hardhat";

// Cierra un escrow cuyo plazo vencio sin reingreso y manda el deposito al fondo.
// Lo puede llamar cualquiera: el decomiso no depende del relayer.
//
// Uso:  NORAD=27386 npx hardhat run scripts/close.ts --network fuji

const deployment = JSON.parse(
  readFileSync(`deployments/${process.env.NETWORK ?? "fuji"}.json`, "utf8"),
);
const norad = Number(process.env.NORAD ?? "27386");
const txLink = (hash: string) =>
  deployment.network === "fuji"
    ? `https://explorer-test.avax.network/c-chain/tx/${hash}`
    : hash;

const { ethers } = await network.create(deployment.network);
const escrow = await ethers.getContractAt("OrbitClearEscrow", deployment.escrow);

const current = await escrow.escrowOf(norad);
if (current.state === 0n) throw new Error(`NORAD ${norad} no esta registrado`);
if (current.state !== 1n) throw new Error(`NORAD ${norad} ya esta liquidado (state=${current.state})`);

const expired = await escrow.isExpired(norad);
console.log(`NORAD ${norad} | plazo: ${new Date(Number(current.deadline) * 1000).toISOString()}`);
console.log(`  deposito: ${ethers.formatUnits(current.deposit, 6)} | vencido: ${expired}`);

if (!expired) throw new Error(`NORAD ${norad} todavia no vencio: no hay nada que decomisar`);

const fund = await escrow.fund();
console.log(`\nDecomisando al fondo ${fund}`);

const tx = await escrow.closeExpired(norad);
console.log(`  tx enviada: ${tx.hash}`);
const receipt = await tx.wait();
console.log(`  confirmada en bloque ${receipt?.blockNumber}`);
console.log(`  ${txLink(tx.hash)}`);

const after = await escrow.escrowOf(norad);
console.log(`  estado final: ${after.state} (3 = Forfeited)`);
