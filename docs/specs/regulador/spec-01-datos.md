# Spec 01 · Datos del regulador

**Worker A.** Objetivo: crear las tablas `regulators` y `regulator_operators`
en el schema Drizzle, exportarlas y generar/aplicar la migración.

## Archivos (propiedad exclusiva)

- CREAR `web/lib/db/schema/regulator.ts`
- EDITAR `web/lib/db/schema/index.ts` — agregar `export * from "./regulator";`
- GENERAR migración con `npm run db:generate` (desde `web/`) y APLICARLA con `npm run db:migrate`

## Convenciones del repo (seguir exactamente)

Ver `web/lib/db/schema/wallets.ts` y `contracts.ts` como referencia:

- Imports de `drizzle-orm/pg-core`: `pgTable, uuid, text, timestamp, unique`
- FK al usuario: `userId: uuid("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" })` — importar `authUsers` de `./auth`
- Timestamps: `timestamp("...", { withTimezone: true }).notNull().defaultNow()` — NOTA: `contracts.ts`/`wallets.ts` usan `withTimezone: true` sin `mode: "date"` → drizzle devuelve `Date`. Usar el mismo estilo.
- Constraints: segundo arg de `pgTable`, ej. `(t) => [unique("nombre_constraint").on(t.a, t.b)]`
- Exportar tipos inferidos al final: `export type Regulator = typeof regulators.$inferSelect;`

## Schema exacto

```ts
// web/lib/db/schema/regulator.ts
import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "./auth";

/** Usuario autenticado dado de alta como agencia supervisora (un registro por usuario). */
export const regulators = pgTable("regulators", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" })
    .unique(),
  /** Nombre completo: "CONAE — Comisión Nacional de Actividades Espaciales". */
  agency: text("agency").notNull(),
  /** Código corto único: "CONAE", "FAA", "ESA-SSA". */
  agencyCode: text("agency_code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Operadores (owner de escrows) que el regulador supervisa. */
export const regulatorOperators = pgTable(
  "regulator_operators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    regulatorId: uuid("regulator_id")
      .notNull()
      .references(() => regulators.id, { onDelete: "cascade" }),
    /** Código de operador tal como aparece en DebrisObject.owner (ej. "ESA"). */
    operator: text("operator").notNull(),
    claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("regulator_operators_regulator_operator_unique").on(t.regulatorId, t.operator)],
);

export type Regulator = typeof regulators.$inferSelect;
export type RegulatorOperator = typeof regulatorOperators.$inferSelect;
```

## Aceptación

- `web/lib/db/schema/index.ts` re-exporta `./regulator`.
- `npm run db:generate` genera `web/drizzle/0004_*.sql` con `CREATE TABLE regulators` y `regulator_operators` (FKs a `neon_auth."user"` y `regulators`); `npm run db:migrate` la aplica OK.
- `npx tsc --noEmit` no introduce errores en los archivos tocados (los errores de workers paralelos se resuelven en integración).
