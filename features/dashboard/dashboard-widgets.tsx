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

function KpiCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof CircleDollarSign;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <span className="rounded-md bg-slate-100 p-2 text-slate-600">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
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
      className={`rounded-lg border border-slate-200 bg-white p-5 ${className}`}
    >
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-5">{children}</div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
        {helper}
      </p>
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
    return <p className="py-12 text-center text-sm text-slate-500">Sem dados.</p>;
  }

  return (
    <ol className="space-y-4">
      {rows.slice(0, 5).map((row, index) => (
        <li key={row.id}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-700">
              {index + 1}. {row.name}
            </span>
            <span className="shrink-0 font-semibold text-slate-900">
              {money(row.revenueCents)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-700"
              style={{
                width: `${max > 0 ? Math.max(3, (row.revenueCents / max) * 100) : 0}%`,
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DashboardWidgets({ metrics }: DashboardWidgetsProps) {
  const hasData =
    metrics.revenue.actualCents > 0 ||
    metrics.openPipeline.count > 0 ||
    metrics.newCustomers > 0;

  if (!hasData) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          Nenhum dado no período
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
          Ajuste os filtros ou execute o seed para visualizar os indicadores
          comerciais.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section
        aria-label="Indicadores principais"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          detail={`${percent(metrics.revenue.attainmentBps)} da meta de ${money(metrics.revenue.targetCents)}`}
          icon={CircleDollarSign}
          title="Receita"
          value={money(metrics.revenue.actualCents)}
        />
        {metrics.margin ? (
          <KpiCard
            detail={`${percent(metrics.margin.attainmentBps)} da meta de ${money(metrics.margin.targetCents)}`}
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
          helper="Pergunta comercial: a receita e o volume de pedidos estão acelerando ou desacelerando mês a mês?"
          title="Evolução mensal"
        >
          <div className="h-72" role="img" aria-label="Receita e pedidos por mês">
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
                      ? [integer.format(Number(value)), name]
                      : [money(Number(value)), name]
                  }
                />
                <Legend />
                <Bar
                  dataKey="revenueCents"
                  fill="#334155"
                  name="Receita"
                  radius={[3, 3, 0, 0]}
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
          helper="Pergunta comercial: em qual etapa as oportunidades estão concentradas e onde o avanço precisa ser destravado?"
          title="Funil por estágio"
        >
          <div className="h-72" role="img" aria-label="Oportunidades por estágio">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={metrics.funnel} layout="vertical">
                <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                <XAxis axisLine={false} fontSize={12} tickLine={false} type="number" />
                <YAxis
                  axisLine={false}
                  dataKey="label"
                  fontSize={11}
                  tickLine={false}
                  type="category"
                  width={84}
                />
                <Tooltip
                  formatter={(value) => [integer.format(Number(value)), "Oportunidades"]}
                />
                <Bar dataKey="count" name="Oportunidades" radius={[0, 3, 3, 0]}>
                  {metrics.funnel.map((row) => (
                    <Cell
                      fill={
                        row.stage === "ganho"
                          ? "#15803d"
                          : row.stage === "perdido"
                            ? "#b91c1c"
                            : "#475569"
                      }
                      key={row.stage}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Widget>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Widget
          helper="Pergunta comercial: quais territórios sustentam a receita e quais precisam de cobertura adicional?"
          title="Ranking por território"
        >
          <RankingList rows={metrics.territoryRanking} />
        </Widget>
        <Widget
          helper="Pergunta comercial: quem está convertendo carteira em receita com maior consistência?"
          title="Ranking por vendedor"
        >
          <RankingList rows={metrics.sellerRanking} />
        </Widget>
        <Widget
          helper="Pergunta comercial: quanto da receita depende dos dez maiores clientes?"
          title="Pareto de clientes"
        >
          <div className="h-64" role="img" aria-label="Receita acumulada por cliente">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={metrics.customerPareto}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis
                  axisLine={false}
                  dataKey="name"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(value: string) => value.slice(0, 8)}
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
                  fill="#bae6fd"
                  name="Acumulado"
                  stroke="#0369a1"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Widget>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Widget
          helper="Pergunta comercial: quais sinais exigem resposta imediata da equipe?"
          title="Alertas comerciais"
        >
          {metrics.alerts.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {metrics.alerts.slice(0, 6).map((alert) => (
                <li className="py-3 first:pt-0" key={alert.id}>
                  <Link
                    className="group flex items-start justify-between gap-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900"
                    href={alert.href}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {alert.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {alert.description}
                      </p>
                    </div>
                    <ArrowRight
                      aria-hidden="true"
                      className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">
              Nenhum alerta aberto.
            </p>
          )}
        </Widget>

        <Widget
          helper="Pergunta comercial: quais são as próximas ações com maior impacto potencial?"
          title="Ações recomendadas"
        >
          <ul className="space-y-3">
            {metrics.recommendedActions.map((action) => (
              <li
                className="rounded-md border border-slate-200 bg-slate-50 p-4"
                key={action.title}
              >
                <Link
                  className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900"
                  href={action.href}
                >
                  <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
                    {action.title}
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5"
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
    </div>
  );
}
