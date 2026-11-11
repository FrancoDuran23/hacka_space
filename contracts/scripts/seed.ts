// Siembra on-chain los escrows de web/data/escrows.json sobre el contrato de web/lib/contract.json.
//   npx hardhat run scripts/seed.ts --network fuji        (escribe direcciones y txHash reales en escrows.json)
//   npx hardhat run scripts/seed.ts --network localhost   (sin write-back salvo WRITE_BACK=1)
//
// Idempotente: lo que ya está on-chain (escrow creado, aporte hecho, liquidación) se saltea.
// Variables opcionales: FUNDER_GAS_AVAX (default 0.01 en fuji, 1 en localhost),
// EXPIRE_AFTER_SECONDS (default 90), WRITE_BACK=1.
import { readFile, writeFile } from "node:fs/promises";
import { network } from "hardhat";
import { HDNodeWallet, Interface, Wallet, type Log } from "ethers";
import { ADDRESS_DERIVATION, cleanerAddress, funderWallet, ownerAddress } from "./lib/addresses.ts";
import { ESCROWS_JSON, asNetworkKey, readContractConfig } from "./lib/contract-config.ts";

// ---------- tipos del JSON de la web ----------
type DataStatus = "ACTIVE" | "EXPIRING" | "EXPIRED" | "CLEANED";
type HistoryType = "ESCROW_CREATED" | "FUNDS_ADDED" | "DEBRIS_DEORBITED" | "ESCROW_EXPIRED";
interface HistoryItem { type: HistoryType; at: string; amount: number; by: string; txHash: string }
interface FunderEntry { name: string; amount: number; address: string | null; [k: string]: unknown }
interface DataObject {
  objectId: number;
  owner: string;
  status: DataStatus;
  deadline: string;
  cleaner: string | null;
  funders: FunderEntry[];
  history: HistoryItem[];
  [k: string]: unknown;
}
interface EscrowsData {
  snapshotAt: string;
  cleaners: string[];
  funderDirectory: { name: string; address: string | null; [k: string]: unknown }[];
  objects: DataObject[];
  [k: string]: unknown;
}

const UNITS = 1_000_000n; // 1 USD = 1 mUSDC = 1e6 unidades
const DAY = 24 * 60 * 60;
const ChainStatus = { None: 0n, Active: 1n, Deorbited: 2n, Expired: 3n } as const;
const HARDHAT_MNEMONIC = "test test test test test test test test test test test junk";

// ---------- conexión ----------
const { ethers, networkName } = await network.create();
const netKey = asNetworkKey(networkName);
const cfg = await readContractConfig();
if (!cfg.address || !cfg.usdc) throw new Error("web/lib/contract.json no tiene dirección: corré primero el deploy");
if (cfg.network !== netKey) throw new Error(`contract.json es de "${cfg.network}" y estás en "${netKey}"`);
const chainId = Number((await ethers.provider.getNetwork()).chainId);
if (chainId !== cfg.chainId) throw new Error(`chainId ${chainId} != ${cfg.chainId} de contract.json`);
if ((await ethers.provider.getCode(cfg.address)) === "0x") {
  throw new Error(`No hay contrato en ${cfg.address} (¿se reinició el nodo local? corré el deploy de nuevo)`);
}

const [deployer] = await ethers.getSigners();
const deployerKey =
  netKey === "fuji"
    ? process.env.FUJI_PRIVATE_KEY
    : HDNodeWallet.fromPhrase(HARDHAT_MNEMONIC, undefined, "m/44'/60'/0'/0/0").privateKey;
if (!deployerKey) throw new Error("Falta FUJI_PRIVATE_KEY en contracts/.env");
if (new Wallet(deployerKey).address !== deployer.address) throw new Error("La clave del deployer no coincide con el signer");
if (cfg.oracle !== deployer.address) throw new Error(`El oráculo del contrato (${cfg.oracle}) no es el deployer`);

