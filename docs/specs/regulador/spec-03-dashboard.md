# Spec 03 · Dashboard del regulador (UI)

**Worker C.** Objetivo: página `/regulador` con alta de agencia, adjudicación de
operadores y dashboard de escrows supervisados. Implementar contra el contrato
de `docs/specs/regulador/README.md` (las acciones las crea worker B en paralelo
en `@/lib/regulador/actions` y `@/lib/regulador/types` — importar desde ahí).

## Archivos (propiedad exclusiva)

- CREAR `web/app/(cuenta)/regulador/page.tsx`
- CREAR `web/components/regulador/` — componentes propios (ver abajo)
- EDITAR `web/app/(cuenta)/cuenta/page.tsx` — agregar una entrada al array `sections`:
  `{ href: "/regulador", title: "Panel de regulador", description: "Escrows supervisados por tu agencia", icon: ShieldCheck }` — importar `ShieldCheck` de `lucide-react`.

## Convenciones del repo

- Layout `(cuenta)`: tema oscuro shadcn (`cuenta.css`), componentes en `@/components/cuenta-ui/*` (Card, Button, Input, Label, Badge, Separator…). Páginas existentes como referencia: `app/(cuenta)/cuenta/wallets/page.tsx`, `cuenta/page.tsx`.
- Estructura página: `export const dynamic = "force-dynamic"`; `<main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">` (el dashboard puede usar `max-w-5xl`).
- Auth en página server: `import { auth } from "@/lib/auth/server"`, `const { data } = await auth.getSession()`; si `!data?.user` → `redirect("/login")`. (Ver `lib/auth/server.ts` para la API exacta — usar `auth.getSession` igual que `requireUser` pero con redirect en vez de throw.)
- Datos relevantes por escrow (`DebrisObject`, `lib/types.ts`): `name`, `objectId` (NORAD), `owner`, `massKg`, `band`, `deposit` (USD), `deadline`/`createdAt` ISO, `status`, `settledAt`, `riskPerDay`, `onChain`, `tleEpoch`, `history` (txHash → `${explorer}/tx/${hash}`).
- Derivados: `statusAt(o, now)` + `STATUS_LABEL`/`STATUS_COLOR` de `lib/status.ts`; telemetría `telemetry(satrecFor(o.tle), new Date())` de `lib/orbit.ts` → `{ altitudeKm, speedKms }` o null (reingresó); `tleFields(o.tle)` → inclinación etc. Formatters de `lib/format.ts`: `formatUSD`, `utcDate`, `utcClock`, `countdown`, `shortHash`.
- Etiquetas en español (es-AR). Sin emojis. Server components por defecto; `"use client"` solo en lo interactivo (formularios). Los server components PUEDEN llamar server actions importadas (`async` functions con `"use server"`) y también pasarlas a client components como props/event handlers.

## Flujo de la página

```
auth.getSession() → !user → redirect("/login")
dash = await regulatorDashboard()
!dash → <OnboardingForm/>            (alta de regulador)
dash  → <RegulatorView dash={dash}/> (dashboard)
```

### 1. `OnboardingForm.tsx` (client)

Card "Darse de alta como regulador": explica que la agencia supervisa operadores
y ve sus escrows. Campos: `Nombre de la agencia` (ej. "CONAE — Comisión Nacional
de Actividades Espaciales") y `Código` (ej. "CONAE", se normaliza a mayúsculas).
Submit → `registerAsRegulator(agency, code)` → error → `<p className="text-sm text-destructive">`;
ok → `router.refresh()`.

### 2. `RegulatorView.tsx` (server) + `OperatorClaims.tsx` (client)

Header: nombre de la agencia + código + badge "Regulador"; debajo las wallets
verificadas (`dash.wallets`, `shortHash`-style `0x1234…abcd`, label + link a
`explorerAddressUrl` de `lib/chain`) con un `Link` a `/cuenta/wallets` ("Gestionar
wallets"). Si no hay wallets: aviso + link directo a vincular una.

`OperatorClaims`: lista de `await availableOperators()` con badge por código;
si está adjudicado → botón "Dejar de supervisar" (`unclaimOperator`), si no →
"Supervisar" (`claimOperator`). Tras cada acción `router.refresh()`.

Por cada `OperatorSummary` (operador adjudicado):

- Encabezado del operador: código + stats — `objects.length` satélites,
  `formatUSD(stats.totalLocked)` bloqueado, conteos por estado
  (`stats.active/expiring/forfeited/refunded`).
- Cards por objeto (grid `sm:grid-cols-2`):
  - Título: `name` + `NORAD {objectId}` + badge estado (`STATUS_LABEL[statusAt(o, now)]`, color `STATUS_COLOR`).
  - Datos: depósito `formatUSD`, plazo `utcDate(Date.parse(deadline))`, tiempo restante `countdown(left)` (o "Vencido"), masa si `>0`, banda.
  - Orbita: altitud `km` y velocidad `km/s` de `telemetry` (o "Reingresó"), `tleEpoch` si existe.
  - Footer: `On-chain` (si `o.onChain`, con link al explorer del primer `history[].txHash` si hay) / `Simulado`; `Riesgo/día formatUSD(riskPerDay)`.
- Si el operador no tiene escrows en el snapshot: nota "Sin escrows registrados en el dataset actual".

Estado vacío global: regulador sin operadores adjudicados → mensaje que invite a
adjudicar desde `OperatorClaims`.

## Aceptación

- `/regulador` sin sesión redirige a `/login`; con sesión sin alta muestra el formulario; con alta muestra operadores + escrows filtrados por adjudicación.
- Solo lectura: ninguna acción sobre escrows (no deposit, no settle).
- Se ve: agencia, wallets verificadas, stats por operador, y por satélite depósito/estado/plazo/orbita/on-chain.
