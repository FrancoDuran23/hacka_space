"use client";

import { shortHash } from "./format";
import { app, patchObject, patchRun, pushFeed, sim } from "./store";
import type { EscrowSnapshot, ReentryResult } from "./types";

/** Ask the relayer to verify the reentry and settle the escrow. The scene plays the fall once it answers. */
export async function requestDeorbit(objectId: number) {
  const s = app.get();
  const o = s.objects.find((x) => x.objectId === objectId);
  const running = s.runs[objectId]?.phase;
  if (!o || running === "verifying" || running === "falling" || running === "burned") return;
  app.set({
    runs: { ...s.runs, [objectId]: { phase: "verifying", txHash: null, explorerUrl: null, simulated: true, refund: o.deposit, operator: o.owner } },
  });
  pushFeed({ tone: "info", label: "Relayer verifying reentry", target: `${o.name} #${o.objectId}` });
  try {
    const res = await fetch("/api/relayer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ objectId }) });
    const json = (await res.json()) as ReentryResult;
    if (!res.ok || !json.ok) throw new Error(json.error ?? `relayer responded ${res.status}`);
    patchRun(objectId, { phase: "falling", txHash: json.txHash, explorerUrl: json.explorerUrl, simulated: json.simulated, refund: json.refund, operator: json.operator });
  } catch (e) {
    const error = (e as Error).message;
    patchRun(objectId, { phase: "failed", error });
    pushFeed({ tone: "bad", label: "Relayer rejected", target: `${o.name} · ${error.slice(0, 60)}` });
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
    status: "REFUNDED",
    settledAt: at,
    history: run.txHash ? [...o.history, { type: "REFUNDED", at, amount: run.refund, by: run.operator, txHash: run.txHash }] : o.history,
  });
  patchRun(objectId, { phase: "burned" });
  pushFeed({
    tone: "ok",
    label: "Reentry verified · deposit refunded",
    target: `${o.name} → ${run.operator}`,
    amount: run.refund,
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
      tle: snap.tle,
      contract: snap.contract,
      explorer: snap.explorer,
      objects: snap.objects.map((o) => (busy.has(o.objectId) && prev.has(o.objectId) ? prev.get(o.objectId)! : o)),
    };
  });
}

export { shortHash };
