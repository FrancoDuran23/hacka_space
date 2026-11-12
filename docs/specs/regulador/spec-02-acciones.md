# Spec 02 · Acciones y queries del regulador

**Worker B.** Objetivo: capa de server actions que usa el dashboard. Implementar
contra el contrato de `docs/specs/regulador/README.md` aunque las tablas aún no
existan (worker A las crea en paralelo).

## Archivos (propiedad exclusiva)

- CREAR `web/lib/regulador/types.ts`
- CREAR `web/lib/regulador/actions.ts` — empieza con `"use server";`

## Convenciones del repo

- Auth: `requireUser()` de `@/lib/auth/session` lanza si no hay sesión. Patrón del repo (ver `lib/wallets/actions.ts`): helper `currentUser()` que hace try/catch y devuelve `null`; acciones que mutan devuelven `{ ok: true } | { ok: false, error: "..." }` en español.
- DB: `import { db } from "@/lib/db"`, schema de `@/lib/db/schema` (se exporta desde `lib/db/schema/regulator.ts`: `regulators`, `regulatorOperators`).
- Escrows: `import { getEscrows } from "@/lib/escrow"` → `EscrowSnapshot` (`lib/types.ts`): `objects: DebrisObject[]`, `source`, `fetchedAt`, `explorer`. `DebrisObject.owner` es el código de operador; `statusAt(o, now)` y `computeStats(objects, now)` en `lib/status.ts` derivan estado/estadísticas.
- Wallets: `listMyWallets()` de `@/lib/wallets/actions` devuelve las wallets verificadas del usuario.
- Tras mutar: `revalidatePath("/regulador")`.

## API exacta a implementar

```ts
// web/lib/regulador/types.ts
import type { DataSource, DebrisObject, Stats } from "@/lib/types";

export interface Regulator { id: string; agency: string; agencyCode: string; createdAt: string }
export interface OperatorSummary { operator: string; stats: Stats; objects: DebrisObject[] }
export interface RegulatorDashboard {
  regulator: Regulator;
  operators: OperatorSummary[];
  snapshot: { source: DataSource; fetchedAt: string; explorer: string };
  wallets: { address: string; label: string | null; verifiedAt: Date }[];
}
export type RegulatorResult = { ok: true } | { ok: false; error: string };
```

```ts
// web/lib/regulador/actions.ts  ("use server")
getMyRegulator(): Promise<Regulator | null>
  // select regulators where userId = user.id → mapear a Regulator (createdAt.toISOString())

registerAsRegulator(agency, agencyCode): Promise<RegulatorResult>
  // validar: agency 2-120 chars, agencyCode 2-20 chars [A-Z0-9-] (normalizar a mayúsculas)
  // insert; unique(user_id) → si ya existe: { ok:false, error:"Ya estás dado de alta como regulador" }
  // unique(agency_code) → { ok:false, error:"Ese código de agencia ya está registrado" }
  // revalidatePath("/regulador")

listMyOperators(): Promise<string[]>          // códigos adjudicados, orden alfabético
claimOperator(operator): Promise<RegulatorResult>
  // requiere regulator propio; insert onConflictDoNothing; validar operator no vacío/≤40 chars
unclaimOperator(operator): Promise<RegulatorResult>
  // delete where regulatorId+operator

availableOperators(): Promise<string[]>
  // const snap = await getEscrows(); distinct o.owner de snap.objects, orden alfabético

regulatorDashboard(): Promise<RegulatorDashboard | null>
  // null si el usuario no está dado de alta como regulador
  // snap = await getEscrows(); ops = await listMyOperators()
  // para cada op: objects = snap.objects.filter(o => o.owner === op)
  //   stats = computeStats(objects, Date.now())
  // wallets = await listMyWallets() → { address, label, verifiedAt }
  // snapshot = { source: snap.source, fetchedAt: snap.fetchedAt, explorer: snap.explorer }
```

`availableOperators` puede incluir operadores ya adjudicados (la UI los marca).

## Aceptación

- Todas las acciones verifican sesión; las mutaciones devuelven `RegulatorResult`.
- `claimOperator`/`unclaimOperator`/`registerAsRegulator` llaman `revalidatePath("/regulador")`.
- Nada de `console.log` ni datos sensibles; errores en español breve.
