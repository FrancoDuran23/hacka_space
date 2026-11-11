"use client";

import { useEffect, useRef, useState } from "react";
import { formatUSD, shortHash } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Number that rolls toward its target value. */
export function useCountUp(target: number, ms = 900): number {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  const current = useRef(0);
  useEffect(() => {
    from.current = current.current;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 4);
      current.current = from.current + (target - from.current) * e;
      setValue(current.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

/** Rolling USD amount as its own leaf, so the animation never re-renders a whole panel. */
export function RollingUsd({ value, ms, sign, suffix = true }: { value: number; ms?: number; sign?: boolean; suffix?: boolean }) {
  return <>{formatUSD(useCountUp(value, ms), { sign, suffix })}</>;
}

export function Usd({ value, sign, className }: { value: number; sign?: boolean; className?: string }) {
  return <span className={cn("num whitespace-nowrap", className)}>{formatUSD(value, { sign })}</span>;
}

/** Types its text out, terminal style. */
export function Typed({ text, cps = 70, animate = true, className }: { text: string; cps?: number; animate?: boolean; className?: string }) {
  const [n, setN] = useState(animate ? 0 : text.length);
  useEffect(() => {
    if (!animate) return;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(text.length, Math.floor(((t - t0) / 1000) * cps));
      setN(k);
      if (k < text.length) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, cps, animate]);
  return (
    <span className={className}>
      {text.slice(0, n)}
      {n < text.length && <span className="text-cyan">▮</span>}
    </span>
  );
}

/** Abbreviated transaction hash; links to the explorer only when the transaction really exists on-chain. */
export function TxHash({ hash, href, className }: { hash: string | null | undefined; href?: string | null; className?: string }) {
  if (!hash) return null;
  const label = shortHash(hash);
  if (!href) {
    return (
      <span className={cn("num text-faint", className)} title="Transacción simulada (modo demo)">
        {label}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cn("num text-cyan/80 underline decoration-cyan/30 underline-offset-2 hover:text-cyan", className)} title="Ver en Snowtrace (Fuji)">
      {label} ↗
    </a>
  );
}

export function Section({ title, right, children, className }: { title: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="panel-title">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
