import { z } from "zod";

import { opportunityStages } from "@/db/schema/enums";

export const moveOpportunityStageSchema = z
  .object({
    id: z.string().trim().min(1),
    stage: z.enum(opportunityStages),
    lossReason: z.string().trim().optional(),
  })
  .superRefine((data, context) => {
    if (data.stage === "perdido" && !data.lossReason) {
      context.addIssue({
        code: "custom",
        path: ["lossReason"],
        message: "Informe o motivo da perda",
      });
    }
  })
  .transform((data) => ({
    ...data,
    lossReason: data.stage === "perdido" ? data.lossReason : undefined,
  }));

export type MoveOpportunityStageInput = z.input<
  typeof moveOpportunityStageSchema
>;

export const updateOpportunityNextStepSchema = z.object({
  id: z.string().trim().min(1),
  nextStep: z.string().trim().min(1, "Informe o próximo passo"),
});

export type UpdateOpportunityNextStepInput = z.input<
  typeof updateOpportunityNextStepSchema
>;
