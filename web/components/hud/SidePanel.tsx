"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { countdown, formatUSD, utcClock, utcDate } from "@/lib/format";
import { computeStats, netBalanceAt, statusAt } from "@/lib/status";
import { app, useApp, useSimTime, type FeedLine } from "@/lib/store";
import { RollingUsd, TxHash, Typed } from "./bits";

const DOT: Record<FeedLine["tone"], string> = { ok: "bg-ok", warn: "bg-warn", bad: "bg-bad", info: "bg-cyan", sys: "bg-faint" };

/** The console at a glance: what is locked, what is at risk, who deposits, what just happened. */
export function SidePanel() {
  const objects = useApp((s) => s.objects);
  const feed = useApp((s) => s.feed);
  const tle = useApp((s) => s.tle);
  const catalog = useApp((s) => s.catalog);
  const catalogGroup = useApp((s) => s.catalogGroup);
  const source = useApp((s) => s.source);
  const simTime = useSimTime();
  // deadlines only matter to the minute: recompute once per simulated minute
  const minute = Math.floor(simTime / 60_000) * 60_000 || Date.now();

  const view = useMemo(() => {
    const stats = computeStats(objects, minute);
    let atRisk = 0;
    let next: { id: number; name: string; left: number; deposit: number } | null = null;
    for (const o of objects) {
      const st = statusAt(o, minute);
      if (st === "EXPIRING") atRisk += o.deposit;
      if (st === "ACTIVE" || st === "EXPIRING") {
        const left = Date.parse(o.deadline) - minute;
        if (!next || left < next.left) next = { id: o.objectId, name: o.name, left, deposit: o.deposit };
      }
    }
    let net = 0;
    let winning = 0;
    let losing = 0;
    for (const o of objects) {
      const b = netBalanceAt(o, minute);
      net += b;
      if (b >= 0) winning++;
      else losing++;
    }
    return { stats, atRisk, next, net, winning, losing };
  }, [objects, minute]);

  const { stats, atRisk, next, net, winning, losing } = view;
  const kinds = useMemo(() => {
    let active = 0;
    let debris = 0;
    let out = 0;
    for (const o of catalog) {
      if (o.kind === "active") active++;
      else if (o.kind === "out") out++;
      else debris++;
    }
    return { active, debris, out };
  }, [catalog]);
  const open = stats.active + stats.expiring;
  const total = Math.max(1, stats.active + stats.expiring + stats.forfeited);
  const top = stats.operators.slice(0, 4);

  return (
    <motion.aside
      data-status={stats.expiring > 0 ? "EXPIRING" : undefined}
      className="panel pointer-events-auto fixed right-4 top-[76px] bottom-4 z-20 flex w-[27vw] min-w-[320px] max-w-[400px] flex-col px-6 py-6"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.3 } }}
      transition={{ duration: 0.6, delay: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {/* headline */}
      <div>
        <div className="label">Deorbit deposits locked</div>
        <div className="figure mt-1 text-[clamp(32px,2.9vw,42px)] leading-none text-white">
          <RollingUsd value={stats.totalLocked} ms={1400} suffix={false} />
          <span className="ml-2 text-[13px] font-normal tracking-normal text-dim">USD</span>
        </div>
        <div className="mt-2 text-[12.5px] text-dim">
          across {open} open {open === 1 ? "escrow" : "escrows"} · {objects.length} tracked
        </div>
      </div>

      {/* one bar for the three states */}
      <div className="mt-6">
        <div className="flex h-[6px] gap-[3px] overflow-hidden rounded-full">
          <Bar n={stats.active} of={total} className="bg-ok" />
          <Bar n={stats.expiring} of={total} className="bg-warn" />
          <Bar n={stats.forfeited} of={total} className="bg-bad" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Count n={stats.active} label="Active" className="text-ok" />
          <Count n={stats.expiring} label="Under 24 h" className="blink-soft text-warn" />
          <Count n={stats.forfeited} label="Forfeited" className="text-bad" />
        </div>
      </div>

      <div className="hairline my-5" />

      {/* the numbers worth acting on */}
      <dl className="space-y-3">
        {/* light blue = profit, indigo = loss */}
        <Row label="Net balance" hint={`${winning} in profit · ${losing} at a loss`}>
          <span className={net >= 0 ? "text-ok" : "text-bad"}>
            <RollingUsd value={net} ms={1400} sign suffix={false} />
          </span>
        </Row>
        <Row label="Refunded to operators" hint={`${stats.refunded} verified ${stats.refunded === 1 ? "reentry" : "reentries"}`}>
          <RollingUsd value={stats.totalRefunded} ms={1400} suffix={false} />
        </Row>
        <Row label="Sent to removal fund" hint={`${stats.forfeited} ${stats.forfeited === 1 ? "deadline" : "deadlines"} missed`}>
          <span>
            <RollingUsd value={stats.totalForfeited} ms={1400} suffix={false} />
          </span>
        </Row>
        <Row label="Expiring within 24 h" hint={`${stats.expiring} ${stats.expiring === 1 ? "escrow" : "escrows"}`}>
          {formatUSD(atRisk, { suffix: false })}
        </Row>
        {next && (
          <button type="button" className="block w-full cursor-pointer text-left" onClick={() => app.set({ selectedId: next.id, warpTarget: 1 })}>
            <Row label="Next deadline" hint={`${next.name} · ${formatUSD(next.deposit, { suffix: false })}`}>
              <span className="mono text-[14px] tracking-normal text-ink">{countdown(next.left).replace("T−", "")}</span>
            </Row>
          </button>
        )}
      </dl>

      <div className="hairline my-5" />

      <h2 className="panel-title mb-3">Top operators</h2>
      <ol className="space-y-[9px]">
        {top.map((f) => (
          <li key={f.name} className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-ink/90">{f.name}</span>
            <span className="figure text-ink">{formatUSD(f.amount, { suffix: false })}</span>
          </li>
        ))}
      </ol>

      <div className="hairline my-5" />

      <h2 className="panel-title mb-3">Activity</h2>
      <ul className="scroll-thin -mr-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-3">
        {feed.map((l) => (
          <li key={l.key} className="grid grid-cols-[10px_1fr_auto] items-baseline gap-x-2 text-[12.5px]">
            <span className={`h-[6px] w-[6px] translate-y-[-1px] rounded-full ${DOT[l.tone]}`} />
            <Typed text={l.label} animate={l.live} className="truncate text-ink/90" />
            {l.amount != null ? <span className="figure text-ink">{formatUSD(l.amount, { suffix: false })}</span> : <span />}
            <span />
            <span className="col-span-2 flex items-baseline gap-2 truncate text-[11.5px] text-dim">
              <span className="truncate">{l.target}</span>
              <span className="mono ml-auto shrink-0 text-[10.5px] text-faint">
                {l.live ? utcClock(l.at) : utcDate(l.at).slice(5)}
              </span>
              <TxHash hash={l.txHash} href={l.explorerUrl} className="mono shrink-0 text-[10.5px]" />
            </span>
          </li>
        ))}
      </ul>

      <div className="hairline my-4" />
      <div className="shrink-0 text-[11px] leading-relaxed text-faint">
        <div>
          Orbit data · <span className={tle?.live ? "text-cyan" : undefined}>CelesTrak GP{tle ? ` · ${tle.live}/${tle.total} live TLEs` : " snapshot"}</span>
          {catalog.length > 0 && <span> · {catalog.length} {catalogGroup} catalog</span>} · SGP4
        </div>
        {catalog.length > 0 && (
          <div>
            <span style={{ color: "#5fd4ff" }}>●</span> {kinds.active} active · <span style={{ color: "#ff8a5c" }}>●</span> {kinds.debris} debris
            {kinds.out > 0 && (
              <>
                {" "}
                · <span className="text-faint">●</span> {kinds.out} decayed
              </>
            )}
          </div>
        )}
        <div>Ledger · {source === "fuji" ? "Avalanche Fuji" : source === "local" ? "local node" : "demo dataset"}</div>
      </div>
    </motion.aside>
  );
}

function Bar({ n, of, className }: { n: number; of: number; className: string }) {
  if (n === 0) return null;
  return <div className={`h-full rounded-full transition-[flex-grow] duration-500 ${className}`} style={{ flexGrow: n / of, flexBasis: 0 }} />;
}

function Count({ n, label, className }: { n: number; label: string; className: string }) {
  return (
    <div>
      <div className={`figure text-[22px] leading-none ${className}`}>{n}</div>
      <div className="mt-1 text-[11.5px] text-dim">{label}</div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div className="min-w-0">
        <dt className="text-[13px] text-ink/90">{label}</dt>
        {hint && <div className="truncate text-[11.5px] text-dim">{hint}</div>}
      </div>
      <dd className="figure shrink-0 text-[17px] text-white">{children}</dd>
    </div>
  );
}
