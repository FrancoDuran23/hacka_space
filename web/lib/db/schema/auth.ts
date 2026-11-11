import { pgSchema, text, uuid } from "drizzle-orm/pg-core";

export const neonAuth = pgSchema("neon_auth");

export const authUsers = neonAuth.table("user", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
});
