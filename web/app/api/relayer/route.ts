import { NextResponse } from "next/server";
import { Contract, JsonRpcProvider, Network, Wallet, keccak256, toUtf8Bytes, isError } from "ethers";
import { ORBITCLEAR_ESCROW_ABI } from "@/lib/abi";
import { loadContractConfig, loadEscrowsFile, SNOWTRACE } from "@/lib/config";
import { getEscrows } from "@/lib/escrow";
import { recordReentry } from "@/lib/live-store";
import { REENTRY_THRESHOLD_KM, verifyReentry } from "@/lib/reentry";
import { statusAt } from "@/lib/status";
import type { ReentryResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TX_TIMEOUT_MS = 45_000;

export async function POST(req: Request) {
  let body: { objectId?: unknown };
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
  if (st === "REFUNDED" || st === "FORFEITED") {
    return NextResponse.json({ ok: false, error: `escrow is ${st.toLowerCase()}` }, { status: 409 });
  }

  // 1) Physical evidence: SGP4 on the tracked TLE must show the object below the reentry line.
  const v = verifyReentry(meta.tle);
  const evidence = {
    perigeeBeforeKm: v.perigeeBeforeKm,
    perigeeAfterKm: v.perigeeAfterKm,
    reentryThresholdKm: REENTRY_THRESHOLD_KM,
    evidenceHash: v.evidenceHash,
  };
  if (!v.reentered) {
    return NextResponse.json({ ok: false, error: "TLE does not confirm reentry", evidence }, { status: 422 });
  }

  const refund = current.deposit;
  const operator = current.owner;
  const cfg = await loadContractConfig();
  const key = process.env.RELAYER_PRIVATE_KEY;
  let result: ReentryResult;

  if (cfg && key && current.onChain) {
    // 2) Sign attestReentry with the relayer key (testnet throwaway wallet). Inside the deadline it refunds the operator.
    try {
      const net = Network.from(cfg.chainId);
      const provider = new JsonRpcProvider(cfg.rpcUrl, net, { staticNetwork: net });
      const wallet = new Wallet(key, provider);
      const c = new Contract(cfg.address!, ORBITCLEAR_ESCROW_ABI, wallet);
      const tx = await c.getFunction("attestReentry")(objectId, Math.floor(Date.now() / 1000), evidence.evidenceHash);
      const receipt = await Promise.race([
        tx.wait(),
        new Promise<null>((_, rej) => setTimeout(() => rej(new Error("tx confirmation timeout")), TX_TIMEOUT_MS)),
      ]);
      const hash: string = receipt?.hash ?? tx.hash;
      const explorer = cfg.explorer ?? (cfg.chainId === 43113 ? SNOWTRACE : null);
      result = { ok: true, objectId, simulated: false, txHash: hash, explorerUrl: explorer ? `${explorer}/tx/${hash}` : null, refund, operator, evidence };
    } catch (e) {
      const reason = isError(e, "CALL_EXCEPTION") ? (e.reason ?? e.shortMessage) : (e as Error).message;
      return NextResponse.json({ ok: false, error: `on-chain attestation failed: ${String(reason).slice(0, 160)}`, evidence }, { status: 502 });
    }
  } else {
    const hash = keccak256(toUtf8Bytes(`sim:${objectId}:${Date.now()}`));
    result = { ok: true, objectId, simulated: true, txHash: hash, explorerUrl: null, refund, operator, evidence };
  }

  recordReentry({
    objectId,
    txHash: result.txHash!,
    at: new Date().toISOString(),
    operator,
    refund,
    simulated: result.simulated,
  });
  return NextResponse.json(result);
}
