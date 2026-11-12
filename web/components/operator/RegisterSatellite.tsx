"use client";

import { useState } from "react";
import Link from "next/link";
import { getAddress } from "ethers";
import { formatUSD, shortHash, utcDate } from "@/lib/format";
import { quoteSatellite, registerSatellite, type SatelliteQuote, type WalletFunds } from "@/lib/satellites/actions";
import type { PublicChain } from "@/lib/types";
import { approveDeposit, connectWallet, mintTestUsdc } from "@/lib/wallet";
import { Button } from "@/components/ui/button";
import { TxHash } from "@/components/hud/bits";
import { OwnerSatellites } from "./OwnerSatellites";
import { BAND_LABEL, usdcToUsd, walletErrorText } from "./shared";

type Busy = "quote" | "mint" | "approve" | "register" | null;
type Message = { tone: "ok" | "bad"; text: string; txHash?: string; href?: string | null; login?: boolean };

/** The contract counts 365-day years. */
const YEAR_MS = 365 * 86_400_000;

const OBJECT_TYPE = { PAY: "satélite", "R/B": "cuerpo de cohete", DEB: "fragmento", UNK: "desconocido" } as Record<string, string>;

/**
 * Alta de un satélite: CelesTrak da los datos, el operador autoriza el depósito exacto de la banda desde
 * una wallet verificada en su cuenta, y el relayer firma register() en el servidor.
 */
