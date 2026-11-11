"use client";

import { useEffect, useState } from "react";
import { parseUnits } from "ethers";
import { formatUSD } from "@/lib/format";
import type { DebrisObject, PublicChain } from "@/lib/types";
import { approveDeposit, bandDeposit, mintTestUsdc, readWallet, type WalletState } from "@/lib/wallet";
import { Button } from "@/components/ui/button";
import { TxHash } from "@/components/hud/bits";
import { usdcToUsd, walletErrorText } from "./shared";

type Busy = "mint" | "approve" | null;
type Message = { tone: "ok" | "bad"; text: string; txHash?: string };

/** A simulated escrow becomes real when the operator authorizes the exact band deposit and the relayer registers it. */
export function DepositAction({
  object: o,
  chain,
  wallet,
  connecting,
  onConnect,
  onWallet,
}: {
  object: DebrisObject;
  chain: PublicChain | null;
  wallet: WalletState | null;
  connecting: boolean;
  onConnect: () => void;
  onWallet: (w: WalletState) => void;
}) {
  const [onChainAmount, setOnChainAmount] = useState<bigint | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [msg, setMsg] = useState<Message | null>(null);

  useEffect(() => {
    if (!chain || !wallet) return;
    let live = true;
    bandDeposit(chain, o.band)
      .then((v) => live && setOnChainAmount(v))
      .catch(() => live && setOnChainAmount(null));
    return () => {
      live = false;
    };
  }, [chain, wallet, o.band]);

  // The contract's band amount is the source of truth; the dataset's is the fallback before connecting.
  const needed = onChainAmount ?? parseUnits(String(o.deposit), 6);
  const neededUsd = usdcToUsd(needed);
  const authorized = !!wallet && wallet.allowance === needed;
  const short = !!wallet && wallet.balance < needed;
  const tx = (hash: string) => (chain?.explorer ? `${chain.explorer}/tx/${hash}` : null);

  async function run(kind: Exclude<Busy, null>) {
    if (!chain || !wallet) return;
    setBusy(kind);
    setMsg(null);
    try {
      const hash = kind === "mint" ? await mintTestUsdc(chain, wallet.address, needed) : await approveDeposit(chain, needed);
      onWallet(await readWallet(chain, wallet.address));
      setMsg({
        tone: "ok",
        text: kind === "mint" ? `Recibiste ${formatUSD(neededUsd)} en mUSDC de prueba` : `Depósito autorizado: ${formatUSD(neededUsd)}`,
        txHash: hash,
      });
    } catch (e) {
      setMsg({ tone: "bad", text: walletErrorText(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-5 rounded-[10px] bg-white/[0.035] px-4 py-4">
      <h3 className="panel-title">Pasar a on-chain</h3>
      <p className="mt-1 text-[12.5px] text-dim">
        Este escrow es simulado. Autorizá al contrato a cobrar el depósito de su banda, <span className="text-ink">{formatUSD(neededUsd)}</span>. Después el
        relayer registra el satélite con el dato de CelesTrak y cobra el depósito de tu wallet.
      </p>

      {!chain ? (
        <p className="mt-3 text-[12.5px] text-warn">No hay contrato configurado: el panel está en modo demo.</p>
      ) : !wallet ? (
        <Button className="mt-3 w-full" onClick={onConnect} disabled={connecting}>
          {connecting ? "Conectando…" : "Conectar wallet para autorizar"}
        </Button>
      ) : (
        <>
          <dl className="mt-3 space-y-[7px] text-[12.5px]">
            <Row label={chain.mockUsdc ? "Saldo mUSDC" : "Saldo USDC"} value={formatUSD(usdcToUsd(wallet.balance))} tone={short ? "text-warn" : "text-ink"} />
            <Row label="Autorización actual al escrow" value={formatUSD(usdcToUsd(wallet.allowance))} tone={authorized ? "text-ok" : "text-ink"} />
          </dl>
          <div className="mt-3 flex flex-col gap-2">
            {chain.mockUsdc && short && (
              <Button variant="violet" onClick={() => run("mint")} disabled={busy !== null}>
                {busy === "mint" ? "Minteando…" : `Obtener ${formatUSD(neededUsd, { suffix: false })} mUSDC de prueba`}
              </Button>
            )}
            <Button onClick={() => run("approve")} disabled={busy !== null || authorized || short}>
              {busy === "approve" ? "Esperando la firma…" : authorized ? "Depósito autorizado" : `Autorizar depósito de ${formatUSD(neededUsd)}`}
            </Button>
          </div>
          <p className="mt-2 text-[11.5px] text-faint">La autorización reemplaza a la anterior: no se suma.</p>
        </>
      )}

      {msg && (
        <div className={`mt-3 text-[12.5px] ${msg.tone === "ok" ? "text-ok" : "text-bad"}`}>
          {msg.text}
          {msg.txHash && (
            <div className="mt-1 text-[11.5px] text-dim">
              Transacción <TxHash hash={msg.txHash} href={tx(msg.txHash)} className="mono" />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink/90">{label}</dt>
      <dd className={`figure ${tone}`}>{value}</dd>
    </div>
  );
}
