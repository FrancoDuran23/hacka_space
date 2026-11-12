# Specs · Panel del regulador

Feature: un **regulador** (agencia supervisora, ej. CONAE) puede darse de alta,
vincular sus wallets (flujo ya existente) y ver un dashboard con los escrows que
tiene a su nombre — es decir, los escrows de los operadores que supervisa — con
los datos relevantes de cada operador y de cada satélite.

## Modelo conceptual

- Un usuario autenticado (Neon Auth) se da de alta como regulador declarando su
  agencia (`agency` + `agency_code`, único).
- El regulador **adjudica operadores**: los códigos `owner` que aparecen en los
  escrows (`DebrisObject.owner`, ej. `"ESA"`). Es la jurisdicción que supervisa.
- Los "escrows a su nombre" = `snapshot.objects` filtrados por sus operadores
  adjudicados.
- La vinculación de wallets se reutiliza tal cual (`/cuenta/wallets`,
  `lib/wallets/actions.ts`): el dashboard las lista como credencial del
  regulador.
- Todo lo del dashboard es **lectura**: el regulador observa, no actúa sobre los
  escrows.

## Contratos compartidos (congelados — los workers implementan contra esto)

### Tablas (Drizzle, `web/lib/db/schema/regulator.ts`)

```ts
regulators:        id uuid pk defaultRandom | user_id uuid fk→neon_auth.user unique cascade
                   | agency text | agency_code text unique | created_at timestamptz defaultNow
regulatorOperators: id uuid pk defaultRandom | regulator_id uuid fk→regulators.id cascade
                   | operator text | claimed_at timestamptz defaultNow
                   | unique(regulator_id, operator)
```

### Server actions (`web/lib/regulador/actions.ts`, `"use server"`)

```ts
getMyRegulator(): Promise<Regulator | null>
registerAsRegulator(agency: string, agencyCode: string): Promise<Result>
listMyOperators(): Promise<string[]>                 // códigos adjudicados
claimOperator(operator: string): Promise<Result>
unclaimOperator(operator: string): Promise<Result>
availableOperators(): Promise<string[]>              // owners distintos del snapshot
regulatorDashboard(): Promise<RegulatorDashboard | null>
type Result = { ok: true } | { ok: false; error: string }
```

### Tipos (`web/lib/regulador/types.ts`)

```ts
interface Regulator { id: string; agency: string; agencyCode: string; createdAt: string }
interface OperatorSummary { operator: string; stats: Stats; objects: DebrisObject[] }
interface RegulatorDashboard {
  regulator: Regulator;
  operators: OperatorSummary[];   // solo operadores adjudicados, orden alfabético
  snapshot: { source: DataSource; fetchedAt: string; explorer: string };
  wallets: { address: string; label: string | null; verifiedAt: Date }[];
}
```

## Work packages (archivos disjuntos — se ejecutan en paralelo)

| Spec | Worker | Archivos |
|---|---|---|
| `spec-01-datos.md` | A | `lib/db/schema/regulator.ts`, `lib/db/schema/index.ts`, `web/drizzle/*` |
| `spec-02-acciones.md` | B | `lib/regulador/types.ts`, `lib/regulador/actions.ts` |
| `spec-03-dashboard.md` | C | `app/(cuenta)/regulador/**`, `components/regulador/**`, `app/(cuenta)/cuenta/page.tsx` |

Reglas: **no tocar archivos fuera de la lista**; B y C implementan contra los
contratos de arriba aunque las tablas/funciones todavía no existan — la
integración compila al final. Verificación final: `npm run typecheck`,
`npm run lint`, `npm run build`, `npm run db:migrate`.
