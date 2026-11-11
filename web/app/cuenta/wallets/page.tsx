import { Suspense } from "react";

import LinkWallet from "@/components/LinkWallet";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { explorerAddressUrl } from "@/lib/chain";
import { listMyWallets, unlinkWallet } from "@/lib/wallets/actions";

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});
const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export default function WalletsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Mis wallets</h1>

      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Cargando…</p>
        }
      >
        <WalletList />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Vincular una wallet</CardTitle>
          <CardDescription>
            Firmás un mensaje con tu wallet de Avalanche Fuji para probar que es
            tuya. No cuesta gas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LinkWallet />
        </CardContent>
      </Card>
    </main>
  );
}

async function WalletList() {
  const list = await listMyWallets();

  if (list.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no vinculaste ninguna wallet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {list.map((w) => (
        <li
          key={w.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
        >
          <div className="flex min-w-0 flex-col">
            <a
              href={explorerAddressUrl(w.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm underline-offset-4 hover:underline"
            >
              {shortAddr(w.address)}
            </a>
            <span className="text-xs text-muted-foreground">
              {[w.label, `Verificada el ${dateFmt.format(w.verifiedAt)}`]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          <form
            action={async () => {
              "use server";
              await unlinkWallet(w.id);
            }}
          >
            <Button type="submit" variant="ghost" size="sm">
              Desvincular
            </Button>
          </form>
        </li>
      ))}
    </ul>
  );
}
