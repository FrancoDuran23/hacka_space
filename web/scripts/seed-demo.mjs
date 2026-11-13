// Seed de la demo: una cuenta y una wallet por operadora del dataset (menos ESA, que es la cuenta real),
// y sus satélites de web/data/escrows.json registrados como escrows REALES en el contrato de Fuji.
// Idempotente: lo que ya existe (cuenta, wallet, escrow) se saltea.
//
// Uso (con el server corriendo en localhost:3123):  node scripts/seed-demo.mjs
// Credenciales de las cuentas y claves de las wallets: ~/.config/orbitclear/seed-accounts.json (permisos 600).
//
// No se inventan reingresos: los escrows quedan activos, por vencer o vencidos (decomisados con closeExpired).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { Contract, JsonRpcProvider, Wallet, keccak256, parseEther, toUtf8Bytes, getAddress } from "ethers";

const APP = process.env.APP_URL ?? "http://localhost:3123";
const SKIP = new Set(["ESA"]);
const YEAR = 365 * 86_400;
const BAND_YEARS = [5, 10, 25];
const ACCOUNTS_FILE = path.join(os.homedir(), ".config/orbitclear/seed-accounts.json");

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }),
);
const sql = neon(env.DATABASE_URL);
const cfg = JSON.parse(fs.readFileSync("lib/contract.json", "utf8"));
const provider = new JsonRpcProvider(cfg.rpcUrl);
const relayer = new Wallet(fs.readFileSync(path.join(os.homedir(), ".config/orbitclear/fuji-demo-wallet.txt"), "utf8").trim(), provider);

const ESCROW_ABI = [
  "function register(uint32,address,uint64,uint64,uint8,bytes32)",
  "function closeExpired(uint32)",
  "function escrowOf(uint32) view returns (tuple(address operator,uint64 launchedAt,uint64 missionEndsAt,uint64 deadline,uint128 deposit,uint8 band,uint8 state))",
  "function bandAmount(uint256) view returns (uint128)",
];
const USDC_ABI = ["function mint(address,uint256)", "function approve(address,uint256) returns (bool)", "function balanceOf(address) view returns (uint256)", "function allowance(address,address) view returns (uint256)"];
const escrow = new Contract(cfg.address, ESCROW_ABI, relayer);
const usdc = new Contract(cfg.usdc, USDC_ABI, relayer);

// SATCAT (copia local del catálogo completo): lanzamiento y apogeo reales de cada NORAD
function satcatRows() {
  const text = fs.readFileSync(".cache/satcat.csv", "utf8").trim().split("\n");
  const head = text[0].split(",");
  const out = new Map();
  for (const line of text.slice(1)) {
    const cols = line.split(",");
    if (cols.length !== head.length) continue;
    const row = Object.fromEntries(head.map((h, i) => [h, cols[i]]));
    out.set(Number(row.NORAD_CAT_ID), row);
  }
  return out;
}

const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const wait = (tx) => tx.wait().then(() => tx.hash);

const accounts = fs.existsSync(ACCOUNTS_FILE) ? JSON.parse(fs.readFileSync(ACCOUNTS_FILE, "utf8")) : {};
const save = () => {
  fs.mkdirSync(path.dirname(ACCOUNTS_FILE), { recursive: true });
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), { mode: 0o600 });
};

const file = JSON.parse(fs.readFileSync("data/escrows.json", "utf8"));
const satcat = satcatRows();
const operators = [...new Set(file.objects.map((o) => o.owner))].filter((o) => !SKIP.has(o));
const nowS = Math.floor(Date.now() / 1000);
let nonce = await provider.getTransactionCount(relayer.address, "pending");
const rtx = (fn) => fn({ nonce: nonce++ });

