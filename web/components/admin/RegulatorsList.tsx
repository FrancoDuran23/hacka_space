import { Badge } from "@/components/cuenta-ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/cuenta-ui/card";
import type { AdminRegulator } from "@/lib/admin";

const dateFmt = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" });

export function RegulatorsList({
  regulators,
}: {
  regulators: AdminRegulator[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reguladores</CardTitle>
        <CardDescription>
          Agencias dadas de alta y los operadores que supervisan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {regulators.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ningún regulador dado de alta.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {regulators.map((r) => (
              <li
                key={r.agencyCode}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.agency}</p>
                    <p className="text-xs text-muted-foreground">
                      Alta {dateFmt.format(r.createdAt)}
                    </p>
                  </div>
                  <Badge variant="secondary">{r.agencyCode}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    Supervisa:
                  </span>
                  {r.operators.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      ningún operador adjudicado
                    </span>
                  ) : (
                    r.operators.map((op) => (
                      <Badge key={op} variant="outline">
                        {op}
                      </Badge>
                    ))
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
