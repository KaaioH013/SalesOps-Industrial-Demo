export const DEFAULT_LOSS_REASONS = [
  "Preço acima do orçamento",
  "Prazo de entrega",
  "Concorrência",
  "Projeto cancelado",
  "Sem budget aprovado",
] as const;

export function parseLossReasonsJson(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [...DEFAULT_LOSS_REASONS];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [...DEFAULT_LOSS_REASONS];
  }
}

export function serializeLossReasons(reasons: string[]): string {
  return JSON.stringify(reasons);
}
