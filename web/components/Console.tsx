"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { applySnapshot } from "@/lib/actions";
import { statusAt } from "@/lib/status";
import { app, pushFeed, sim, useApp, useSimTime, type FeedLine } from "@/lib/store";
import type { EscrowSnapshot, EscrowStatus, HistoryType } from "@/lib/types";
import { AccountSection } from "./hud/AccountSection";
import { Boot } from "./hud/Boot";
import { Controls, Hint } from "./hud/Controls";
import { DetailPanel } from "./hud/DetailPanel";
import { Header } from "./hud/Header";
import { SidePanel } from "./hud/SidePanel";

const Scene = dynamic(() => import("./scene/Scene"), { ssr: false });

const HISTORY_FEED: Record<HistoryType, { tone: FeedLine["tone"]; label: string }> = {
  REGISTERED: { tone: "info", label: "Satellite registered · deposit locked" },
  REENTRY_ATTESTED: { tone: "info", label: "Reentry attested by relayer" },
  REFUNDED: { tone: "ok", label: "Deposit refunded to operator" },
  FORFEITED: { tone: "bad", label: "Deposit forfeited to removal fund" },
};

/** Recent on-record events become the first lines of the terminal feed. */
function seedFeed(snap: EscrowSnapshot): FeedLine[] {
  return snap.objects
    .flatMap((o) =>
      o.history.map((h, i) => ({
        key: `h-${o.objectId}-${i}`,
        ...HISTORY_FEED[h.type],
        target: `${o.name} · ${h.by}`,
        amount: h.amount,
        txHash: h.txHash,
        explorerUrl: o.onChain && snap.explorer ? `${snap.explorer}/tx/${h.txHash}` : null,
        at: Date.parse(h.at),
        live: false,
      })),
    )
    .sort((a, b) => b.at - a.at)
    .slice(0, 14);
}

export function Console({ initial }: { initial: EscrowSnapshot }) {
  const ready = useRef(false);
  if (!ready.current) {
    ready.current = true;
    sim.time = Date.now();
    app.set({ objects: initial.objects, source: initial.source, contract: initial.contract, explorer: initial.explorer, feed: seedFeed(initial) });
  }
  // ?boot=0 skips the power-on sequence (handy while iterating)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("boot") === "0") app.set({ booted: true });
  }, []);

  const booted = useApp((s) => s.booted);
  const selected = useApp((s) => (s.selectedId == null ? null : (s.objects.find((o) => o.objectId === s.selectedId) ?? null)));

  // keep in sync with the ledger
  useEffect(() => {
    const h = setInterval(async () => {
      try {
        const res = await fetch("/api/escrows", { cache: "no-store" });
        if (res.ok) applySnapshot((await res.json()) as EscrowSnapshot);
      } catch {
        /* offline: keep what we have */
      }
    }, 20_000);
    return () => clearInterval(h);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") app.set({ selectedId: null });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // announce escrows that cross a threshold while the clock runs (or warps)
  const simTime = useSimTime();
  const seen = useRef<Map<number, EscrowStatus> | null>(null);
  useEffect(() => {
    if (!simTime) return;
    const { objects } = app.get();
    const next = new Map(objects.map((o) => [o.objectId, statusAt(o, simTime)] as const));
    const prev = seen.current;
    seen.current = next;
    if (!prev) return;
    for (const o of objects) {
      const was = prev.get(o.objectId);
      const is = next.get(o.objectId);
      if (!was || was === is) continue;
      if (is === "EXPIRING") pushFeed({ tone: "warn", label: "Deadline under 24 h", target: `${o.name} #${o.objectId}`, amount: o.deposit });
      if (is === "FORFEITED") pushFeed({ tone: "bad", label: "Deadline missed · deposit forfeited", target: `${o.name} #${o.objectId} · to removal fund`, amount: o.deposit });
    }
  }, [simTime]);

  return (
    <main className="fixed inset-0 flex flex-col overflow-y-auto bg-void lg:flex-row lg:overflow-hidden">
      {/* the planet gets its own area; the panel never covers it */}
      <section className="relative h-[62vh] shrink-0 overflow-hidden lg:h-auto lg:min-w-0 lg:flex-1">
        <Scene />
        <Header />
        <AnimatePresence>
          {booted && !selected && <Controls key="controls" />}
          {booted && !selected && <Hint key="hint" />}
        </AnimatePresence>
      </section>
      <aside className="scroll-thin relative z-20 flex shrink-0 flex-col border-t border-white/[0.07] bg-[rgb(5_9_18/0.96)] lg:h-full lg:w-[min(420px,34vw)] lg:min-w-[340px] lg:overflow-y-auto lg:border-t-0 lg:border-l">
        {booted && <AccountSection />}
        <AnimatePresence mode="wait">
          {booted && (selected ? <DetailPanel key={`d${selected.objectId}`} object={selected} /> : <SidePanel key="side" />)}
        </AnimatePresence>
      </aside>
      <div className="screen-scan" />
      <div className="screen-noise" />
      <Boot />
    </main>
  );
}
