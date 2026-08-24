"use client";

import { ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import type { OpportunityListRow } from "@/db/queries/opportunities";
import { formatBRL } from "@/lib/formatters/currency";
import { formatDatePtBR } from "@/lib/formatters/date";
import { cn } from "@/lib/utils";

const STAGE_LABELS: Record<OpportunityListRow["stage"], string> = {
  novo: "Novo",
  qualificacao: "Qualificação",
  diagnostico: "Diagnóstico",
  proposta: "Proposta",
  negociacao: "Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
};

const STALENESS_LABELS: Record<OpportunityListRow["staleness"], string> = {
  ok: "Em dia",
  attention: "Atenção",
  critical: "Crítico",
};

type OpportunitySidePanelProps = {
  opportunity: OpportunityListRow | null;
  onClose: () => void;
};

export function OpportunitySidePanel({
  opportunity,
  onClose,
}: OpportunitySidePanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!opportunity) {
      return;
    }

    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [opportunity, onClose]);

  if (!opportunity) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40" role="presentation">
      <button
        aria-label="Fechar detalhes da oportunidade"
        className="absolute inset-0 cursor-default bg-slate-950/25"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-labelledby="opportunity-panel-title"
        aria-modal="true"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl"
        role="dialog"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div className="pr-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {STAGE_LABELS[opportunity.stage]}
            </p>
            <h2
              className="mt-1 text-lg font-semibold text-slate-900"
              id="opportunity-panel-title"
            >
              {opportunity.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {opportunity.customer.name}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            aria-label="Fechar painel"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
            <div>
              <dt className="text-xs font-medium text-slate-500">Valor estimado</dt>
              <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                {formatBRL(opportunity.estimatedValueCents / 100)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Valor ponderado</dt>
              <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                {formatBRL(opportunity.weightedValueCents / 100)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Probabilidade</dt>
              <dd className="mt-1 text-sm tabular-nums text-slate-800">
                {opportunity.probability}%
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Previsão de fechamento</dt>
              <dd className="mt-1 text-sm text-slate-800">
                {opportunity.expectedCloseAt
                  ? formatDatePtBR(opportunity.expectedCloseAt)
                  : "Não informada"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Dias no estágio</dt>
              <dd className="mt-1 text-sm text-slate-800">
                {opportunity.daysInStage} dias
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Última atividade</dt>
              <dd className="mt-1 text-sm text-slate-800">
                {opportunity.daysSinceActivity == null
                  ? "Sem atividade"
                  : `Há ${opportunity.daysSinceActivity} dias`}
              </dd>
            </div>
          </dl>

          <div>
            <p className="text-xs font-medium text-slate-500">Risco de inatividade</p>
            <span
              className={cn(
                "mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                opportunity.staleness === "ok" &&
                  "bg-emerald-50 text-emerald-700",
                opportunity.staleness === "attention" &&
                  "bg-amber-50 text-amber-700",
                opportunity.staleness === "critical" &&
                  "bg-red-50 text-red-700",
              )}
            >
              {STALENESS_LABELS[opportunity.staleness]}
            </span>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">Responsável</p>
            <p className="mt-1 text-sm text-slate-800">
              {opportunity.owner?.name ?? "Não atribuído"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">Próximo passo</p>
            <p className="mt-1 text-sm leading-6 text-slate-800">
              {opportunity.nextStep ?? "Nenhum próximo passo informado."}
            </p>
          </div>

          {opportunity.lossReason ? (
            <div>
              <p className="text-xs font-medium text-slate-500">Motivo da perda</p>
              <p className="mt-1 text-sm leading-6 text-slate-800">
                {opportunity.lossReason}
              </p>
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-200 p-4">
          <Link
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            href={`/opportunities/${opportunity.id}`}
          >
            Ver oportunidade completa
            <ExternalLink aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </aside>
    </div>
  );
}
