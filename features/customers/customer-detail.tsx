import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import type { getCustomer360 } from "@/db/queries/customers";
import type {
  ActivityStatus,
  ActivityType,
  CustomerSize,
  CustomerStatus,
  OpportunityStage,
  OrderStatus,
  QuoteStatus,
} from "@/db/schema/enums";
import { formatBRL } from "@/lib/formatters/currency";
import { formatDatePtBR } from "@/lib/formatters/date";
import { formatPercent } from "@/lib/formatters/percent";
import { cn } from "@/lib/utils";

export type Customer360View = NonNullable<
  Awaited<ReturnType<typeof getCustomer360>>
>;

type CustomerDetailProps = {
  customer: Customer360View;
  showMargin: boolean;
};

const STATUS_LABELS: Record<CustomerStatus, string> = {
  prospect: "Prospecto",
  active: "Ativo",
  inactive: "Inativo",
};

const SIZE_LABELS: Record<CustomerSize, string> = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_production: "Em produção",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  approved: "Aprovada",
  rejected: "Rejeitada",
  expired: "Expirada",
  won: "Ganha",
  lost: "Perdida",
};

const STAGE_LABELS: Record<OpportunityStage, string> = {
  novo: "Novo",
  qualificacao: "Qualificação",
  diagnostico: "Diagnóstico",
  proposta: "Proposta",
  negociacao: "Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
};

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  ligacao: "Ligação",
  email: "E-mail",
  visita: "Visita",
  reuniao: "Reunião",
  follow_up: "Follow-up",
};

const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  planned: "Planejada",
  completed: "Concluída",
  cancelled: "Cancelada",
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

function StatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        status === "active" && "bg-emerald-50 text-emerald-700",
        status === "prospect" && "bg-amber-50 text-amber-700",
        status === "inactive" && "bg-slate-100 text-slate-600",
      )}
    >
      {STATUS_LABELS[status]}
    </span>
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

