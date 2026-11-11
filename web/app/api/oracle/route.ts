import { NextResponse } from "next/server";
import { Contract, JsonRpcProvider, Network, Wallet, keccak256, toUtf8Bytes, isError } from "ethers";
import { DEBRIS_ESCROW_ABI } from "@/lib/abi";
import { loadContractConfig, loadEscrowsFile, SNOWTRACE } from "@/lib/config";
import { getEscrows } from "@/lib/escrow";
import { recordDeorbit } from "@/lib/live-store";
import { REENTRY_THRESHOLD_KM, cleanerAddress, verifyDeorbit } from "@/lib/oracle";
import { statusAt } from "@/lib/status";
import type { OracleResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TX_TIMEOUT_MS = 45_000;

export async function POST(req: Request) {
  let body: { objectId?: unknown; cleaner?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }
  const objectId = Number(body.objectId);
  if (!Number.isInteger(objectId) || objectId <= 0) {
    return NextResponse.json({ ok: false, error: "objectId must be a NORAD id" }, { status: 400 });
  }

  const file = await loadEscrowsFile();
  const meta = file.objects.find((o) => o.objectId === objectId);
  if (!meta) return NextResponse.json({ ok: false, error: "unknown object" }, { status: 404 });

  const snap = await getEscrows();
  const current = snap.objects.find((o) => o.objectId === objectId);
  if (!current) return NextResponse.json({ ok: false, error: "object not escrowed" }, { status: 404 });
  const st = statusAt(current, Date.now());
  if (st === "CLEANED" || st === "EXPIRED") {
    return NextResponse.json({ ok: false, error: `escrow is ${st.toLowerCase()}` }, { status: 409 });
  }

  const cleaners = file.cleaners.length ? file.cleaners : ["Grúa Orbital"];
  const cleaner =
    typeof body.cleaner === "string" && cleaners.includes(body.cleaner) ? body.cleaner : cleaners[objectId % cleaners.length];
  const cleanerAddr = file.cleanerDirectory?.find((c) => c.name === cleaner)?.address ?? cleanerAddress(cleaner);

  // 1) Physical evidence: SGP4 on the tracked TLE must show the object below the reentry line.
  const v = verifyDeorbit(meta.tle);
  const evidence = {
    perigeeBeforeKm: v.perigeeBeforeKm,
    perigeeAfterKm: v.perigeeAfterKm,
    reentryThresholdKm: REENTRY_THRESHOLD_KM,
    evidenceHash: v.evidenceHash,
  };
  if (!v.reentered) {
    return NextResponse.json({ ok: false, error: "TLE does not confirm reentry", evidence }, { status: 422 });
  }

  const payout = current.locked;
  const cfg = await loadContractConfig();
  const key = process.env.ORACLE_PRIVATE_KEY;
  let result: OracleResult;

  if (cfg && key && snap.source !== "demo") {
    // 2) Sign confirmDeorbit with the server's oracle key (testnet throwaway wallet).
    try {
      const net = Network.from(cfg.chainId);
      const provider = new JsonRpcProvider(cfg.rpcUrl, net, { staticNetwork: net });
      const wallet = new Wallet(key, provider);
      const c = new Contract(cfg.address!, DEBRIS_ESCROW_ABI, wallet);
      const tx = await c.getFunction("confirmDeorbit")(objectId, cleanerAddr);
      const receipt = await Promise.race([
        tx.wait(),
        new Promise<null>((_, rej) => setTimeout(() => rej(new Error("tx confirmation timeout")), TX_TIMEOUT_MS)),
      ]);
      const hash: string = receipt?.hash ?? tx.hash;
      const explorer = cfg.explorer ?? (cfg.chainId === 43113 ? SNOWTRACE : null);
      result = { ok: true, objectId, simulated: false, txHash: hash, explorerUrl: explorer ? `${explorer}/tx/${hash}` : null, payout, cleaner, evidence };
    } catch (e) {
      const reason = isError(e, "CALL_EXCEPTION") ? (e.reason ?? e.shortMessage) : (e as Error).message;
      return NextResponse.json({ ok: false, error: `on-chain confirm failed: ${String(reason).slice(0, 160)}`, evidence }, { status: 502 });
    }
  } else {
    const hash = keccak256(toUtf8Bytes(`sim:${objectId}:${Date.now()}`));
    result = { ok: true, objectId, simulated: true, txHash: hash, explorerUrl: null, payout, cleaner, evidence };
  }

  recordDeorbit({
    objectId,
    txHash: result.txHash!,
    at: new Date().toISOString(),
    cleaner,
    payout,
    simulated: result.simulated,
  });
  return NextResponse.json(result);
}
