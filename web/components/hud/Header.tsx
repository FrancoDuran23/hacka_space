"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { utcClock, utcDate } from "@/lib/format";
import { useApp, useRealTime } from "@/lib/store";

export function Header() {
  const booted = useApp((s) => s.booted);
  const now = useRealTime();
  return (
    <motion.header
      className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-16 items-start justify-between gap-6 px-5 pt-4"
      initial={{ opacity: 0, y: -18 }}
      animate={booted ? { opacity: 1, y: 0 } : { opacity: 0, y: -18 }}
      transition={{ duration: 0.7, delay: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="flex items-baseline gap-3">
        <h1 className="font-pixel text-[24px] leading-none tracking-[0.12em] text-white">ORBITCLEAR</h1>
        <span className="hidden whitespace-nowrap text-[12.5px] text-dim xl:inline">Deorbit deposit escrow</span>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-[12.5px]">
        <Link href="/ranking" className="pointer-events-auto text-dim hover:text-cyan">
          Top operadoras
        </Link>
        <span className="mono hidden text-dim md:inline">
          {now ? `${utcDate(now)} · ${utcClock(now)}` : "---------- · --:--:--"} UTC
        </span>
      </div>
    </motion.header>
  );
}
