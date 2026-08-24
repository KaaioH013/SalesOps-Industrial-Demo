import { describe, expect, it } from "vitest";

import { moveOpportunityStageSchema } from "@/lib/validations/opportunities";

describe("moveOpportunityStageSchema", () => {
  it("requires a loss reason when moving to perdido", () => {
    const result = moveOpportunityStageSchema.safeParse({
      id: "opportunity-1",
      stage: "perdido",
      lossReason: " ",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a loss reason when moving to perdido", () => {
    const result = moveOpportunityStageSchema.safeParse({
      id: "opportunity-1",
      stage: "perdido",
      lossReason: "Preço acima do orçamento",
    });

    expect(result.success).toBe(true);
  });

  it("removes a loss reason when moving to another stage", () => {
    const result = moveOpportunityStageSchema.parse({
      id: "opportunity-1",
      stage: "negociacao",
      lossReason: "Motivo antigo",
    });

    expect(result.lossReason).toBeUndefined();
  });
});
