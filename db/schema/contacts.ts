import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { customers } from "./customers";
import { organizations } from "./organizations";
import { profiles } from "./profiles";

export const contacts = sqliteTable(
  "contacts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title"),
    email: text("email"),
    phone: text("phone"),
    isDecisionMaker: integer("is_decision_maker", { mode: "boolean" })
      .notNull()
      .default(false),
    isInfluencer: integer("is_influencer", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("contacts_org_idx").on(table.organizationId),
    index("contacts_customer_idx").on(table.customerId),
  ],
);

export const customerNotes = sqliteTable(
  "customer_notes",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    authorId: text("author_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    content: text("content").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("customer_notes_org_idx").on(table.organizationId),
    index("customer_notes_customer_created_idx").on(
      table.customerId,
      table.createdAt,
    ),
  ],
);
