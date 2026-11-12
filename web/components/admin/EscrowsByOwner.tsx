import { Badge } from "@/components/cuenta-ui/badge";
import type { DebrisObject } from "@/lib/types";

import { EscrowCard } from "./EscrowCard";

export function EscrowsByOwner({
  objects,
  explorer,
  now,
}: {
  objects: DebrisObject[];
  explorer: string;
  now: number;
}) {
  const groups = new Map<string, DebrisObject[]>();
  for (const o of objects) {
    const g = groups.get(o.owner);
    if (g) g.push(o);
    else groups.set(o.owner, [o]);
  }
  const owners = [...groups.keys()].sort((a, b) => a.localeCompare(b, "es"));

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Escrows</h2>
        <p className="text-sm text-muted-foreground">
          Todos los objetos del snapshot agrupados por operador (
          {objects.length} en total).
        </p>
      </div>
      {owners.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay escrows en el snapshot actual.
        </p>
      ) : (
        owners.map((owner) => {
          const list = groups.get(owner)!;
          const sorted = [...list].sort(
            (a, b) => Date.parse(a.deadline) - Date.parse(b.deadline),
          );
          return (
            <div key={owner} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{owner}</Badge>
                <span className="text-sm text-muted-foreground">
                  {list.length} {list.length === 1 ? "objeto" : "objetos"}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {sorted.map((o) => (
                  <EscrowCard
                    key={o.objectId}
                    o={o}
                    now={now}
                    explorer={explorer}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
