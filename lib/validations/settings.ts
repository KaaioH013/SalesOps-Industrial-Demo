import { z } from "zod";

export const upsertTargetSchema = z
  .object({
    id: z.string().trim().optional(),
    period: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}$/, "Use o formato AAAA-MM"),
    sellerId: z.string().trim().optional(),
    territoryId: z.string().trim().optional(),
    revenueTargetCents: z.coerce.number().int().min(0),
    marginTargetCents: z.coerce.number().int().min(0),
    newCustomersTarget: z.coerce.number().int().min(0),
    conversionTargetBps: z.coerce.number().int().min(0).max(10_000),
  })
  .superRefine((data, context) => {
    if (!data.sellerId && !data.territoryId) {
      context.addIssue({
        code: "custom",
        path: ["sellerId"],
        message: "Informe vendedor ou território",
      });
    }
  });

export type UpsertTargetInput = z.input<typeof upsertTargetSchema>;

export const deleteTargetSchema = z.object({
  id: z.string().trim().min(1),
});

export const updateOrganizationConfigSchema = z
  .object({
    attentionDays: z.coerce.number().int().min(1).max(365),
    criticalDays: z.coerce.number().int().min(2).max(730),
    lossReasons: z.array(z.string().trim().min(1)).min(1),
  })
  .superRefine((data, context) => {
    if (data.criticalDays <= data.attentionDays) {
      context.addIssue({
        code: "custom",
        path: ["criticalDays"],
        message: "O limite crítico deve ser maior que o de atenção",
      });
    }
  });

export type UpdateOrganizationConfigInput = z.input<
  typeof updateOrganizationConfigSchema
>;
