"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { formatUSD, shortHash } from "@/lib/format";
import { computeStats, statusAt } from "@/lib/status";
import { useRealTime } from "@/lib/store";
import type { EscrowSnapshot, PublicChain } from "@/lib/types";
import { connectWallet, type WalletState } from "@/lib/wallet";
import { Button } from "@/components/ui/button";
import { SatelliteDetail } from "./SatelliteDetail";
import { SatelliteCards } from "./SatelliteCards";
import { usdcToUsd, walletErrorText } from "./shared";

/** ESA owns the only real escrow on Fuji (ENVISAT), so the demo opens on live data. */
const DEFAULT_OPERATOR = "ESA";
const REFRESH_MS = 20_000;

// three.js only runs in the browser
const CardCanvas = dynamic(() => import("./CardModel").then((m) => m.CardCanvas), { ssr: false });

export function OperatorDashboard({ initial, chain }: { initial: EscrowSnapshot; chain: PublicChain | null }) {
  const [snap, setSnap] = useState(initial);
  const operators = useMemo(() => computeStats(snap.objects, Date.parse(snap.fetchedAt)).operators.map((o) => o.name), [snap]);
  const [operator, setOperator] = useState(() => (operators.includes(DEFAULT_OPERATOR) ? DEFAULT_OPERATOR : (operators[0] ?? "")));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const now = useRealTime();

  useEffect(() => {
    const h = setInterval(async () => {
      try {
        const res = await fetch("/api/escrows", { cache: "no-store" });
        if (res.ok) setSnap((await res.json()) as EscrowSnapshot);
      } catch {
        /* offline: keep what we have */
      }
    }, REFRESH_MS);
    return () => clearInterval(h);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelectedId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const mine = useMemo(
    () => snap.objects.filter((o) => o.owner === operator).sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline)),
    [snap.objects, operator],
  );
  const t = now || Date.parse(snap.fetchedAt);
  const stats = computeStats(mine, t);
  const expiring = mine.filter((o) => statusAt(o, t) === "EXPIRING");
  const onChain = mine.filter((o) => o.onChain).length;
  const selected = mine.find((o) => o.objectId === selectedId) ?? null;

  async function connect() {
    if (!chain) return;
    setConnecting(true);
    setWalletError(null);
    try {
      setWallet(await connectWallet(chain));
    } catch (e) {
      setWalletError(walletErrorText(e));
    } finally {
      setConnecting(false);
    }
  }

  return (
    <main className="scroll-thin fixed inset-0 overflow-y-auto bg-void">
      <div className="mx-auto max-w-[1320px] px-6 pt-5 pb-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="font-pixel text-[24px] leading-none tracking-[0.12em] text-white">
              ORBITCLEAR
            </Link>
            <span className="text-[12.5px] text-dim">Panel del operador</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[12.5px]">
            <Link href="/" className="text-dim hover:text-cyan">
              Consola orbital
            </Link>
            {wallet ? (
              <span className="mono text-ink" title={wallet.address}>
                {shortHash(wallet.address)} · {formatUSD(usdcToUsd(wallet.balance), { suffix: false })} {chain?.mockUsdc ? "mUSDC" : "USDC"}
              </span>
            ) : (
              <Button size="sm" onClick={connect} disabled={!chain || connecting} title={chain ? undefined : "No hay contrato configurado"}>
                {connecting ? "Conectando…" : "Conectar wallet"}
              </Button>
            )}
          </div>
        </header>
        {walletError && <p className="mt-2 text-right text-[12.5px] text-bad">{walletError}</p>}

        <section className="mt-6">
          <div className="label mb-2">Operador</div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Operador">
            {operators.map((name) => (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={name === operator}
                onClick={() => {
                  setOperator(name);
                  setSelectedId(null);
                }}
                className={`cursor-pointer rounded-full px-3 py-[5px] text-[12.5px] transition-colors ${
                  name === operator ? "bg-cyan/15 text-cyan shadow-[inset_0_0_0_1px_rgb(56_232_255/0.5)]" : "bg-white/[0.04] text-dim hover:text-ink"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </section>

        {expiring.length > 0 && (
          <div role="alert" className="panel mt-5 px-5 py-3 text-[13px] text-warn shadow-[inset_0_0_0_1px_rgb(255_182_39/0.35)]">
            <span className="font-medium">Plazo de retiro en menos de 24 h:</span> {expiring.map((o) => `${o.name} (${o.objectId})`).join(", ")}. Si no
            reingresan antes, el depósito pasa al fondo de remoción.
          </div>
        )}

        <section className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Total label="Depósito bloqueado" value={stats.totalLocked} hint={plural(stats.active + stats.expiring, "escrow abierto", "escrows abiertos")} />
          <Total label="Devuelto al operador" value={stats.totalRefunded} hint={plural(stats.refunded, "reingreso verificado", "reingresos verificados")} tone="text-ok" />
          <Total label="Decomisado al fondo" value={stats.totalForfeited} hint={plural(stats.forfeited, "plazo vencido", "plazos vencidos")} tone={stats.totalForfeited ? "text-bad" : "text-dim"} />
          <div className="panel px-5 py-4">
            <div className="label">Satélites</div>
            <div className="figure mt-1 text-[28px] leading-none text-white">{mine.length}</div>
            <div className="mt-2 text-[11.5px] text-dim">
              {onChain} on-chain · {plural(mine.length - onChain, "simulado", "simulados")}
            </div>
          </div>
        </section>

        <div className="mt-6">
          <SatelliteCards objects={mine} now={t} onOpen={setSelectedId} />
        </div>
      </div>

      <CardCanvas />

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-30 bg-void/60 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
            />
            <motion.aside
              key={`detail-${selected.objectId}`}
              role="dialog"
              aria-label={`Detalle de ${selected.name}`}
              className="panel scroll-thin fixed top-4 right-4 bottom-4 z-40 !bg-[rgb(6_10_20/0.94)] w-[min(440px,calc(100vw-2rem))] overflow-y-auto"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] } }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
            >
              <SatelliteDetail
                object={selected}
                now={now}
                explorer={snap.explorer}
                chain={chain}
                wallet={wallet}
                connecting={connecting}
                onConnect={connect}
                onWallet={setWallet}
                onClose={() => setSelectedId(null)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Total({ label, value, hint, tone = "text-white" }: { label: string; value: number; hint: string; tone?: string }) {
  return (
    <div className="panel px-5 py-4">
      <div className="label">{label}</div>
      <div className={`figure mt-1 text-[28px] leading-none ${tone}`}>
        {formatUSD(value, { suffix: false })}
        <span className="ml-2 text-[12px] font-normal tracking-normal text-dim">USD</span>
      </div>
      <div className="mt-2 text-[11.5px] text-dim">{hint}</div>
    </div>
  );
}
