import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { productStatuses } from "./enums";
import { organizations } from "./organizations";

export const productFamilies = sqliteTable(
  "product_families",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    targetMarginBps: integer("target_margin_bps").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("product_families_org_idx").on(table.organizationId),
    uniqueIndex("product_families_org_name_unique").on(
      table.organizationId,
      table.name,
    ),
    check(
      "product_families_target_margin_check",
      sql`${table.targetMarginBps} between 0 and 10000`,
    ),
  ],
);

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    familyId: text("family_id")
      .notNull()
      .references(() => productFamilies.id, { onDelete: "restrict" }),
    sku: text("sku").notNull(),
    description: text("description").notNull(),
    application: text("application"),
    listPriceCents: integer("list_price_cents").notNull(),
    standardCostCents: integer("standard_cost_cents").notNull(),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    leadTimeDays: integer("lead_time_days").notNull().default(0),
    status: text("status", { enum: productStatuses })
      .notNull()
      .default("active"),
    targetMarginBps: integer("target_margin_bps").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("products_org_idx").on(table.organizationId),
    index("products_org_family_idx").on(
      table.organizationId,
      table.familyId,
    ),
    index("products_org_status_idx").on(
      table.organizationId,
      table.status,
    ),
    uniqueIndex("products_org_sku_unique").on(
      table.organizationId,
      table.sku,
    ),
    check("products_list_price_check", sql`${table.listPriceCents} >= 0`),
    check("products_standard_cost_check", sql`${table.standardCostCents} >= 0`),
    check("products_stock_check", sql`${table.stockQuantity} >= 0`),
    check("products_lead_time_check", sql`${table.leadTimeDays} >= 0`),
    check(
      "products_status_check",
      sql`${table.status} in ('active', 'inactive')`,
    ),
    check(
      "products_target_margin_check",
      sql`${table.targetMarginBps} between 0 and 10000`,
    ),
  ],
);
