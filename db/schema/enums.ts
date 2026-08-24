export const profileRoles = ["admin", "manager", "seller"] as const;

export type ProfileRole = (typeof profileRoles)[number];

export const customerStatuses = ["prospect", "active", "inactive"] as const;
export const customerSizes = ["small", "medium", "large"] as const;
export const productStatuses = ["active", "inactive"] as const;
export const priceListScopes = ["standard", "customer", "segment"] as const;
export const quoteStatuses = [
  "draft",
  "sent",
  "approved",
  "rejected",
  "expired",
  "won",
  "lost",
] as const;
export const orderStatuses = [
  "pending",
  "confirmed",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
] as const;

// UI mapping: Novo, Qualificação, Diagnóstico, Proposta, Negociação, Ganho, Perdido.
export const opportunityStages = [
  "novo",
  "qualificacao",
  "diagnostico",
  "proposta",
  "negociacao",
  "ganho",
  "perdido",
] as const;
export const opportunityPriorities = ["low", "medium", "high"] as const;
export const activityTypes = [
  "ligacao",
  "email",
  "visita",
  "reuniao",
  "follow_up",
] as const;
export const activityStatuses = [
  "planned",
  "completed",
  "cancelled",
] as const;
export const alertSeverities = ["info", "warning", "critical"] as const;
export const alertStatuses = ["open", "resolved", "dismissed"] as const;

export type CustomerStatus = (typeof customerStatuses)[number];
export type CustomerSize = (typeof customerSizes)[number];
export type ProductStatus = (typeof productStatuses)[number];
export type PriceListScope = (typeof priceListScopes)[number];
export type QuoteStatus = (typeof quoteStatuses)[number];
export type OrderStatus = (typeof orderStatuses)[number];
export type OpportunityStage = (typeof opportunityStages)[number];
export type OpportunityPriority = (typeof opportunityPriorities)[number];
export type ActivityType = (typeof activityTypes)[number];
export type ActivityStatus = (typeof activityStatuses)[number];
export type AlertSeverity = (typeof alertSeverities)[number];
export type AlertStatus = (typeof alertStatuses)[number];
