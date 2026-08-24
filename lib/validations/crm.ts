import { z } from "zod";

import {
  activityStatuses,
  activityTypes,
  opportunityPriorities,
  opportunityStages,
} from "@/db/schema/enums";

const dateString = z
  .string()
  .trim()
  .min(1, "Informe a data")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Data inválida")
  .transform((value) => new Date(value));

const requiredDate = z.union([z.date(), dateString]);

const optionalDate = z
  .union([requiredDate, z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

const optionalText = z
  .string()
  .trim()
  .max(2_000, "Use no máximo 2.000 caracteres")
  .optional()
  .transform((value) => value || undefined);

export const createActivitySchema = z.object({
  customerId: z.string().trim().min(1, "Cliente é obrigatório"),
  type: z.enum(activityTypes),
  status: z.enum(activityStatuses).default("planned"),
  subject: z
    .string()
    .trim()
    .min(1, "Assunto é obrigatório")
    .max(200, "Use no máximo 200 caracteres"),
  description: optionalText,
  scheduledAt: requiredDate,
});

export const createOpportunitySchema = z.object({
  customerId: z.string().trim().min(1, "Cliente é obrigatório"),
  title: z
    .string()
    .trim()
    .min(1, "Título é obrigatório")
    .max(200, "Use no máximo 200 caracteres"),
  stage: z.enum(opportunityStages).default("novo"),
  source: z
    .string()
    .trim()
    .max(100, "Use no máximo 100 caracteres")
    .optional()
    .transform((value) => value || undefined),
  estimatedValueCents: z
    .number()
    .int("Informe um valor válido")
    .min(0, "O valor não pode ser negativo"),
  probability: z
    .number()
    .int("Informe uma probabilidade válida")
    .min(0, "A probabilidade mínima é 0")
    .max(100, "A probabilidade máxima é 100"),
  expectedCloseAt: optionalDate,
  priority: z.enum(opportunityPriorities).default("medium"),
  nextStep: optionalText,
});

export type CreateActivityInput = z.input<typeof createActivitySchema>;
export type CreateOpportunityInput = z.input<typeof createOpportunitySchema>;
