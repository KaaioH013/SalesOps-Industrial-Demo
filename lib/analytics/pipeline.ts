export function weightedPipelineValue(
  estimatedValue: number,
  probability: number,
): number {
  return estimatedValue * probability;
}
