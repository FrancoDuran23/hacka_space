import { Badge } from "@/components/cuenta-ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/cuenta-ui/card";
import { formatUSD } from "@/lib/format";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/status";
import type { EscrowStatus, Stats } from "@/lib/types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-lg font-medium">{value}</dd>
    </div>
  );
}

export function GlobalStats({
  stats,
  total,
}: {
  stats: Stats;
  total: number;
}) {
  const counts: { st: EscrowStatus; n: number }[] = [
    { st: "ACTIVE", n: stats.active },
    { st: "EXPIRING", n: stats.expiring },
    { st: "FORFEITED", n: stats.forfeited },
    { st: "REFUNDED", n: stats.refunded },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen global</CardTitle>
        <CardDescription>
          Todos los escrows del snapshot, sin filtrar por operador.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Objetos" value={total.toLocaleString("es-AR")} />
          <Stat label="Bloqueado" value={formatUSD(stats.totalLocked)} />
          <Stat label="Decomisado" value={formatUSD(stats.totalForfeited)} />
          <Stat label="Devuelto" value={formatUSD(stats.totalRefunded)} />
        </dl>
        <div className="flex flex-wrap gap-2">
          {counts.map(({ st, n }) => (
            <Badge
              key={st}
              variant="outline"
              style={{
                color: STATUS_COLOR[st],
                borderColor: `${STATUS_COLOR[st]}66`,
                backgroundColor: `${STATUS_COLOR[st]}14`,
              }}
            >
              {STATUS_LABEL[st]}: {n}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
