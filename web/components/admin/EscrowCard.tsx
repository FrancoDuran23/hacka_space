import { Badge } from "@/components/cuenta-ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/cuenta-ui/card";
import { countdown, formatUSD, shortHash, utcDate } from "@/lib/format";
import { satrecFor, telemetry, tleEpochISO, tleFields } from "@/lib/orbit";
import { STATUS_COLOR, STATUS_LABEL, statusAt } from "@/lib/status";
import type { DebrisObject } from "@/lib/types";

const BAND_LABEL = [
  "Baja · < 600 km",
  "Media · 600–900 km",
  "Alta · > 900 km",
] as const;

const KIND_LABEL = {
  "rocket-body": "cuerpo de cohete",
  satellite: "satélite",
  fragment: "fragmento",
} as const;

function safeTelemetry(o: DebrisObject, now: number) {
  try {
    return telemetry(satrecFor(o.tle), new Date(now));
  } catch {
    return null;
  }
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

export function EscrowCard({
  o,
  now,
  explorer,
}: {
  o: DebrisObject;
  now: number;
  explorer: string;
}) {
  const st = statusAt(o, now);
  const left = Date.parse(o.deadline) - now;
  const tel = safeTelemetry(o, now);
  const fields = tleFields(o.tle);
  const epoch = o.tleEpoch ?? tleEpochISO(o.tle[0]);
  const txHash = o.history.find((h) => h.txHash)?.txHash;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="truncate">{o.name}</CardTitle>
        <CardDescription>
          NORAD {o.objectId} · {KIND_LABEL[o.kind]}
        </CardDescription>
        <CardAction>
          <Badge
            variant="outline"
            style={{
              color: STATUS_COLOR[st],
              borderColor: `${STATUS_COLOR[st]}66`,
              backgroundColor: `${STATUS_COLOR[st]}14`,
            }}
          >
            {STATUS_LABEL[st]}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <Item label="Depósito" value={formatUSD(o.deposit)} />
          <Item label="Banda" value={BAND_LABEL[o.band]} />
          <Item label="Plazo de retiro" value={utcDate(Date.parse(o.deadline))} />
          <Item
            label="Tiempo restante"
            value={left <= 0 ? "Vencido" : countdown(left)}
          />
          {o.massKg > 0 && (
            <Item
              label="Masa"
              value={`${o.massKg.toLocaleString("es-AR")} kg`}
            />
          )}
          {o.settledAt && (
            <Item label="Liquidado" value={utcDate(Date.parse(o.settledAt))} />
          )}
        </dl>
        <div className="text-sm">
          {tel ? (
            <p>
              Órbita: {Math.round(tel.altitudeKm).toLocaleString("es-AR")} km ·{" "}
              {tel.speedKms.toFixed(2)} km/s
              {fields ? ` · inclinación ${fields.inclinationDeg.toFixed(1)}°` : ""}
            </p>
          ) : (
            <p>Órbita: reingresó</p>
          )}
          {epoch && (
            <p className="text-xs text-muted-foreground">
              TLE epoch {utcDate(Date.parse(epoch))}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-2 text-xs">
        {o.onChain ? (
          txHash ? (
            <a
              href={`${explorer}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              On-chain · {shortHash(txHash)}
            </a>
          ) : (
            <span>On-chain</span>
          )
        ) : (
          <span className="text-muted-foreground">Simulado</span>
        )}
        <span className="text-muted-foreground">
          Riesgo/día {formatUSD(o.riskPerDay)}
        </span>
      </CardFooter>
    </Card>
  );
}
