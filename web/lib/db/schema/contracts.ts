import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { authUsers } from "./auth";

export const contractKind = pgEnum("contract_kind", [
  "escrow",
  "oracle",
  "token",
  "treasury",
  "other",
]);

export const contractAddresses = pgTable(
  "contract_addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    kind: contractKind("kind").notNull(),
    address: text("address").notNull(),
    chainId: integer("chain_id").notNull().default(43113),
    deployTxHash: text("deploy_tx_hash"),
    notes: text("notes"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.chainId, t.address)],
);

export type ContractAddress = typeof contractAddresses.$inferSelect;
