import { and, asc, eq, type SQL } from "drizzle-orm";

import { getDb } from "../client";
import {
  alerts,
  customerScores,
  customers,
  opportunities,
  orders,
  profiles,
  salesTerritories,
  targets,
} from "../schema";
import type {
  AlertSeverity,
  OpportunityStage,
  ProfileRole,
} from "../schema/enums";

export type DashboardQueryParams = {
  organizationId: string;
  role: ProfileRole;
  userId: string;
  from?: Date;
  to?: Date;
  territoryId?: string;
  segment?: string;
  sellerId?: string;
};

type DashboardOrderRow = {
  id: string;
  customerId: string;
  customerName: string;
  ownerId: string | null;
  sellerName: string | null;
  territoryId: string | null;
  territoryName: string | null;
  orderedAt: Date;
  revenueCents: number;
  costCents: number;
};

type DashboardOpportunityRow = {
  id: string;
  stage: OpportunityStage;
  estimatedValueCents: number;
  probability: number;
};

type DashboardCustomerRow = {
  id: string;
  name: string;
  registeredAt: Date;
  lastPurchaseAt: Date | null;
  inactivityRiskScore: number | null;
  repurchaseScore: number | null;
};

type DashboardTargetRow = {
  period: string;
  revenueTargetCents: number;
  marginTargetCents: number;
};

type DashboardAlertRow = {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendation: string | null;
  customerId: string | null;
  opportunityId: string | null;
  createdAt: Date;
};

export type DashboardMetrics = {
  revenue: {
    actualCents: number;
    targetCents: number;
    attainmentBps: number | null;
  };
  margin: {
    actualCents: number;
    targetCents: number;
    attainmentBps: number | null;
  } | null;
  openPipeline: { count: number; weightedValueCents: number };
  proposalToWonConversionBps: number | null;
  newCustomers: number;
  atRiskCustomers: number;
  repurchaseCandidates: number;
  monthlySeries: Array<{
    period: string;
    label: string;
    revenueCents: number;
    marginCents: number | null;
    orders: number;
  }>;
  funnel: Array<{
    stage: OpportunityStage;
    label: string;
    count: number;
    valueCents: number;
  }>;
  territoryRanking: Array<{
    id: string;
    name: string;
    revenueCents: number;
    orders: number;
  }>;
  sellerRanking: Array<{
    id: string;
    name: string;
    revenueCents: number;
    orders: number;
  }>;
  customerPareto: Array<{
    id: string;
    name: string;
    revenueCents: number;
    shareBps: number;
    cumulativeShareBps: number;
  }>;
  alerts: Array<{
    id: string;
    severity: AlertSeverity;
    title: string;
    description: string;
    recommendation: string | null;
    href: string;
    createdAt: Date;
  }>;
  recommendedActions: Array<{
    title: string;
    reason: string;
    href: string;
  }>;
};

type DashboardAggregationInput = {
  role: ProfileRole;
  from: Date;
  to: Date;
  orders: DashboardOrderRow[];
  opportunities: DashboardOpportunityRow[];
  customers: DashboardCustomerRow[];
  targets: DashboardTargetRow[];
  alerts: DashboardAlertRow[];
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

const FUNNEL_STAGES = Object.keys(STAGE_LABELS) as OpportunityStage[];
const OPEN_STAGES = new Set<OpportunityStage>([
  "novo",
  "qualificacao",
  "diagnostico",
  "proposta",
  "negociacao",
]);

function attainmentBps(actual: number, target: number): number | null {
  return target > 0 ? Math.round((actual / target) * 10_000) : null;
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthKeys(from: Date, to: Date): string[] {
  const periods: string[] = [];
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1),
  );
  const last = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));

  while (cursor <= last) {
    periods.push(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return periods;
}

function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year!, month! - 1, 1)));
}