for (const operator of operators) {
  const key = slug(operator);
  accounts[operator] ??= {
    email: `${key}@orbitclear-demo.test`,
    password: crypto.randomBytes(12).toString("base64url"),
    walletKey: Wallet.createRandom().privateKey,
  };
  save();
  const acc = accounts[operator];
  const wallet = new Wallet(acc.walletKey, provider);
  console.log(`\n== ${operator} · ${acc.email} · ${wallet.address}`);

  // 1. cuenta (sign-up por la app, como un usuario)
  const res = await fetch(`${APP}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: APP },
    body: JSON.stringify({ email: acc.email, password: acc.password, name: operator }),
  });
  const body = await res.text();
  console.log(`  cuenta: ${res.ok ? "creada" : /exist/i.test(body) ? "ya existía" : `ERROR ${res.status} ${body.slice(0, 120)}`}`);
  const [user] = await sql`select id from neon_auth."user" where email = ${acc.email}`;
  if (!user) { console.log("  sin usuario, salteo"); continue; }

  // 2. wallet vinculada a la cuenta (la clave la generamos nosotros: es nuestra)
  await sql`insert into wallets (user_id, address, chain_id, label, verified_at) values (${user.id}, ${wallet.address}, 43113, 'Wallet de demo', now()) on conflict do nothing`;

  // 3. satélites del operador sin escrow todavía
  const pending = [];
  for (const o of file.objects.filter((x) => x.owner === operator)) {
    const e = await escrow.escrowOf(o.objectId);
    if (e.state !== 0n) { console.log(`  ${o.name} (${o.objectId}): ya registrado`); continue; }
    const row = satcat.get(o.objectId);
    if (!row?.LAUNCH_DATE) { console.log(`  ${o.name} (${o.objectId}): sin SATCAT, salteo`); continue; }
    const apogee = Number(row.APOGEE);
    const band = apogee < 600 ? 0 : apogee <= 900 ? 1 : 2;
    const launchedAt = Math.max(Math.floor(Date.parse(row.LAUNCH_DATE) / 1000), 1);
    // estado buscado según el dataset: vencido, por vencer (deadline en 1–3 días) o activo (deadline en 3–15 años)
    const target = o.status === "FORFEITED" ? "vencido" : o.status === "EXPIRING" ? "por vencer" : "activo";
    const deadline = target === "vencido" ? null : target === "por vencer" ? nowS + (1 + (o.objectId % 3)) * 86_400 : nowS + (3 + (o.objectId % 12)) * YEAR;
    const missionEndsAt = deadline === null ? launchedAt : Math.max(launchedAt, deadline - BAND_YEARS[band] * YEAR);
    pending.push({ o, band, launchedAt, missionEndsAt, target, dataHash: keccak256(toUtf8Bytes(JSON.stringify(row))), deposit: await escrow.bandAmount(band) });
  }
  if (pending.length === 0) continue;
  const total = pending.reduce((s, p) => s + p.deposit, 0n);

  // 4. gas, mUSDC y autorización exacta para todos sus depósitos
  if ((await provider.getBalance(wallet.address)) < parseEther("0.002")) {
    await wait(await rtx((o) => relayer.sendTransaction({ to: wallet.address, value: parseEther("0.005"), ...o })));
  }
  const bal = await usdc.balanceOf(wallet.address);
  if (bal < total) await wait(await rtx((o) => usdc.mint(wallet.address, total - bal, o)));
  const ownUsdc = usdc.connect(wallet);
  if ((await ownUsdc.allowance(wallet.address, cfg.address)) < total) await wait(await ownUsdc.approve(cfg.address, total));

  // 5. registro firmado por el relayer y, si quedó vencido, decomiso
  for (const p of pending) {
    const hash = await wait(await rtx((o) => escrow.register(p.o.objectId, wallet.address, p.launchedAt, p.missionEndsAt, p.band, p.dataHash, o)));
    await sql`insert into satellite_registrations (norad, escrow, tx_hash, operator, user_id) values (${p.o.objectId}, ${cfg.address}, ${hash}, ${getAddress(wallet.address)}, ${user.id}) on conflict do nothing`;
    let line = `  ${p.o.name} (${p.o.objectId}): ${p.target} · tx ${hash.slice(0, 12)}`;
    if (p.target === "vencido") line += ` · closeExpired ${(await wait(await rtx((o) => escrow.closeExpired(p.o.objectId, o))) ).slice(0, 12)}`;
    console.log(line);
  }
}
console.log(`\nCuentas guardadas en ${ACCOUNTS_FILE}`);
