import {
  and,
  asc,
  count,
  desc,
  eq,
  like,
  or,
  type SQL,
  type SQLWrapper,
} from "drizzle-orm";

import { getDb } from "../client";
import {
  activities,
  contacts,
  customerNotes,
  customers,
  opportunities,
  orders,
  profiles,
  quotes,
} from "../schema";

export type CustomerQueryRole = "admin" | "manager" | "seller";

type CustomerAccessParams = {
  organizationId: string;
  role: CustomerQueryRole;
  userId: string;
};

type CustomerAccessRecord = {
  organizationId: string;
  sellerId: string | null;
};

export function filterCustomersByAccess<T extends CustomerAccessRecord>(
  records: readonly T[],
  params: CustomerAccessParams,
): T[] {
  return records.filter(
    (record) =>
      record.organizationId === params.organizationId &&
      (params.role !== "seller" || record.sellerId === params.userId),
  );
}

function customerScopeConditions(params: CustomerAccessParams): SQL[] {
  const conditions: SQL[] = [
    eq(customers.organizationId, params.organizationId),
  ];

  if (params.role === "seller") {
    conditions.push(eq(customers.sellerId, params.userId));
  }

  return conditions;
}

export async function listCustomers(
  params: CustomerAccessParams & {
    q?: string;
    page?: number;
    pageSize?: number;
  },
) {
  const db = getDb();
  const page = Math.max(1, Math.trunc(params.page ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Math.trunc(params.pageSize ?? 20)),
  );
  const conditions = customerScopeConditions(params);
  const search = params.q?.trim();

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        like(customers.legalName, pattern),
        like(customers.tradeName, pattern),
        like(customers.taxId, pattern),
      )!,
    );
  }

  const where = and(...conditions)!;
  const [rows, totalRows] = await Promise.all([
    db
      .select({
        customer: customers,
        seller: {
          id: profiles.id,
          name: profiles.name,
          email: profiles.email,
        },
      })
      .from(customers)
      .leftJoin(profiles, eq(customers.sellerId, profiles.id))
      .where(where)
      .orderBy(asc(customers.tradeName), asc(customers.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(customers).where(where),
  ]);

  const total = totalRows[0]?.total ?? 0;

  return {
    data: rows.map(({ customer, seller }) => ({
      ...customer,
      seller: seller?.id ? seller : null,
    })),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getCustomer360(
  params: CustomerAccessParams & { customerId: string },
) {
  const db = getDb();
  const customerRows = await db
    .select({
      customer: customers,
      seller: {
        id: profiles.id,
        name: profiles.name,
        email: profiles.email,
      },
    })
    .from(customers)
    .leftJoin(profiles, eq(customers.sellerId, profiles.id))
    .where(
      and(
        ...customerScopeConditions(params),
        eq(customers.id, params.customerId),
      ),
    )
    .limit(1);

  const customerRow = customerRows[0];

  if (!customerRow) {
    return null;
  }

  const relationScope = (
    organizationId: SQLWrapper,
    customerId: SQLWrapper,
  ) =>
    and(
      eq(organizationId, params.organizationId),
      eq(customerId, params.customerId),
    );

  const [
    customerContacts,
    customerNotesRows,
    customerOpportunities,
    customerActivities,
    customerOrders,
    customerQuotes,
  ] = await Promise.all([
    db
      .select()
      .from(contacts)
      .where(relationScope(contacts.organizationId, contacts.customerId))
      .orderBy(asc(contacts.name)),
    db
      .select()
      .from(customerNotes)
      .where(
        relationScope(
          customerNotes.organizationId,
          customerNotes.customerId,
        ),
      )
      .orderBy(desc(customerNotes.createdAt)),
    db
      .select()
      .from(opportunities)
      .where(
        relationScope(
          opportunities.organizationId,
          opportunities.customerId,
        ),
      )
      .orderBy(desc(opportunities.updatedAt)),
    db
      .select()
      .from(activities)
      .where(
        relationScope(activities.organizationId, activities.customerId),
      )
      .orderBy(desc(activities.scheduledAt)),
    db
      .select()
      .from(orders)
      .where(relationScope(orders.organizationId, orders.customerId))
      .orderBy(desc(orders.orderedAt)),
    db
      .select()
      .from(quotes)
      .where(relationScope(quotes.organizationId, quotes.customerId))
      .orderBy(desc(quotes.createdAt)),
  ]);

  const hideSensitiveFields = params.role === "seller";

  return {
    ...customerRow.customer,
    seller: customerRow.seller?.id ? customerRow.seller : null,
    contacts: customerContacts,
    notes: customerNotesRows,
    opportunities: customerOpportunities,
    activities: customerActivities,
    orders: customerOrders.map((order) => ({
      ...order,
      costCents: hideSensitiveFields ? null : order.costCents,
      grossMarginBps: hideSensitiveFields ? null : order.grossMarginBps,
    })),
    quotes: customerQuotes.map((quote) => ({
      ...quote,
      costCents: hideSensitiveFields ? null : quote.costCents,
      grossMarginBps: hideSensitiveFields ? null : quote.grossMarginBps,
    })),
  };
}
