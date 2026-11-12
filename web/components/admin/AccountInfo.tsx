import Link from "next/link";

import { Badge } from "@/components/cuenta-ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/cuenta-ui/card";
import { explorerAddressUrl } from "@/lib/chain";
import type { ContractAddress } from "@/lib/db/schema";
import { shortHash } from "@/lib/format";

const QUICK_LINKS = [
  { href: "/", label: "Consola" },
  { href: "/operador", label: "Operador" },
  { href: "/regulador", label: "Regulador" },
  { href: "/account/account", label: "Mi cuenta" },
];

export function AccountInfo({
  walletCount,
  contracts,
}: {
  walletCount: number;
  contracts: ContractAddress[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuenta</CardTitle>
        <CardDescription>
          Estado general de la base y accesos rápidos.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm">
          <span className="font-medium">{walletCount}</span>{" "}
          {walletCount === 1
            ? "wallet vinculada en total"
            : "wallets vinculadas en total"}
          .
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Contratos registrados</p>
          {contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ningún contrato registrado.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {contracts.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge variant="outline">{c.kind}</Badge>
                    <span className="truncate text-sm">{c.name}</span>
                    {c.notes && (
                      <span className="truncate text-xs text-muted-foreground">
                        {c.notes}
                      </span>
                    )}
                  </div>
                  <a
                    href={explorerAddressUrl(c.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 font-mono text-xs underline-offset-4 hover:underline"
                  >
                    {shortHash(c.address)}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
      <CardFooter className="gap-4 text-sm">
        {QUICK_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="underline-offset-4 hover:underline"
          >
            {l.label}
          </Link>
        ))}
      </CardFooter>
    </Card>
  );
}
