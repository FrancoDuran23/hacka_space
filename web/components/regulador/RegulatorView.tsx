import Link from "next/link";

import { Badge } from "@/components/cuenta-ui/badge";
import { Button } from "@/components/cuenta-ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/cuenta-ui/card";
import { explorerAddressUrl } from "@/lib/chain";
import { formatUSD, shortHash, utcClock, utcDate } from "@/lib/format";
import { STATUS_COLOR } from "@/lib/status";
import type { DataSource, EscrowStatus } from "@/lib/types";
import { availableOperators } from "@/lib/regulador/actions";
import type { OperatorSummary, RegulatorDashboard } from "@/lib/regulador/types";

import { ObjectCard } from "./ObjectCard";
import { OperatorClaims } from "./OperatorClaims";

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const SOURCE_LABEL: Record<DataSource, string> = {
  fuji: "desde Avalanche Fuji",
  local: "del dataset local",
  demo: "de la demo",
};

const STATUS_PLURAL: Record<EscrowStatus, string> = {
  ACTIVE: "activos",
  EXPIRING: "por vencer",
  FORFEITED: "decomisados",
  REFUNDED: "devueltos",
};

const ORDER: EscrowStatus[] = ["ACTIVE", "EXPIRING", "FORFEITED", "REFUNDED"];

/** Server components render once per request; keep Date.now out of the render body (react-hooks/purity). */
function nowMs(): number {
  return Date.now();
}

export async function RegulatorView({ dash }: { dash: RegulatorDashboard }) {
  const now = nowMs();
  const operators = await availableOperators();
  const claimed = dash.operators.map((s) => s.operator);
  const { regulator, wallets, snapshot } = dash;
  const fetchedAt = Date.parse(snapshot.fetchedAt);

  return (
    <>
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {regulator.agency}
          </h1>
          <Badge>Regulador</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Código {regulator.agencyCode} · Panel de supervisión de escrows
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wallets verificadas</CardTitle>
          <CardDescription>
            Credencial del regulador en Avalanche Fuji.
          </CardDescription>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href="/operador">Gestionar wallets</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {wallets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no vinculaste ninguna wallet.{" "}
              <Link
                href="/operador"
                className="underline underline-offset-4"
              >
                Vincular una wallet
              </Link>
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {wallets.map((w) => (
                <li
                  key={w.address}
                  className="flex min-w-0 items-baseline gap-2 text-sm"
                >
                  <a
                    href={explorerAddressUrl(w.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono underline-offset-4 hover:underline"
                  >
                    {shortHash(w.address)}
                  </a>
                  <span className="truncate text-xs text-muted-foreground">
                    {[w.label, `Verificada el ${dateFmt.format(w.verifiedAt)}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operadores</CardTitle>
          <CardDescription>
            Adjudicá los códigos de operador que tu agencia supervisa. Los
            escrows de esos operadores aparecen abajo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OperatorClaims operators={operators} claimed={claimed} />
        </CardContent>
      </Card>

      {dash.operators.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no supervisás ningún operador. Adjudicá un código en la sección
          de arriba para ver sus escrows.
        </p>
      ) : (
        dash.operators.map((summary) => (
          <OperatorSection
            key={summary.operator}
            summary={summary}
            now={now}
            explorer={snapshot.explorer}
          />
        ))
      )}

      <p className="text-xs text-muted-foreground">
        Datos {SOURCE_LABEL[snapshot.source]}
        {Number.isNaN(fetchedAt)
          ? ""
          : ` · actualizado el ${utcDate(fetchedAt)} ${utcClock(fetchedAt)} UTC`}
      </p>
    </>
  );
}

function OperatorSection({
  summary,
  now,
  explorer,
}: {
  summary: OperatorSummary;
  now: number;
  explorer: string;
}) {
  const { operator, stats, objects } = summary;
  const sorted = [...objects].sort(
    (a, b) => Date.parse(a.deadline) - Date.parse(b.deadline),
  );
  const counts: Record<EscrowStatus, number> = {
    ACTIVE: stats.active,
    EXPIRING: stats.expiring,
    FORFEITED: stats.forfeited,
    REFUNDED: stats.refunded,
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Badge variant="secondary">{operator}</Badge>
          <span className="text-sm font-normal text-muted-foreground">
            {objects.length}{" "}
            {objects.length === 1 ? "satélite" : "satélites"} ·{" "}
            {formatUSD(stats.totalLocked)} bloqueados
          </span>
        </h2>
        <span className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {ORDER.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: STATUS_COLOR[s] }}
              />
              {counts[s]} {STATUS_PLURAL[s]}
            </span>
          ))}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin escrows registrados en el dataset actual.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((o) => (
            <ObjectCard
              key={o.objectId}
              o={o}
              now={now}
              explorer={explorer}
            />
          ))}
        </div>
      )}
    </section>
  );
}
