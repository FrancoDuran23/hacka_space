"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/cuenta-ui/badge";
import { Button } from "@/components/cuenta-ui/button";
import { claimOperator, unclaimOperator } from "@/lib/regulador/actions";

export function OperatorClaims({
  operators,
  claimed,
}: {
  operators: string[];
  claimed: string[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const claimedSet = new Set(claimed);

  async function toggle(operator: string, isClaimed: boolean) {
    setError(null);
    setPending(operator);
    try {
      const res = isClaimed
        ? await unclaimOperator(operator)
        : await claimOperator(operator);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Error inesperado, probá de nuevo");
    } finally {
      setPending(null);
    }
  }

  if (operators.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay operadores en el dataset actual.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {operators.map((op) => {
          const isClaimed = claimedSet.has(op);
          return (
            <li
              key={op}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Badge variant={isClaimed ? "default" : "outline"}>{op}</Badge>
                {isClaimed && (
                  <span className="text-xs text-muted-foreground">
                    Supervisado
                  </span>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant={isClaimed ? "ghost" : "outline"}
                disabled={pending !== null}
                onClick={() => toggle(op, isClaimed)}
              >
                {pending === op
                  ? "Guardando…"
                  : isClaimed
                    ? "Dejar de supervisar"
                    : "Supervisar"}
              </Button>
            </li>
          );
        })}
      </ul>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
