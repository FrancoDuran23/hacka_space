import { readFileSync } from "node:fs";
import { network } from "hardhat";

// Relayer de OrbitClear: lee SATCAT de CelesTrak y refleja el estado del satelite
// en el contrato. Registra el escrow si no existe; acredita el reingreso si el
// objeto ya decayo. Nunca inventa datos: todo sale del registro crudo, y su
// keccak256 queda on-chain para que cualquiera lo audite.
//
// Uso:  NORAD=27386 MISSION_END=2012-05-09 npx hardhat run scripts/relayer.ts --network fuji
//       MISSION_END es el fin de mision declarado por el operador; sin el, se toma el lanzamiento.

const SATCAT_URL = "https://celestrak.org/satcat/records.php";
const TX_EXPLORER = "https://explorer-test.avax.network/c-chain/tx";

const deployment = JSON.parse(readFileSync(`deployments/${process.env.NETWORK ?? "fuji"}.json`, "utf8"));
const norad = Number(process.env.NORAD ?? "27386");
const operatorAddress: string = process.env.OPERATOR_ADDRESS ?? deployment.relayer;
const txLink = (hash: string) =>
  deployment.network === "fuji" ? `${TX_EXPLORER}/${hash}` : hash;

const { ethers } = await network.create(deployment.network);
const escrow = await ethers.getContractAt("OrbitClearEscrow", deployment.escrow);

if (deployment.network === "fuji") {
  const { chainId } = await ethers.provider.getNetwork();
  if (chainId !== 43113n) {
    throw new Error(`Red equivocada: chainId ${chainId}, se esperaba 43113 (Fuji)`);
  }
}

// 1. Traer el registro crudo de SATCAT.
const url = `${SATCAT_URL}?CATNR=${norad}&FORMAT=JSON`;
const response = await fetch(url, { headers: { "User-Agent": "orbitclear-relayer/1.0" } });
if (!response.ok) {
  // Politica de CelesTrak: ante cualquier no-200 hay que cortar, no reintentar.
  throw new Error(`CelesTrak respondio ${response.status}. No reintentar en loop.`);
}

const records = await response.json();
const record = Array.isArray(records) ? records[0] : records;
if (!record) throw new Error(`SATCAT no tiene registro para NORAD ${norad}`);

console.log(`NORAD ${norad}: ${record.OBJECT_NAME}`);
console.log(`  lanzado:  ${record.LAUNCH_DATE}`);
console.log(`  decayo:   ${record.DECAY_DATE || "-"}`);
console.log(`  estado:   ${record.OPS_STATUS_CODE}`);
console.log(`  apogeo:   ${record.APOGEE} km`);

const dataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(record)));

// SATCAT tiene objetos anteriores a 1970 (4133 se lanzo en 1969-09-30). Un timestamp
// negativo no entra en uint64, asi que se ancla al epoch: para el plazo da igual
// porque cualquier banda de esa epoca vencio hace decadas, y el registro crudo con su
// hash on-chain conservan la fecha real.
const launchedMs = Date.parse(record.LAUNCH_DATE);
const preEpoch = launchedMs < 0;
const launchedAt = BigInt(Math.max(Math.floor(launchedMs / 1000), 1));
// Fin de mision declarado: no viene de CelesTrak, lo declara el operador (ADR 0004).
const missionEndMs = process.env.MISSION_END ? Date.parse(process.env.MISSION_END) : NaN;
if (process.env.MISSION_END && Number.isNaN(missionEndMs)) throw new Error(`MISSION_END invalido: ${process.env.MISSION_END}`);
const missionEndsAt = Number.isNaN(missionEndMs) ? launchedAt : BigInt(Math.max(Math.floor(missionEndMs / 1000), Number(launchedAt)));
if (preEpoch) {
  console.log("  aviso:    lanzado antes de 1970, se ancla al epoch (el hash conserva la fecha real)");
}

// 2. Banda orbital por apogeo: <600 baja, 600-900 media, >900 alta.
const apogee = Number(record.APOGEE);
const band = apogee < 600 ? 0 : apogee <= 900 ? 1 : 2;
console.log(`  banda:    ${band} (${deployment.bandYears[band]} anos desde el fin de mision)`);
console.log(`  fin de mision declarado: ${new Date(Number(missionEndsAt) * 1000).toISOString().slice(0, 10)}`);

const current = await escrow.escrowOf(norad);
const deposit = BigInt(deployment.bandAmounts[band]);

async function ensureFunds() {
  if (deployment.mode !== "mock") return;
  const token = await ethers.getContractAt("MockUSDC", deployment.usdc);
  if ((await token.balanceOf(operatorAddress)) < deposit) {
    const mintTx = await token.mint(operatorAddress, deposit * 2n);
    await mintTx.wait();
    console.log(`  mUSDC minteado a ${operatorAddress}`);
  }
  if ((await token.allowance(operatorAddress, deployment.escrow)) < deposit) {
    const approveTx = await token.approve(deployment.escrow, ethers.MaxUint256);
    await approveTx.wait();
    console.log(`  allowance aprobada para ${deployment.escrow}`);
  }
}

async function registerEscrow() {
  await ensureFunds();
  console.log(`\nRegistrando escrow con deposito ${ethers.formatUnits(deposit, 6)} y hash ${dataHash}`);

  const tx = await escrow.register(norad, operatorAddress, launchedAt, missionEndsAt, band, dataHash);
  console.log(`  tx enviada: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`  confirmada en bloque ${receipt?.blockNumber}`);
  console.log(`  ${txLink(tx.hash)}`);

  const created = await escrow.escrowOf(norad);
  console.log(`  plazo de retiro: ${new Date(Number(created.deadline) * 1000).toISOString()}`);
  console.log(`  vencido al registrar: ${await escrow.isExpired(norad)}`);
}

// 3. Registrar el escrow si todavia no existe.
if (current.state === 0n) {
  await registerEscrow();
} else if (current.state === 1n) {
  console.log(`\nEl escrow de ${norad} ya existe.`);
  console.log(`  plazo: ${new Date(Number(current.deadline) * 1000).toISOString()}`);
  const expired = await escrow.isExpired(norad);
  console.log(`  vencido: ${expired}${expired ? " -> scripts/close.ts lo decomisa al fondo" : ""}`);
} else {
  console.log(`\nEl escrow de ${norad} ya esta liquidado (state=${current.state}). Nada que hacer.`);
  process.exit(0);
}

// 4. Si el objeto ya decayo, acreditar el reingreso. Vale tambien si lo acabamos de registrar.
if (record.DECAY_DATE) {
  const decayDate = BigInt(Math.floor(Date.parse(record.DECAY_DATE) / 1000));
  console.log(`\nAcreditando reingreso del ${record.DECAY_DATE}`);

  const tx = await escrow.attestReentry(norad, decayDate, dataHash);
  console.log(`  tx enviada: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`  confirmada en bloque ${receipt?.blockNumber}`);
  console.log(`  ${txLink(tx.hash)}`);

  const settled = await escrow.escrowOf(norad);
  console.log(`  estado final: ${settled.state} (2 = Refunded, 3 = Forfeited)`);
}
