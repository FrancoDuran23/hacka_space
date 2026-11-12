import { formatUnits, isError } from "ethers";
import { DAY } from "@/lib/status";
import type { HistoryType } from "@/lib/types";
import { countdown } from "@/lib/format";

export const BAND_LABEL = ["Baja · < 600 km", "Media · 600–900 km", "Alta · > 900 km"] as const;

export const EVENT_LABEL: Record<HistoryType, string> = {
  REGISTERED: "Registrado · depósito bloqueado",
  REENTRY_ATTESTED: "Reingreso acreditado por el relayer",
  REFUNDED: "Depósito devuelto",
  FORFEITED: "Depósito decomisado al fondo",
};

export const EVENT_TONE: Record<HistoryType, string> = {
  REGISTERED: "text-ink/90",
  REENTRY_ATTESTED: "text-ink/90",
  REFUNDED: "text-ok",
  FORFEITED: "text-bad",
};

export const KIND_LABEL = { "rocket-body": "cuerpo de cohete", satellite: "satélite", fragment: "fragmento" } as const;

/** Time left to the deadline: days while it is far, a live countdown in the last two days. */
export function deadlineLeft(ms: number): string {
  const days = Math.floor(Math.abs(ms) / DAY);
  if (ms <= 0) return days > 0 ? `vencido hace ${span(days)}` : "vencido";
  return ms > 2 * DAY ? `faltan ${span(days)}` : countdown(ms).replace("T−", "");
}

/** Whole years from a year on (365-day years, like the contract), days below that. */
function span(days: number): string {
  if (days < 365) return `${days.toLocaleString("es-AR")} ${days === 1 ? "día" : "días"}`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "año" : "años"}`;
}

/** USDC units (6 decimals) → USD number for formatUSD. */
export const usdcToUsd = (v: bigint) => Number(formatUnits(v, 6));

export function walletErrorText(e: unknown): string {
  if (isError(e, "ACTION_REJECTED")) return "Firma rechazada en la wallet";
  if (isError(e, "CALL_EXCEPTION")) return `El contrato rechazó la transacción: ${e.reason ?? e.shortMessage}`;
  // ethers wraps wallet errors it does not recognise ("could not coalesce error"): show the wallet's own message
  const err = e as { shortMessage?: string; message?: string; error?: { message?: string }; info?: { error?: { message?: string } } };
  const inner = err.error?.message ?? err.info?.error?.message;
  const m = (/could not coalesce/i.test(err.shortMessage ?? "") && inner ? `La wallet respondió: ${inner}` : null) ?? err.shortMessage ?? err.message ?? String(e);
  return m.slice(0, 200);
}
