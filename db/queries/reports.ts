import { and, asc, desc, eq, type SQL } from "drizzle-orm";

import { getDb } from "../client";
import {
  customers,
  opportunities,
  orders,
  profiles,
  salesTerritories,
} from "../schema";
import type { OpportunityStage, OrderStatus, ProfileRole } from "../schema/enums";
import { presentOrderFinancials } from "./orders";

export const REPORT_EXPORT_MAX_ROWS = 5000;

export const REPORT_TYPES = [
  "orders",
  "pipeline",
  "customers",
  "territories",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export type ReportQueryParams = {
  organizationId: string;
  role: ProfileRole;
  userId: string;
  type: ReportType;
  from?: Date;
  to?: Date;
  territoryId?: string;
  segment?: string;
  sellerId?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
};

export type ReportFilterOptions = {
  territories: Array<{ id: string; name: string }>;
  segments: string[];
  sellers: Array<{ id: string; name: string }>;
};

const STAGE_LABELS: Record<OpportunityStage, string> = {
  novo: "Novo",
  qualificacao: "Qualificação",
  diagnostico: "Diagnóstico",
  proposta: "Proposta",
  negociacao: "Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_production: "Em produção",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

function customerScopeConditions(
  params: Pick<
    ReportQueryParams,
    "organizationId" | "role" | "userId" | "territoryId" | "segment" | "sellerId"
  >,
): SQL[] {
  const conditions: SQL[] = [
    eq(customers.organizationId, params.organizationId),
  ];
  const sellerId = params.role === "seller" ? params.userId : params.sellerId;

  if (sellerId) conditions.push(eq(customers.sellerId, sellerId));
  if (params.territoryId)
    conditions.push(eq(customers.territoryId, params.territoryId));
  if (params.segment) conditions.push(eq(customers.segment, params.segment));

  return conditions;
}

function resolvePeriod(from?: Date, to?: Date) {
  const end = to ?? new Date();
  const start =
    from ??
    new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1));
  return { from: start, to: end };
}

export async function getReportFilterOptions(
  params: Pick<ReportQueryParams, "organizationId" | "role" | "userId">,
): Promise<ReportFilterOptions> {
  const db = getDb();
  const sellerCondition =
    params.role === "seller" ? eq(profiles.id, params.userId) : undefined;
  const [territoryRows, customerRows, sellerRows] = await Promise.all([
    db
      .select({ id: salesTerritories.id, name: salesTerritories.name })
      .from(salesTerritories)
      .where(eq(salesTerritories.organizationId, params.organizationId))
      .orderBy(asc(salesTerritories.name)),
    db
      .select({ segment: customers.segment })
      .from(customers)
      .where(
        and(
          eq(customers.organizationId, params.organizationId),
          params.role === "seller"
            ? eq(customers.sellerId, params.userId)
            : undefined,
        ),
      )
      .orderBy(asc(customers.segment)),
    db
      .select({ id: profiles.id, name: profiles.name })
      .from(profiles)
      .where(
        and(
          eq(profiles.organizationId, params.organizationId),
          eq(profiles.role, "seller"),
          sellerCondition,
        ),
      )
      .orderBy(asc(profiles.name)),
  ]);

  return {
    territories: territoryRows,
    segments: [...new Set(customerRows.map((row) => row.segment))],
    sellers: sellerRows,
  };
}

export type OrderReportRow = {
  id: string;
  number: string;
  orderedAt: Date;
  status: OrderStatus;
  statusLabel: string;
  customerName: string;
  sellerName: string | null;
  territoryName: string | null;
  segment: string;
  revenueCents: number;
  costCents: number | null;
  grossMarginBps: number | null;
};

export type PipelineReportRow = {
  id: string;
  title: string;
  stage: OpportunityStage;
  stageLabel: string;
  customerName: string;
  sellerName: string | null;
  territoryName: string | null;
  estimatedValueCents: number;
  probability: number;
  weightedValueCents: number;
  expectedCloseAt: Date | null;
  lossReason: string | null;
};

