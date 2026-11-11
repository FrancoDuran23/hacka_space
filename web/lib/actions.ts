"use client";

import { shortHash } from "./format";
import { app, patchObject, patchRun, pushFeed, sim } from "./store";
import type { EscrowSnapshot, OracleResult } from "./types";

/** Ask the oracle to verify the reentry and release the escrow. The scene plays the fall once it answers. */
export async function requestDeorbit(objectId: number) {
  const s = app.get();
  const o = s.objects.find((x) => x.objectId === objectId);
  const running = s.runs[objectId]?.phase;
  if (!o || running === "verifying" || running === "falling" || running === "burned") return;
  app.set({
    runs: { ...s.runs, [objectId]: { phase: "verifying", txHash: null, explorerUrl: null, simulated: true, payout: o.locked, cleaner: "" } },
  });
  pushFeed({ tone: "info", label: "Oracle verifying reentry", target: `${o.name} #${o.objectId}` });
  try {
    const res = await fetch("/api/oracle", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ objectId }) });
    const json = (await res.json()) as OracleResult;
    if (!res.ok || !json.ok) throw new Error(json.error ?? `oracle responded ${res.status}`);
    patchRun(objectId, { phase: "falling", txHash: json.txHash, explorerUrl: json.explorerUrl, simulated: json.simulated, payout: json.payout, cleaner: json.cleaner });
  } catch (e) {
    const error = (e as Error).message;
    patchRun(objectId, { phase: "failed", error });
    pushFeed({ tone: "bad", label: "Oracle rejected", target: `${o.name} · ${error.slice(0, 60)}` });
  }
}

/** Called by the scene the instant the object burns up. */
export function settleDeorbit(objectId: number) {
  const s = app.get();
  const o = s.objects.find((x) => x.objectId === objectId);
  const run = s.runs[objectId];
  if (!o || !run) return;
  const at = new Date(sim.time).toISOString();
  patchObject(objectId, {
    status: "CLEANED",
    locked: 0,
    collected: run.payout,
    cleaner: run.cleaner,
    settledAt: at,
    history: run.txHash ? [...o.history, { type: "DEBRIS_DEORBITED", at, amount: run.payout, by: run.cleaner, txHash: run.txHash }] : o.history,
  });
  patchRun(objectId, { phase: "burned" });
  pushFeed({
    tone: "ok",
    label: "Debris deorbited · payout released",
    target: `${o.name} → ${run.cleaner}`,
    amount: run.payout,
    txHash: run.txHash,
    explorerUrl: run.explorerUrl,
  });
}

/** Merge a fresh server snapshot without disturbing objects that are mid-animation. */
export function applySnapshot(snap: EscrowSnapshot) {
  app.set((s) => {
    const busy = new Set(Object.entries(s.runs).filter(([, r]) => r.phase !== "failed").map(([id]) => Number(id)));
    const prev = new Map(s.objects.map((o) => [o.objectId, o] as const));
    return {
      source: snap.source,
      contract: snap.contract,
      explorer: snap.explorer,
      objects: snap.objects.map((o) => (busy.has(o.objectId) && prev.has(o.objectId) ? prev.get(o.objectId)! : o)),
    };
  });
}

export { shortHash };
