import { and, count, desc, eq, inArray, type SQL } from "drizzle-orm";

import { grossMargin } from "@/lib/analytics/margin";

import { getDb } from "../client";
import {
  customers,
  productFamilies,
  products,
  profiles,
  quoteItems,
  quotes,
} from "../schema";
import type { ProfileRole, QuoteStatus } from "../schema/enums";

type QuoteAccessParams = {
  organizationId: string;
  role: ProfileRole;
  userId: string;
};

type QuoteFinancialInput = {
  totalCents: number;
  costCents: number;
  targetMarginBps: number | null;
};

export function presentQuoteFinancials(
  quote: QuoteFinancialInput,
  role: ProfileRole,
) {
  if (role === "seller") {
    return {
      costCents: null,
      grossMarginBps: null,
      targetMarginBps: null,
      belowTarget: null,
    };
  }

  const margin = grossMargin(quote.totalCents, quote.costCents);
  const grossMarginBps = margin == null ? null : Math.round(margin * 10_000);
  return {
    costCents: quote.costCents,
    grossMarginBps,
    targetMarginBps: quote.targetMarginBps,
    belowTarget:
      grossMarginBps == null || quote.targetMarginBps == null
        ? null
        : grossMarginBps < quote.targetMarginBps,
  };
}

function quoteConditions(params: QuoteAccessParams): SQL[] {
  const conditions: SQL[] = [eq(quotes.organizationId, params.organizationId)];
  if (params.role === "seller") conditions.push(eq(quotes.ownerId, params.userId));
  return conditions;
}

async function getQuoteTargets(quoteIds: string[]) {
  if (quoteIds.length === 0) return new Map<string, number>();
  const db = getDb();
  const rows = await db
    .select({
      quoteId: quoteItems.quoteId,
      totalCents: quoteItems.totalCents,
      targetMarginBps: productFamilies.targetMarginBps,
    })
    .from(quoteItems)
    .innerJoin(products, eq(quoteItems.productId, products.id))
    .innerJoin(productFamilies, eq(products.familyId, productFamilies.id))
    .where(inArray(quoteItems.quoteId, quoteIds));
  const totals = new Map<string, { value: number; weight: number }>();

  for (const row of rows) {
    const current = totals.get(row.quoteId) ?? { value: 0, weight: 0 };
    current.value += row.targetMarginBps * row.totalCents;
    current.weight += row.totalCents;
    totals.set(row.quoteId, current);
  }

  return new Map(
    [...totals.entries()]
      .filter(([, value]) => value.weight > 0)
      .map(([id, value]) => [id, Math.round(value.value / value.weight)]),
  );
}

export type QuoteListRow = {
  id: string;
  number: string;
  customer: { id: string; name: string };
  owner: { id: string; name: string } | null;
  validUntil: Date;
  status: QuoteStatus;
  totalCents: number;
  costCents: number | null;
  grossMarginBps: number | null;
  targetMarginBps: number | null;
  belowTarget: boolean | null;
};

export async function listQuotes(
  params: QuoteAccessParams & { page?: number; pageSize?: number },
) {
  const db = getDb();
  const page = Math.max(1, Math.trunc(params.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.trunc(params.pageSize ?? 25)));
  const where = and(...quoteConditions(params))!;
  const [rows, totalRows] = await Promise.all([
    db
      .select({
        quote: quotes,
        customer: { id: customers.id, name: customers.tradeName },
        owner: { id: profiles.id, name: profiles.name },
      })
      .from(quotes)
      .innerJoin(customers, eq(quotes.customerId, customers.id))
      .leftJoin(profiles, eq(quotes.ownerId, profiles.id))
      .where(where)
      .orderBy(desc(quotes.createdAt), desc(quotes.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(quotes).where(where),
  ]);
  const targets = await getQuoteTargets(rows.map(({ quote }) => quote.id));
  const total = totalRows[0]?.total ?? 0;

  return {
    data: rows.map(({ quote, customer, owner }) => ({
      id: quote.id,
      number: quote.number,
      customer,
      owner: owner?.id ? owner : null,
      validUntil: quote.validUntil,
      status: quote.status,
      totalCents: quote.totalCents,
      ...presentQuoteFinancials(
        {
          totalCents: quote.totalCents,
          costCents: quote.costCents,
          targetMarginBps: targets.get(quote.id) ?? null,
        },
        params.role,
      ),
    })) satisfies QuoteListRow[],
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getQuote(
  params: QuoteAccessParams & { quoteId: string },
) {
  const db = getDb();
  const rows = await db
    .select({
      quote: quotes,
      customer: { id: customers.id, name: customers.tradeName },
      owner: { id: profiles.id, name: profiles.name },
    })
    .from(quotes)
    .innerJoin(customers, eq(quotes.customerId, customers.id))
    .leftJoin(profiles, eq(quotes.ownerId, profiles.id))
    .where(
      and(...quoteConditions(params), eq(quotes.id, params.quoteId)),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const [items, targets] = await Promise.all([
    db
      .select({
        id: quoteItems.id,
        quantity: quoteItems.quantity,
        unitPriceCents: quoteItems.unitPriceCents,
        unitCostCents: quoteItems.unitCostCents,
        discountBps: quoteItems.discountBps,
        totalCents: quoteItems.totalCents,
        product: {
          id: products.id,
          sku: products.sku,
          description: products.description,
        },
        familyName: productFamilies.name,
      })
      .from(quoteItems)
      .innerJoin(products, eq(quoteItems.productId, products.id))
      .innerJoin(productFamilies, eq(products.familyId, productFamilies.id))
      .where(
        and(
          eq(quoteItems.organizationId, params.organizationId),
          eq(quoteItems.quoteId, params.quoteId),
        ),
      ),
    getQuoteTargets([params.quoteId]),
  ]);
  const hideSensitive = params.role === "seller";

  return {
    ...row.quote,
    customer: row.customer,
    owner: row.owner?.id ? row.owner : null,
    ...presentQuoteFinancials(
      {
        totalCents: row.quote.totalCents,
        costCents: row.quote.costCents,
        targetMarginBps: targets.get(params.quoteId) ?? null,
      },
      params.role,
    ),
    items: items.map((item) => ({
      ...item,
      unitCostCents: hideSensitive ? null : item.unitCostCents,
    })),
  };
}