export type CustomerReportRow = {
  id: string;
  tradeName: string;
  segment: string;
  status: string;
  territoryName: string | null;
  sellerName: string | null;
  registeredAt: Date;
  lastPurchaseAt: Date | null;
  revenueCents: number;
  orders: number;
};

export type TerritoryReportRow = {
  id: string;
  name: string;
  revenueCents: number;
  costCents: number | null;
  grossMarginBps: number | null;
  orders: number;
  customers: number;
};

export type ReportResult =
  | {
      type: "orders";
      rows: OrderReportRow[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }
  | {
      type: "pipeline";
      rows: PipelineReportRow[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }
  | {
      type: "customers";
      rows: CustomerReportRow[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }
  | {
      type: "territories";
      rows: TerritoryReportRow[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };

async function listScopedCustomerIds(
  params: ReportQueryParams,
): Promise<Set<string>> {
  const db = getDb();
  const rows = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(...customerScopeConditions(params)));
  return new Set(rows.map((row) => row.id));
}

export async function listReportRows(
  params: ReportQueryParams,
): Promise<ReportResult> {
  const page = Math.max(1, Math.trunc(params.page ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Math.trunc(params.pageSize ?? 25)),
  );
  const exportLimit = params.limit
    ? Math.min(REPORT_EXPORT_MAX_ROWS, Math.max(1, params.limit))
    : undefined;
  const period = resolvePeriod(params.from, params.to);
  const customerIds = await listScopedCustomerIds(params);
  const effectiveSellerId =
    params.role === "seller" ? params.userId : params.sellerId;

  if (params.type === "orders") {
    return listOrderReportRows({
      ...params,
      customerIds,
      effectiveSellerId,
      period,
      page,
      pageSize,
      exportLimit,
    });
  }

  if (params.type === "pipeline") {
    return listPipelineReportRows({
      ...params,
      customerIds,
      effectiveSellerId,
      period,
      page,
      pageSize,
      exportLimit,
    });
  }

  if (params.type === "customers") {
    return listCustomerReportRows({
      ...params,
      customerIds,
      period,
      page,
      pageSize,
      exportLimit,
    });
  }

  return listTerritoryReportRows({
    ...params,
    customerIds,
    effectiveSellerId,
    period,
    page,
    pageSize,
    exportLimit,
  });
}

async function listOrderReportRows(input: {
  role: ProfileRole;
  organizationId: string;
  customerIds: Set<string>;
  effectiveSellerId?: string;
  period: { from: Date; to: Date };
  page: number;
  pageSize: number;
  exportLimit?: number;
}): Promise<Extract<ReportResult, { type: "orders" }>> {
  const db = getDb();
  const rows = await db
    .select({
      order: orders,
      customerName: customers.tradeName,
      segment: customers.segment,
      sellerName: profiles.name,
      territoryName: salesTerritories.name,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(profiles, eq(orders.ownerId, profiles.id))
    .leftJoin(salesTerritories, eq(customers.territoryId, salesTerritories.id))
    .where(eq(orders.organizationId, input.organizationId))
    .orderBy(desc(orders.orderedAt), desc(orders.id));

  const filtered = rows.filter(
    (row) =>
      input.customerIds.has(row.order.customerId) &&
      (!input.effectiveSellerId || row.order.ownerId === input.effectiveSellerId) &&
      row.order.orderedAt >= input.period.from &&
      row.order.orderedAt <= input.period.to,
  );

  const total = filtered.length;
  const limit = input.exportLimit ?? input.pageSize;
  const offset = input.exportLimit ? 0 : (input.page - 1) * input.pageSize;
  const slice = filtered.slice(offset, offset + limit);

  return {
    type: "orders",
    total,
    page: input.page,
    pageSize: input.exportLimit ?? input.pageSize,
    totalPages: Math.ceil(total / input.pageSize),
    rows: slice.map(({ order, customerName, segment, sellerName, territoryName }) => {
      const financials = presentOrderFinancials(order, input.role);
      return {
        id: order.id,
        number: order.number,
        orderedAt: order.orderedAt,
        status: order.status,
        statusLabel: ORDER_STATUS_LABELS[order.status],
        customerName,
        sellerName,
        territoryName,
        segment,
        revenueCents: order.revenueCents,
        ...financials,
      };
    }),
  };
}

async function listPipelineReportRows(input: {
  organizationId: string;
  customerIds: Set<string>;
  effectiveSellerId?: string;
  period: { from: Date; to: Date };
  page: number;
  pageSize: number;
  exportLimit?: number;
}): Promise<Extract<ReportResult, { type: "pipeline" }>> {
  const db = getDb();
  const rows = await db
    .select({
      opportunity: opportunities,
      customerName: customers.tradeName,
      sellerName: profiles.name,
      territoryName: salesTerritories.name,
    })
    .from(opportunities)
    .innerJoin(customers, eq(opportunities.customerId, customers.id))
    .leftJoin(profiles, eq(opportunities.ownerId, profiles.id))
    .leftJoin(salesTerritories, eq(customers.territoryId, salesTerritories.id))
    .where(eq(opportunities.organizationId, input.organizationId))
    .orderBy(desc(opportunities.updatedAt), desc(opportunities.id));

  const filtered = rows.filter(
    (row) =>
      input.customerIds.has(row.opportunity.customerId) &&
      (!input.effectiveSellerId ||
        row.opportunity.ownerId === input.effectiveSellerId) &&
      row.opportunity.createdAt >= input.period.from &&
      row.opportunity.createdAt <= input.period.to,
  );

  const total = filtered.length;
  const limit = input.exportLimit ?? input.pageSize;
  const offset = input.exportLimit ? 0 : (input.page - 1) * input.pageSize;
  const slice = filtered.slice(offset, offset + limit);

  return {
    type: "pipeline",
    total,
    page: input.page,
    pageSize: input.exportLimit ?? input.pageSize,
    totalPages: Math.ceil(total / input.pageSize),
    rows: slice.map(({ opportunity, customerName, sellerName, territoryName }) => ({
      id: opportunity.id,
      title: opportunity.title,
      stage: opportunity.stage,
      stageLabel: STAGE_LABELS[opportunity.stage],
      customerName,
      sellerName,
      territoryName,
      estimatedValueCents: opportunity.estimatedValueCents,
      probability: opportunity.probability,
      weightedValueCents: Math.round(
        (opportunity.estimatedValueCents * opportunity.probability) / 100,
      ),
      expectedCloseAt: opportunity.expectedCloseAt,
      lossReason: opportunity.lossReason,
    })),
  };
}

async function listCustomerReportRows(input: {
  organizationId: string;
  customerIds: Set<string>;
  period: { from: Date; to: Date };
  page: number;
  pageSize: number;
  exportLimit?: number;
}): Promise<Extract<ReportResult, { type: "customers" }>> {
  const db = getDb();
  const [customerRows, orderRows] = await Promise.all([
    db
      .select({
        customer: customers,
        sellerName: profiles.name,
        territoryName: salesTerritories.name,
      })
      .from(customers)
      .leftJoin(profiles, eq(customers.sellerId, profiles.id))
      .leftJoin(salesTerritories, eq(customers.territoryId, salesTerritories.id))
      .where(eq(customers.organizationId, input.organizationId))
      .orderBy(asc(customers.tradeName)),
    db
      .select({
        customerId: orders.customerId,
        revenueCents: orders.revenueCents,
        orderedAt: orders.orderedAt,
      })
      .from(orders)
      .where(eq(orders.organizationId, input.organizationId)),
  ]);

  const revenueByCustomer = new Map<string, { revenueCents: number; orders: number }>();
  for (const order of orderRows) {
    if (
      !input.customerIds.has(order.customerId) ||
      order.orderedAt < input.period.from ||
      order.orderedAt > input.period.to
    ) {
      continue;
    }
    const current = revenueByCustomer.get(order.customerId) ?? {
      revenueCents: 0,
      orders: 0,
    };
    current.revenueCents += order.revenueCents;
    current.orders += 1;
    revenueByCustomer.set(order.customerId, current);
  }

  const filtered = customerRows
    .filter((row) => input.customerIds.has(row.customer.id))
    .map(({ customer, sellerName, territoryName }) => {
      const totals = revenueByCustomer.get(customer.id) ?? {
        revenueCents: 0,
        orders: 0,
      };
      return {
        id: customer.id,
        tradeName: customer.tradeName,
        segment: customer.segment,
        status: customer.status,
        territoryName,
        sellerName,
        registeredAt: customer.registeredAt,
        lastPurchaseAt: customer.lastPurchaseAt,
        revenueCents: totals.revenueCents,
        orders: totals.orders,
      };
    });

  const total = filtered.length;
  const limit = input.exportLimit ?? input.pageSize;
  const offset = input.exportLimit ? 0 : (input.page - 1) * input.pageSize;
  const slice = filtered.slice(offset, offset + limit);

  return {
    type: "customers",
    total,
    page: input.page,
    pageSize: input.exportLimit ?? input.pageSize,
    totalPages: Math.ceil(total / input.pageSize),
    rows: slice,
  };
}

async function listTerritoryReportRows(input: {
  role: ProfileRole;
  organizationId: string;
  customerIds: Set<string>;
  effectiveSellerId?: string;
  period: { from: Date; to: Date };
  page: number;
  pageSize: number;
  exportLimit?: number;
}): Promise<Extract<ReportResult, { type: "territories" }>> {
  const db = getDb();
  const [territoryRows, orderRows, customerRows] = await Promise.all([
    db
      .select({ id: salesTerritories.id, name: salesTerritories.name })
      .from(salesTerritories)
      .where(eq(salesTerritories.organizationId, input.organizationId))
      .orderBy(asc(salesTerritories.name)),
    db
      .select({
        customerId: orders.customerId,
        ownerId: orders.ownerId,
        revenueCents: orders.revenueCents,
        costCents: orders.costCents,
        orderedAt: orders.orderedAt,
        territoryId: customers.territoryId,
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.organizationId, input.organizationId)),
    db
      .select({ id: customers.id, territoryId: customers.territoryId })
      .from(customers)
      .where(eq(customers.organizationId, input.organizationId)),
  ]);

  const customersByTerritory = new Map<string, number>();
  for (const customer of customerRows) {
    if (!input.customerIds.has(customer.id) || !customer.territoryId) continue;
    customersByTerritory.set(
      customer.territoryId,
      (customersByTerritory.get(customer.territoryId) ?? 0) + 1,
    );
  }

  const totalsByTerritory = new Map<
    string,
    { revenueCents: number; costCents: number; orders: number }
  >();

  for (const order of orderRows) {
    if (
      !input.customerIds.has(order.customerId) ||
      !order.territoryId ||
      (input.effectiveSellerId && order.ownerId !== input.effectiveSellerId) ||
      order.orderedAt < input.period.from ||
      order.orderedAt > input.period.to
    ) {
      continue;
    }

    const current = totalsByTerritory.get(order.territoryId) ?? {
      revenueCents: 0,
      costCents: 0,
      orders: 0,
    };
    current.revenueCents += order.revenueCents;
    current.costCents += order.costCents;
    current.orders += 1;
    totalsByTerritory.set(order.territoryId, current);
  }

  const rows: TerritoryReportRow[] = territoryRows.map((territory) => {
    const totals = totalsByTerritory.get(territory.id) ?? {
      revenueCents: 0,
      costCents: 0,
      orders: 0,
    };
    const financials = presentOrderFinancials(
      { revenueCents: totals.revenueCents, costCents: totals.costCents },
      input.role,
    );
    return {
      id: territory.id,
      name: territory.name,
      revenueCents: totals.revenueCents,
      orders: totals.orders,
      customers: customersByTerritory.get(territory.id) ?? 0,
      ...financials,
    };
  });

  const total = rows.length;
  const limit = input.exportLimit ?? input.pageSize;
  const offset = input.exportLimit ? 0 : (input.page - 1) * input.pageSize;
  const slice = rows.slice(offset, offset + limit);

  return {
    type: "territories",
    total,
    page: input.page,
    pageSize: input.exportLimit ?? input.pageSize,
    totalPages: Math.ceil(total / input.pageSize),
    rows: slice,
  };
}

export function reportRowCount(result: ReportResult): number {
  return result.total;
}
