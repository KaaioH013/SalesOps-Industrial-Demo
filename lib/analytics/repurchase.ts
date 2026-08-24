export type RepurchaseInput = {
  daysSinceLastPurchase: number | null;
  averagePurchaseIntervalDays: number | null;
  purchaseCount: number;
};

export function calculateRepurchaseScore(input: RepurchaseInput): number {
  if (
    input.daysSinceLastPurchase == null ||
    input.averagePurchaseIntervalDays == null ||
    input.averagePurchaseIntervalDays <= 0 ||
    input.purchaseCount < 2
  ) {
    return 0;
  }

  const distance = Math.abs(input.daysSinceLastPurchase - input.averagePurchaseIntervalDays);
  const window = Math.max(14, input.averagePurchaseIntervalDays);
  return Math.round(Math.max(0, 100 - (distance / window) * 100));
}

export function averagePurchaseInterval(orderDates: Date[]): number | null {
  if (orderDates.length < 2) return null;

  const sorted = [...orderDates].sort((left, right) => left.getTime() - right.getTime());
  const totalDays = sorted.slice(1).reduce((total, date, index) => {
    const previous = sorted[index]!;
    return total + (date.getTime() - previous.getTime()) / 86_400_000;
  }, 0);

  return totalDays / (sorted.length - 1);
}
