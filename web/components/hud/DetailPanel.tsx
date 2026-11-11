"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { requestDeorbit } from "@/lib/actions";
import { countdown, formatUSD, initials, utcDate } from "@/lib/format";
import { satrecFor, telemetry } from "@/lib/orbit";
import { STATUS_LABEL, balanceSeries, netBalanceAt, statusAt } from "@/lib/status";
import { app, useApp, useSimTime } from "@/lib/store";
import type { DebrisObject, HistoryType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RollingUsd, TxHash } from "./bits";

const EVENT_LABEL: Record<HistoryType, string> = {
  REGISTERED: "Registered · deposit locked",
  REENTRY_ATTESTED: "Reentry attested",
  REFUNDED: "Deposit refunded",
  FORFEITED: "Deposit forfeited",
};
const EVENT_TONE: Record<HistoryType, string> = {
  REGISTERED: "text-ink/90",
  REENTRY_ATTESTED: "text-ink/90",
  REFUNDED: "text-ink/90",
  FORFEITED: "text-ink/90",
};
const BAND_LABEL = ["Low band · < 600 km", "Mid band · 600–900 km", "High band · > 900 km"] as const;
const KIND_LABEL = { "rocket-body": "rocket body", satellite: "defunct satellite", fragment: "fragment" } as const;

export function DetailPanel({ object: o }: { object: DebrisObject }) {
  const explorer = useApp((s) => s.explorer);
  const source = useApp((s) => s.source);
  const run = useApp((s) => s.runs[o.objectId]);
  const tick = useSimTime();
  const now = tick || Date.now();

  const st = statusAt(o, now);
  const net = netBalanceAt(o, now);
  const lockedNow = st === "ACTIVE" || st === "EXPIRING" ? o.deposit : 0;
  const tm = useMemo(() => telemetry(satrecFor(o.tle), new Date(now)), [o.tle, now]);
  const inFlight = run?.phase === "falling" || run?.phase === "burned" || st === "REFUNDED";
  const left = Date.parse(o.deadline) - now;
  const canDeorbit = (st === "ACTIVE" || st === "EXPIRING") && (!run || run.phase === "failed");
  const onChain = o.onChain && source !== "demo" && !!explorer;
  const txUrl = (hash: string) => (onChain ? `${explorer}/tx/${hash}` : null);
  const history = useMemo(() => [...o.history].sort((a, b) => b.at.localeCompare(a.at)), [o.history]);

  return (
    <motion.aside
      data-status={st}
      className="panel pointer-events-auto fixed right-4 top-[76px] bottom-4 z-20 flex w-[30vw] min-w-[350px] max-w-[440px] flex-col px-6 py-6"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0, transition: { duration: 0.55, delay: 0.55, ease: [0.2, 0.8, 0.2, 1] } }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.3 } }}
    >
      <div className="scroll-thin -mr-3 flex min-h-0 flex-1 flex-col overflow-y-auto pr-3">
        {/* identity */}
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white/6 text-[13px] font-medium text-ink">
            {initials(o.owner)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[18px] font-medium leading-tight text-white">{o.name}</div>
            <div className="truncate text-[12.5px] text-dim">
              {o.owner} · {o.country} · {KIND_LABEL[o.kind]}
            </div>
          </div>
          <span className="status-chip shrink-0" data-status={st}>
            {STATUS_LABEL[st]}
          </span>
        </div>

        {/* net balance */}
        <div className="mt-6">
          <div className="label">Net balance</div>
          <div className={`figure mt-1 text-[clamp(34px,3.3vw,46px)] leading-none ${net >= 0 ? "text-ok" : "text-bad"}`}>
            <RollingUsd value={net} ms={700} sign suffix={false} />
            <span className="ml-2 text-[13px] font-normal tracking-normal opacity-60">USD</span>
          </div>
          <div className="mt-2 text-[11.5px] text-dim">
            Deposit backing the removal minus collision risk accrued, {formatUSD(o.riskPerDay, { suffix: false })} per day
          </div>
          <Sparkline object={o} now={now} positive={net >= 0} />
        </div>

        <dl className="mt-5 space-y-[9px]">
          <Stat label="Locked now" value={formatUSD(lockedNow)} />
          <Stat label={st === "REFUNDED" ? "Refunded to operator" : st === "FORFEITED" ? "Sent to removal fund" : "Deorbit deposit"} value={formatUSD(o.deposit)} />
          <Stat
            label={st === "REFUNDED" ? "Settled" : st === "FORFEITED" ? "Overdue by" : "Time to deadline"}
            value={st === "REFUNDED" ? (o.settledAt ? utcDate(Date.parse(o.settledAt)) : "—") : countdown(left).replace("T−", "").replace("−", "")}
            mono
          />
        </dl>

        <div className="hairline my-5" />

        <dl className="grid grid-cols-3 gap-3">
          <Mini label="Altitude" value={inFlight || !tm ? "Reentry" : `${tm.altitudeKm.toFixed(0)} km`} />
          <Mini label="Velocity" value={inFlight || !tm ? "—" : `${tm.speedKms.toFixed(2)} km/s`} />
          <Mini label="NORAD ID" value={String(o.objectId)} />
        </dl>

        <div className="hairline my-5" />

        <h2 className="panel-title mb-3">Deposit</h2>
        <dl className="space-y-[9px]">
          <Stat label="Operator" value={`${o.owner} · ${o.country}`} />
          <Stat label="Orbital band" value={BAND_LABEL[o.band]} />
          <Stat label="Deadline" value={utcDate(Date.parse(o.deadline))} mono />
        </dl>

        <div className="hairline my-5" />

        <h2 className="panel-title mb-3">Transactions</h2>
        <ul className="space-y-3">
          {history.map((h) => (
            <li key={h.txHash + h.type} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 text-[12.5px]">
              <span className={`truncate ${EVENT_TONE[h.type]}`}>{EVENT_LABEL[h.type]}</span>
              <span className="figure text-ink">{h.amount ? formatUSD(h.amount, { suffix: false }) : "—"}</span>
              <span className="truncate text-[11.5px] text-dim">
                {h.by} · {utcDate(Date.parse(h.at))}
              </span>
              <TxHash hash={h.txHash} href={txUrl(h.txHash)} className="mono text-[10.5px]" />
            </li>
          ))}
        </ul>
      </div>

      {/* actions */}
      <div className="mt-4 shrink-0">
        {run && run.phase !== "failed" && (
          <div className="mb-3 text-[12.5px]">
            {run.phase === "verifying" && <span className="blink-soft text-cyan">Relayer verifying reentry against tracking data…</span>}
            {run.phase === "falling" && <span className="text-[#ffb089]">Reentry verified · refunding {formatUSD(run.refund)}</span>}
            {run.phase === "burned" && (
              <span className="text-ink">
                Deposit refunded · {formatUSD(run.refund)} to {run.operator}
              </span>
            )}
            {run.txHash && (
              <div className="mt-1 text-[11.5px] text-dim">
                Transaction <TxHash hash={run.txHash} href={run.explorerUrl} className="mono" />
              </div>
            )}
          </div>
        )}
        {run?.phase === "failed" && <div className="mb-3 text-[12.5px] text-bad">Relayer: {run.error}</div>}
        <div className="flex items-center gap-2">
          <Button variant="danger" size="lg" className="flex-1" disabled={!canDeorbit} onClick={() => requestDeorbit(o.objectId)}>
            {run?.phase === "verifying" ? "Verifying…" : st === "REFUNDED" || run?.phase === "burned" ? "Deposit refunded" : st === "FORFEITED" ? "Deposit forfeited" : "Deorbit"}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => app.set({ selectedId: null })}>
            Back to orbit <span className="mono ml-1 text-[10.5px] text-faint">Esc</span>
          </Button>
        </div>
      </div>
    </motion.aside>
  );
}

