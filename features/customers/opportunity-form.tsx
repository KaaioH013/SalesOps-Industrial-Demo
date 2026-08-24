"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import {
  createOpportunitySchema,
  type CreateOpportunityInput,
} from "@/lib/validations/crm";

import { createCustomerOpportunity } from "./actions";

type OpportunityFormValues = z.output<typeof createOpportunitySchema>;

const FIELD_CLASS =
  "mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export function OpportunityForm({ customerId }: { customerId: string }) {
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<CreateOpportunityInput, unknown, OpportunityFormValues>({
    resolver: zodResolver(createOpportunitySchema),
    defaultValues: {
      customerId,
      title: "",
      stage: "novo",
      source: "",
      estimatedValueCents: 0,
      probability: 0,
      expectedCloseAt: "",
      priority: "medium",
      nextStep: "",
    },
  });

  const onSubmit = async (values: OpportunityFormValues) => {
    setFeedback(null);

    try {
      await createCustomerOpportunity(values);
      reset({
        customerId,
        title: "",
        stage: "novo",
        source: "",
        estimatedValueCents: 0,
        probability: 0,
        expectedCloseAt: "",
        priority: "medium",
        nextStep: "",
      });
      setFeedback({
        type: "success",
        message: "Oportunidade criada com sucesso.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Não foi possível criar a oportunidade.",
      });
    }
  };

  return (
    <details className="mb-4 rounded-md border border-slate-200 bg-slate-50/60">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-blue-700">
        Nova oportunidade
      </summary>
      <form
        className="grid gap-3 border-t border-slate-200 p-3 sm:grid-cols-2"
        onSubmit={handleSubmit(onSubmit)}
      >
        <input type="hidden" {...register("customerId")} />

        <label className="text-sm text-slate-700 sm:col-span-2">
          Título
          <input className={FIELD_CLASS} {...register("title")} />
          {errors.title ? (
            <span className="mt-1 block text-xs text-red-600">
              {errors.title.message}
            </span>
          ) : null}
        </label>

        <label className="text-sm text-slate-700">
          Estágio
          <select className={FIELD_CLASS} {...register("stage")}>
            <option value="novo">Novo</option>
            <option value="qualificacao">Qualificação</option>
            <option value="diagnostico">Diagnóstico</option>
            <option value="proposta">Proposta</option>
            <option value="negociacao">Negociação</option>
            <option value="ganho">Ganho</option>
            <option value="perdido">Perdido</option>
          </select>
        </label>

        <label className="text-sm text-slate-700">
          Prioridade
          <select className={FIELD_CLASS} {...register("priority")}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </label>

        <label className="text-sm text-slate-700">
          Valor estimado (R$)
          <input
            className={FIELD_CLASS}
            min="0"
            step="0.01"
            type="number"
            {...register("estimatedValueCents", {
              setValueAs: (value) => Math.round(Number(value) * 100),
            })}
          />
          {errors.estimatedValueCents ? (
            <span className="mt-1 block text-xs text-red-600">
              {errors.estimatedValueCents.message}
            </span>
          ) : null}
        </label>

        <label className="text-sm text-slate-700">
          Probabilidade (%)
          <input
            className={FIELD_CLASS}
            max="100"
            min="0"
            type="number"
            {...register("probability", { valueAsNumber: true })}
          />
          {errors.probability ? (
            <span className="mt-1 block text-xs text-red-600">
              {errors.probability.message}
            </span>
          ) : null}
        </label>

        <label className="text-sm text-slate-700">
          Previsão de fechamento
          <input
            className={FIELD_CLASS}
            type="date"
            {...register("expectedCloseAt")}
          />
        </label>

        <label className="text-sm text-slate-700">
          Origem
          <input className={FIELD_CLASS} {...register("source")} />
        </label>

        <label className="text-sm text-slate-700 sm:col-span-2">
          Próximo passo
          <textarea
            className={`${FIELD_CLASS} min-h-20 py-2`}
            {...register("nextStep")}
          />
        </label>

        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            className="h-9 rounded-md bg-blue-700 px-3 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Salvando..." : "Criar oportunidade"}
          </button>
          {feedback ? (
            <p
              className={
                feedback.type === "success"
                  ? "text-sm text-emerald-700"
                  : "text-sm text-red-600"
              }
              role="status"
            >
              {feedback.message}
            </p>
          ) : null}
        </div>
      </form>
    </details>
  );
}
