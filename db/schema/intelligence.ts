import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { opportunities } from "./crm";
import { customers } from "./customers";
import { alertSeverities, alertStatuses } from "./enums";
import { organizations } from "./organizations";
import { profiles } from "./profiles";

export const customerScores = sqliteTable(
  "customer_scores",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    repurchaseScore: integer("repurchase_score").notNull(),
    inactivityRiskScore: integer("inactivity_risk_score").notNull(),
    potentialScore: integer("potential_score").notNull(),
    priorityScore: integer("priority_score").notNull(),
    explanations: text("explanations", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull(),
    calculatedAt: integer("calculated_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("customer_scores_org_idx").on(table.organizationId),
    index("customer_scores_org_priority_idx").on(
      table.organizationId,
      table.priorityScore,
    ),
    index("customer_scores_customer_calculated_idx").on(
      table.customerId,
      table.calculatedAt,
    ),
    check(
      "customer_scores_repurchase_check",
      sql`${table.repurchaseScore} between 0 and 100`,
    ),
    check(
      "customer_scores_inactivity_check",
      sql`${table.inactivityRiskScore} between 0 and 100`,
    ),
    check(
      "customer_scores_potential_check",
      sql`${table.potentialScore} between 0 and 100`,
    ),
    check(
      "customer_scores_priority_check",
      sql`${table.priorityScore} between 0 and 100`,
    ),
  ],
);

export const alerts = sqliteTable(
  "alerts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    severity: text("severity", { enum: alertSeverities }).notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    customerId: text("customer_id").references(() => customers.id, {
      onDelete: "cascade",
    }),
    opportunityId: text("opportunity_id").references(
      () => opportunities.id,
      { onDelete: "cascade" },
    ),
    recommendation: text("recommendation"),
    status: text("status", { enum: alertStatuses })
      .notNull()
      .default("open"),
    resolvedById: text("resolved_by_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    resolvedAt: integer("resolved_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("alerts_org_idx").on(table.organizationId),
    index("alerts_org_status_severity_idx").on(
      table.organizationId,
      table.status,
      table.severity,
    ),
    index("alerts_customer_idx").on(table.customerId),
    index("alerts_opportunity_idx").on(table.opportunityId),
    check(
      "alerts_severity_check",
      sql`${table.severity} in ('info', 'warning', 'critical')`,
    ),
    check(
      "alerts_status_check",
      sql`${table.status} in ('open', 'resolved', 'dismissed')`,
    ),
  ],
);

export const forecastSnapshots = sqliteTable(
  "forecast_snapshots",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    forecastCents: integer("forecast_cents").notNull(),
    actualCents: integer("actual_cents"),
    method: text("method").notNull(),
    forecastErrorBps: integer("forecast_error_bps"),
    calculatedAt: integer("calculated_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("forecast_snapshots_org_period_idx").on(
      table.organizationId,
      table.period,
    ),
    uniqueIndex("forecast_snapshots_org_period_method_calculated_unique").on(
      table.organizationId,
      table.period,
      table.method,
      table.calculatedAt,
    ),
    check(
      "forecast_snapshots_forecast_check",
      sql`${table.forecastCents} >= 0`,
    ),
    check(
      "forecast_snapshots_actual_check",
      sql`${table.actualCents} is null or ${table.actualCents} >= 0`,
    ),
  ],
);
