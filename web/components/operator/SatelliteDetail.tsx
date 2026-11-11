"use client";

import { formatUSD, shortHash, utcDate } from "@/lib/format";
import { satrecFor, telemetry } from "@/lib/orbit";
import { STATUS_LABEL, statusAt } from "@/lib/status";
import type { DebrisObject, PublicChain } from "@/lib/types";
import type { WalletState } from "@/lib/wallet";
import { TxHash } from "@/components/hud/bits";
import { DepositAction } from "./DepositAction";
import { BAND_LABEL, EVENT_LABEL, EVENT_TONE, KIND_LABEL, deadlineLeft } from "./shared";

export function SatelliteDetail({
  object: o,
  now,
  explorer,
  chain,
  wallet,
  connecting,
  onConnect,
  onWallet,
  onClose,
}: {
  object: DebrisObject;
  now: number;
  explorer: string;
  chain: PublicChain | null;
  wallet: WalletState | null;
  connecting: boolean;
  onConnect: () => void;
  onWallet: (w: WalletState) => void;
  onClose: () => void;
}) {
  const t = now || Date.now();
  const st = statusAt(o, t);
  const left = Date.parse(o.deadline) - t;
  const tm = st === "REFUNDED" ? null : telemetry(satrecFor(o.tle), new Date(t));
  const txUrl = (hash: string) => (o.onChain && explorer ? `${explorer}/tx/${hash}` : null);
  const history = [...o.history].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="px-6 py-5">
      <button type="button" onClick={onClose} className="mb-4 cursor-pointer text-[12.5px] text-dim hover:text-cyan">
        ← Volver a los satélites <span className="mono ml-1 text-[10.5px] text-faint">Esc</span>
      </button>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[18px] font-medium leading-tight text-white">{o.name}</div>
          <div className="truncate text-[12.5px] text-dim">
            NORAD {o.objectId} · {KIND_LABEL[o.kind]} · {o.massKg.toLocaleString("es-AR")} kg
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="status-chip" data-status={st}>
            {STATUS_LABEL[st]}
          </span>
          <span className={`text-[11.5px] ${o.onChain ? "text-cyan" : "text-faint"}`}>{o.onChain ? "On-chain" : "Simulado"}</span>
        </div>
      </div>

      <dl className="mt-5 space-y-[9px]">
        <Stat label="Depósito de desorbitado" value={formatUSD(o.deposit)} />
        <Stat label="Banda orbital" value={BAND_LABEL[o.band]} />
        <Stat label="Plazo de retiro" value={utcDate(Date.parse(o.deadline))} mono />
        <Stat
          label={st === "REFUNDED" ? "Liquidado" : "Tiempo restante"}
          value={st === "REFUNDED" ? (o.settledAt ? utcDate(Date.parse(o.settledAt)) : "—") : now ? deadlineLeft(left) : "—"}
          tone={st === "FORFEITED" ? "text-bad" : st === "EXPIRING" ? "text-warn" : "text-ink"}
          mono
        />
        <Stat label="Altitud actual" value={tm ? `${tm.altitudeKm.toFixed(0)} km` : "Reingresó"} />
        <Stat label="Velocidad" value={tm ? `${tm.speedKms.toFixed(2)} km/s` : "—"} />
      </dl>

      {o.onChain && (st === "ACTIVE" || st === "EXPIRING") && (
        <p className="mt-4 text-[12.5px] text-dim">
          La devolución es automática: cuando el relayer acredita el reingreso antes del plazo, el depósito vuelve a tu wallet.
        </p>
      )}
      {o.onChain && st === "FORFEITED" && o.status === "ACTIVE" && (
        <p className="mt-4 text-[12.5px] text-bad">Plazo vencido: cualquiera puede cerrar el escrow y el depósito pasa al fondo de remoción.</p>
      )}

      <div className="hairline my-5" />

      <h2 className="panel-title mb-3">Historial</h2>
      {history.length === 0 ? (
        <p className="text-[12.5px] text-dim">Sin transacciones leídas todavía.</p>
      ) : (
        <ul className="space-y-3">
          {history.map((h) => (
            <li key={h.txHash + h.type} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 text-[12.5px]">
              <span className={`truncate ${EVENT_TONE[h.type]}`}>{EVENT_LABEL[h.type]}</span>
              <span className="figure text-ink">{h.amount ? formatUSD(h.amount, { suffix: false }) : "—"}</span>
              <span className="truncate text-[11.5px] text-dim">
                {h.by} · {utcDate(Date.parse(h.at))}
              </span>
              <TxHash hash={h.txHash} href={txUrl(h.txHash)} className="mono text-[10.5px]" />
              {h.dataHash && (
                <span className="col-span-2 mono truncate text-[10.5px] text-faint" title={h.dataHash}>
                  Hash del dato crudo {shortHash(h.dataHash, 10, 8)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {!o.onChain && (st === "ACTIVE" || st === "EXPIRING") && (
        <DepositAction object={o} chain={chain} wallet={wallet} connecting={connecting} onConnect={onConnect} onWallet={onWallet} />
      )}
    </div>
  );
}

function Stat({ label, value, tone = "text-ink", mono }: { label: string; value: string; tone?: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[13px] text-ink/90">{label}</dt>
      <dd className={`${mono ? "mono text-[13.5px]" : "figure text-[15px]"} text-right ${tone}`}>{value}</dd>
    </div>
  );
}
