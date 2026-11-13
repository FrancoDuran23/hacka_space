import type { Metadata } from "next";
import Link from "next/link";
import { getEscrows } from "@/lib/escrow";
import { formatUSD, shortHash } from "@/lib/format";
import type { HistoryType } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "OrbitClear · Actividad" };

const LABEL: Record<HistoryType, string> = {
  REGISTERED: "Satélite registrado · depósito bloqueado",
  REENTRY_ATTESTED: "Reingreso acreditado por el relayer",
  REFUNDED: "Depósito devuelto al operador",
  FORFEITED: "Depósito decomisado al fondo de remoción",
};

const TONE: Record<HistoryType, string> = {
  REGISTERED: "bg-cyan",
  REENTRY_ATTESTED: "bg-cyan",
  REFUNDED: "bg-ok",
  FORFEITED: "bg-bad",
};

export default async function ActivityPage() {
  const snapshot = await getEscrows();
  const events = snapshot.objects
    .flatMap((o) => o.history.map((h) => ({ ...h, object: o })))
    .sort((a, b) => b.at.localeCompare(a.at));

  return (
    <main className="scroll-thin fixed inset-0 overflow-y-auto bg-void">
      <div className="mx-auto max-w-[1000px] px-6 pt-5 pb-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="font-pixel text-[24px] leading-none tracking-[0.12em] text-white">
              ORBITCLEAR
            </Link>
            <span className="text-[12.5px] text-dim">Actividad</span>
          </div>
          <Link href="/" className="text-[12.5px] text-dim hover:text-cyan">
            Consola orbital
          </Link>
        </header>

        <section className="mt-6">
          <h1 className="text-[22px] font-medium text-white">Últimas actividades</h1>
          <p className="mt-1 text-[13px] text-dim">
            Registros, reingresos, devoluciones y decomisos de todos los escrows, del más reciente al más antiguo. {events.length} eventos.
          </p>
        </section>

        <section className="panel mt-6 overflow-hidden">
          {events.length === 0 ? (
            <p className="px-5 py-6 text-[13px] text-dim">Todavía no hay actividad.</p>
          ) : (
            <ul>
              {events.map((e) => {
                const href = e.object.onChain && snapshot.explorer ? `${snapshot.explorer}/tx/${e.txHash}` : null;
                return (
                  <li key={`${e.txHash}-${e.type}-${e.object.objectId}`} className="grid grid-cols-[10px_1fr_auto] items-baseline gap-x-3 border-t border-white/5 px-5 py-3 text-[13px] first:border-t-0">
                    <span className={`h-[7px] w-[7px] translate-y-[-1px] rounded-full ${TONE[e.type]}`} />
                    <span className="min-w-0">
                      <span className="text-ink">{LABEL[e.type]}</span>
                      <span className="block truncate text-[12px] text-dim">
                        {e.object.name} · NORAD {e.object.objectId} · {e.by}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="figure block text-ink">{e.amount ? formatUSD(e.amount, { suffix: false }) : "—"}</span>
                      <span className="mono block text-[11px] text-faint">
                        {new Date(e.at).toISOString().slice(0, 16).replace("T", " ")} UTC ·{" "}
                        {href ? (
                          <a href={href} target="_blank" rel="noreferrer" className="text-cyan/80 underline decoration-cyan/30 underline-offset-2 hover:text-cyan">
                            {shortHash(e.txHash)} ↗
                          </a>
                        ) : (
                          shortHash(e.txHash)
                        )}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
