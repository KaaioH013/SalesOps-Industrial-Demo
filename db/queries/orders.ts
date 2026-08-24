import { and, count, desc, eq, type SQL } from "drizzle-orm";

import { grossMargin } from "@/lib/analytics/margin";

import { getDb } from "../client";
import {
  customers,
  orderItems,
  orders,
  products,
  profiles,
  quotes,
} from "../schema";
import type { OrderStatus, ProfileRole } from "../schema/enums";

type OrderAccessParams = {
  organizationId: string;
  role: ProfileRole;
  userId: string;
};

export function presentOrderFinancials(
  order: { revenueCents: number; costCents: number },
  role: ProfileRole,
) {
  if (role === "seller") {
    return { costCents: null, grossMarginBps: null };
  }
  const margin = grossMargin(order.revenueCents, order.costCents);
  return {
    costCents: order.costCents,
    grossMarginBps: margin == null ? null : Math.round(margin * 10_000),
  };
}

function orderConditions(params: OrderAccessParams): SQL[] {
  const conditions: SQL[] = [eq(orders.organizationId, params.organizationId)];
  if (params.role === "seller") conditions.push(eq(orders.ownerId, params.userId));
  return conditions;
}

export type OrderListRow = {
  id: string;
  number: string;
  customer: { id: string; name: string };
  owner: { id: string; name: string } | null;
  status: OrderStatus;
  orderedAt: Date;
  revenueCents: number;
  costCents: number | null;
  grossMarginBps: number | null;
};

export async function listOrders(
  params: OrderAccessParams & { page?: number; pageSize?: number },
) {
  const db = getDb();
  const page = Math.max(1, Math.trunc(params.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.trunc(params.pageSize ?? 25)));
  const where = and(...orderConditions(params))!;
  const [rows, totalRows] = await Promise.all([
    db
      .select({
        order: orders,
        customer: { id: customers.id, name: customers.tradeName },
        owner: { id: profiles.id, name: profiles.name },
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(profiles, eq(orders.ownerId, profiles.id))
      .where(where)
      .orderBy(desc(orders.orderedAt), desc(orders.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(orders).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;

  return {
    data: rows.map(({ order, customer, owner }) => ({
      id: order.id,
      number: order.number,
      customer,
      owner: owner?.id ? owner : null,
      status: order.status,
      orderedAt: order.orderedAt,
      revenueCents: order.revenueCents,
      ...presentOrderFinancials(order, params.role),
    })) satisfies OrderListRow[],
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getOrder(
  params: OrderAccessParams & { orderId: string },
) {
  const db = getDb();
  const rows = await db
    .select({
      order: orders,
      customer: { id: customers.id, name: customers.tradeName },
      owner: { id: profiles.id, name: profiles.name },
      quote: { id: quotes.id, number: quotes.number },
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(profiles, eq(orders.ownerId, profiles.id))
    .leftJoin(quotes, eq(orders.quoteId, quotes.id))
    .where(
      and(...orderConditions(params), eq(orders.id, params.orderId)),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const items = await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      unitPriceCents: orderItems.unitPriceCents,
      unitCostCents: orderItems.unitCostCents,
      totalCents: orderItems.totalCents,
      product: {
        id: products.id,
        sku: products.sku,
        description: products.description,
      },
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(
      and(
        eq(orderItems.organizationId, params.organizationId),
        eq(orderItems.orderId, params.orderId),
      ),
    );
  const hideSensitive = params.role === "seller";

  return {
    ...row.order,
    customer: row.customer,
    owner: row.owner?.id ? row.owner : null,
    quote: row.quote?.id ? row.quote : null,
    ...presentOrderFinancials(row.order, params.role),
    items: items.map((item) => ({
      ...item,
      unitCostCents: hideSensitive ? null : item.unitCostCents,
    })),
  };
}
