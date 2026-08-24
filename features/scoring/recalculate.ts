"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db/client";
import {
  alerts,
  customerScores,
  customers,
  forecastSnapshots,
  opportunities,
  orders,
  products,
  quoteItems,
  quotes,
} from "@/db/schema";
import { buildOpportunityStalenessAlert, buildQuoteMarginAlert } from "@/lib/analytics/alerts";
import { exponentialSmoothingForecast } from "@/lib/analytics/forecast";
import { calculateRfmScore } from "@/lib/analytics/rfm";
import { averagePurchaseInterval, calculateRepurchaseScore } from "@/lib/analytics/repurchase";
import { computePriorityScore } from "@/lib/analytics/scoring";
import { auth } from "@/lib/auth/auth";
import { requireRole } from "@/lib/permissions/roles";

const DAY_MS = 86_400_000;
const GENERATED_ALERT_TYPES = ["quote_margin", "opportunity_staleness"];
const OPEN_OPPORTUNITY_STAGES = [
  "novo",
  "qualificacao",
  "diagnostico",
  "proposta",
  "negociacao",
] as const;

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function nextMonthPeriod(now: Date) {
  return monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)));
}

export async function recalculateOrganizationScores(organizationId: string, now = new Date()) {
  const db = getDb();
  const [customerRows, orderRows, opportunityRows, quoteRows, quoteItemRows] = await Promise.all([
    db.select().from(customers).where(eq(customers.organizationId, organizationId)),
    db.select().from(orders).where(eq(orders.organizationId, organizationId)),
    db
      .select()
      .from(opportunities)
      .where(
        and(
          eq(opportunities.organizationId, organizationId),
          inArray(opportunities.stage, OPEN_OPPORTUNITY_STAGES),
        ),
      ),
    db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.organizationId, organizationId),
          inArray(quotes.status, ["draft", "sent", "approved"]),
        ),
      ),
    db
      .select({
        quoteId: quoteItems.quoteId,
        totalCents: quoteItems.totalCents,
        targetMarginBps: products.targetMarginBps,
      })
      .from(quoteItems)
      .innerJoin(products, eq(quoteItems.productId, products.id))
      .where(eq(quoteItems.organizationId, organizationId)),
  ]);

  const ordersByCustomer = new Map<string, typeof orderRows>();
  for (const order of orderRows) {
    const current = ordersByCustomer.get(order.customerId) ?? [];
    current.push(order);
    ordersByCustomer.set(order.customerId, current);
  }

  const maxPurchaseCount = Math.max(
    1,
    ...customerRows.map((customer) => ordersByCustomer.get(customer.id)?.length ?? 0),
  );
  const maxRevenueCents = Math.max(
    1,
    ...customerRows.map((customer) =>
      (ordersByCustomer.get(customer.id) ?? []).reduce((sum, order) => sum + order.revenueCents, 0),
    ),
  );

  const scoreRows = customerRows.map((customer) => {
    const customerOrders = ordersByCustomer.get(customer.id) ?? [];
    const purchaseDates = customerOrders.map((order) => order.orderedAt);
    const latestPurchase = purchaseDates.reduce<Date | null>(
      (latest, date) => (!latest || date > latest ? date : latest),
      customer.lastPurchaseAt,
    );
    const daysSinceLastPurchase = latestPurchase
      ? Math.max(0, Math.floor((now.getTime() - latestPurchase.getTime()) / DAY_MS))
      : null;
    const revenueCents = customerOrders.reduce((sum, order) => sum + order.revenueCents, 0);
    const rfm = calculateRfmScore({
      daysSinceLastPurchase,
      purchaseCount: customerOrders.length,
      revenueCents,
      maxPurchaseCount,
      maxRevenueCents,
    });
    const repurchaseScore = calculateRepurchaseScore({
      daysSinceLastPurchase,
      averagePurchaseIntervalDays: averagePurchaseInterval(purchaseDates),
      purchaseCount: customerOrders.length,
    });
    const inactivityRiskScore =
      daysSinceLastPurchase == null
        ? 100
        : Math.round(Math.min(100, (daysSinceLastPurchase / 180) * 100));
    const priority = computePriorityScore({
      repurchaseScore,
      inactivityRiskScore,
      potentialScore: rfm.score,
    });

    return {
      id: crypto.randomUUID(),
      organizationId,
      customerId: customer.id,
      repurchaseScore,
      inactivityRiskScore,
      potentialScore: rfm.score,
      priorityScore: priority.score,
      explanations: {
        factors: priority.factors,
        rfm,
        daysSinceLastPurchase,
      },
      calculatedAt: now,
      createdAt: now,
      updatedAt: now,
    };
  });

  const generatedAlerts = [
    ...opportunityRows
      .map((opportunity) =>
        buildOpportunityStalenessAlert({
          opportunityId: opportunity.id,
          title: opportunity.title,
          customerId: opportunity.customerId,
          daysSinceActivity: opportunity.lastActivityAt
            ? Math.max(
                0,
                Math.floor((now.getTime() - opportunity.lastActivityAt.getTime()) / DAY_MS),
              )
            : null,
        }),
      )
      .filter((alert) => alert !== null),
    ...quoteRows
      .map((quote) => {
        const items = quoteItemRows.filter((item) => item.quoteId === quote.id);
        const total = items.reduce((sum, item) => sum + item.totalCents, 0);
        const targetMarginBps =
          total > 0
            ? Math.round(
                items.reduce((sum, item) => sum + item.targetMarginBps * item.totalCents, 0) /
                  total,
              )
            : 3_000;
        return buildQuoteMarginAlert({
          quoteId: quote.id,
          quoteNumber: quote.number,
          grossMarginBps: quote.grossMarginBps,
          targetMarginBps,
          customerId: quote.customerId,
        });
      })
      .filter((alert) => alert !== null),
  ];

  const monthlyRevenue = new Map<string, number>();
  for (const order of orderRows) {
    const period = monthKey(order.orderedAt);
    monthlyRevenue.set(period, (monthlyRevenue.get(period) ?? 0) + order.revenueCents);
  }
  const historicalValues = [...monthlyRevenue.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-12)
    .map(([, value]) => value);

  await db.transaction(async (tx) => {
    await tx.delete(customerScores).where(eq(customerScores.organizationId, organizationId));
    await tx
      .delete(alerts)
      .where(
        and(
          eq(alerts.organizationId, organizationId),
          eq(alerts.status, "open"),
          inArray(alerts.type, GENERATED_ALERT_TYPES),
        ),
      );

    if (scoreRows.length > 0) await tx.insert(customerScores).values(scoreRows);
    if (generatedAlerts.length > 0) {
      await tx.insert(alerts).values(
        generatedAlerts.map((alert) => ({
          id: crypto.randomUUID(),
          organizationId,
          ...alert,
          status: "open" as const,
          createdAt: now,
          updatedAt: now,
        })),
      );
    }
    await tx.insert(forecastSnapshots).values({
      id: crypto.randomUUID(),
      organizationId,
      period: nextMonthPeriod(now),
      forecastCents: exponentialSmoothingForecast(historicalValues),
      method: "exponential_smoothing_alpha_0.4",
      calculatedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  });

  return {
    customers: scoreRows.length,
    alerts: generatedAlerts.length,
    forecastPeriod: nextMonthPeriod(now),
  };
}

export async function recalculateScores() {
  const session = await auth();
  if (!session?.user) throw new Error("Autenticação necessária");
  requireRole(session.user.role, ["admin", "manager"]);

  const result = await recalculateOrganizationScores(session.user.organizationId);
  revalidatePath("/insights");
  revalidatePath("/dashboard");
  return result;
}
