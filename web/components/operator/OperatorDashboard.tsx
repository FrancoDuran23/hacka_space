"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { formatUSD, shortHash } from "@/lib/format";
import { computeStats, statusAt } from "@/lib/status";
import { useRealTime } from "@/lib/store";
import type { EscrowSnapshot, PublicChain } from "@/lib/types";
import { getAddress } from "ethers";
import { createWalletChallenge, listMyWallets, unlinkWallet, verifyAndLinkWallet } from "@/lib/wallets/actions";
import { connectWallet, signMessage, type WalletState } from "@/lib/wallet";
import { Button } from "@/components/ui/button";
import { SatelliteDetail } from "./SatelliteDetail";
import { RegisterSatellite } from "./RegisterSatellite";
import { SatelliteCards } from "./SatelliteCards";
import { usdcToUsd, walletErrorText } from "./shared";

/** The dashboard belongs to one operator. ESA owns the only real escrow on Fuji (ENVISAT), so the demo shows live data. */
const OPERATOR = "ESA";
/** The operator's OWNER code in CelesTrak's SATCAT (same as its name for ESA). */
const OPERATOR_SATCAT = "ESA";
const REFRESH_MS = 20_000;

// three.js only runs in the browser
const CardCanvas = dynamic(() => import("./CardModel").then((m) => m.CardCanvas), { ssr: false });

