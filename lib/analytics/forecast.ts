export function exponentialSmoothingForecast(values: number[], alpha = 0.4): number {
  if (values.length === 0) return 0;
  if (alpha <= 0 || alpha > 1) {
    throw new RangeError("alpha must be greater than 0 and at most 1");
  }

  const forecast = values
    .slice(1)
    .reduce((smoothed, value) => alpha * value + (1 - alpha) * smoothed, values[0]!);

  return Math.max(0, Math.round(forecast));
}
