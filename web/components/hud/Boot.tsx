"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatUSD } from "@/lib/format";
import { computeStats } from "@/lib/status";
import { app, useApp } from "@/lib/store";

const CHAR_MS = 13;
const LINE_PAUSE_MS = 150;

/** Power-on sequence: status lines type themselves, then the planet rises from black and the panels assemble. */
export function Boot() {
  const booted = useApp((s) => s.booted);
  const renderer = useApp((s) => s.renderer);
  const source = useApp((s) => s.source);
  const objects = useApp((s) => s.objects);

  const lines = useMemo(() => {
    const locked = computeStats(objects, Date.now()).totalLocked;
    const chain = source === "fuji" ? "OK · FUJI C-CHAIN 43113" : source === "local" ? "OK · LOCAL NODE 31337" : "OFFLINE · DEMO DATASET";
    return [
      ["ORBITCLEAR OS 1.0 // SPACE TRAFFIC ESCROW", ""],
      ["INIT RENDER PIPELINE", renderer ?? "…"],
      ["CONNECTING TO AVALANCHE", chain],
      ["SYNCING ORBITAL DATA", `${objects.length} OBJECTS · SGP4`],
      ["LOADING ESCROW LEDGER", `${formatUSD(locked)} LOCKED`],
      ["ARGENTINA SPACE · SALTA UPLINK", "NOMINAL"],
    ] as const;
  }, [objects, source, renderer]);

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (booted) return;
    const t0 = performance.now();
    const h = setInterval(() => setElapsed(performance.now() - t0), 30);
    return () => clearInterval(h);
  }, [booted]);

  // each line starts when the previous one has finished typing
  const starts = useMemo(() => {
    let t = 250;
    return lines.map(([a, b]) => {
      const s = t;
      t += (a.length + 14 + b.length) * CHAR_MS + LINE_PAUSE_MS;
      return s;
    });
  }, [lines]);
  const total = starts[starts.length - 1] + 900;
  const ready = renderer != null;

  useEffect(() => {
    if (!booted && ready && elapsed >= total) app.set({ booted: true });
  }, [booted, ready, elapsed, total]);

  useEffect(() => {
    if (booted) return;
    const skip = () => app.set({ booted: true });
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [booted]);

  return (
    <AnimatePresence>
      {!booted && (
        <motion.div
          key="boot"
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-void"
          exit={{ opacity: 0, transition: { duration: 1.6, ease: "easeInOut" } }}
          onClick={() => app.set({ booted: true })}
        >
          <div className="w-[min(640px,88vw)]">
            <div className="font-pixel mb-2 text-[30px] leading-none tracking-[0.12em] text-white">ORBITCLEAR</div>
            <div className="mb-7 text-[12.5px] text-dim">Space traffic escrow · starting up</div>
            <div className="mono space-y-[7px] text-[12px]">
              {lines.map(([a, b], i) => {
                const t = elapsed - starts[i];
                if (t < 0) return null;
                const dots = ".".repeat(Math.max(3, 34 - a.length));
                const head = i === 0 ? a : `> ${a} ${dots} `;
                const full = head + b;
                const n = Math.floor(t / CHAR_MS);
                const typing = n < full.length;
                const shown = full.slice(0, n);
                return (
                  <div key={i} className={i === 0 ? "mb-3 tracking-[0.2em] text-dim" : "tracking-[0.08em] text-ink"}>
                    <span>{shown.slice(0, head.length)}</span>
                    <span className={b.startsWith("OFFLINE") ? "text-warn" : "text-ok"}>{shown.slice(head.length)}</span>
                    {typing && <span className="text-cyan">▮</span>}
                  </div>
                );
              })}
            </div>
            <div className="mt-8 h-px w-full bg-line">
              <div className="h-px bg-cyan shadow-[0_0_10px_#38e8ff]" style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }} />
            </div>
            <div className="mt-3 flex justify-between text-[11.5px] text-faint">
              <span>{elapsed >= total && !ready ? "Waiting for GPU…" : "Press any key to skip"}</span>
              <span className="mono">{Math.min(100, Math.round((elapsed / total) * 100))}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
