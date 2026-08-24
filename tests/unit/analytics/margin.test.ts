import { describe, it, expect } from "vitest";
import { grossMargin } from "@/lib/analytics/margin";

describe("grossMargin", () => {
  it("computes (revenue-cost)/revenue", () => {
    expect(grossMargin(100, 60)).toBeCloseTo(0.4);
  });

  it("returns null when revenue is 0", () => {
    expect(grossMargin(0, 10)).toBeNull();
  });
});
