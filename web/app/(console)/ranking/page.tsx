import type { Metadata } from "next";
import Link from "next/link";
import { getEscrows } from "@/lib/escrow";
import { formatUSD } from "@/lib/format";
import { rankOperators } from "@/lib/ranking";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "OrbitClear · Top operadoras" };

export default async function RankingPage() {
  const snapshot = await getEscrows();
  const ranks = rankOperators(snapshot.objects, Date.now());
  const top = Math.max(1, ...ranks.map((r) => r.forfeited));
  const totalForfeited = ranks.reduce((s, r) => s + r.forfeited, 0);
  const simulated = snapshot.objects.some((o) => !o.onChain);

  return (
    <main className="scroll-thin fixed inset-0 overflow-y-auto bg-void">
      <div className="mx-auto max-w-[1100px] px-6 pt-5 pb-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="font-pixel text-[24px] leading-none tracking-[0.12em] text-white">
              ORBITCLEAR
            </Link>
            <span className="text-[12.5px] text-dim">Top operadoras</span>
          </div>
          <Link href="/" className="text-[12.5px] text-dim hover:text-cyan">
            Consola orbital
          </Link>
        </header>

        <section className="mt-6">
          <h1 className="text-[22px] font-medium text-white">¿Quién dejó más basura en órbita?</h1>
          <p className="mt-1 max-w-[720px] text-[13px] text-dim">
            Operadoras ordenadas por el depósito que perdieron: la garantía de satélites que no reingresaron antes de su plazo de retiro y pasó al fondo de
            remoción. En total, {formatUSD(totalForfeited)} decomisados.
          </p>
          {simulated && <p className="mt-1 text-[11.5px] text-faint">Incluye escrows simulados de la demo además de los registrados en el contrato.</p>}
        </section>

        <section className="panel mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="label text-left">
                  <th className="px-5 pt-4 pb-3 font-normal">#</th>
                  <th className="px-3 pt-4 pb-3 font-normal">Operadora</th>
                  <th className="px-3 pt-4 pb-3 font-normal">Decomisado al fondo</th>
                  <th className="px-3 pt-4 pb-3 text-right font-normal">Satélites decomisados</th>
                  <th className="px-3 pt-4 pb-3 text-right font-normal">Devueltos</th>
                  <th className="px-3 pt-4 pb-3 text-right font-normal">Cumplimiento</th>
                  <th className="px-5 pt-4 pb-3 text-right font-normal">Depósito activo</th>
                </tr>
              </thead>
              <tbody>
                {ranks.map((r, i) => (
                  <tr key={r.operator} className="border-t border-white/5">
                    <td className="mono px-5 py-3 text-dim">{i + 1}</td>
                    <td className="px-3 py-3">
                      <span className="text-white">{r.operator}</span>
                      <span className="block text-[11.5px] text-faint">
                        {r.total} {r.total === 1 ? "satélite" : "satélites"}
                        {r.onChain > 0 && ` · ${r.onChain} on-chain`}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-[6px] w-[160px] overflow-hidden rounded-full bg-white/[0.05]">
                          <div className="h-full rounded-full bg-bad" style={{ width: `${(r.forfeited / top) * 100}%` }} />
                        </div>
                        <span className={`figure ${r.forfeited ? "text-white" : "text-faint"}`}>{formatUSD(r.forfeited, { suffix: false })}</span>
                      </div>
                    </td>
                    <td className="figure px-3 py-3 text-right text-ink">{r.forfeitedCount}</td>
                    <td className="figure px-3 py-3 text-right text-ink">{r.refundedCount}</td>
                    <td className="figure px-3 py-3 text-right">
                      {r.compliance === null ? (
                        <span className="text-faint">—</span>
                      ) : (
                        <span className={r.compliance >= 0.5 ? "text-ok" : "text-bad"}>{Math.round(r.compliance * 100)}%</span>
                      )}
                    </td>
                    <td className="figure px-5 py-3 text-right text-ink">{formatUSD(r.locked, { suffix: false })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <p className="mt-3 text-[11.5px] text-faint">
          Cumplimiento: escrows devueltos sobre escrows cerrados (devueltos + decomisados). Un escrow vencido cuenta como decomisado aunque nadie lo
          haya cerrado todavía.
        </p>
      </div>
    </main>
  );
}
