"use client";

import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import type { OpportunityDetail } from "@/db/queries/opportunities";
import { opportunityStages, type OpportunityStage } from "@/db/schema/enums";
import { moveOpportunityStage, updateOpportunityNextStep } from "@/features/pipeline/actions";
import { formatBRL } from "@/lib/formatters/currency";
import { formatDatePtBR } from "@/lib/formatters/date";
import { cn } from "@/lib/utils";

const STAGE_LABELS: Record<OpportunityStage, string> = {
  novo: "Novo",
  qualificacao: "Qualificação",
  diagnostico: "Diagnóstico",
  proposta: "Proposta",
  negociacao: "Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
};

const STALENESS_LABELS: Record<OpportunityDetail["staleness"], string> = {
  ok: "Em dia",
  attention: "Atenção",
  critical: "Crítico",
};

const ACTIVITY_TYPE_LABELS = {
  ligacao: "Ligação",
  email: "E-mail",
  visita: "Visita",
  reuniao: "Reunião",
  follow_up: "Follow-up",
} as const;

const ACTIVITY_STATUS_LABELS = {
  planned: "Planejada",
  completed: "Concluída",
  cancelled: "Cancelada",
} as const;

type OpportunityDetailViewProps = {
  opportunity: OpportunityDetail;
  canEdit: boolean;
};

function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function MetricItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
        {value}
      </p>
    </div>
  );
}

