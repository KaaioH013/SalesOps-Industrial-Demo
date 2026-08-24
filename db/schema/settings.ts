import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { organizations } from "./organizations";

export const organizationSettings = sqliteTable(
  "organization_settings",
  {
    organizationId: text("organization_id")
      .primaryKey()
      .references(() => organizations.id, { onDelete: "cascade" }),
    attentionDays: integer("attention_days").notNull().default(14),
    criticalDays: integer("critical_days").notNull().default(30),
    lossReasonsJson: text("loss_reasons_json").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    check("organization_settings_attention_check", sql`${table.attentionDays} > 0`),
    check("organization_settings_critical_check", sql`${table.criticalDays} > 0`),
    check(
      "organization_settings_critical_gt_attention_check",
      sql`${table.criticalDays} > ${table.attentionDays}`,
    ),
  ],
);
