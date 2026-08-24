import { describe, expect, it } from "vitest";

import {
  createActivitySchema,
  createOpportunitySchema,
} from "@/lib/validations/crm";

describe("createActivitySchema", () => {
  it("normaliza uma atividade válida e aplica o status padrão", () => {
    const result = createActivitySchema.parse({
      customerId: "customer-1",
      type: "visita",
      subject: "  Visita técnica  ",
      scheduledAt: "2026-08-25T14:30",
    });

    expect(result).toMatchObject({
      customerId: "customer-1",
      type: "visita",
      status: "planned",
      subject: "Visita técnica",
    });
    expect(result.scheduledAt).toBeInstanceOf(Date);
  });

  it("rejeita tipo inválido e assunto vazio", () => {
    expect(() =>
      createActivitySchema.parse({
        customerId: "customer-1",
        type: "mensagem",
        subject: " ",
        scheduledAt: "2026-08-25T14:30",
      }),
    ).toThrow();
  });
});

describe("createOpportunitySchema", () => {
  it("normaliza uma oportunidade válida e aplica padrões", () => {
    const result = createOpportunitySchema.parse({
      customerId: "customer-1",
      title: "  Retrofit da linha  ",
      estimatedValueCents: 150000,
      probability: 40,
      expectedCloseAt: "2026-10-01",
    });

    expect(result).toMatchObject({
      customerId: "customer-1",
      title: "Retrofit da linha",
      stage: "novo",
      estimatedValueCents: 150000,
      probability: 40,
      priority: "medium",
    });
    expect(result.expectedCloseAt).toBeInstanceOf(Date);
  });

  it("rejeita probabilidade e valor fora dos limites", () => {
    expect(() =>
      createOpportunitySchema.parse({
        customerId: "customer-1",
        title: "Projeto",
        estimatedValueCents: -1,
        probability: 101,
      }),
    ).toThrow();
  });
});
