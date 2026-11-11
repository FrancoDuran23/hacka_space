"use client";

import { Check, Copy, ExternalLink, Trash2 } from "lucide-react";
import { useActionState, useState, useTransition } from "react";

import { Badge } from "@/components/cuenta-ui/badge";
import { Button } from "@/components/cuenta-ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/cuenta-ui/card";
import { Input } from "@/components/cuenta-ui/input";
import { Label } from "@/components/cuenta-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/cuenta-ui/select";
import { Textarea } from "@/components/cuenta-ui/textarea";
import { explorerAddressUrl, explorerTxUrl } from "@/lib/chain";
import {
  addContractAddress,
  deleteContractAddress,
  type ContractActionState,
  type ContractAddressItem,
} from "@/lib/contracts/actions";

const KIND_LABELS: Record<ContractAddressItem["kind"], string> = {
  escrow: "Escrow",
  oracle: "Oráculo",
  token: "Token",
  treasury: "Tesorería",
  other: "Otro",
};
const KINDS = Object.keys(KIND_LABELS) as ContractAddressItem["kind"][];

export function ContractAddressForm() {
  const [state, formAction, pending] = useActionState<
    ContractActionState,
    FormData
  >((_prev, formData) => addContractAddress(formData), { ok: false });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar dirección</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contract-name">Nombre</Label>
            <Input
              id="contract-name"
              name="name"
              required
              maxLength={80}
              placeholder="Escrow de garantía"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contract-kind">Tipo</Label>
            <Select name="kind" required defaultValue="escrow">
              <SelectTrigger id="contract-kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {KIND_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contract-address">Dirección</Label>
            <Input
              id="contract-address"
              name="address"
              required
              placeholder="0x…"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contract-tx">Hash de deploy (opcional)</Label>
            <Input
              id="contract-tx"
              name="deployTxHash"
              placeholder="0x…"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contract-notes">Notas (opcional)</Label>
            <Textarea
              id="contract-notes"
              name="notes"
              maxLength={500}
              rows={2}
            />
          </div>
          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          {state.ok ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Dirección registrada.
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function ContractAddressList({
  items,
  currentUserId,
}: {
  items: ContractAddressItem[];
  currentUserId: string;
}) {
  const [deleting, startDelete] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay direcciones registradas.
      </p>
    );
  }

  const copy = async (id: string, address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      setCopiedId(null);
    }
  };

  const remove = (id: string) => {
    setDeleteError(null);
    startDelete(async () => {
      const r = await deleteContractAddress(id);
      if (!r.ok) setDeleteError(r.error ?? "No se pudo borrar.");
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {deleteError ? (
        <p role="alert" className="text-sm text-destructive">
          {deleteError}
        </p>
      ) : null}
      {items.map((c) => (
        <Card key={c.id} size="sm">
          <CardHeader>
            <div className="flex min-w-0 items-center gap-2">
              <CardTitle className="truncate">{c.name}</CardTitle>
              <Badge variant="secondary">{KIND_LABELS[c.kind]}</Badge>
            </div>
            {c.createdBy === currentUserId ? (
              <CardAction>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  disabled={deleting}
                  onClick={() => remove(c.id)}
                  aria-label={`Borrar ${c.name}`}
                >
                  <Trash2 />
                </Button>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <a
                href={explorerAddressUrl(c.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm underline underline-offset-2"
              >
                {shortAddr(c.address)}
              </a>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => copy(c.id, c.address)}
                aria-label="Copiar dirección"
              >
                {copiedId === c.id ? <Check /> : <Copy />}
              </Button>
            </div>
            {c.deployTxHash ? (
              <a
                href={explorerTxUrl(c.deployTxHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground underline underline-offset-2"
              >
                Tx de deploy
                <ExternalLink />
              </a>
            ) : null}
            {c.notes ? (
              <p className="text-sm text-muted-foreground">{c.notes}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Cargada por {c.createdByEmail ?? "otro usuario"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
