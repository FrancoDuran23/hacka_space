"use client";

import { formatUSD, utcDate } from "@/lib/format";
import { STATUS_LABEL, statusAt } from "@/lib/status";
import type { DebrisObject } from "@/lib/types";
import { BAND_LABEL, deadlineLeft } from "./shared";

export function SatelliteTable({
  objects,
  now,
  selectedId,
  onSelect,
}: {
  objects: DebrisObject[];
  now: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <section className="panel min-w-0 overflow-hidden">
      <div className="flex items-baseline justify-between px-5 pt-4 pb-3">
        <h2 className="panel-title">Satélites</h2>
        <span className="text-[11.5px] text-dim">ordenados por plazo de retiro</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr className="label text-left">
              <th className="px-5 pb-2 font-normal">Satélite</th>
              <th className="px-3 pb-2 font-normal">Banda</th>
              <th className="px-3 pb-2 text-right font-normal">Depósito</th>
              <th className="px-3 pb-2 font-normal">Estado</th>
              <th className="px-3 pb-2 font-normal">Plazo de retiro</th>
              <th className="px-5 pb-2 font-normal">Origen</th>
            </tr>
          </thead>
          <tbody>
            {objects.map((o) => {
              const st = statusAt(o, now);
              const left = Date.parse(o.deadline) - now;
              const selected = o.objectId === selectedId;
              return (
                <tr
                  key={o.objectId}
                  onClick={() => onSelect(o.objectId)}
                  className={`cursor-pointer border-t border-white/5 transition-colors hover:bg-white/[0.03] ${selected ? "bg-cyan/[0.07]" : ""}`}
                >
                  <td className="px-5 py-3">
                    <button type="button" className="cursor-pointer text-left" onClick={() => onSelect(o.objectId)} aria-pressed={selected}>
                      <span className="block text-white">{o.name}</span>
                      <span className="mono text-[11.5px] text-dim">NORAD {o.objectId}</span>
                    </button>
                  </td>
                  <td className="px-3 py-3 text-ink/90">{BAND_LABEL[o.band].split(" · ")[0]}</td>
                  <td className="figure px-3 py-3 text-right text-ink">{formatUSD(o.deposit, { suffix: false })}</td>
                  <td className="px-3 py-3">
                    <span className="status-chip" data-status={st}>
                      {STATUS_LABEL[st]}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="mono text-ink/90">{utcDate(Date.parse(o.deadline))}</span>
                    <span className={`mono block text-[11.5px] ${st === "EXPIRING" ? "text-warn" : st === "FORFEITED" ? "text-bad" : "text-dim"}`}>
                      {st === "REFUNDED" ? "reingresó a tiempo" : now ? deadlineLeft(left) : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={o.onChain ? "text-cyan" : "text-faint"}>{o.onChain ? "On-chain" : "Simulado"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
