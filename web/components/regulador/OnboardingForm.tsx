"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/cuenta-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/cuenta-ui/card";
import { Input } from "@/components/cuenta-ui/input";
import { Label } from "@/components/cuenta-ui/label";
import { registerAsRegulator } from "@/lib/regulador/actions";

export function OnboardingForm() {
  const router = useRouter();
  const [agency, setAgency] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await registerAsRegulator(
        agency.trim(),
        code.trim().toUpperCase(),
      );
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Error inesperado, probá de nuevo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>Darse de alta como regulador</CardTitle>
        <CardDescription>
          Tu agencia supervisa operadores: adjudicá los códigos que aparecen en
          los escrows para ver los satélites, depósitos y plazos de retiro de tu
          jurisdicción.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="regulator-agency">Nombre de la agencia</Label>
            <Input
              id="regulator-agency"
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              placeholder="CONAE — Comisión Nacional de Actividades Espaciales"
              maxLength={120}
              required
              disabled={busy}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="regulator-code">Código</Label>
            <Input
              id="regulator-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CONAE"
              maxLength={20}
              required
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              Identificador corto de la agencia. Se normaliza a mayúsculas.
            </p>
          </div>
          <Button type="submit" disabled={busy} className="self-start">
            {busy ? "Registrando…" : "Registrarme como regulador"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
