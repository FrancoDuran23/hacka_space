import { Badge } from "@/components/cuenta-ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/cuenta-ui/card";
import type { HealthCheck } from "@/lib/admin";

export function HealthChecks({ checks }: { checks: HealthCheck[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checks de salud</CardTitle>
        <CardDescription>
          Cada parte de la app, verificada al cargar esta página.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y divide-border">
          {checks.map((c) => (
            <li
              key={c.name}
              className="flex items-center justify-between gap-4 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {c.detail}
                </p>
              </div>
              <Badge variant={c.ok ? "default" : "destructive"}>
                {c.ok ? "OK" : "Falla"}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
