import { describe, expect, it } from "vitest";

import { aggregateDashboardRows } from "@/db/queries/dashboard";

const from = new Date("2026-01-01T00:00:00.000Z");
const to = new Date("2026-01-31T23:59:59.999Z");

const baseRows = {
  role: "manager" as const,
  from,
  to,
  orders: [
    {
      id: "order-1",
      customerId: "customer-1",
      customerName: "Cliente A",
      ownerId: "seller-1",
      sellerName: "Ana",
      territoryId: "territory-1",
      territoryName: "Sul",
      orderedAt: new Date("2026-01-10T12:00:00.000Z"),
      revenueCents: 100_000,
      costCents: 60_000,
    },
  ],
  opportunities: [
    {
      id: "opportunity-1",
      stage: "proposta" as const,
      estimatedValueCents: 50_000,
      probability: 50,
    },
    {
      id: "opportunity-2",
      stage: "ganho" as const,
      estimatedValueCents: 80_000,
      probability: 100,
    },
    {
      id: "opportunity-3",
      stage: "perdido" as const,
      estimatedValueCents: 40_000,
      probability: 0,
    },
  ],
  customers: [
    {
      id: "customer-1",
      name: "Cliente A",
      registeredAt: new Date("2026-01-05T12:00:00.000Z"),
      lastPurchaseAt: new Date("2025-09-01T12:00:00.000Z"),
      inactivityRiskScore: 80,
      repurchaseScore: 75,
    },
  ],
  targets: [
    {
      period: "2026-01",
      revenueTargetCents: 200_000,
      marginTargetCents: 50_000,
    },
  ],
  alerts: [],
};

describe("aggregateDashboardRows", () => {
  it("calcula KPIs, série mensal e conversão comercial", () => {
    const result = aggregateDashboardRows(baseRows);

    expect(result.revenue).toEqual({
      actualCents: 100_000,
      targetCents: 200_000,
      attainmentBps: 5_000,
    });
    expect(result.margin).toEqual({
      actualCents: 40_000,
      targetCents: 50_000,
      attainmentBps: 8_000,
    });
    expect(result.openPipeline).toEqual({
      count: 1,
      weightedValueCents: 25_000,
    });
    expect(result.proposalToWonConversionBps).toBe(5_000);
    expect(result.monthlySeries[0]).toMatchObject({
      period: "2026-01",
      revenueCents: 100_000,
      marginCents: 40_000,
      orders: 1,
    });
  });

  it("oculta margem para vendedor sem remover os demais indicadores", () => {
    const result = aggregateDashboardRows({
      ...baseRows,
      role: "seller",
    });

    expect(result.margin).toBeNull();
    expect(result.revenue.actualCents).toBe(100_000);
    expect(result.customerPareto).toHaveLength(1);
  });
});
