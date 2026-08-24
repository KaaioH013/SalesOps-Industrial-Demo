import { differenceInDays } from "date-fns";
import { ATTENTION_DAYS, CRITICAL_DAYS } from "@/lib/analytics/alert-thresholds";
import { weightedPipelineValue } from "@/lib/analytics/pipeline";

export { weightedPipelineValue as weightedValue };

export type StalenessLevel = "ok" | "attention" | "critical";

export function daysBetween(a: Date, b: Date): number {
  return differenceInDays(b, a);
}

export function daysInStage(stageEnteredAt: Date, now: Date = new Date()): number {
  return differenceInDays(now, stageEnteredAt);
}

export function daysSinceActivity(
  lastActivityAt: Date,
  now: Date = new Date(),
): number {
  return differenceInDays(now, lastActivityAt);
}

export function stalenessLevel(daysSinceActivityCount: number): StalenessLevel {
  if (daysSinceActivityCount >= CRITICAL_DAYS) {
    return "critical";
  }
  if (daysSinceActivityCount >= ATTENTION_DAYS) {
    return "attention";
  }
  return "ok";
}
