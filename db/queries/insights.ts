import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { alerts, customerScores, customers } from "@/db/schema";
import type { AlertSeverity, ProfileRole } from "@/db/schema/enums";

export type InsightItem = {
  id: string;
  name: string;
  score?: number;
  severity?: AlertSeverity;
  factors: string[];
  recommendation: string;
  href: string;
};

export type InsightsData = {
  repurchase: InsightItem[];
  inactivity: InsightItem[];
  opportunityRisk: InsightItem[];
  marginRisk: InsightItem[];
};

function scoreFactors(explanations: Record<string, unknown>): string[] {
  const factors = explanations.factors;
  if (!Array.isArray(factors)) return [];

  return factors
    .filter(
      (factor): factor is { label: string; score: number } =>
        typeof factor === "object" &&
        factor !== null &&
        "label" in factor &&
        typeof factor.label === "string" &&
        "score" in factor &&
        typeof factor.score === "number",
    )
    .map((factor) => `${factor.label}: ${factor.score}/100`);
}

export async function getInsights(params: {
  organizationId: string;
  role: ProfileRole;
  userId: string;
}): Promise<InsightsData> {
  const customerCondition =
    params.role === "seller"
      ? and(
          eq(customers.organizationId, params.organizationId),
          eq(customers.sellerId, params.userId),
        )
      : eq(customers.organizationId, params.organizationId);
  const scoreRows = await getDb()
    .select({
      id: customerScores.id,
      customerId: customers.id,
      customerName: customers.tradeName,
      repurchaseScore: customerScores.repurchaseScore,
      inactivityRiskScore: customerScores.inactivityRiskScore,
      explanations: customerScores.explanations,
    })
    .from(customerScores)
    .innerJoin(customers, eq(customerScores.customerId, customers.id))
    .where(customerCondition);

  const alertRows = await getDb()
    .select({
      id: alerts.id,
      type: alerts.type,
      severity: alerts.severity,
      title: alerts.title,
      description: alerts.description,
      recommendation: alerts.recommendation,
      customerId: alerts.customerId,
      opportunityId: alerts.opportunityId,
      customerSellerId: customers.sellerId,
    })
    .from(alerts)
    .leftJoin(customers, eq(alerts.customerId, customers.id))
    .where(and(eq(alerts.organizationId, params.organizationId), eq(alerts.status, "open")))
    .orderBy(desc(alerts.createdAt));
  const scopedAlerts = alertRows.filter(
    (alert) => params.role !== "seller" || alert.customerSellerId === params.userId,
  );

  const toScoreInsight = (
    row: (typeof scoreRows)[number],
    score: number,
    recommendation: string,
  ): InsightItem => ({
    id: row.id,
    name: row.customerName,
    score,
    factors: scoreFactors(row.explanations),
    recommendation,
    href: `/customers/${row.customerId}`,
  });
  const toAlertInsight = (alert: (typeof alertRows)[number]): InsightItem => ({
    id: alert.id,
    name: alert.title,
    severity: alert.severity,
    factors: [alert.description],
    recommendation: alert.recommendation ?? "Revisar com o responsável comercial.",
    href: alert.opportunityId
      ? `/opportunities/${alert.opportunityId}`
      : alert.customerId
        ? `/customers/${alert.customerId}`
        : "/insights",
  });

  return {
    repurchase: [...scoreRows]
      .sort((left, right) => right.repurchaseScore - left.repurchaseScore)
      .slice(0, 5)
      .map((row) =>
        toScoreInsight(
          row,
          row.repurchaseScore,
          "Contatar o cliente e preparar uma oferta aderente ao histórico de compras.",
        ),
      ),
    inactivity: [...scoreRows]
      .sort((left, right) => right.inactivityRiskScore - left.inactivityRiskScore)
      .slice(0, 5)
      .map((row) =>
        toScoreInsight(
          row,
          row.inactivityRiskScore,
          "Agendar contato de recuperação e validar mudanças na demanda.",
        ),
      ),
    opportunityRisk: scopedAlerts
      .filter((alert) => alert.type === "opportunity_staleness")
      .slice(0, 5)
      .map(toAlertInsight),
    marginRisk:
      params.role === "seller"
        ? []
        : scopedAlerts
            .filter((alert) => alert.type === "quote_margin")
            .slice(0, 5)
            .map(toAlertInsight),
  };
}
