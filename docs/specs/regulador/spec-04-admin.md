# Spec 04 · Usuario administrador

**Worker D.** Objetivo: un usuario admin (allowlist por env, **no**
auto-registrable) que ve TODO sin filtrar — todos los escrows, todos los
operadores, los reguladores dados de alta — y un panel de checks para testear
que cada parte de la app funcione.

## Archivos (propiedad exclusiva)

- CREAR `web/lib/admin.ts` — helpers de admin + checks (server-only)
- CREAR `web/app/(cuenta)/admin/page.tsx`
- CREAR `web/components/admin/*.tsx`
- EDITAR `web/.env.example` — documentar `ADMIN_EMAILS`
- **NO** editar `app/(cuenta)/cuenta/page.tsx` (lo toca otro worker; el link al admin se agrega en integración)

## Modelo

```ts
// lib/admin.ts
import "server-only";

/** Emails admin, separados por coma (case-insensitive). */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}
export function isAdminEmail(email?: string | null): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}
export interface HealthCheck { name: string; ok: boolean; detail: string }
export async function runChecks(): Promise<HealthCheck[]>
export async function adminOverview(): Promise<AdminOverview>
```

`.env.example`: agregar

```
# Emails con acceso al panel /admin (separados por coma)
ADMIN_EMAILS="admin@orbitclear.dev"
```

## `runChecks()` — checks de funcionamiento de cada parte

Cada check: `{ name, ok, detail }`, nunca lanza (try/catch → `ok:false` + mensaje).

- `"Base de datos"`: `select 1` o `count(*)` sobre `regulators` con `db` → ok + latencia ms.
- `"Escrows (API/console)"`: `await getEscrows()` → ok si `objects.length > 0`; detail: `${objects.length} objetos · fuente ${source}`.
- `"TLEs CelesTrak"`: del mismo snapshot, `tle.live/tle.total` → ok si `live > 0`; detail incluye `tle.oldestEpoch`.
- `"Catálogo CelesTrak"`: `await getCatalog("visual")` (`@/lib/celestrak`) → ok si objects > 0; detail: count + `fetchedAt`.
- `"Blockchain"`: `snap.source` — `"fuji"` → ok `Leyendo Avalanche Fuji`; `"demo"/"local"` → ok con detail aclarando (no es error, es degradado conocido).
- `"Sesión admin"`: trivialmente ok si se llegó (el check corre bajo sesión admin).

## `adminOverview()`

```ts
interface AdminOverview {
  stats: Stats;                          // computeStats(TODOS los objects)
  objects: DebrisObject[];               // todos, sin filtrar
  regulators: { agency: string; agencyCode: string; operators: string[]; createdAt: Date }[];
  walletCount: number;
  contracts: ContractAddress[];          // contract_addresses registradas
  snapshot: { source: DataSource; fetchedAt: string; explorer: string };
}
```

- `snap = await getEscrows()`; `stats = computeStats(snap.objects, Date.now())`.
- `regulators`: join `regulators` + `regulatorOperators` (schema `@/lib/db/schema` — tablas en creación paralela, nombres/columnas en `spec-01-datos.md`: `regulators{id,userId,agency,agencyCode,createdAt}`, `regulatorOperators{regulatorId,operator}`). Agrupar operadores por regulador. Si la query falla (tabla aún no migrada) → devolver `[]` sin lanzar.
- `walletCount`: `count()` de `wallets`; `contracts`: `select *` de `contractAddresses`. Igual: try/catch → defaults.
- `snapshot`: `{ source, fetchedAt, explorer }` del snapshot.

## `/admin` page + componentes

- `export const dynamic = "force-dynamic"`. Sesión vía `auth.getSession()` (ver `lib/auth/server.ts`): `!user` → `redirect("/login")`; `!isAdminEmail(user.email)` → card "Sin acceso" que diga que el panel es solo para administradores.
- Layout `(cuenta)` con shadcn `@/components/cuenta-ui/*`, `<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">`, español es-AR, sin emojis. Header: `Panel de administración` + email del usuario.

Secciones (server components salvo lo interactivo):

1. **Checks de salud** — una Card por check o una lista: nombre, badge `OK`/`Falla` (variant default/destructive), detail en `text-sm text-muted-foreground`. Orden fijo. Es lo primero que se ve.
2. **Resumen global** — fila de stats: `objects.length` objetos, `formatUSD(stats.totalLocked)` bloqueado, `formatUSD(stats.totalForfeited)` decomisado, `formatUSD(stats.totalRefunded)` devuelto, conteos por estado.
3. **Operadores** — tabla/cards por `stats.operators` (`{name, amount}`) + conteo de objetos por owner (derivar de `objects`).
4. **Reguladores** — lista: `agency` + `agencyCode`, operadores supervisados (chips), `createdAt`; vacío → "Ningún regulador dado de alta".
5. **Escrows** — la misma card de satélite que describe `spec-03-dashboard.md` (estado/depósito/plazo/órbita/on-chain), agrupada por `owner`, o tabla compacta si el volumen molesta. Datos: `statusAt`+`STATUS_LABEL`, `formatUSD`, `utcDate`, `countdown`, `telemetry(satrecFor(o.tle), new Date())`, `tleEpoch`, `history[].txHash` → `${explorer}/tx/…`.
6. **Cuenta** — `walletCount` wallets vinculadas en total, lista de `contracts` registrados (name/kind/address → `explorerAddressUrl`), links rápidos: `/` consola, `/operador`, `/regulador`, `/cuenta`.

## Aceptación

- `/admin` sin sesión → login; con sesión no-admin → mensaje de acceso denegado (no datos).
- Con email en `ADMIN_EMAILS`: checks arriba de todo, todos los escrows sin filtro, reguladores listados, stats globales.
- Nada se rompe si `ADMIN_EMAILS` está vacío o las tablas nuevas aún no existen.
