import {
  getDashboardFilterOptions,
  getDashboardMetrics,
} from "@/db/queries/dashboard";
import { DashboardWidgets } from "@/features/dashboard/dashboard-widgets";
import { auth } from "@/lib/auth/auth";

type DashboardPageProps = {
  searchParams: Promise<{
    period?: string;
    territoryId?: string;
    segment?: string;
    sellerId?: string;
  }>;
};

const PERIODS = [
  { value: "3m", label: "Últimos 3 meses", months: 3 },
  { value: "6m", label: "Últimos 6 meses", months: 6 },
  { value: "12m", label: "Últimos 12 meses", months: 12 },
  { value: "ytd", label: "Ano atual", months: 0 },
] as const;

function resolvePeriod(value: string | undefined) {
  const selected = PERIODS.find((period) => period.value === value) ?? PERIODS[2];
  const to = new Date();
  const from =
    selected.value === "ytd"
      ? new Date(Date.UTC(to.getUTCFullYear(), 0, 1))
      : new Date(
          Date.UTC(
            to.getUTCFullYear(),
            to.getUTCMonth() - selected.months + 1,
            1,
          ),
        );

  return { selected: selected.value, from, to };
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user) {
    return null;
  }

  const period = resolvePeriod(params.period);
  const scope = {
    organizationId: session.user.organizationId,
    role: session.user.role,
    userId: session.user.id,
  };
  const [metrics, options] = await Promise.all([
    getDashboardMetrics({
      ...scope,
      from: period.from,
      to: period.to,
      territoryId: params.territoryId || undefined,
      segment: params.segment || undefined,
      sellerId:
        session.user.role === "seller"
          ? session.user.id
          : params.sellerId || undefined,
    }),
    getDashboardFilterOptions(scope),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Dashboard executivo
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Receita, pipeline, carteira e prioridades comerciais em uma única
            visão.
          </p>
        </div>
        <form
          className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4"
          method="get"
        >
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Período
            <select
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
              defaultValue={period.selected}
              name="period"
            >
              {PERIODS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Território
            <select
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
              defaultValue={params.territoryId ?? ""}
              name="territoryId"
            >
              <option value="">Todos</option>
              {options.territories.map((territory) => (
                <option key={territory.id} value={territory.id}>
                  {territory.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Segmento
            <select
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
              defaultValue={params.segment ?? ""}
              name="segment"
            >
              <option value="">Todos</option>
              {options.segments.map((segment) => (
                <option key={segment} value={segment}>
                  {segment}
                </option>
              ))}
            </select>
          </label>
          {session.user.role !== "seller" ? (
            <label className="grid gap-1 text-xs font-medium text-slate-600">
              Vendedor
              <select
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
                defaultValue={params.sellerId ?? ""}
                name="sellerId"
              >
                <option value="">Todos</option>
                {options.sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            className="min-h-11 cursor-pointer rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 lg:col-start-4"
            type="submit"
          >
            Aplicar filtros
          </button>
        </form>
      </div>
      <DashboardWidgets metrics={metrics} />
    </div>
  );
}
