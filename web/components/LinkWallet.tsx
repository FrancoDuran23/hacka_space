"use client";

import { useState, useSyncExternalStore } from "react";
import { BrowserProvider, type Eip1193Provider } from "ethers";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FUJI, FUJI_CHAIN_ID } from "@/lib/chain";
import { createWalletChallenge, verifyAndLinkWallet } from "@/lib/wallets/actions";

function getEth(): Eip1193Provider | null {
  const e = (globalThis as unknown as { ethereum?: Eip1193Provider }).ethereum;
  return e && typeof e.request === "function" ? e : null;
}

type Status = "idle" | "connecting" | "signing" | "verifying" | "done";

const BUTTON_LABEL: Record<Status, string> = {
  idle: "Vincular wallet",
  connecting: "Conectando…",
  signing: "Firmá el mensaje…",
  verifying: "Verificando…",
  done: "Vincular otra wallet",
};

const noopSubscribe = () => () => {};

export default function LinkWallet() {
  const hasWallet = useSyncExternalStore(
    noopSubscribe,
    () => getEth() !== null,
    () => null,
  );
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("");

  const busy = status === "connecting" || status === "signing" || status === "verifying";

  async function onLink() {
    setError(null);
    setStatus("connecting");
    try {
      const eth = getEth();
      if (!eth) throw new Error("Instalá Core Wallet");

      const provider = new BrowserProvider(eth);
      await provider.send("eth_requestAccounts", []);
      if ((await provider.getNetwork()).chainId !== BigInt(FUJI_CHAIN_ID)) {
        try {
          await eth.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: FUJI.chainId }],
          });
        } catch (e) {
          if ((e as { code?: number }).code === 4902) {
            await eth.request({ method: "wallet_addEthereumChain", params: [FUJI] });
          } else throw e;
        }
      }
      const signer = await new BrowserProvider(eth).getSigner();

      const challenge = await createWalletChallenge(await signer.getAddress());
      if (!challenge.ok) throw new Error(challenge.error);

      setStatus("signing");
      const signature = await signer.signMessage(challenge.message);

      setStatus("verifying");
      const res = await verifyAndLinkWallet(
        challenge.challengeId,
        signature,
        label.trim() || undefined,
      );
      if (!res.ok) throw new Error(res.error);

      setStatus("done");
      setLabel("");
    } catch (e) {
      setStatus("idle");
      const err = e as {
        code?: string;
        shortMessage?: string;
        message?: string;
      };
      setError(
        err.code === "ACTION_REJECTED"
          ? "Cancelaste la firma"
          : (err.shortMessage ?? err.message ?? "Error inesperado"),
      );
    }
  }

  if (hasWallet === null) {
    return <Button disabled>Vincular wallet</Button>;
  }

  if (!hasWallet) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">
          No detectamos ninguna wallet. Core Wallet es la recomendada para
          Avalanche.
        </p>
        <Button asChild variant="outline">
          <a
            href="https://core.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instalá Core Wallet
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex w-full max-w-sm flex-col gap-1.5">
        <Label htmlFor="wallet-label">Etiqueta (opcional)</Label>
        <Input
          id="wallet-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ej.: wallet del operador"
          disabled={busy}
        />
      </div>
      <Button onClick={onLink} disabled={busy}>
        {BUTTON_LABEL[status]}
      </Button>
      {status === "done" && (
        <p className="text-sm text-muted-foreground">
          Wallet vinculada. Ya aparece en tu lista.
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
