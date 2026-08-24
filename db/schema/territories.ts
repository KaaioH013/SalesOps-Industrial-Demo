import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { organizations } from "./organizations";
import { profiles } from "./profiles";

export const salesTerritories = sqliteTable(
  "sales_territories",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    region: text("region").notNull(),
    states: text("states", { mode: "json" }).$type<string[]>().notNull(),
    sellerId: text("seller_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    isActive: integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("sales_territories_org_idx").on(table.organizationId),
    index("sales_territories_seller_idx").on(table.sellerId),
    index("sales_territories_region_idx").on(
      table.organizationId,
      table.region,
    ),
  ],
);
