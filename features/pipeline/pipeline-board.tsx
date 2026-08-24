"use client";

import { KanbanSquare, List, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useMemo,
  useOptimistic,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import { EmptyState } from "@/components/ui/empty-state";
import type { OpportunityListRow } from "@/db/queries/opportunities";
import { opportunityStages, type OpportunityStage } from "@/db/schema/enums";
import { formatBRL } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

import { moveOpportunityStage } from "./actions";
import { OpportunitySidePanel } from "./opportunity-side-panel";

const STAGE_LABELS: Record<OpportunityStage, string> = {
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

type PendingMove = {
  opportunity: OpportunityListRow;
  stage: OpportunityStage;
};

type PipelineBoardProps = {
  rows: OpportunityListRow[];
  query: string;
};

function StalenessBadge({
  staleness,
}: {
  staleness: OpportunityListRow["staleness"];
}) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
        staleness === "ok" && "bg-emerald-50 text-emerald-700",
        staleness === "attention" && "bg-amber-50 text-amber-700",
        staleness === "critical" && "bg-red-50 text-red-700",
      )}
    >
      {STALENESS_LABELS[staleness]}
    </span>
  );
}

export function PipelineBoard({ rows, query }: PipelineBoardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"board" | "table">("board");
  const [searchValue, setSearchValue] = useState(query);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [lossReason, setLossReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [localRows, updateOpportunityStage] = useOptimistic(
    rows,
    (
      current,
      update: {
        id: string;
        stage: OpportunityStage;
        lossReason?: string;
      },
    ) =>
      current.map((row) =>
        row.id === update.id
          ? {
              ...row,
              stage: update.stage,
              daysInStage: 0,
              lossReason:
                update.stage === "perdido" ? update.lossReason ?? null : null,
            }
          : row,
      ),
  );

  const rowsByStage = useMemo(
    () =>
      Object.fromEntries(
        opportunityStages.map((stage) => [
          stage,
          localRows.filter((row) => row.stage === stage),
        ]),
      ) as Record<OpportunityStage, OpportunityListRow[]>,
    [localRows],
  );

  const selectedOpportunity =
    localRows.find((row) => row.id === selectedId) ?? null;

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const nextQuery = searchValue.trim();

    if (nextQuery) {
      params.set("q", nextQuery);
    } else {
      params.delete("q");
    }

    startTransition(() => {
      const queryString = params.toString();
      router.push(queryString ? `/pipeline?${queryString}` : "/pipeline");
    });
  };

  const applyMove = (
    opportunity: OpportunityListRow,
    stage: OpportunityStage,
    reason?: string,
  ) => {
    setError(null);
    startTransition(async () => {
      updateOpportunityStage({
        id: opportunity.id,
        stage,
        lossReason: reason,
      });

      try {
        await moveOpportunityStage({
          id: opportunity.id,
          stage,
          lossReason: reason,
        });
        setPendingMove(null);
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

  const requestMove = (
    opportunity: OpportunityListRow,
    stage: OpportunityStage,
  ) => {
    if (stage === opportunity.stage) {
      return;
    }

    if (stage === "ganho" || stage === "perdido") {
      setPendingMove({ opportunity, stage });
      setLossReason("");
      return;
    }

    applyMove(opportunity, stage);
  };

  if (rows.length === 0 && !query) {
    return (
      <EmptyState
        title="Nenhuma oportunidade cadastrada"
        description="As oportunidades aparecerão aqui após a execução do seed do ambiente de demonstração."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form className="flex w-full gap-2 lg:max-w-md" onSubmit={submitSearch}>
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Buscar oportunidades"
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Buscar oportunidade ou cliente..."
              type="search"
              value={searchValue}
            />
          </div>
          <button
            className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            Buscar
          </button>
        </form>

        <div
          aria-label="Modo de visualização"
          className="inline-flex w-fit rounded-md border border-slate-300 bg-white p-1"
          role="group"
        >
          <button
            aria-pressed={view === "board"}
            className={cn(
              "flex h-8 items-center gap-2 rounded px-3 text-sm font-medium",
              view === "board"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
            onClick={() => setView("board")}
            type="button"
          >
            <KanbanSquare aria-hidden="true" className="size-4" />
            Kanban
          </button>
          <button
            aria-pressed={view === "table"}
            className={cn(
              "flex h-8 items-center gap-2 rounded px-3 text-sm font-medium",
              view === "table"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
            onClick={() => setView("table")}
            type="button"
          >
            <List aria-hidden="true" className="size-4" />
            Tabela
          </button>
        </div>
      </div>

      {error ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {localRows.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
          Nenhuma oportunidade encontrada para &quot;{query}&quot;.
        </div>
      ) : view === "board" ? (
        <div
          className={cn(
            "overflow-x-auto pb-3",
            isPending && "pointer-events-none opacity-70",
          )}
        >
          <div className="grid min-w-[1540px] grid-cols-7 gap-3">
            {opportunityStages.map((stage) => {
              const stageRows = rowsByStage[stage];
              const totalCents = stageRows.reduce(
                (sum, row) => sum + row.estimatedValueCents,
                0,
              );

              return (
                <section
                  key={stage}
                  aria-labelledby={`stage-${stage}`}
                  className="rounded-lg border border-slate-200 bg-slate-50/80"
                >
                  <div className="border-b border-slate-200 px-3 py-3">
                    <div className="flex items-center justify-between">
                      <h2
                        className="text-xs font-semibold uppercase tracking-wide text-slate-700"
                        id={`stage-${stage}`}
                      >
                        {STAGE_LABELS[stage]}
                      </h2>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700">
                        {stageRows.length}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium tabular-nums text-slate-500">
                      {formatBRL(totalCents / 100)}
                    </p>
                  </div>
                  <div className="space-y-2 p-2">
                    {stageRows.length === 0 ? (
                      <p className="px-2 py-6 text-center text-xs text-slate-400">
                        Sem oportunidades
                      </p>
                    ) : (
                      stageRows.map((opportunity) => (
                        <article
                          key={opportunity.id}
                          className="rounded-md border border-slate-200 bg-white p-3 shadow-sm"
                        >
                          <button
                            className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            onClick={() => setSelectedId(opportunity.id)}
                            type="button"
                          >
                            <span className="block text-sm font-semibold leading-5 text-slate-900">
                              {opportunity.title}
                            </span>
                            <span className="mt-1 block truncate text-xs text-slate-500">
                              {opportunity.customer.name}
                            </span>
                            <span className="mt-3 flex items-end justify-between gap-2">
                              <span>
                                <span className="block text-sm font-semibold tabular-nums text-slate-900">
                                  {formatBRL(
                                    opportunity.estimatedValueCents / 100,
                                  )}
                                </span>
                                <span className="block text-[11px] text-slate-500">
                                  {opportunity.probability}% ·{" "}
                                  {opportunity.daysInStage}d no estágio
                                </span>
                              </span>
                              <StalenessBadge
                                staleness={opportunity.staleness}
                              />
                            </span>
                          </button>
                          <label className="mt-3 block border-t border-slate-100 pt-2">
                            <span className="sr-only">
                              Estágio de {opportunity.title}
                            </span>
                            <select
                              className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              disabled={isPending}
                              onChange={(event) =>
                                requestMove(
                                  opportunity,
                                  event.target.value as OpportunityStage,
                                )
                              }
                              value={opportunity.stage}
                            >
                              {opportunityStages.map((option) => (
                                <option key={option} value={option}>
                                  {STAGE_LABELS[option]}
                                </option>
                              ))}
                            </select>
                          </label>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "overflow-hidden rounded-lg border border-slate-200 bg-white",
            isPending && "pointer-events-none opacity-70",
          )}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Oportunidade",
                    "Estágio",
                    "Valor",
                    "Ponderado",
                    "Responsável",
                    "Inatividade",
                  ].map((header) => (
                    <th
                      key={header}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {localRows.map((opportunity) => (
                  <tr
                    key={opportunity.id}
                    className="cursor-pointer hover:bg-slate-50/80"
                    onClick={() => setSelectedId(opportunity.id)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {opportunity.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {opportunity.customer.name}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Estágio de ${opportunity.title}`}
                        className="h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        disabled={isPending}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) =>
                          requestMove(
                            opportunity,
                            event.target.value as OpportunityStage,
                          )
                        }
                        value={opportunity.stage}
                      >
                        {opportunityStages.map((option) => (
                          <option key={option} value={option}>
                            {STAGE_LABELS[option]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">
                      {formatBRL(opportunity.estimatedValueCents / 100)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">
                      {formatBRL(opportunity.weightedValueCents / 100)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {opportunity.owner?.name ?? "Não atribuído"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StalenessBadge staleness={opportunity.staleness} />
                        <span className="text-xs text-slate-500">
                          {opportunity.daysSinceActivity == null
                            ? "Sem atividade"
                            : `${opportunity.daysSinceActivity}d`}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <OpportunitySidePanel
        onClose={() => setSelectedId(null)}
        opportunity={selectedOpportunity}
      />

      {pendingMove ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Cancelar alteração de estágio"
            className="absolute inset-0 cursor-default bg-slate-950/35"
            onClick={() => setPendingMove(null)}
            type="button"
          />
          <div
            aria-labelledby="stage-confirm-title"
            aria-modal="true"
            className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
            role="dialog"
          >
            <h2
              className="text-lg font-semibold text-slate-900"
              id="stage-confirm-title"
            >
              Confirmar oportunidade como{" "}
              {pendingMove.stage === "ganho" ? "ganha" : "perdida"}?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {pendingMove.opportunity.title} ·{" "}
              {pendingMove.opportunity.customer.name}
            </p>

            {pendingMove.stage === "perdido" ? (
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
                onClick={() => setPendingMove(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className={cn(
                  "h-10 rounded-md px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50",
                  pendingMove.stage === "ganho"
                    ? "bg-emerald-700 hover:bg-emerald-800"
                    : "bg-red-700 hover:bg-red-800",
                )}
                disabled={
                  isPending ||
                  (pendingMove.stage === "perdido" && !lossReason.trim())
                }
                onClick={() =>
                  applyMove(
                    pendingMove.opportunity,
                    pendingMove.stage,
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
