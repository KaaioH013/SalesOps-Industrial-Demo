import { describe, expect, it } from "vitest";

import { buildOpportunityStalenessAlert, buildQuoteMarginAlert } from "@/lib/analytics/alerts";
import { exponentialSmoothingForecast } from "@/lib/analytics/forecast";
import { calculateRfmScore } from "@/lib/analytics/rfm";
import { calculateRepurchaseScore } from "@/lib/analytics/repurchase";
import { PRIORITY_SCORE_WEIGHTS } from "@/lib/analytics/score-weights";
import { computePriorityScore } from "@/lib/analytics/scoring";

describe("analytics scoring", () => {
  it("mantém os pesos documentados normalizados", () => {
    expect(Object.values(PRIORITY_SCORE_WEIGHTS).reduce((sum, value) => sum + value, 0)).toBe(1);
  });

  it("calcula prioridade limitada a 0-100 e expõe fatores", () => {
    expect(
      computePriorityScore({
        repurchaseScore: 90,
        inactivityRiskScore: 80,
        potentialScore: 70,
      }),
    ).toEqual({
      score: 82,
      factors: [
        { key: "repurchase", label: "Propensão à recompra", score: 90, weight: 0.4 },
        { key: "inactivity", label: "Risco de inatividade", score: 80, weight: 0.35 },
        { key: "potential", label: "Potencial comercial", score: 70, weight: 0.25 },
      ],
    });
  });

  it("calcula RFM com recência, frequência e valor normalizados", () => {
    expect(
      calculateRfmScore({
        daysSinceLastPurchase: 15,
        purchaseCount: 8,
        revenueCents: 80_000,
        maxPurchaseCount: 10,
        maxRevenueCents: 100_000,
      }),
    ).toEqual({
      score: 84,
      recencyScore: 90,
      frequencyScore: 80,
      monetaryScore: 80,
    });
  });

  it("prioriza recompra quando o cliente chega ao intervalo habitual", () => {
    expect(
      calculateRepurchaseScore({
        daysSinceLastPurchase: 30,
        averagePurchaseIntervalDays: 30,
        purchaseCount: 4,
      }),
    ).toBe(100);
    expect(
      calculateRepurchaseScore({
        daysSinceLastPurchase: 5,
        averagePurchaseIntervalDays: 30,
        purchaseCount: 4,
      }),
    ).toBeLessThan(50);
  });

  it("gera alerta de margem quando a cotação fica abaixo da meta", () => {
    expect(
      buildQuoteMarginAlert({
        quoteId: "quote-1",
        quoteNumber: "Q-001",
        grossMarginBps: 1_500,
        targetMarginBps: 3_000,
      }),
    ).toMatchObject({
      type: "quote_margin",
      severity: "critical",
      opportunityId: null,
    });
  });

  it("usa os thresholds existentes para oportunidade sem atividade", () => {
    expect(
      buildOpportunityStalenessAlert({
        opportunityId: "opp-1",
        title: "Expansão",
        customerId: "customer-1",
        daysSinceActivity: 31,
      }),
    ).toMatchObject({
      type: "opportunity_staleness",
      severity: "critical",
      opportunityId: "opp-1",
    });
  });

  it("projeta o próximo período por suavização exponencial", () => {
    expect(exponentialSmoothingForecast([100, 200, 300], 0.5)).toBe(225);
    expect(exponentialSmoothingForecast([], 0.5)).toBe(0);
  });
});
