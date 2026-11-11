"use client";

import { motion } from "framer-motion";
import { utcClock, utcDate } from "@/lib/format";
import { useApp, useRealTime } from "@/lib/store";

export function Header() {
  const booted = useApp((s) => s.booted);
  const source = useApp((s) => s.source);
  const renderer = useApp((s) => s.renderer);
  const now = useRealTime();
  const live = source !== "demo";
  return (
    <motion.header
      className="pointer-events-none fixed inset-x-0 top-0 z-30 flex h-16 items-start justify-between gap-6 px-5 pt-4"
      initial={{ opacity: 0, y: -18 }}
      animate={booted ? { opacity: 1, y: 0 } : { opacity: 0, y: -18 }}
      transition={{ duration: 0.7, delay: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="flex items-baseline gap-3">
        <h1 className="font-pixel text-[24px] leading-none tracking-[0.12em] text-white">ORBITCLEAR</h1>
        <span className="text-[12.5px] text-dim">Space traffic escrow</span>
      </div>
      <div className="flex items-center gap-5 text-[12.5px]">
        <span className="mono hidden text-dim md:inline">
          {now ? `${utcDate(now)} · ${utcClock(now)}` : "---------- · --:--:--"} UTC
        </span>
        <span className={`flex items-center gap-2 font-medium ${live ? "text-ok" : "text-warn"}`}>
          <span className="blink-soft inline-block h-[7px] w-[7px] rounded-full bg-current" />
          {source === "fuji" ? "Live on Fuji" : source === "local" ? "Live · local node" : "Demo mode"}
        </span>
        <span className="hidden text-faint lg:inline">Settled on Avalanche{renderer ? ` · ${renderer === "WEBGPU" ? "WebGPU" : "WebGL 2"}` : ""}</span>
      </div>
    </motion.header>
  );
}
