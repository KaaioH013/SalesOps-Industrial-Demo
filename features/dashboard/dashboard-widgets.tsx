"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  CircleDollarSign,
  Percent,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardMetrics } from "@/db/queries/dashboard";
import { cn } from "@/lib/utils";

type DashboardWidgetsProps = {
  metrics: DashboardMetrics;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat("pt-BR");

function money(cents: number) {
  return currency.format(cents / 100);
}

function percent(bps: number | null) {
  return bps == null ? "—" : `${(bps / 100).toFixed(1).replace(".", ",")}%`;
}

type Tone = "neutral" | "positive" | "attention" | "risk";

function attainmentTone(bps: number | null): Tone {
  if (bps == null) return "neutral";
  if (bps >= 10_000) return "positive";
  if (bps >= 7_000) return "attention";
  return "risk";
}

const toneBar: Record<Tone, string> = {
  neutral: "bg-slate-700",
  positive: "bg-green-700",
  attention: "bg-amber-600",
  risk: "bg-red-700",
};

const toneText: Record<Tone, string> = {
  neutral: "text-slate-600",
  positive: "text-green-800",
  attention: "text-amber-800",
  risk: "text-red-800",
};

const toneAccent: Record<Tone, string> = {
  neutral: "bg-blue-950",
  positive: "bg-green-700",
  attention: "bg-amber-600",
  risk: "bg-red-700",
};

function KpiCard({
  title,
  value,
  detail,
  icon: Icon,
  attainmentBps,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof CircleDollarSign;
  attainmentBps?: number | null;
}) {
  const tone = attainmentTone(attainmentBps ?? null);
  const width =
    attainmentBps == null
      ? 0
      : Math.min(100, Math.max(4, Math.round(attainmentBps / 100)));

  return (
    <article className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-1.5", toneAccent[tone])}
      />
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {title}
            </p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">
              {value}
            </p>
          </div>
          <span
            aria-hidden="true"
            className="rounded-md bg-slate-100 p-2 text-slate-600"
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>
        {attainmentBps != null ? (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className={cn("font-semibold", toneText[tone])}>
                {percent(attainmentBps)} da meta
              </span>
            </div>
            <div
              aria-hidden="true"
              className="h-2.5 overflow-hidden rounded bg-slate-100"
            >
              <div
                className={cn("h-full rounded", toneBar[tone])}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        ) : null}
        <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
      </div>
    </article>
  );
}

function Widget({
  title,
  helper,
  children,
  className = "",
}: {
  title: string;
  helper: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-md border border-slate-200 bg-white p-5",
        className,
      )}
    >
      <header className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function RankingList({
  rows,
}: {
  rows: Array<{ id: string; name: string; revenueCents: number; orders: number }>;
}) {
  const max = rows[0]?.revenueCents ?? 0;

  if (rows.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">
        Sem dados para este filtro.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {rows.slice(0, 5).map((row, index) => (
        <li key={row.id}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-700">
              <span className="mr-1 tabular-nums text-slate-400">
                {index + 1}.
              </span>
              {row.name}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-slate-900">
              {money(row.revenueCents)}
            </span>
          </div>
          <div
            aria-hidden="true"
            className="h-1.5 overflow-hidden rounded-sm bg-slate-100"
          >
            <div
              className="h-full rounded-sm bg-blue-950"
              style={{
                width: `${max > 0 ? Math.max(3, (row.revenueCents / max) * 100) : 0}%`,
              }}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {integer.format(row.orders)} pedido(s)
          </p>
        </li>
      ))}
    </ol>
  );
}

function FunnelAccessible({
  funnel,
}: {
  funnel: DashboardMetrics["funnel"];
}) {
  const total = funnel.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-4">
      <div
        aria-label="Oportunidades por estágio"
        className="h-56"
        role="img"
      >
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={funnel} layout="vertical" margin={{ left: 4, right: 8 }}>
            <CartesianGrid horizontal={false} stroke="#e2e8f0" />
            <XAxis
              allowDecimals={false}
              axisLine={false}
              fontSize={12}
              tickLine={false}
              type="number"
            />
            <YAxis
              axisLine={false}
              dataKey="label"
              fontSize={11}
              tickLine={false}
              type="category"
              width={92}
            />
            <Tooltip
              formatter={(value) => [
                integer.format(Number(value)),
                "Oportunidades",
              ]}
            />
            <Bar dataKey="count" name="Oportunidades" radius={[0, 2, 2, 0]}>
              {funnel.map((row) => (
                <Cell
                  fill={
                    row.stage === "ganho"
                      ? "#15803d"
                      : row.stage === "perdido"
                        ? "#b91c1c"
                        : "#172554"
                  }
                  key={row.stage}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="w-full text-left text-xs">
        <caption className="sr-only">
          Tabela acessível do funil por estágio
        </caption>
        <thead>
          <tr className="border-b border-slate-100 text-slate-500">
            <th className="py-2 pr-2 font-medium" scope="col">
              Estágio
            </th>
            <th className="py-2 pr-2 font-medium tabular-nums" scope="col">
              Qtd
            </th>
            <th className="py-2 font-medium tabular-nums" scope="col">
              % do funil
            </th>
          </tr>
        </thead>
        <tbody>
          {funnel.map((row) => (
            <tr className="border-b border-slate-50 text-slate-700" key={row.stage}>
              <th className="py-2 pr-2 font-medium" scope="row">
                {row.label}
                {row.stage === "ganho" ? (
                  <span className="ml-1 text-green-700">· ganho</span>
                ) : null}
                {row.stage === "perdido" ? (
                  <span className="ml-1 text-red-700">· perdido</span>
                ) : null}
              </th>
              <td className="py-2 pr-2 tabular-nums">
                {integer.format(row.count)}
              </td>
              <td className="py-2 tabular-nums">
                {total > 0
                  ? `${((row.count / total) * 100).toFixed(0).replace(".", ",")}%`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardWidgets({ metrics }: DashboardWidgetsProps) {
  const hasData =
    metrics.revenue.actualCents > 0 ||
    metrics.openPipeline.count > 0 ||
    metrics.newCustomers > 0;

  if (!hasData) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          Nenhum dado no período
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
          Ajuste os filtros acima ou rode o seed local para popular indicadores
          comerciais.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            className="inline-flex min-h-11 cursor-pointer items-center rounded-md bg-blue-950 px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950 motion-reduce:transition-none"
            href="/customers"
          >
            Ir para clientes
          </Link>
          <Link
            className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 motion-reduce:transition-none"
            href="/pipeline"
          >
            Ver pipeline
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section
        aria-label="Indicadores principais"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          attainmentBps={metrics.revenue.attainmentBps}
          detail={`Meta ${money(metrics.revenue.targetCents)}`}
          icon={CircleDollarSign}
          title="Receita"
          value={money(metrics.revenue.actualCents)}
        />
        {metrics.margin ? (
          <KpiCard
            attainmentBps={metrics.margin.attainmentBps}
            detail={`Meta ${money(metrics.margin.targetCents)}`}
            icon={BadgeDollarSign}
            title="Margem bruta"
            value={money(metrics.margin.actualCents)}
          />
        ) : null}
        <KpiCard
          detail={`${integer.format(metrics.openPipeline.count)} oportunidade(s) aberta(s)`}
          icon={BriefcaseBusiness}
          title="Pipeline ponderado"
          value={money(metrics.openPipeline.weightedValueCents)}
        />
        <KpiCard
          detail="Ganhos sobre oportunidades encerradas"
          icon={Percent}
          title="Conversão proposta → ganho"
          value={percent(metrics.proposalToWonConversionBps)}
        />
        <KpiCard
          detail="Clientes cadastrados no período filtrado"
          icon={UserPlus}
          title="Novos clientes"
          value={integer.format(metrics.newCustomers)}
        />
        <KpiCard
          detail="Inatividade acima de 90 dias ou alto risco"
          icon={AlertTriangle}
          title="Clientes em risco"
          value={integer.format(metrics.atRiskCustomers)}
        />
        <KpiCard
          detail="Contas com sinal de nova compra"
          icon={RefreshCw}
          title="Potencial de recompra"
          value={integer.format(metrics.repurchaseCandidates)}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Widget
          className="xl:col-span-2"
          helper="A receita e o volume de pedidos estão acelerando ou desacelerando mês a mês?"
          title="Evolução mensal"
        >
          <div
            aria-label="Receita e pedidos por mês"
            className="h-72"
            role="img"
          >
            <ResponsiveContainer height="100%" width="100%">
              <ComposedChart data={metrics.monthlySeries}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={(value: number) => money(value)}
                  tickLine={false}
                  width={74}
                  yAxisId="money"
                />
                <YAxis hide orientation="right" yAxisId="orders" />
                <Tooltip
                  formatter={(value, name) =>
                    name === "Pedidos"
                      ? [integer.format(Number(value)), String(name)]
                      : [money(Number(value)), String(name)]
                  }
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="revenueCents"
                  fill="#334155"
                  name="Receita"
                  radius={[2, 2, 0, 0]}
                  yAxisId="money"
                />
                {metrics.margin ? (
                  <Line
                    dataKey="marginCents"
                    dot={false}
                    name="Margem"
                    stroke="#15803d"
                    strokeWidth={2}
                    yAxisId="money"
                  />
                ) : null}
                <Line
                  dataKey="orders"
                  dot={false}
                  name="Pedidos"
                  stroke="#0369a1"
                  strokeWidth={2}
                  yAxisId="orders"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Widget>

        <Widget
          helper="Em qual etapa as oportunidades estão concentradas e onde o avanço precisa ser destravado?"
          title="Funil por estágio"
        >
          <FunnelAccessible funnel={metrics.funnel} />
        </Widget>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Widget
          helper="Quais territórios sustentam a receita e quais precisam de cobertura adicional?"
          title="Ranking por território"
        >
          <RankingList rows={metrics.territoryRanking} />
        </Widget>
        <Widget
          helper="Quem está convertendo carteira em receita com maior consistência?"
          title="Ranking por vendedor"
        >
          <RankingList rows={metrics.sellerRanking} />
        </Widget>
        <Widget
          helper="Quanto da receita depende dos dez maiores clientes?"
          title="Pareto de clientes"
        >
          <div
            aria-label="Receita acumulada por cliente"
            className="h-64"
            role="img"
          >
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={metrics.customerPareto}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis
                  axisLine={false}
                  dataKey="name"
                  fontSize={10}
                  tickFormatter={(value: string) => value.slice(0, 8)}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  domain={[0, 10000]}
                  fontSize={11}
                  tickFormatter={(value: number) => `${value / 100}%`}
                  tickLine={false}
                  width={42}
                />
                <Tooltip
                  formatter={(value) => [percent(Number(value)), "Acumulado"]}
                />
                <Area
                  dataKey="cumulativeShareBps"
                  fill="#e2e8f0"
                  name="Acumulado"
                  stroke="#172554"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Widget>
      </div>

      <section aria-labelledby="ops-hoje-heading" className="space-y-4">
        <div>
          <h2
            className="text-lg font-semibold text-slate-900"
            id="ops-hoje-heading"
          >
            Operação de hoje
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Sinais que pedem ação — alertas abertos e próximas recomendações.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Widget
            helper="Quais sinais exigem resposta imediata da equipe?"
            title="Alertas comerciais"
          >
            {metrics.alerts.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {metrics.alerts.slice(0, 6).map((alert) => (
                  <li className="py-3 first:pt-0" key={alert.id}>
                    <Link
                      className="group flex cursor-pointer items-start justify-between gap-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-950"
                      href={alert.href}
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800 group-hover:text-blue-950">
                          {alert.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {alert.description}
                        </p>
                      </div>
                      <ArrowRight
                        aria-hidden="true"
                        className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">
                Nenhum alerta aberto. Continue monitorando o pipeline.
              </p>
            )}
          </Widget>

          <Widget
            helper="Quais são as próximas ações com maior impacto potencial?"
            title="Ações recomendadas"
          >
            <ul className="space-y-3">
              {metrics.recommendedActions.map((action) => (
                <li key={action.title}>
                  <Link
                    className="group block cursor-pointer rounded-md border border-slate-200 bg-slate-50 p-4 transition-colors duration-150 hover:border-blue-950/30 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950 motion-reduce:transition-none"
                    href={action.href}
                  >
                    <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
                      {action.title}
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
                      />
                    </span>
                    <span className="mt-1.5 block text-xs leading-5 text-slate-500">
                      {action.reason}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Widget>
        </div>
      </section>
    </div>
  );
}