function SimpleTable({
  headers,
  rows,
  emptyMessage,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-slate-500">{emptyMessage}</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((cells, index) => (
            <tr key={index} className="hover:bg-slate-50/80">
              {cells.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2 align-top text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function computeFinancialSummary(
  customer: Customer360View,
  showMargin: boolean,
) {
  const totalRevenueCents = customer.orders.reduce(
    (sum, order) => sum + order.revenueCents,
    0,
  );
  const totalCostCents = showMargin
    ? customer.orders.reduce((sum, order) => sum + (order.costCents ?? 0), 0)
    : 0;
  const grossMarginBps =
    showMargin && totalRevenueCents > 0
      ? Math.round(
          ((totalRevenueCents - totalCostCents) / totalRevenueCents) * 10_000,
        )
      : null;

  const openOpportunities = customer.opportunities.filter(
    (opp) => opp.stage !== "ganho" && opp.stage !== "perdido",
  ).length;

  const activeQuotes = customer.quotes.filter(
    (quote) =>
      quote.status !== "won" &&
      quote.status !== "lost" &&
      quote.status !== "rejected" &&
      quote.status !== "expired",
  ).length;

  return {
    totalRevenueCents,
    totalCostCents,
    grossMarginBps,
    openOpportunities,
    activeQuotes,
  };
}

type ScoreFields = {
  priorityScore?: number | null;
  repurchaseScore?: number | null;
  inactivityRiskScore?: number | null;
  potentialScore?: number | null;
};

type AlertItem = {
  id: string;
  title: string;
  severity: string;
  status: string;
};

function hasScoreFields(
  customer: Customer360View,
): customer is Customer360View & ScoreFields {
  return (
    "priorityScore" in customer ||
    "repurchaseScore" in customer ||
    "inactivityRiskScore" in customer ||
    "potentialScore" in customer
  );
}

function hasAlerts(
  customer: Customer360View,
): customer is Customer360View & { alerts: AlertItem[] } {
  return (
    "alerts" in customer &&
    Array.isArray((customer as Customer360View & { alerts?: unknown }).alerts)
  );
}

export function CustomerDetail({ customer, showMargin }: CustomerDetailProps) {
  const summary = computeFinancialSummary(customer, showMargin);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            className="text-sm font-medium text-blue-700 hover:underline"
            href="/customers"
          >
            ← Voltar para clientes
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">
              {customer.tradeName}
            </h1>
            <StatusBadge status={customer.status} />
          </div>
          {customer.tradeName !== customer.legalName ? (
            <p className="mt-1 text-sm text-slate-600">{customer.legalName}</p>
          ) : null}
          <p className="mt-1 text-sm text-slate-500">
            {customer.segment} · {customer.city}/{customer.state} · CNPJ{" "}
            {customer.taxId}
          </p>
        </div>
        <div className="text-right text-sm text-slate-600">
          <p>
            Vendedor:{" "}
            <span className="font-medium text-slate-900">
              {customer.seller?.name ?? "—"}
            </span>
          </p>
          <p className="mt-1">
            Porte:{" "}
            <span className="font-medium text-slate-900">
              {SIZE_LABELS[customer.size]}
            </span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Resumo financeiro e comercial">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MetricItem
                label="Receita acumulada"
                value={
                  summary.totalRevenueCents > 0
                    ? formatBRL(summary.totalRevenueCents / 100)
                    : "—"
                }
              />
              {showMargin ? (
                <>
                  <MetricItem
                    label="Custo acumulado"
                    value={
                      summary.totalCostCents > 0
                        ? formatBRL(summary.totalCostCents / 100)
                        : "—"
                    }
                  />
                  <MetricItem
                    label="Margem bruta"
                    value={
                      summary.grossMarginBps != null
                        ? formatPercent(summary.grossMarginBps / 10_000, 1)
                        : "—"
                    }
                  />
                </>
              ) : null}
              <MetricItem
                label="Limite de crédito"
                value={
                  customer.creditLimitCents > 0
                    ? formatBRL(customer.creditLimitCents / 100)
                    : "—"
                }
              />
              <MetricItem
                label="Última compra"
                value={
                  customer.lastPurchaseAt
                    ? formatDatePtBR(customer.lastPurchaseAt)
                    : "—"
                }
              />
              <MetricItem
                label="Oportunidades abertas"
                value={String(summary.openOpportunities)}
              />
              <MetricItem
                label="Cotações ativas"
                value={String(summary.activeQuotes)}
              />
              <MetricItem
                label="Pedidos"
                value={String(customer.orders.length)}
              />
            </div>
          </SectionCard>

          <SectionCard title="Contatos">
            {customer.contacts.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">
                Nenhum contato cadastrado para este cliente.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {customer.contacts.map((contact) => (
                  <li key={contact.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {contact.name}
                        </p>
                        {contact.title ? (
                          <p className="text-sm text-slate-600">
                            {contact.title}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {contact.isDecisionMaker ? (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Decisor
                          </span>
                        ) : null}
                        {contact.isInfluencer ? (
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                            Influenciador
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      {contact.email ? <span>{contact.email}</span> : null}
                      {contact.phone ? <span>{contact.phone}</span> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Pedidos">
            <SimpleTable
              emptyMessage="Nenhum pedido registrado para este cliente."
              headers={
                showMargin
                  ? ["Número", "Data", "Status", "Receita", "Margem"]
                  : ["Número", "Data", "Status", "Receita"]
              }
              rows={customer.orders.map((order) => {
                const cells: React.ReactNode[] = [
                  <span key="number" className="font-medium text-slate-900">
                    {order.number}
                  </span>,
                  formatDatePtBR(order.orderedAt),
                  ORDER_STATUS_LABELS[order.status],
                  order.revenueCents > 0
                    ? formatBRL(order.revenueCents / 100)
                    : "—",
                ];
                if (showMargin) {
                  cells.push(
                    order.grossMarginBps != null
                      ? formatPercent(order.grossMarginBps / 10_000, 1)
                      : "—",
                  );
                }
                return cells;
              })}
            />
          </SectionCard>

          <SectionCard title="Cotações">
            <SimpleTable
              emptyMessage="Nenhuma cotação registrada para este cliente."
              headers={
                showMargin
                  ? ["Número", "Criada em", "Validade", "Status", "Total", "Margem"]
                  : ["Número", "Criada em", "Validade", "Status", "Total"]
              }
              rows={customer.quotes.map((quote) => {
                const cells: React.ReactNode[] = [
                  <span key="number" className="font-medium text-slate-900">
                    {quote.number}
                  </span>,
                  formatDatePtBR(quote.createdAt),
                  formatDatePtBR(quote.validUntil),
                  QUOTE_STATUS_LABELS[quote.status],
                  quote.totalCents > 0
                    ? formatBRL(quote.totalCents / 100)
                    : "—",
                ];
                if (showMargin) {
                  cells.push(
                    quote.grossMarginBps != null
                      ? formatPercent(quote.grossMarginBps / 10_000, 1)
                      : "—",
                  );
                }
                return cells;
              })}
            />
          </SectionCard>

          <SectionCard title="Oportunidades">
            <SimpleTable
              emptyMessage="Nenhuma oportunidade registrada para este cliente."
              headers={["Título", "Estágio", "Valor estimado", "Probabilidade", "Previsão"]}
              rows={customer.opportunities.map((opp) => [
                <span key="title" className="font-medium text-slate-900">
                  {opp.title}
                </span>,
                STAGE_LABELS[opp.stage],
                opp.estimatedValueCents > 0
                  ? formatBRL(opp.estimatedValueCents / 100)
                  : "—",
                opp.probability > 0 ? `${opp.probability}%` : "—",
                opp.expectedCloseAt
                  ? formatDatePtBR(opp.expectedCloseAt)
                  : "—",
              ])}
            />
          </SectionCard>

          <SectionCard title="Atividades">
            <SimpleTable
              emptyMessage="Nenhuma atividade registrada para este cliente."
              headers={["Assunto", "Tipo", "Status", "Agendada para"]}
              rows={customer.activities.map((activity) => [
                <span key="subject" className="font-medium text-slate-900">
                  {activity.subject}
                </span>,
                ACTIVITY_TYPE_LABELS[activity.type],
                ACTIVITY_STATUS_LABELS[activity.status],
                formatDatePtBR(activity.scheduledAt),
              ])}
            />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Scores de inteligência">
            {hasScoreFields(customer) &&
            (customer.priorityScore != null ||
              customer.repurchaseScore != null ||
              customer.inactivityRiskScore != null ||
              customer.potentialScore != null) ? (
              <div className="grid gap-3">
                {customer.priorityScore != null ? (
                  <MetricItem
                    label="Prioridade"
                    value={String(customer.priorityScore)}
                  />
                ) : null}
                {customer.repurchaseScore != null ? (
                  <MetricItem
                    label="Recompra"
                    value={String(customer.repurchaseScore)}
                  />
                ) : null}
                {customer.inactivityRiskScore != null ? (
                  <MetricItem
                    label="Risco de inatividade"
                    value={String(customer.inactivityRiskScore)}
                  />
                ) : null}
                {customer.potentialScore != null ? (
                  <MetricItem
                    label="Potencial"
                    value={String(customer.potentialScore)}
                  />
                ) : null}
              </div>
            ) : (
              <EmptyState
                description="Os scores de prioridade, recompra e risco serão exibidos aqui quando o módulo de inteligência estiver disponível."
                title="Scores indisponíveis"
              />
            )}
          </SectionCard>

          <SectionCard title="Alertas">
            {hasAlerts(customer) && customer.alerts.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {customer.alerts.map((alert) => (
                  <li key={alert.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="font-medium text-slate-900">{alert.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {alert.severity} · {alert.status}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                description="Alertas comerciais e de risco aparecerão aqui quando configurados para este cliente."
                title="Nenhum alerta"
              />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
