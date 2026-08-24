"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { createCustomerActivity } from "./actions";
import {
  createActivitySchema,
  type CreateActivityInput,
} from "@/lib/validations/crm";

type ActivityFormValues = z.output<typeof createActivitySchema>;

const FIELD_CLASS =
  "mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export function ActivityForm({ customerId }: { customerId: string }) {
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<CreateActivityInput, unknown, ActivityFormValues>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: {
      customerId,
      type: "ligacao",
      status: "planned",
      subject: "",
      description: "",
      scheduledAt: "",
    },
  });

  const onSubmit = async (values: ActivityFormValues) => {
    setFeedback(null);

    try {
      await createCustomerActivity(values);
      reset({
        customerId,
        type: "ligacao",
        status: "planned",
        subject: "",
        description: "",
        scheduledAt: "",
      });
      setFeedback({ type: "success", message: "Atividade criada com sucesso." });
    } catch {
      setFeedback({
        type: "error",
        message: "Não foi possível criar a atividade.",
      });
    }
  };

  return (
    <details className="mb-4 rounded-md border border-slate-200 bg-slate-50/60">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-blue-700">
        Nova atividade
      </summary>
      <form
        className="grid gap-3 border-t border-slate-200 p-3 sm:grid-cols-2"
        onSubmit={handleSubmit(onSubmit)}
      >
        <input type="hidden" {...register("customerId")} />

        <label className="text-sm text-slate-700">
          Tipo
          <select className={FIELD_CLASS} {...register("type")}>
            <option value="ligacao">Ligação</option>
            <option value="email">E-mail</option>
            <option value="visita">Visita</option>
            <option value="reuniao">Reunião</option>
            <option value="follow_up">Follow-up</option>
          </select>
        </label>

        <label className="text-sm text-slate-700">
          Status
          <select className={FIELD_CLASS} {...register("status")}>
            <option value="planned">Planejada</option>
            <option value="completed">Concluída</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </label>

        <label className="text-sm text-slate-700 sm:col-span-2">
          Assunto
          <input className={FIELD_CLASS} {...register("subject")} />
          {errors.subject ? (
            <span className="mt-1 block text-xs text-red-600">
              {errors.subject.message}
            </span>
          ) : null}
        </label>

        <label className="text-sm text-slate-700">
          Agendada para
          <input
            className={FIELD_CLASS}
            type="datetime-local"
            {...register("scheduledAt")}
          />
          {errors.scheduledAt ? (
            <span className="mt-1 block text-xs text-red-600">
              {errors.scheduledAt.message}
            </span>
          ) : null}
        </label>

        <label className="text-sm text-slate-700 sm:col-span-2">
          Descrição
          <textarea
            className={`${FIELD_CLASS} min-h-20 py-2`}
            {...register("description")}
          />
        </label>

        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            className="h-9 rounded-md bg-blue-700 px-3 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Salvando..." : "Criar atividade"}
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