export function RegisterSatellite({
  chain,
  owner,
  onClose,
  onRegistered,
}: {
  chain: PublicChain | null;
  /** The operator: SATCAT OWNER code and display name, for the preloaded list. */
  owner: { code: string; label: string };
  onClose: () => void;
  onRegistered: () => void;
}) {
  const [norad, setNorad] = useState("");
  const [quote, setQuote] = useState<SatelliteQuote | null>(null);
  const [wallets, setWallets] = useState<WalletFunds[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [acceptExpired, setAcceptExpired] = useState(false);
  /** Declared end of mission (YYYY-MM-DD): the deadline runs from here (ADR 0004). */
  const [missionEnd, setMissionEnd] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [msg, setMsg] = useState<Message | null>(null);
  const [done, setDone] = useState(false);

  const wallet = wallets.find((w) => w.address === chosen) ?? null;
  const deposit = quote ? BigInt(quote.deposit) : 0n;
  const short = !!wallet && BigInt(wallet.balance) < deposit;
  const authorized = !!wallet && BigInt(wallet.allowance) >= deposit;
  const launchDay = quote ? new Date(quote.launchedAt * 1000).toISOString().slice(0, 10) : undefined;
  // preview only; the server recomputes and validates it before registering
  const missionEndsAt = /^\d{4}-\d{2}-\d{2}$/.test(missionEnd) ? Date.parse(`${missionEnd}T00:00:00Z`) : NaN;
  const deadline = quote && !Number.isNaN(missionEndsAt) && missionEndsAt >= quote.launchedAt * 1000 ? missionEndsAt + quote.bandYears * YEAR_MS : null;
  const expired = deadline !== null && deadline <= Date.now();
  const tx = (hash: string) => (chain?.explorer ? `${chain.explorer}/tx/${hash}` : null);

  async function lookUp(id = Number(norad)) {
    setBusy("quote");
    setMsg(null);
    try {
      const r = await quoteSatellite(id);
      if (!r.ok) {
        setQuote(null);
        setMsg({ tone: "bad", text: r.error, login: r.code === "auth" });
        return;
      }
      setQuote(r.quote);
      setWallets(r.wallets);
      setChosen((c) => (c && r.wallets.some((w) => w.address === c) ? c : (r.wallets[0]?.address ?? null)));
      setAcceptExpired(false);
    } catch (e) {
      setMsg({ tone: "bad", text: walletErrorText(e) });
    } finally {
      setBusy(null);
    }
  }

  /** Signs in the browser with the chosen wallet, which must be the one connected in the extension. */
  async function sign(kind: "mint" | "approve") {
    if (!chain || !wallet || !quote) return;
    setBusy(kind);
    setMsg(null);
    try {
      const connected = await connectWallet(chain);
      if (getAddress(connected.address) !== getAddress(wallet.address)) {
        throw new Error(`Cambiá en tu wallet a la cuenta ${shortHash(wallet.address)} (está conectada ${shortHash(connected.address)}).`);
      }
      const hash = kind === "mint" ? await mintTestUsdc(chain, wallet.address, deposit) : await approveDeposit(chain, deposit);
      setMsg({ tone: "ok", text: kind === "mint" ? "Recibiste mUSDC de prueba." : "Depósito autorizado.", txHash: hash, href: tx(hash) });
      await lookUp(quote.norad);
    } catch (e) {
      setMsg({ tone: "bad", text: walletErrorText(e) });
    } finally {
      setBusy(null);
    }
  }

  async function register() {
    if (!quote || !wallet) return;
    setBusy("register");
    setMsg(null);
    try {
      const r = await registerSatellite(quote.norad, wallet.address, missionEnd);
      if (!r.ok) {
        setMsg({ tone: "bad", text: r.error, login: r.code === "auth" });
        return;
      }
      setDone(true);
      setMsg({ tone: "ok", text: `${quote.name} quedó registrado en Fuji. Aparece en el panel en unos segundos.`, txHash: r.txHash, href: r.explorerUrl });
      onRegistered();
    } catch (e) {
      setMsg({ tone: "bad", text: walletErrorText(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="px-6 py-5">
      <button type="button" onClick={onClose} className="mb-4 cursor-pointer text-[12.5px] text-dim hover:text-cyan">
        ← Volver a los satélites <span className="mono ml-1 text-[10.5px] text-faint">Esc</span>
      </button>
      <h2 className="text-[18px] font-medium text-white">Dar de alta un satélite</h2>
      <p className="mt-1 text-[12.5px] text-dim">
        Los datos salen del catálogo público de CelesTrak. El relayer registra el satélite en el contrato y adjunta el hash del registro crudo.
      </p>

      <form
        className="mt-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!done) lookUp();
        }}
      >
        <label className="sr-only" htmlFor="norad">
          Número NORAD
        </label>
        <input
          id="norad"
          inputMode="numeric"
          placeholder="Número NORAD, ej. 25544"
          value={norad}
          disabled={done}
          onChange={(e) => {
            setNorad(e.target.value.replace(/\D/g, ""));
            setQuote(null);
          }}
          className="mono h-9 min-w-0 flex-1 rounded-[8px] bg-white/[0.05] px-3 text-[13px] text-ink outline-none placeholder:text-faint focus:shadow-[inset_0_0_0_1px_rgb(56_232_255/0.5)]"
        />
        <Button type="submit" disabled={!norad || busy !== null || done}>
          {busy === "quote" ? "Consultando…" : "Consultar"}
        </Button>
      </form>
      {busy === "quote" && <p className="mt-2 text-[11.5px] text-faint">CelesTrak puede tardar unos segundos.</p>}

      {!quote && !done && (
        <OwnerSatellites
          owner={owner.code}
          label={owner.label}
          onPick={(id) => {
            setNorad(String(id));
            lookUp(id);
          }}
        />
      )}

      {quote && (
        <section className="mt-5">
          <div className="text-[15px] text-white">{quote.name}</div>
          <div className="text-[12px] text-dim">
            NORAD {quote.norad} · {OBJECT_TYPE[quote.objectType] ?? quote.objectType} · {quote.owner}
          </div>
          <dl className="mt-4 space-y-[8px] text-[13px]">
            <Row label="Lanzamiento" value={quote.launchDate} mono />
            <Row label="Apogeo" value={`${quote.apogeeKm.toLocaleString("es-AR")} km`} />
            <Row label="Banda orbital" value={BAND_LABEL[quote.band]} />
            <Row label="Depósito de desorbitado" value={formatUSD(quote.depositUsd)} />
          </dl>

          <label className="mt-4 block text-[13px] text-ink/90" htmlFor="mission-end">
            Fin de misión declarado
          </label>
          <input
            id="mission-end"
            type="date"
            value={missionEnd}
            min={launchDay}
            disabled={done}
            onChange={(e) => {
              setMissionEnd(e.target.value);
              setAcceptExpired(false);
            }}
            className="mono mt-1 h-9 w-full rounded-[8px] bg-white/[0.05] px-3 text-[13px] text-ink outline-none [color-scheme:dark] focus:shadow-[inset_0_0_0_1px_rgb(56_232_255/0.5)]"
          />
          <p className="mt-1 text-[11.5px] text-faint">
            La fecha en que el satélite deja de operar. CelesTrak no la publica: la declarás vos y queda registrada en el contrato.
          </p>
          {deadline !== null && (
            <dl className="mt-3 text-[13px]">
              <Row
                label="Plazo de retiro"
                value={`${utcDate(deadline)} (fin de misión + ${quote.bandYears} años)`}
                tone={expired ? "text-bad" : "text-ink"}
                mono
              />
            </dl>
          )}

          {expired && (
            <div role="alert" className="mt-4 rounded-[10px] bg-bad/10 px-4 py-3 text-[12.5px] text-bad shadow-[inset_0_0_0_1px_rgb(255_51_85/0.35)]">
              El plazo de retiro ya venció. Al registrarlo, cualquiera puede cerrar el escrow y el depósito pasa al fondo de remoción.
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-ink">
                <input type="checkbox" checked={acceptExpired} onChange={(e) => setAcceptExpired(e.target.checked)} disabled={done} />
                Entiendo que el depósito queda decomisable
              </label>
            </div>
          )}

          <div className="hairline my-5" />

          <h3 className="panel-title mb-2">Wallet que paga el depósito</h3>
          {wallets.length === 0 ? (
            <p className="text-[12.5px] text-dim">
              No tenés wallets guardadas en tu cuenta. Cerrá este panel, tocá <span className="text-ink">Conectar wallet</span> arriba a la
              derecha, firmá el mensaje y volvé a consultar.
            </p>
          ) : (
            <div className="space-y-2" role="radiogroup" aria-label="Wallet">
              {wallets.map((w) => (
                <label
                  key={w.address}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-[12.5px] ${w.address === chosen ? "bg-cyan/10 shadow-[inset_0_0_0_1px_rgb(56_232_255/0.45)]" : "bg-white/[0.04]"}`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <input type="radio" name="wallet" checked={w.address === chosen} onChange={() => setChosen(w.address)} disabled={done} />
                    <span className="truncate text-ink">{w.label || "Wallet"}</span>
                    <span className="mono text-faint">{shortHash(w.address)}</span>
                  </span>
                  <span className="figure shrink-0 text-ink">
                    {formatUSD(usdcToUsd(BigInt(w.balance)), { suffix: false })} {chain?.mockUsdc ? "mUSDC" : "USDC"}
                  </span>
                </label>
              ))}
            </div>
          )}

          {wallet && !done && (
            <div className="mt-4 flex flex-col gap-2">
              {chain?.mockUsdc && short && (
                <Button variant="violet" onClick={() => sign("mint")} disabled={busy !== null}>
                  {busy === "mint" ? "Minteando…" : `1. Obtener ${formatUSD(quote.depositUsd, { suffix: false })} mUSDC de prueba`}
                </Button>
              )}
              <Button onClick={() => sign("approve")} disabled={busy !== null || short || authorized}>
                {busy === "approve" ? "Esperando la firma…" : authorized ? "✓ Depósito autorizado" : `${short ? "2" : "1"}. Autorizar depósito de ${formatUSD(quote.depositUsd)}`}
              </Button>
              <Button variant="danger" onClick={register} disabled={busy !== null || !authorized || short || deadline === null || (expired && !acceptExpired)}>
                {busy === "register" ? "Registrando en Fuji…" : "Registrar en Fuji"}
              </Button>
              <p className="text-[11.5px] text-faint">Autorizar se firma con tu wallet. El registro lo firma el relayer y no te cuesta gas.</p>
            </div>
          )}
        </section>
      )}

      {msg && (
        <div className={`mt-4 text-[12.5px] ${msg.tone === "ok" ? "text-ok" : "text-bad"}`}>
          {msg.text}
          {msg.login && (
            <>
              {" "}
              <Link href="/login" className="text-cyan underline underline-offset-2">
                Iniciar sesión
              </Link>
            </>
          )}
          {msg.txHash && (
            <div className="mt-1 text-[11.5px] text-dim">
              Transacción <TxHash hash={msg.txHash} href={msg.href} className="mono" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, tone = "text-ink", mono }: { label: string; value: string; tone?: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink/90">{label}</dt>
      <dd className={`${mono ? "mono text-[12.5px]" : "figure"} text-right ${tone}`}>{value}</dd>
    </div>
  );
}
