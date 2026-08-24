import { ATTENTION_DAYS, CRITICAL_DAYS } from "@/lib/analytics/alert-thresholds";

type GeneratedAlert = {
  type: "quote_margin" | "opportunity_staleness";
  severity: "warning" | "critical";
  title: string;
  description: string;
  recommendation: string;
  customerId: string | null;
  opportunityId: string | null;
};

export function buildQuoteMarginAlert(input: {
  quoteId: string;
  quoteNumber: string;
  grossMarginBps: number;
  targetMarginBps: number;
  customerId?: string;
}): GeneratedAlert | null {
  const gapBps = input.targetMarginBps - input.grossMarginBps;
  if (gapBps <= 0) return null;

  return {
    type: "quote_margin",
    severity: gapBps >= 1_000 ? "critical" : "warning",
    title: `Margem em risco na cotação ${input.quoteNumber}`,
    description: `Margem de ${(input.grossMarginBps / 100).toFixed(1)}%, ${(gapBps / 100).toFixed(
      1,
    )} p.p. abaixo da meta.`,
    recommendation: `Revisar descontos e custos da cotação ${input.quoteNumber}.`,
    customerId: input.customerId ?? null,
    opportunityId: null,
  };
}

export function buildOpportunityStalenessAlert(input: {
  opportunityId: string;
  title: string;
  customerId: string;
  daysSinceActivity: number | null;
}): GeneratedAlert | null {
  const days = input.daysSinceActivity ?? CRITICAL_DAYS;
  if (days < ATTENTION_DAYS) return null;

  return {
    type: "opportunity_staleness",
    severity: days >= CRITICAL_DAYS ? "critical" : "warning",
    title: `Oportunidade sem atividade: ${input.title}`,
    description:
      input.daysSinceActivity == null
        ? "Nenhuma atividade registrada para esta oportunidade."
        : `Sem atividade há ${days} dias.`,
    recommendation: "Definir próximo passo e realizar follow-up comercial.",
    customerId: input.customerId,
    opportunityId: input.opportunityId,
  };
}
