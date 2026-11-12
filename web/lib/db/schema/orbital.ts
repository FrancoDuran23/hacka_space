import { doublePrecision, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Caché persistente de datos orbitales (CelesTrak). La app lee de acá y solo
 * pega contra la API cuando la fila supera su TTL. TLEs ~1 h, SATCAT ~12 h.
 */

/** Último TLE conocido por NORAD id (objetos con escrow + catálogo). */
export const orbitalTle = pgTable("orbital_tle", {
  catnr: integer("catnr").primaryKey(),
  name: text("name"),
  line1: text("line1").notNull(),
  line2: text("line2").notNull(),
  /** TLE epoch como ISO string. */
  epoch: text("epoch"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

/** Estado del catálogo SATCAT para los ids que OrbitClear sigue. */
export const orbitalSatcat = pgTable("orbital_satcat", {
  catnr: integer("catnr").primaryKey(),
  objectType: text("object_type"),
  opsStatus: text("ops_status"),
  owner: text("owner"),
  decayDate: text("decay_date"),
  intlDes: text("intl_des"),
  launchDate: text("launch_date"),
  launchSite: text("launch_site"),
  /** Radar cross-section en m². */
  rcs: doublePrecision("rcs"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

/** La capa de catálogo tal como quedó en el último fetch del grupo. */
export const catalogObject = pgTable(
  "catalog_object",
  {
    groupName: text("group_name").notNull(),
    catnr: integer("catnr").notNull(),
    name: text("name").notNull(),
    /** Procedencia del registro: "celestrak" = importado de la API. */
    source: text("source").notNull().default("celestrak"),
    line1: text("line1").notNull(),
    line2: text("line2").notNull(),
    epoch: text("epoch"),
    kind: text("kind"),
    objectType: text("object_type"),
    opsStatus: text("ops_status"),
    owner: text("owner"),
    intlDes: text("intl_des"),
    launchDate: text("launch_date"),
    launchSite: text("launch_site"),
    rcs: doublePrecision("rcs"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.groupName, t.catnr] })],
);