export function OperatorDashboard({ initial, chain, account }: { initial: EscrowSnapshot; chain: PublicChain | null; account: { name: string } | null }) {
  const [snap, setSnap] = useState(initial);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  /** The connected wallet is saved to the signed-in account (verified by signature). */
  const [saved, setSaved] = useState(false);
  const [myWallets, setMyWallets] = useState<{ id: string; address: string; label: string | null }[]>([]);
  const [connecting, setConnecting] = useState(false);
  const now = useRealTime();

  async function refresh() {
    try {
      const res = await fetch("/api/escrows", { cache: "no-store" });
      if (res.ok) setSnap((await res.json()) as EscrowSnapshot);
    } catch {
      /* offline: keep what we have */
    }
  }

  useEffect(() => {
    const h = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(h);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSelectedId(null);
      setAdding(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const mine = useMemo(
    () => snap.objects.filter((o) => o.owner === OPERATOR || o.fromChain).sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline)),
    [snap.objects],
  );
  const t = now || Date.parse(snap.fetchedAt);
  const stats = computeStats(mine, t);
  const expiring = mine.filter((o) => statusAt(o, t) === "EXPIRING");
  const onChain = mine.filter((o) => o.onChain).length;
  const selected = mine.find((o) => o.objectId === selectedId) ?? null;

  async function loadMyWallets() {
    if (!account) return;
    try {
      setMyWallets((await listMyWallets()).map((w) => ({ id: w.id, address: w.address, label: w.label })));
    } catch {
      /* session expired: the header already offers to sign in */
    }
  }

  useEffect(() => {
    if (!account) return;
    listMyWallets()
      .then((rows) => setMyWallets(rows.map((w) => ({ id: w.id, address: w.address, label: w.label }))))
      .catch(() => {});
  }, [account]);

  async function unlink(id: string, address: string) {
    if (!window.confirm(`¿Desvincular ${shortHash(address)} de tu cuenta? Vas a tener que firmar de nuevo para volver a usarla.`)) return;
    const r = await unlinkWallet(id);
    if (!r.ok) setWalletError(r.error);
    if (wallet && getAddress(wallet.address) === getAddress(address)) setSaved(false);
    await loadMyWallets();
  }

  /** Links the wallet to the account with a signed one-time challenge, unless it already is. */
  async function saveToAccount(address: string) {
    if (!chain) return;
    const mine = await listMyWallets();
    if (mine.some((w) => getAddress(w.address) === getAddress(address))) return;
    const challenge = await createWalletChallenge(address);
    if (!challenge.ok) throw new Error(challenge.error);
    const signature = await signMessage(chain, challenge.message);
    const linked = await verifyAndLinkWallet(challenge.challengeId, signature, "MetaMask");
    if (!linked.ok) throw new Error(linked.error);
  }

  async function connect(pickAccount = false) {
    if (!chain) return;
    setConnecting(true);
    setWalletError(null);
    try {
      const w = await connectWallet(chain, pickAccount);
      setSaved(false);
      setWallet(w);
      if (account) {
        await saveToAccount(w.address);
        setSaved(true);
        await loadMyWallets();
      }
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
            {account ? (
              <Link href="/account/account" className="text-dim hover:text-cyan" title="Perfil y seguridad de la cuenta">
                Mi cuenta · <span className="text-ink">{account.name}</span>
              </Link>
            ) : (
              <Link href="/login" className="text-dim hover:text-cyan">
                Iniciar sesión
              </Link>
            )}
            {wallet ? (
              <span className="flex items-center gap-2">
                <span className="mono text-ink" title={wallet.address}>
                  {shortHash(wallet.address)} · {formatUSD(usdcToUsd(wallet.balance), { suffix: false })} {chain?.mockUsdc ? "mUSDC" : "USDC"}
                </span>
                {saved ? (
                  <span className="text-[11.5px] text-ok">✓ guardada en tu cuenta</span>
                ) : !account ? (
                  <span className="text-[11.5px] text-faint">iniciá sesión para guardarla</span>
                ) : (
                  <button type="button" onClick={() => connect()} className="cursor-pointer text-[11.5px] text-cyan underline underline-offset-2">
                    guardar en mi cuenta
                  </button>
                )}
              </span>
            ) : null}
            {wallet || myWallets.length > 0 ? (
              <Button size="sm" onClick={() => connect(true)} disabled={!chain || connecting} title="Elegí otra cuenta en tu wallet y firmá para sumarla">
                {connecting ? "Conectando…" : "+ Agregar wallet"}
              </Button>
            ) : (
              <Button size="sm" onClick={() => connect()} disabled={!chain || connecting} title={chain ? undefined : "No hay contrato configurado"}>
                {connecting ? "Conectando…" : "Conectar wallet"}
              </Button>
            )}
          </div>
        </header>
        {walletError && <p className="mt-2 text-right text-[12.5px] text-bad">{walletError}</p>}

        <section className="mt-6">
          <div className="label">Operador</div>
          <h1 className="mt-1 text-[22px] font-medium leading-tight text-white">
            {OPERATOR}
            {mine[0] && <span className="ml-2 text-[13px] font-normal text-dim">{mine[0].country}</span>}
          </h1>
          {account && myWallets.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
              <span className="label">Wallets de tu cuenta</span>
              {myWallets.map((w) => (
                <span key={w.id} className="flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-[3px]">
                  <span className="mono text-ink" title={w.address}>
                    {shortHash(w.address)}
                  </span>
                  {w.label && <span className="text-faint">{w.label}</span>}
                  <button type="button" onClick={() => unlink(w.id, w.address)} className="cursor-pointer text-faint hover:text-bad" aria-label={`Desvincular ${w.address}`}>
                    Desvincular
                  </button>
                </span>
              ))}
            </div>
          )}
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
          <SatelliteCards objects={mine} now={t} onOpen={setSelectedId} onAdd={() => (setSelectedId(null), setAdding(true))} />
        </div>
      </div>

      <CardCanvas />

      <AnimatePresence>
        {(selected || adding) && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-30 bg-void/60 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => (setSelectedId(null), setAdding(false))}
            />
            <motion.aside
              key={selected ? `detail-${selected.objectId}` : "register"}
              role="dialog"
              aria-label={selected ? `Detalle de ${selected.name}` : "Dar de alta un satélite"}
              className="panel scroll-thin fixed top-4 right-4 bottom-4 z-40 !bg-[rgb(6_10_20/0.94)] w-[min(440px,calc(100vw-2rem))] overflow-y-auto"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] } }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
            >
              {selected ? (
                <SatelliteDetail
                  object={selected}
                  now={now}
                  explorer={snap.explorer}
                  chain={chain}
                  wallet={wallet}
                  connecting={connecting}
                  onConnect={() => connect()}
                  onWallet={setWallet}
                  onClose={() => setSelectedId(null)}
                />
              ) : (
                <RegisterSatellite
                  chain={chain}
                  owner={{ code: OPERATOR_SATCAT, label: OPERATOR }}
                  onClose={() => setAdding(false)}
                  onRegistered={() => {
                    refresh();
                    setTimeout(refresh, 8_000);
                  }}
                />
              )}
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