export function OpportunityDetailView({
  opportunity,
  canEdit,
}: OpportunityDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [nextStepDraft, setNextStepDraft] = useState(opportunity.nextStep ?? "");
  const [isEditingNextStep, setIsEditingNextStep] = useState(false);
  const [pendingStage, setPendingStage] = useState<OpportunityStage | null>(null);
  const [lossReason, setLossReason] = useState("");

  const applyStageChange = (stage: OpportunityStage, reason?: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await moveOpportunityStage({
          id: opportunity.id,
          stage,
          lossReason: reason,
        });
        setPendingStage(null);
        setLossReason("");
        router.refresh();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível alterar o estágio.",
        );
      }
    });
  };

  const handleStageSelect = (stage: OpportunityStage) => {
    if (stage === opportunity.stage) {
      return;
    }

    if (stage === "ganho" || stage === "perdido") {
      setPendingStage(stage);
      setLossReason("");
      return;
    }

    applyStageChange(stage);
  };

  const saveNextStep = () => {
    const trimmed = nextStepDraft.trim();

    if (!trimmed) {
      setError("Informe o próximo passo.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await updateOpportunityNextStep({
          id: opportunity.id,
          nextStep: trimmed,
        });
        setIsEditingNextStep(false);
        router.refresh();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível salvar o próximo passo.",
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
            href="/pipeline"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar ao pipeline
          </Link>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {STAGE_LABELS[opportunity.stage]}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {opportunity.title}
          </h1>
          <Link
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
            href={`/customers/${opportunity.customer.id}`}
          >
            <Building2 aria-hidden="true" className="size-4" />
            {opportunity.customer.name}
          </Link>
        </div>

        <span
          className={cn(
            "inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold",
            opportunity.staleness === "ok" && "bg-emerald-50 text-emerald-700",
            opportunity.staleness === "attention" &&
              "bg-amber-50 text-amber-700",
            opportunity.staleness === "critical" && "bg-red-50 text-red-700",
          )}
        >
          {STALENESS_LABELS[opportunity.staleness]}
        </span>
      </div>

      {error ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <SectionCard title="Resumo comercial">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MetricItem
                label="Valor estimado"
                value={formatBRL(opportunity.estimatedValueCents / 100)}
              />
              <MetricItem
                label="Valor ponderado"
                value={formatBRL(opportunity.weightedValueCents / 100)}
              />
              <MetricItem
                label="Probabilidade"
                value={`${opportunity.probability}%`}
              />
              <MetricItem
                label="Previsão de fechamento"
                value={
                  opportunity.expectedCloseAt
                    ? formatDatePtBR(opportunity.expectedCloseAt)
                    : "Não informada"
                }
              />
              <MetricItem
                label="Dias no estágio"
                value={`${opportunity.daysInStage} dias`}
              />
              <MetricItem
                label="Responsável"
                value={opportunity.owner?.name ?? "Não atribuído"}
              />
            </div>
          </SectionCard>

          <SectionCard title="Risco de inatividade">
            <p className="text-sm leading-6 text-slate-700">
              {opportunity.riskExplanation}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Última atividade:{" "}
              {opportunity.lastActivityAt
                ? formatDatePtBR(opportunity.lastActivityAt)
                : "Nenhuma registrada"}
            </p>
          </SectionCard>

          <SectionCard
            action={
              canEdit && !isEditingNextStep ? (
                <button
                  className="text-xs font-medium text-blue-700 hover:text-blue-800"
                  onClick={() => {
                    setNextStepDraft(opportunity.nextStep ?? "");
                    setIsEditingNextStep(true);
                  }}
                  type="button"
                >
                  Editar
                </button>
              ) : null
            }
            title="Próximo passo"
          >
            {canEdit && isEditingNextStep ? (
              <div className="space-y-3">
                <textarea
                  className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  onChange={(event) => setNextStepDraft(event.target.value)}
                  placeholder="Descreva a próxima ação comercial..."
                  value={nextStepDraft}
                />
                <div className="flex justify-end gap-2">
                  <button
                    className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    disabled={isPending}
                    onClick={() => {
                      setIsEditingNextStep(false);
                      setNextStepDraft(opportunity.nextStep ?? "");
                    }}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="h-9 rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                    disabled={isPending}
                    onClick={saveNextStep}
                    type="button"
                  >
                    {isPending ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-slate-800">
                {opportunity.nextStep ?? "Nenhum próximo passo informado."}
              </p>
            )}
          </SectionCard>

          {canEdit ? (
            <SectionCard title="Estágio">
              <label className="block">
                <span className="text-xs font-medium text-slate-500">
                  Alterar estágio
                </span>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                  disabled={isPending}
                  onChange={(event) =>
                    handleStageSelect(event.target.value as OpportunityStage)
                  }
                  value={opportunity.stage}
                >
                  {opportunityStages.map((stage) => (
                    <option key={stage} value={stage}>
                      {STAGE_LABELS[stage]}
                    </option>
                  ))}
                </select>
              </label>
              {opportunity.lossReason ? (
                <p className="mt-3 text-sm text-slate-600">
                  Motivo da perda: {opportunity.lossReason}
                </p>
              ) : null}
            </SectionCard>
          ) : (
            <SectionCard title="Estágio">
              <p className="text-sm font-medium text-slate-900">
                {STAGE_LABELS[opportunity.stage]}
              </p>
              {opportunity.lossReason ? (
                <p className="mt-2 text-sm text-slate-600">
                  Motivo da perda: {opportunity.lossReason}
                </p>
              ) : null}
            </SectionCard>
          )}

          <SectionCard title="Linha do tempo">
            {opportunity.timeline.length === 0 ? (
              <EmptyState
                description="Atividades e mudanças de estágio aparecerão aqui conforme forem registradas."
                title="Nenhum evento registrado"
              />
            ) : (
              <ol className="space-y-4">
                {opportunity.timeline.map((item) => (
                  <li
                    key={`${item.kind}-${item.id}`}
                    className="relative border-l-2 border-slate-200 pl-4"
                  >
                    <span className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-slate-400" />
                    <p className="text-xs text-slate-500">
                      {formatDatePtBR(item.occurredAt)}
                    </p>
                    {item.kind === "activity" ? (
                      <>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {item.subject}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {ACTIVITY_TYPE_LABELS[item.type]} ·{" "}
                          {ACTIVITY_STATUS_LABELS[item.status]}
                          {item.ownerName ? ` · ${item.ownerName}` : ""}
                        </p>
                        {item.description ? (
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {item.description}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          Mudança de estágio
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {item.fromStage
                            ? `${STAGE_LABELS[item.fromStage]} → ${STAGE_LABELS[item.toStage]}`
                            : STAGE_LABELS[item.toStage]}
                          {item.actorName ? ` · ${item.actorName}` : ""}
                        </p>
                        {item.lossReason ? (
                          <p className="mt-2 text-sm text-slate-600">
                            Motivo: {item.lossReason}
                          </p>
                        ) : null}
                      </>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Cliente">
            <p className="text-sm font-medium text-slate-900">
              {opportunity.customer.name}
            </p>
            {opportunity.source ? (
              <p className="mt-2 text-sm text-slate-600">
                Origem: {opportunity.source}
              </p>
            ) : null}
            <Link
              className="mt-4 inline-flex text-sm font-medium text-blue-700 hover:text-blue-800"
              href={`/customers/${opportunity.customer.id}`}
            >
              Ver cliente completo
            </Link>
          </SectionCard>

          <SectionCard title="Datas">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-500">
                  Estágio desde
                </dt>
                <dd className="mt-1 text-slate-800">
                  {formatDatePtBR(opportunity.stageChangedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Criada em</dt>
                <dd className="mt-1 text-slate-800">
                  {formatDatePtBR(opportunity.createdAt)}
                </dd>
              </div>
              {opportunity.closedAt ? (
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    Fechada em
                  </dt>
                  <dd className="mt-1 text-slate-800">
                    {formatDatePtBR(opportunity.closedAt)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </SectionCard>
        </div>
      </div>

      {pendingStage ? (
        <div
          aria-labelledby="stage-confirm-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            <h2
              className="text-lg font-semibold text-slate-900"
              id="stage-confirm-title"
            >
              Confirmar oportunidade como{" "}
              {pendingStage === "ganho" ? "ganha" : "perdida"}?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {opportunity.title} · {opportunity.customer.name}
            </p>

            {pendingStage === "perdido" ? (
              <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-700">
                  Motivo da perda
                </span>
                <textarea
                  autoFocus
                  className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  onChange={(event) => setLossReason(event.target.value)}
                  placeholder="Ex.: preço, prazo ou concorrência"
                  value={lossReason}
                />
              </label>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setPendingStage(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className={cn(
                  "h-10 rounded-md px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50",
                  pendingStage === "ganho"
                    ? "bg-emerald-700 hover:bg-emerald-800"
                    : "bg-red-700 hover:bg-red-800",
                )}
                disabled={
                  isPending ||
                  (pendingStage === "perdido" && !lossReason.trim())
                }
                onClick={() =>
                  applyStageChange(
                    pendingStage,
                    lossReason.trim() || undefined,
                  )
                }
                type="button"
              >
                {isPending ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
