import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { customerSizes, customerStatuses } from "./enums";
import { organizations } from "./organizations";
import { profiles } from "./profiles";
import { salesTerritories } from "./territories";

export const customers = sqliteTable(
  "customers",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    legalName: text("legal_name").notNull(),
    tradeName: text("trade_name").notNull(),
    taxId: text("tax_id").notNull(),
    segment: text("segment").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    territoryId: text("territory_id").references(() => salesTerritories.id, {
      onDelete: "set null",
    }),
    status: text("status", { enum: customerStatuses })
      .notNull()
      .default("prospect"),
    size: text("size", { enum: customerSizes }).notNull(),
    registeredAt: integer("registered_at", { mode: "timestamp" }).notNull(),
    sellerId: text("seller_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    creditLimitCents: integer("credit_limit_cents").notNull().default(0),
    lastPurchaseAt: integer("last_purchase_at", { mode: "timestamp" }),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("customers_org_idx").on(table.organizationId),
    index("customers_org_status_idx").on(
      table.organizationId,
      table.status,
    ),
    index("customers_org_seller_idx").on(
      table.organizationId,
      table.sellerId,
    ),
    index("customers_org_territory_idx").on(
      table.organizationId,
      table.territoryId,
    ),
    index("customers_org_segment_idx").on(
      table.organizationId,
      table.segment,
    ),
    check(
      "customers_status_check",
      sql`${table.status} in ('prospect', 'active', 'inactive')`,
    ),
    check(
      "customers_size_check",
      sql`${table.size} in ('small', 'medium', 'large')`,
    ),
    check(
      "customers_credit_limit_check",
      sql`${table.creditLimitCents} >= 0`,
    ),
  ],
);
