"use client";

import dynamic from "next/dynamic";
import { formatUSD, utcDate } from "@/lib/format";
import { STATUS_LABEL, statusAt } from "@/lib/status";
import type { DebrisObject } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BAND_LABEL, KIND_LABEL, deadlineLeft } from "./shared";

// three.js only runs in the browser
const CardModel = dynamic(() => import("./CardModel").then((m) => m.CardModel), { ssr: false });

export function SatelliteCards({ objects, now, onOpen, onAdd }: { objects: DebrisObject[]; now: number; onOpen: (id: number) => void; onAdd: () => void }) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="panel-title">Satélites</h2>
          <span className="text-[11.5px] text-dim">ordenados por plazo de retiro · click para ver el detalle</span>
        </div>
        <Button size="sm" onClick={onAdd}>
          + Dar de alta un satélite
        </Button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
        {objects.map((o) => {
          const st = statusAt(o, now);
          const left = Date.parse(o.deadline) - now;
          return (
            <button
              key={o.objectId}
              type="button"
              onClick={() => onOpen(o.objectId)}
              data-status={st}
              className="panel group cursor-pointer overflow-hidden text-left transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[inset_0_0_0_1px_var(--st),0_18px_40px_rgb(0_0_0/0.4)] focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--st)]"
            >
              <div className="relative h-[150px] bg-[radial-gradient(ellipse_at_center,rgb(56_232_255/0.08),transparent_70%)]">
                <CardModel kind={o.kind} objectId={o.objectId} status={st} />
                <span className="status-chip absolute top-3 left-3" data-status={st}>
                  {STATUS_LABEL[st]}
                </span>
                <span className={`absolute top-3 right-3 text-[11px] ${o.onChain ? "text-cyan" : "text-faint"}`}>{o.onChain ? "On-chain" : "Simulado"}</span>
              </div>
              <div className="px-4 pt-2 pb-4">
                <div className="truncate text-[15px] font-medium text-white">{o.name}</div>
                <div className="mono text-[11.5px] text-dim">
                  NORAD {o.objectId} · {KIND_LABEL[o.kind]}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
                  <div>
                    <dt className="label">Depósito</dt>
                    <dd className="figure text-[14px] text-ink">{formatUSD(o.deposit, { suffix: false })}</dd>
                  </div>
                  <div>
                    <dt className="label">Banda</dt>
                    <dd className="text-ink/90">{BAND_LABEL[o.band].split(" · ")[0]}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="label">Plazo de retiro</dt>
                    <dd className="mono text-ink/90">
                      {utcDate(Date.parse(o.deadline))}{" "}
                      <span className={st === "EXPIRING" ? "text-warn" : st === "FORFEITED" ? "text-bad" : "text-dim"}>
                        · {st === "REFUNDED" ? "reingresó a tiempo" : deadlineLeft(left)}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
