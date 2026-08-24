import { describe, expect, it } from "vitest";

import { presentOrderFinancials } from "@/db/queries/orders";
import { presentProductFinancials } from "@/db/queries/products";
import { presentQuoteFinancials } from "@/db/queries/quotes";

describe("commerce RBAC", () => {
  it("remove custo e margem do produto para vendedor", () => {
    expect(
      presentProductFinancials(
        { listPriceCents: 100_000, standardCostCents: 60_000 },
        "seller",
      ),
    ).toEqual({
      standardCostCents: null,
      grossMarginBps: null,
    });
  });

  it("calcula margem do produto para gerente", () => {
    expect(
      presentProductFinancials(
        { listPriceCents: 100_000, standardCostCents: 60_000 },
        "manager",
      ),
    ).toEqual({
      standardCostCents: 60_000,
      grossMarginBps: 4_000,
    });
  });

  it("calcula margem da cotação e sinaliza resultado abaixo da meta", () => {
    expect(
      presentQuoteFinancials(
        { totalCents: 100_000, costCents: 75_000, targetMarginBps: 3_000 },
        "manager",
      ),
    ).toEqual({
      costCents: 75_000,
      grossMarginBps: 2_500,
      targetMarginBps: 3_000,
      belowTarget: true,
    });
  });

  it("remove campos financeiros da cotação para vendedor", () => {
    expect(
      presentQuoteFinancials(
        { totalCents: 100_000, costCents: 75_000, targetMarginBps: 3_000 },
        "seller",
      ),
    ).toEqual({
      costCents: null,
      grossMarginBps: null,
      targetMarginBps: null,
      belowTarget: null,
    });
  });

  it("remove custo e margem do pedido para vendedor", () => {
    expect(
      presentOrderFinancials(
        { revenueCents: 100_000, costCents: 70_000 },
        "seller",
      ),
    ).toEqual({
      costCents: null,
      grossMarginBps: null,
    });
  });
});