export function aggregateDashboardRows({
  role,
  from,
  to,
  orders: orderRows,
  opportunities: opportunityRows,
  customers: customerRows,
  targets: targetRows,
  alerts: alertRows,
}: DashboardAggregationInput): DashboardMetrics {
  const revenueActual = orderRows.reduce(
    (total, order) => total + order.revenueCents,
    0,
  );
  const marginActual = orderRows.reduce(
    (total, order) => total + order.revenueCents - order.costCents,
    0,
  );
  const revenueTarget = targetRows.reduce(
    (total, target) => total + target.revenueTargetCents,
    0,
  );
  const marginTarget = targetRows.reduce(
    (total, target) => total + target.marginTargetCents,
    0,
  );
  const openOpportunities = opportunityRows.filter((opportunity) =>
    OPEN_STAGES.has(opportunity.stage),
  );
  const won = opportunityRows.filter(
    (opportunity) => opportunity.stage === "ganho",
  ).length;
  const lost = opportunityRows.filter(
    (opportunity) => opportunity.stage === "perdido",
  ).length;
  const referenceTime = to.getTime();
  const dayMs = 86_400_000;

  const monthlySeries = monthKeys(from, to).map((period) => {
    const monthlyOrders = orderRows.filter(
      (order) => monthKey(order.orderedAt) === period,
    );

    return {
      period,
      label: periodLabel(period),
      revenueCents: monthlyOrders.reduce(
        (total, order) => total + order.revenueCents,
        0,
      ),
      marginCents:
        role === "seller"
          ? null
          : monthlyOrders.reduce(
              (total, order) =>
                total + order.revenueCents - order.costCents,
              0,
            ),
      orders: monthlyOrders.length,
    };
  });

  const rank = <T extends { id: string; name: string }>(
    rows: Array<T & { revenueCents: number }>,
  ) =>
    Array.from(
      rows.reduce(
        (groups, row) => {
          const current = groups.get(row.id) ?? {
            id: row.id,
            name: row.name,
            revenueCents: 0,
            orders: 0,
          };
          current.revenueCents += row.revenueCents;
          current.orders += 1;
          groups.set(row.id, current);
          return groups;
        },
        new Map<
          string,
          { id: string; name: string; revenueCents: number; orders: number }
        >(),
      ).values(),
    ).sort((left, right) => right.revenueCents - left.revenueCents);

  const customerRevenue = rank(
    orderRows.map((order) => ({
      id: order.customerId,
      name: order.customerName,
      revenueCents: order.revenueCents,
    })),
  ).slice(0, 10);
  let cumulativeRevenue = 0;

  const atRiskCustomers = customerRows.filter((customer) => {
    const daysSincePurchase = customer.lastPurchaseAt
      ? (referenceTime - customer.lastPurchaseAt.getTime()) / dayMs
      : Number.POSITIVE_INFINITY;
    return (
      (customer.inactivityRiskScore ?? 0) >= 70 || daysSincePurchase > 90
    );
  }).length;
  const repurchaseCandidates = customerRows.filter((customer) => {
    const daysSincePurchase = customer.lastPurchaseAt
      ? (referenceTime - customer.lastPurchaseAt.getTime()) / dayMs
      : Number.POSITIVE_INFINITY;
    return (
      (customer.repurchaseScore ?? 0) >= 70 ||
      (daysSincePurchase >= 30 && daysSincePurchase <= 180)
    );
  }).length;

  const recommendedActions: DashboardMetrics["recommendedActions"] = [];
  if (atRiskCustomers > 0) {
    recommendedActions.push({
      title: "Priorizar clientes em risco",
      reason: `${atRiskCustomers} cliente(s) estão sem recompra recente ou com alto risco de inatividade.`,
      href: "/customers",
    });
  }
  if (openOpportunities.length > 0) {
    recommendedActions.push({
      title: "Revisar oportunidades abertas",
      reason: `${openOpportunities.length} oportunidade(s) concentram o pipeline em andamento.`,
      href: "/pipeline",
    });
  }
  if (repurchaseCandidates > 0) {
    recommendedActions.push({
      title: "Ativar campanha de recompra",
      reason: `${repurchaseCandidates} cliente(s) apresentam janela favorável para nova abordagem.`,
      href: "/customers",
    });
  }

  return {
    revenue: {
      actualCents: revenueActual,
      targetCents: revenueTarget,
      attainmentBps: attainmentBps(revenueActual, revenueTarget),
    },
    margin:
      role === "seller"
        ? null
        : {
            actualCents: marginActual,
            targetCents: marginTarget,
            attainmentBps: attainmentBps(marginActual, marginTarget),
          },
    openPipeline: {
      count: openOpportunities.length,
      weightedValueCents: openOpportunities.reduce(
        (total, opportunity) =>
          total +
          Math.round(
            opportunity.estimatedValueCents * (opportunity.probability / 100),
          ),
        0,
      ),
    },
    proposalToWonConversionBps:
      won + lost > 0 ? Math.round((won / (won + lost)) * 10_000) : null,
    newCustomers: customerRows.filter(
      (customer) =>
        customer.registeredAt >= from && customer.registeredAt <= to,
    ).length,
    atRiskCustomers,
    repurchaseCandidates,
    monthlySeries,
    funnel: FUNNEL_STAGES.map((stage) => {
      const stageRows = opportunityRows.filter(
        (opportunity) => opportunity.stage === stage,
      );
      return {
        stage,
        label: STAGE_LABELS[stage],
        count: stageRows.length,
        valueCents: stageRows.reduce(
          (total, opportunity) => total + opportunity.estimatedValueCents,
          0,
        ),
      };
    }),
    territoryRanking: rank(
      orderRows
        .filter(
          (order): order is DashboardOrderRow & {
            territoryId: string;
            territoryName: string;
          } => Boolean(order.territoryId && order.territoryName),
        )
        .map((order) => ({
          id: order.territoryId,
          name: order.territoryName,
          revenueCents: order.revenueCents,
        })),
    ),
    sellerRanking: rank(
      orderRows
        .filter(
          (order): order is DashboardOrderRow & {
            ownerId: string;
            sellerName: string;
          } => Boolean(order.ownerId && order.sellerName),
        )
        .map((order) => ({
          id: order.ownerId,
          name: order.sellerName,
          revenueCents: order.revenueCents,
        })),
    ),
    customerPareto: customerRevenue.map((customer) => {
      cumulativeRevenue += customer.revenueCents;
      return {
        id: customer.id,
        name: customer.name,
        revenueCents: customer.revenueCents,
        shareBps:
          revenueActual > 0
            ? Math.round((customer.revenueCents / revenueActual) * 10_000)
            : 0,
        cumulativeShareBps:
          revenueActual > 0
            ? Math.round((cumulativeRevenue / revenueActual) * 10_000)
            : 0,
      };
    }),
    alerts: alertRows.map((alert) => ({
      id: alert.id,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      recommendation: alert.recommendation,
      href: alert.opportunityId
        ? `/opportunities/${alert.opportunityId}`
        : alert.customerId
          ? `/customers/${alert.customerId}`
          : "/insights",
      createdAt: alert.createdAt,
    })),
    recommendedActions,
  };
}

