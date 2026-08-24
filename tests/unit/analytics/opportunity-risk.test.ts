import { describe, it, expect } from "vitest";
import {
  daysBetween,
  daysInStage,
  daysSinceActivity,
  stalenessLevel,
  weightedValue,
} from "@/lib/analytics/opportunity-risk";

describe("daysBetween", () => {
  it("returns full days from earlier to later date", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-01-15T00:00:00Z");
    expect(daysBetween(start, end)).toBe(14);
  });

  it("returns negative days when end is before start", () => {
    const start = new Date("2026-01-15T00:00:00Z");
    const end = new Date("2026-01-01T00:00:00Z");
    expect(daysBetween(start, end)).toBe(-14);
  });
});

describe("daysInStage", () => {
  it("counts days since stage entry using provided now", () => {
    const stageEnteredAt = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-01-08T00:00:00Z");
    expect(daysInStage(stageEnteredAt, now)).toBe(7);
  });
});

describe("daysSinceActivity", () => {
  it("counts days since last activity using provided now", () => {
    const lastActivityAt = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-01-20T00:00:00Z");
    expect(daysSinceActivity(lastActivityAt, now)).toBe(19);
  });
});

describe("stalenessLevel", () => {
  it("returns ok below 14-day attention threshold", () => {
    expect(stalenessLevel(0)).toBe("ok");
    expect(stalenessLevel(13)).toBe("ok");
  });

  it("returns attention at 14 days and below 30-day critical threshold", () => {
    expect(stalenessLevel(14)).toBe("attention");
    expect(stalenessLevel(29)).toBe("attention");
  });

  it("returns critical at 30 days and above", () => {
    expect(stalenessLevel(30)).toBe("critical");
    expect(stalenessLevel(45)).toBe("critical");
  });
});

describe("weightedValue", () => {
  it("re-exports weighted pipeline value from pipeline analytics", () => {
    expect(weightedValue(10000, 0.25)).toBe(2500);
  });
});
