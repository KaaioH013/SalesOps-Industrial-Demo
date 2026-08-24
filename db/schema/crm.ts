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
  activityStatuses,
  activityTypes,
  opportunityPriorities,
  opportunityStages,
} from "./enums";
import { organizations } from "./organizations";
import { productFamilies, products } from "./products";
import { profiles } from "./profiles";
import { salesTerritories } from "./territories";

export const opportunities = sqliteTable(
  "opportunities",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    stage: text("stage", { enum: opportunityStages })
      .notNull()
      .default("novo"),
    source: text("source"),
    estimatedValueCents: integer("estimated_value_cents").notNull().default(0),
    probability: integer("probability").notNull().default(0),
    expectedCloseAt: integer("expected_close_at", {
      mode: "timestamp",
    }),
    ownerId: text("owner_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    productId: text("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    productFamilyId: text("product_family_id").references(
      () => productFamilies.id,
      { onDelete: "set null" },
    ),
    priority: text("priority", { enum: opportunityPriorities })
      .notNull()
      .default("medium"),
    nextStep: text("next_step"),
    lossReason: text("loss_reason"),
    stageChangedAt: integer("stage_changed_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    lastActivityAt: integer("last_activity_at", { mode: "timestamp" }),
    closedAt: integer("closed_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("opportunities_org_idx").on(table.organizationId),
    index("opportunities_org_stage_idx").on(
      table.organizationId,
      table.stage,
    ),
    index("opportunities_org_owner_idx").on(
      table.organizationId,
      table.ownerId,
    ),
    index("opportunities_customer_idx").on(table.customerId),
    index("opportunities_expected_close_idx").on(
      table.organizationId,
      table.expectedCloseAt,
    ),
    check(
      "opportunities_stage_check",
      sql`${table.stage} in ('novo', 'qualificacao', 'diagnostico', 'proposta', 'negociacao', 'ganho', 'perdido')`,
    ),
    check(
      "opportunities_priority_check",
      sql`${table.priority} in ('low', 'medium', 'high')`,
    ),
    check(
      "opportunities_estimated_value_check",
      sql`${table.estimatedValueCents} >= 0`,
    ),
    check(
      "opportunities_probability_check",
      sql`${table.probability} between 0 and 100`,
    ),
  ],
);

export const activities = sqliteTable(
  "activities",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: text("type", { enum: activityTypes }).notNull(),
    status: text("status", { enum: activityStatuses })
      .notNull()
      .default("planned"),
    subject: text("subject").notNull(),
    description: text("description"),
    scheduledAt: integer("scheduled_at", { mode: "timestamp" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    customerId: text("customer_id").references(() => customers.id, {
      onDelete: "cascade",
    }),
    opportunityId: text("opportunity_id").references(
      () => opportunities.id,
      { onDelete: "cascade" },
    ),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("activities_org_idx").on(table.organizationId),
    index("activities_org_owner_date_idx").on(
      table.organizationId,
      table.ownerId,
      table.scheduledAt,
    ),
    index("activities_customer_idx").on(table.customerId),
    index("activities_opportunity_idx").on(table.opportunityId),
    index("activities_org_status_idx").on(
      table.organizationId,
      table.status,
    ),
    check(
      "activities_type_check",
      sql`${table.type} in ('ligacao', 'email', 'visita', 'reuniao', 'follow_up')`,
    ),
    check(
      "activities_status_check",
      sql`${table.status} in ('planned', 'completed', 'cancelled')`,
    ),
  ],
);

export const targets = sqliteTable(
  "targets",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    sellerId: text("seller_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    territoryId: text("territory_id").references(() => salesTerritories.id, {
      onDelete: "cascade",
    }),
    revenueTargetCents: integer("revenue_target_cents").notNull().default(0),
    marginTargetCents: integer("margin_target_cents").notNull().default(0),
    newCustomersTarget: integer("new_customers_target").notNull().default(0),
    conversionTargetBps: integer("conversion_target_bps").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("targets_org_period_idx").on(table.organizationId, table.period),
    index("targets_seller_idx").on(table.sellerId),
    index("targets_territory_idx").on(table.territoryId),
    uniqueIndex("targets_org_period_assignment_unique").on(
      table.organizationId,
      table.period,
      table.sellerId,
      table.territoryId,
    ),
    check(
      "targets_assignment_check",
      sql`${table.sellerId} is not null or ${table.territoryId} is not null`,
    ),
    check("targets_revenue_check", sql`${table.revenueTargetCents} >= 0`),
    check("targets_margin_check", sql`${table.marginTargetCents} >= 0`),
    check(
      "targets_new_customers_check",
      sql`${table.newCustomersTarget} >= 0`,
    ),
    check(
      "targets_conversion_check",
      sql`${table.conversionTargetBps} between 0 and 10000`,
    ),
  ],
);
