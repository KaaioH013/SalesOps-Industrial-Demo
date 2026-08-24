export type RfmInput = {
  daysSinceLastPurchase: number | null;
  purchaseCount: number;
  revenueCents: number;
  maxPurchaseCount: number;
  maxRevenueCents: number;
};

function clamp(value: number) {
  return Math.round(Math.min(100, Math.max(0, value)));
}

export function calculateRfmScore(input: RfmInput) {
  const recencyScore =
    input.daysSinceLastPurchase == null
      ? 0
      : clamp(100 - (input.daysSinceLastPurchase / 150) * 100);
  const frequencyScore = clamp(
    input.maxPurchaseCount > 0 ? (input.purchaseCount / input.maxPurchaseCount) * 100 : 0,
  );
  const monetaryScore = clamp(
    input.maxRevenueCents > 0 ? (input.revenueCents / input.maxRevenueCents) * 100 : 0,
  );

  return {
    score: clamp(recencyScore * 0.4 + frequencyScore * 0.3 + monetaryScore * 0.3),
    recencyScore,
    frequencyScore,
    monetaryScore,
  };
}