const escrow = await ethers.getContractAt("DebrisEscrow", cfg.address, deployer);
const usdc = await ethers.getContractAt("MockUSDC", cfg.usdc, deployer);

const FUNDER_GAS = ethers.parseEther(process.env.FUNDER_GAS_AVAX ?? (netKey === "fuji" ? "0.01" : "1"));
const EXPIRE_AFTER = Number(process.env.EXPIRE_AFTER_SECONDS ?? 90);
const WRITE_BACK = netKey === "fuji" || process.env.WRITE_BACK === "1";
const sym = netKey === "fuji" ? "AVAX" : "ETH";

// ---------- utilidades ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isTransient(e: unknown): boolean {
  const err = e as { code?: string; message?: string };
  const msg = `${err?.code ?? ""} ${err?.message ?? String(e)}`;
  if (err?.code === "CALL_EXCEPTION" || /revert/i.test(msg)) return false;
  return /timeout|timed out|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|socket hang up|fetch failed|network|429|too many requests|rate limit|50[234]|nonce too low|nonce has already been used|replacement transaction underpriced|already known|header not found|missing response|SERVER_ERROR|UNKNOWN_ERROR/i.test(
    msg,
  );
}

async function retry<T>(label: string, fn: () => Promise<T>, attempts = 6): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= attempts || !isTransient(e)) throw e;
      console.warn(`  ! ${label}: error transitorio (intento ${i}/${attempts}), reintento…`);
      await sleep(1500 * i);
    }
  }
}

interface SentTx { hash: string; wait(): Promise<{ status: number | null; hash: string } | null> }

/** Manda una tx solo si `isDone()` es falso; espera el receipt. Reintenta errores de RPC transitorios. */
async function step(label: string, isDone: () => Promise<boolean>, send: () => Promise<SentTx>): Promise<string | null> {
  return retry(label, async () => {
    if (await isDone()) {
      console.log(`  = ${label} (ya estaba)`);
      return null;
    }
    const tx = await send();
    const r = await tx.wait();
    if (!r || r.status !== 1) throw new Error(`${label}: tx falló (${tx.hash})`);
    console.log(`  + ${label}  ${cfg.explorer ? `${cfg.explorer}/tx/${r.hash}` : r.hash}`);
    return r.hash;
  });
}

async function chainNow(): Promise<number> {
  const block = await retry("getBlock", () => ethers.provider.getBlock("latest"));
  return Math.max(Math.floor(Date.now() / 1000), block?.timestamp ?? 0);
}

// ---------- plan ----------
const data = JSON.parse(await readFile(ESCROWS_JSON, "utf8")) as EscrowsData;
const snapshotAt = Date.parse(data.snapshotAt) / 1000;

interface Contribution { funder: string; amount: bigint }
interface Plan { obj: DataObject; contributions: Contribution[] }

const plans: Plan[] = data.objects.map((obj) => {
  // Mismo orden que el historial (created, funds added…), para que los txHash calcen.
  const fromHistory = obj.history
    .filter((h) => h.type === "ESCROW_CREATED" || h.type === "FUNDS_ADDED")
    .map((h) => ({ funder: h.by, amount: BigInt(h.amount) * UNITS }));
  const contributions = fromHistory.length
    ? fromHistory
    : obj.funders.map((f) => ({ funder: f.name, amount: BigInt(f.amount) * UNITS }));
  if (!contributions.length) throw new Error(`Objeto ${obj.objectId} sin financiadores`);
  if (obj.status === "CLEANED" && !obj.cleaner) throw new Error(`Objeto ${obj.objectId} CLEANED sin cleaner`);
  return { obj, contributions };
});

const funderNames = [...new Set(plans.flatMap((p) => p.contributions.map((c) => c.funder)))];
const wallets = new Map(funderNames.map((n) => [n, funderWallet(deployerKey, n, ethers.provider)]));
const walletOf = (name: string) => wallets.get(name)!;

