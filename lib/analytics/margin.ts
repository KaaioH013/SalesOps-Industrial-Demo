export function grossMargin(revenue: number, cost: number): number | null {
  if (revenue === 0) return null;
  return (revenue - cost) / revenue;
}
