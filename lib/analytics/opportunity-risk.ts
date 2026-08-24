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

export function buildStalenessExplanation(
  staleness: StalenessLevel,
  daysSinceActivityCount: number | null,
  daysInStageCount: number,
): string {
  if (daysSinceActivityCount == null) {
    return "Nenhuma atividade registrada para esta oportunidade. Sem histórico de contato, o risco de esfriamento é considerado crítico.";
  }

  if (staleness === "critical") {
    return `Sem atividade há ${daysSinceActivityCount} dias (limite crítico: ${CRITICAL_DAYS} dias). A oportunidade está há ${daysInStageCount} dias no estágio atual e precisa de follow-up imediato para evitar perda.`;
  }

  if (staleness === "attention") {
    return `Sem atividade há ${daysSinceActivityCount} dias (atenção a partir de ${ATTENTION_DAYS} dias). Permanece há ${daysInStageCount} dias no estágio atual — agende contato em breve.`;
  }

  return `Atividade recente há ${daysSinceActivityCount} dias. A oportunidade está em dia, com ${daysInStageCount} dias no estágio atual.`;
}