console.log(`Red: ${netKey}  contrato: ${cfg.address}`);
console.log(`Deployer/oráculo: ${deployer.address}  saldo: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ${sym}`);
console.log(`${plans.length} objetos, ${funderNames.length} financiadores`);

// Qué falta hacer on-chain (para mint y gas solo de lo pendiente).
async function onchain(objectId: number) {
  const [e, [funders]] = await retry("lectura", () =>
    Promise.all([escrow.getEscrow(objectId), escrow.getFunders(objectId)]),
  );
  return { status: e.status, deadline: e.deadline, funders: new Set(funders.map((a: string) => a.toLowerCase())) };
}

const need = new Map<string, bigint>();
const txCount = new Map<string, number>();
for (const p of plans) {
  const s = await onchain(p.obj.objectId);
  if (s.status !== ChainStatus.None && s.status !== ChainStatus.Active) continue;
  for (const c of p.contributions) {
    if (s.funders.has(walletOf(c.funder).address.toLowerCase())) continue;
    need.set(c.funder, (need.get(c.funder) ?? 0n) + c.amount);
    txCount.set(c.funder, (txCount.get(c.funder) ?? 0) + 1);
  }
}

// ---------- 1. gas, mint y approve para cada financiador ----------
console.log("\n1) Financiadores: gas, mUSDC y approve");
const pending = funderNames.filter((n) => (need.get(n) ?? 0n) > 0n);
{
  let topUp = 0n;
  for (const n of pending) {
    const bal = await retry("balance", () => ethers.provider.getBalance(walletOf(n).address));
    if (bal < FUNDER_GAS / 2n) topUp += FUNDER_GAS - bal;
  }
  const deployerBal = await ethers.provider.getBalance(deployer.address);
  if (topUp > deployerBal) {
    throw new Error(
      `El deployer necesita ~${ethers.formatEther(topUp)} ${sym} para gas de financiadores y tiene ${ethers.formatEther(deployerBal)}. ` +
        `Fondealo o bajá FUNDER_GAS_AVAX.`,
    );
  }
}
for (const name of pending) {
  const w = walletOf(name);
  const amount = need.get(name)!;
  console.log(`- ${name} ${w.address}  necesita ${amount / UNITS} mUSDC en ${txCount.get(name)} aportes`);
  await step(
    `gas → ${name}`,
    async () => (await ethers.provider.getBalance(w.address)) >= FUNDER_GAS / 2n,
    async () => deployer.sendTransaction({ to: w.address, value: FUNDER_GAS - (await ethers.provider.getBalance(w.address)) }),
  );
  await step(
    `mint ${amount / UNITS} mUSDC → ${name}`,
    async () => (await usdc.balanceOf(w.address)) >= amount,
    async () => usdc.mint(w.address, amount - (await usdc.balanceOf(w.address))),
  );
  await step(
    `approve ${name}`,
    async () => (await usdc.allowance(w.address, cfg.address!)) >= amount,
    async () => usdc.connect(w).approve(cfg.address!, ethers.MaxUint256),
  );
}

