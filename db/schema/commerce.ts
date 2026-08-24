import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { customers } from "./customers";
import {
  orderStatuses,
  priceListScopes,
  quoteStatuses,
} from "./enums";
import { organizations } from "./organizations";
import { products } from "./products";
import { profiles } from "./profiles";

export const priceLists = sqliteTable(
  "price_lists",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    scope: text("scope", { enum: priceListScopes }).notNull(),
    customerId: text("customer_id").references(() => customers.id, {
      onDelete: "cascade",
    }),
    segment: text("segment"),
    validFrom: integer("valid_from", { mode: "timestamp" }).notNull(),
    validUntil: integer("valid_until", { mode: "timestamp" }),
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
    index("price_lists_org_idx").on(table.organizationId),
    index("price_lists_org_scope_idx").on(
      table.organizationId,
      table.scope,
    ),
    index("price_lists_customer_idx").on(table.customerId),
    check(
      "price_lists_scope_check",
      sql`${table.scope} in ('standard', 'customer', 'segment')`,
    ),
    check(
      "price_lists_scope_target_check",
      sql`(${table.scope} = 'standard' and ${table.customerId} is null and ${table.segment} is null)
        or (${table.scope} = 'customer' and ${table.customerId} is not null)
        or (${table.scope} = 'segment' and ${table.segment} is not null)`,
    ),
  ],
);

export const priceListItems = sqliteTable(
  "price_list_items",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    priceListId: text("price_list_id")
      .notNull()
      .references(() => priceLists.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    unitPriceCents: integer("unit_price_cents").notNull(),
    minQuantity: integer("min_quantity").notNull().default(1),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("price_list_items_org_idx").on(table.organizationId),
    index("price_list_items_product_idx").on(table.productId),
    uniqueIndex("price_list_items_list_product_qty_unique").on(
      table.priceListId,
      table.productId,
      table.minQuantity,
    ),
    check(
      "price_list_items_unit_price_check",
      sql`${table.unitPriceCents} >= 0`,
    ),
    check(
      "price_list_items_min_quantity_check",
      sql`${table.minQuantity} > 0`,
    ),
  ],
);

export const quotes = sqliteTable(
  "quotes",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    number: text("number").notNull(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    ownerId: text("owner_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    validUntil: integer("valid_until", { mode: "timestamp" }).notNull(),
    status: text("status", { enum: quoteStatuses })
      .notNull()
      .default("draft"),
    discountBps: integer("discount_bps").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    costCents: integer("cost_cents").notNull().default(0),
    grossMarginBps: integer("gross_margin_bps").notNull().default(0),
    lossReason: text("loss_reason"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("quotes_org_idx").on(table.organizationId),
    index("quotes_org_status_idx").on(table.organizationId, table.status),
    index("quotes_customer_idx").on(table.customerId),
    index("quotes_owner_idx").on(table.ownerId),
    uniqueIndex("quotes_org_number_unique").on(
      table.organizationId,
      table.number,
    ),
    check(
      "quotes_status_check",
      sql`${table.status} in ('draft', 'sent', 'approved', 'rejected', 'expired', 'won', 'lost')`,
    ),
    check("quotes_discount_check", sql`${table.discountBps} between 0 and 10000`),
    check("quotes_total_check", sql`${table.totalCents} >= 0`),
    check("quotes_cost_check", sql`${table.costCents} >= 0`),
  ],
);

export const quoteItems = sqliteTable(
  "quote_items",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    unitCostCents: integer("unit_cost_cents").notNull(),
    discountBps: integer("discount_bps").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("quote_items_org_idx").on(table.organizationId),
    index("quote_items_quote_idx").on(table.quoteId),
    index("quote_items_product_idx").on(table.productId),
    check("quote_items_quantity_check", sql`${table.quantity} > 0`),
    check("quote_items_unit_price_check", sql`${table.unitPriceCents} >= 0`),
    check("quote_items_unit_cost_check", sql`${table.unitCostCents} >= 0`),
    check(
      "quote_items_discount_check",
      sql`${table.discountBps} between 0 and 10000`,
    ),
    check("quote_items_total_check", sql`${table.totalCents} >= 0`),
  ],
);

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    number: text("number").notNull(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    quoteId: text("quote_id").references(() => quotes.id, {
      onDelete: "set null",
    }),
    ownerId: text("owner_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    status: text("status", { enum: orderStatuses })
      .notNull()
      .default("pending"),
    orderedAt: integer("ordered_at", { mode: "timestamp" }).notNull(),
    revenueCents: integer("revenue_cents").notNull().default(0),
    costCents: integer("cost_cents").notNull().default(0),
    grossMarginBps: integer("gross_margin_bps").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("orders_org_idx").on(table.organizationId),
    index("orders_org_status_date_idx").on(
      table.organizationId,
      table.status,
      table.orderedAt,
    ),
    index("orders_customer_idx").on(table.customerId),
    index("orders_owner_idx").on(table.ownerId),
    uniqueIndex("orders_org_number_unique").on(
      table.organizationId,
      table.number,
    ),
    check(
      "orders_status_check",
      sql`${table.status} in ('pending', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled')`,
    ),
    check("orders_revenue_check", sql`${table.revenueCents} >= 0`),
    check("orders_cost_check", sql`${table.costCents} >= 0`),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    unitCostCents: integer("unit_cost_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("order_items_org_idx").on(table.organizationId),
    index("order_items_order_idx").on(table.orderId),
    index("order_items_product_idx").on(table.productId),
    check("order_items_quantity_check", sql`${table.quantity} > 0`),
    check("order_items_unit_price_check", sql`${table.unitPriceCents} >= 0`),
    check("order_items_unit_cost_check", sql`${table.unitCostCents} >= 0`),
    check("order_items_total_check", sql`${table.totalCents} >= 0`),
  ],
);
