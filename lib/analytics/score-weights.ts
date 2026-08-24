/**
 * A recompra lidera a prioridade por representar receita de curto prazo.
 * Inatividade recebe peso próximo para proteger a carteira, enquanto potencial
 * complementa a decisão sem superar sinais comportamentais observados.
 */
export const PRIORITY_SCORE_WEIGHTS = {
  repurchase: 0.4,
  inactivity: 0.35,
  potential: 0.25,
} as const;
