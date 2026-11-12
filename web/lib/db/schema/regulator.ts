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