function Stat({ label, value, tone = "text-ink", mono }: { label: string; value: string; tone?: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[13px] text-ink/90">{label}</dt>
      <dd className={`${mono ? "mono text-[14px]" : "figure text-[16px]"} ${tone}`}>{value}</dd>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="figure mt-[2px] text-[14px] text-ink">{value}</dd>
    </div>
  );
}

/** Net balance over the life of the escrow. */
function Sparkline({ object, now, positive }: { object: DebrisObject; now: number; positive: boolean }) {
  const W = 480;
  const H = 76;
  // re-sample every simulated 10 minutes at most
  const bucket = Math.floor(now / 600_000);
  const geo = useMemo(() => {
    const pts = balanceSeries(object, bucket * 600_000, 56);
    const lo = Math.min(0, ...pts.map((p) => p.v));
    const hi = Math.max(0, ...pts.map((p) => p.v));
    const span = hi - lo || 1;
    const x = (i: number) => (i / (pts.length - 1)) * W;
    const y = (v: number) => 6 + (1 - (v - lo) / span) * (H - 12);
    const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
    return { line, zero: y(0), lastY: y(pts[pts.length - 1].v) };
  }, [object, bucket]);
  const c = positive ? "#a6e9ff" : "#6a5cff";
  const gid = `g${object.objectId}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-[64px] w-full" preserveAspectRatio="none" role="img" aria-label="Balance neto en el tiempo">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={c} stopOpacity="0.16" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" x2={W} y1={geo.zero} y2={geo.zero} stroke="#7f95b3" strokeOpacity="0.45" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
      <path d={`${geo.line} L${W},${geo.zero} L0,${geo.zero} Z`} fill={`url(#${gid})`} />
      <path d={geo.line} fill="none" stroke={c} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <circle cx={W - 3} cy={geo.lastY} r="3" fill={c} />
    </svg>
  );
}