// ---------- 2. escrows ----------
console.log("\n2) Escrows");
const toExpire: { objectId: number; deadline: bigint }[] = [];
for (const { obj, contributions } of plans) {
  const id = obj.objectId;
  console.log(`- ${id} ${obj.status}`);
  const s0 = await onchain(id);

  if (s0.status === ChainStatus.Deorbited || s0.status === ChainStatus.Expired) {
    console.log(`  = ya liquidado on-chain`);
    continue;
  }

  let deadline = s0.deadline;
  if (s0.status === ChainStatus.None) {
    const now = await chainNow();
    let rel: number;
    if (obj.status === "CLEANED") rel = 30 * DAY;
    else if (obj.status === "EXPIRED") rel = EXPIRE_AFTER;
    else rel = Math.max(3600, Math.round(Date.parse(obj.deadline) / 1000 - snapshotAt));
    deadline = BigInt(now + rel);
    const first = contributions[0];
    await step(
      `createEscrow por ${first.funder} (${first.amount / UNITS} mUSDC)`,
      async () => (await escrow.getEscrow(id)).status !== ChainStatus.None,
      async () => escrow.connect(walletOf(first.funder)).createEscrow(id, ownerAddress(obj.owner), first.amount, deadline),
    );
  }

  for (const c of contributions) {
    const w = walletOf(c.funder);
    const s = await onchain(id);
    if (s.funders.has(w.address.toLowerCase())) continue;
    if (BigInt(await chainNow()) > s.deadline) {
      console.warn(`  ! plazo vencido, no se puede sumar a ${c.funder}`);
      break;
    }
    await step(
      `addFunds por ${c.funder} (${c.amount / UNITS} mUSDC)`,
      async () => (await onchain(id)).funders.has(w.address.toLowerCase()),
      async () => escrow.connect(w).addFunds(id, c.amount),
    );
  }

  if (obj.status === "CLEANED") {
    await step(
      `confirmDeorbit → ${obj.cleaner}`,
      async () => (await escrow.getEscrow(id)).status === ChainStatus.Deorbited,
      async () => escrow.confirmDeorbit(id, cleanerAddress(obj.cleaner!)),
    );
  } else if (obj.status === "EXPIRED") {
    toExpire.push({ objectId: id, deadline });
  }
}

// ---------- 3. vencer los EXPIRED ----------
if (toExpire.length) {
  console.log(`\n3) Vencer ${toExpire.length} escrows`);
  const maxDeadline = toExpire.reduce((m, e) => (e.deadline > m ? e.deadline : m), 0n);
  for (;;) {
    const block = await retry("getBlock", () => ethers.provider.getBlock("latest"));
    const ts = BigInt(block?.timestamp ?? 0);
    if (ts > maxDeadline) break;
    const wallWait = Number(maxDeadline - BigInt(Math.floor(Date.now() / 1000)));
    if (wallWait >= 0) {
      console.log(`  esperando ${wallWait + 2}s a que pase el plazo…`);
      await sleep((wallWait + 2) * 1000);
    } else if (netKey === "localhost") {
      await ethers.provider.send("evm_mine", []); // el nodo local no mina bloques solo
    } else {
      await sleep(3000);
    }
  }
  for (const { objectId } of toExpire) {
    await step(
      `expire ${objectId}`,
      async () => (await escrow.getEscrow(objectId)).status === ChainStatus.Expired,
      async () => escrow.expire(objectId),
    );
  }
}

// ---------- 4. resumen ----------
console.log("\n4) Estado on-chain");
const ids = (await escrow.getObjectIds()).map(Number);
const expected = { ACTIVE: ChainStatus.Active, EXPIRING: ChainStatus.Active, CLEANED: ChainStatus.Deorbited, EXPIRED: ChainStatus.Expired };
let mismatches = 0;
for (const { obj } of plans) {
  const e = await escrow.getEscrow(obj.objectId);
  const ok = e.status === expected[obj.status] && ids.includes(obj.objectId);
  if (!ok) mismatches++;
  console.log(`  ${ok ? "ok" : "!!"} ${obj.objectId} ${obj.status} → status ${e.status} locked ${e.locked / UNITS} paidOut ${e.paidOut / UNITS}`);
}
console.log(`  ${ids.length} escrows on-chain, ${mismatches} con estado inesperado`);
if (mismatches) process.exitCode = 1;

