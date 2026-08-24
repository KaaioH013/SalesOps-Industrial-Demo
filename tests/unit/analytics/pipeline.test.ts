import { describe, it, expect } from "vitest";
import { weightedPipelineValue } from "@/lib/analytics/pipeline";

describe("weightedPipelineValue", () => {
  it("multiplies value by probability", () => {
    expect(weightedPipelineValue(10000, 0.25)).toBe(2500);
  });
});
