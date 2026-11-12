import { Badge } from "@/components/cuenta-ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/cuenta-ui/card";
import { formatUSD } from "@/lib/format";
import type { DebrisObject, Stats } from "@/lib/types";

export function OperatorsList({
  stats,
  objects,
}: {
  stats: Stats;
  objects: DebrisObject[];
}) {
  const counts = new Map<string, number>();
  for (const o of objects) {
    counts.set(o.owner, (counts.get(o.owner) ?? 0) + 1);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operadores</CardTitle>
        <CardDescription>
          Todos los owners que aparecen en el snapshot, ordenados por total
          depositado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stats.operators.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin operadores en el dataset actual.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {stats.operators.map((op) => (
              <li
                key={op.name}
                className="flex items-center justify-between gap-4 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Badge variant="secondary">{op.name}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {counts.get(op.name) ?? 0}{" "}
                    {(counts.get(op.name) ?? 0) === 1 ? "objeto" : "objetos"}
                  </span>
                </div>
                <span className="shrink-0 text-sm">
                  {formatUSD(op.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