function resolvePeriod(from?: Date, to?: Date) {
  const end = to ?? new Date();
  const start =
    from ??
    new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1));
  return { from: start, to: end };
}

function customerScopeConditions(params: DashboardQueryParams): SQL[] {
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

export async function getDashboardMetrics(
  params: DashboardQueryParams,
): Promise<DashboardMetrics> {
  const db = getDb();
  const period = resolvePeriod(params.from, params.to);
  const scopedCustomers = await db
    .select({
      id: customers.id,
      name: customers.tradeName,
      registeredAt: customers.registeredAt,
      lastPurchaseAt: customers.lastPurchaseAt,
      sellerId: customers.sellerId,
      territoryId: customers.territoryId,
      segment: customers.segment,
      inactivityRiskScore: customerScores.inactivityRiskScore,
      repurchaseScore: customerScores.repurchaseScore,
    })
    .from(customers)
    .leftJoin(customerScores, eq(customerScores.customerId, customers.id))
    .where(and(...customerScopeConditions(params)));

  const customerIds = new Set(scopedCustomers.map((customer) => customer.id));
  const effectiveSellerId =
    params.role === "seller" ? params.userId : params.sellerId;
  const [allOrders, allOpportunities, allTargets, allAlerts] =
    await Promise.all([
      db
        .select({
          id: orders.id,
          customerId: orders.customerId,
          customerName: customers.tradeName,
          ownerId: orders.ownerId,
          sellerName: profiles.name,
          territoryId: customers.territoryId,
          territoryName: salesTerritories.name,
          orderedAt: orders.orderedAt,
          revenueCents: orders.revenueCents,
          costCents: orders.costCents,
        })
        .from(orders)
        .innerJoin(customers, eq(orders.customerId, customers.id))
        .leftJoin(profiles, eq(orders.ownerId, profiles.id))
        .leftJoin(
          salesTerritories,
          eq(customers.territoryId, salesTerritories.id),
        )
        .where(eq(orders.organizationId, params.organizationId)),
      db
        .select({
          id: opportunities.id,
          customerId: opportunities.customerId,
          ownerId: opportunities.ownerId,
          stage: opportunities.stage,
          estimatedValueCents: opportunities.estimatedValueCents,
          probability: opportunities.probability,
          createdAt: opportunities.createdAt,
        })
        .from(opportunities)
        .where(eq(opportunities.organizationId, params.organizationId)),
      db
        .select()
        .from(targets)
        .where(eq(targets.organizationId, params.organizationId)),
      db
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.organizationId, params.organizationId),
            eq(alerts.status, "open"),
          ),
        )
        .orderBy(asc(alerts.createdAt)),
    ]);

  const scopedOrders = allOrders.filter(
    (order) =>
      customerIds.has(order.customerId) &&
      (!effectiveSellerId || order.ownerId === effectiveSellerId) &&
      order.orderedAt >= period.from &&
      order.orderedAt <= period.to,
  );
  const scopedOpportunities = allOpportunities.filter(
    (opportunity) =>
      customerIds.has(opportunity.customerId) &&
      (!effectiveSellerId || opportunity.ownerId === effectiveSellerId) &&
      opportunity.createdAt >= period.from &&
      opportunity.createdAt <= period.to,
  );
  const opportunityIds = new Set(
    scopedOpportunities.map((opportunity) => opportunity.id),
  );
  const periods = new Set(monthKeys(period.from, period.to));
  const scopedTargets = allTargets.filter(
    (target) =>
      periods.has(target.period) &&
      (!effectiveSellerId || target.sellerId === effectiveSellerId) &&
      (!params.territoryId || target.territoryId === params.territoryId),
  );
  const scopedAlerts = allAlerts.filter(
    (alert) =>
      (!alert.customerId || customerIds.has(alert.customerId)) &&
      (!alert.opportunityId || opportunityIds.has(alert.opportunityId)),
  );

  return aggregateDashboardRows({
    role: params.role,
    ...period,
    orders: scopedOrders,
    opportunities: scopedOpportunities,
    customers: scopedCustomers,
    targets: scopedTargets,
    alerts: scopedAlerts,
  });
}

export type DashboardFilterOptions = {
  territories: Array<{ id: string; name: string }>;
  segments: string[];
  sellers: Array<{ id: string; name: string }>;
};

export async function getDashboardFilterOptions(
  params: Pick<DashboardQueryParams, "organizationId" | "role" | "userId">,
): Promise<DashboardFilterOptions> {
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
