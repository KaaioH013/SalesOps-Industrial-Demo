import { PRIORITY_SCORE_WEIGHTS } from "@/lib/analytics/score-weights";

export type PriorityScoreInput = {
  repurchaseScore: number;
  inactivityRiskScore: number;
  potentialScore: number;
};

export type ScoreFactor = {
  key: "repurchase" | "inactivity" | "potential";
  label: string;
  score: number;
  weight: number;
};

function clampScore(value: number) {
  return Math.round(Math.min(100, Math.max(0, value)));
}

export function computePriorityScore(input: PriorityScoreInput): {
  score: number;
  factors: ScoreFactor[];
} {
  const factors: ScoreFactor[] = [
    {
      key: "repurchase",
      label: "Propensão à recompra",
      score: clampScore(input.repurchaseScore),
      weight: PRIORITY_SCORE_WEIGHTS.repurchase,
    },
    {
      key: "inactivity",
      label: "Risco de inatividade",
      score: clampScore(input.inactivityRiskScore),
      weight: PRIORITY_SCORE_WEIGHTS.inactivity,
    },
    {
      key: "potential",
      label: "Potencial comercial",
      score: clampScore(input.potentialScore),
      weight: PRIORITY_SCORE_WEIGHTS.potential,
    },
  ];

  return {
    score: clampScore(factors.reduce((total, factor) => total + factor.score * factor.weight, 0)),
    factors,
  };
}