// ---------- 5. write-back ----------
if (!WRITE_BACK) {
  console.log("\nSin write-back (solo en fuji o con WRITE_BACK=1).");
} else {
  console.log("\n5) Write-back a web/data/escrows.json");
  const iface = new Interface(cfg.abi as never);
  const latest = await ethers.provider.getBlockNumber();
  const from = cfg.deployBlock ?? 0;
  const logs: Log[] = [];
  for (let start = from; start <= latest; start += 2000) {
    const end = Math.min(start + 1999, latest);
    logs.push(...(await retry("getLogs", () => ethers.provider.getLogs({ address: cfg.address!, fromBlock: start, toBlock: end }))));
  }
  // objectId → eventos en orden
  const events = new Map<number, { type: HistoryType; hash: string; funder?: string }[]>();
  const typeOf: Record<string, HistoryType> = {
    EscrowCreated: "ESCROW_CREATED",
    FundsAdded: "FUNDS_ADDED",
    DebrisDeorbited: "DEBRIS_DEORBITED",
    EscrowExpired: "ESCROW_EXPIRED",
  };
  for (const log of logs) {
    const parsed = iface.parseLog(log);
    if (!parsed || !typeOf[parsed.name]) continue;
    const id = Number(parsed.args.objectId);
    const funder = parsed.name === "EscrowCreated" || parsed.name === "FundsAdded" ? String(parsed.args.funder) : undefined;
    if (!events.has(id)) events.set(id, []);
    events.get(id)!.push({ type: typeOf[parsed.name], hash: log.transactionHash, funder });
  }

  // Releer el archivo justo antes de escribir, por si la web lo tocó mientras corría el seed.
  const fresh = JSON.parse(await readFile(ESCROWS_JSON, "utf8")) as EscrowsData;
  const funderAddr = (name: string) => funderWallet(deployerKey, name).address;
  const insertAfter = (o: Record<string, unknown>, after: string, key: string, value: unknown) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      if (k === key) continue;
      out[k] = v;
      if (k === after) out[key] = value;
    }
    if (!(key in out)) out[key] = value;
    return out;
  };

  let replaced = 0;
  let missing = 0;
  fresh.funderDirectory = fresh.funderDirectory.map((f) => ({ ...f, address: funderAddr(f.name) }));
  fresh.objects = fresh.objects.map((obj) => {
    const evs = [...(events.get(obj.objectId) ?? [])];
    const history = obj.history.map((h) => {
      const isFunding = h.type === "ESCROW_CREATED" || h.type === "FUNDS_ADDED";
      const idx = evs.findIndex(
        (ev) => ev.type === h.type && (!isFunding || ev.funder?.toLowerCase() === funderAddr(h.by).toLowerCase()),
      );
      if (idx < 0) {
        missing++;
        return h;
      }
      replaced++;
      return { ...h, txHash: evs.splice(idx, 1)[0].hash };
    });
    let out: Record<string, unknown> = {
      ...obj,
      funders: obj.funders.map((f) => ({ ...f, address: funderAddr(f.name) })),
      history,
    };
    out = insertAfter(out, "owner", "ownerAddress", ownerAddress(obj.owner));
    if (obj.cleaner) out = insertAfter(out, "cleaner", "cleanerAddress", cleanerAddress(obj.cleaner));
    return out as DataObject;
  });
  let top: Record<string, unknown> = { ...fresh };
  top = insertAfter(top, "cleaners", "cleanerDirectory", fresh.cleaners.map((name) => ({ name, address: cleanerAddress(name) })));
  top = insertAfter(
    top,
    "cleanerDirectory",
    "ownerDirectory",
    [...new Set(fresh.objects.map((o) => o.owner))].map((name) => ({ name, address: ownerAddress(name) })),
  );
  top = insertAfter(top, "ownerDirectory", "addressDerivation", { owner: ADDRESS_DERIVATION.owner, cleaner: ADDRESS_DERIVATION.cleaner });
  top.seeded = { network: netKey, address: cfg.address, at: new Date().toISOString() };

  await writeFile(ESCROWS_JSON, JSON.stringify(top, null, 2) + "\n");
  console.log(`  ${replaced} txHash reales, ${missing} sin evento on-chain (quedaron como estaban)`);
}
