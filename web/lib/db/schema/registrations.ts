import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { authUsers } from "./auth";

/**
 * Satellites registered from the operator panel. The chain is the source of truth for the escrow; this
 * row only remembers that the NORAD is ours to list and which transaction registered it, so the panel
 * does not depend on an indexer catching up (Routescan's logs endpoint lagged and dropped one).
 */
export const satelliteRegistrations = pgTable("satellite_registrations", {
  norad: integer("norad").primaryKey(),
  escrow: text("escrow").notNull(),
  txHash: text("tx_hash").notNull(),
  operator: text("operator").notNull(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SatelliteRegistration = typeof satelliteRegistrations.$inferSelect;
