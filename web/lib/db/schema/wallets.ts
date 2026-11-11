import {
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { FUJI_CHAIN_ID } from "@/lib/chain";

import { authUsers } from "./auth";

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    address: text("address").notNull(),
    chainId: integer("chain_id").notNull().default(FUJI_CHAIN_ID),
    label: text("label"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("wallets_address_chain_id_unique").on(t.address, t.chainId)],
);

export const walletChallenges = pgTable("wallet_challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  address: text("address").notNull(),
  nonce: text("nonce").notNull().unique(),
  message: text("message").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Wallet = typeof wallets.$inferSelect;
export type WalletChallenge = typeof walletChallenges.$inferSelect;
