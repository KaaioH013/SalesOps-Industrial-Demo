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
  { value: "3m", label: "3 meses", months: 3 },
  { value: "6m", label: "6 meses", months: 6 },
  { value: "12m", label: "12 meses", months: 12 },
  { value: "ytd", label: "Ano atual", months: 0 },
] as const;

const selectClassName =
  "h-9 w-full min-w-0 cursor-pointer rounded border border-slate-300 bg-white px-2.5 text-sm text-slate-800 outline-none focus-visible:border-blue-950 focus-visible:ring-2 focus-visible:ring-blue-950/25";

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

  return { selected: selected.value, from, to, label: selected.label };
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
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1.5 bg-blue-950"
        />
        <div className="flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-end sm:justify-between sm:p-5 sm:pl-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-950">
              Inteligência comercial
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
              Dashboard executivo
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Recorte:{" "}
              <strong className="font-semibold text-slate-900">
                {period.label}
              </strong>
              . Filtre e priorize ações do dia.
            </p>
          </div>
          <form
            aria-label="Filtros do dashboard"
            className="flex w-full flex-wrap items-end gap-2 sm:w-auto sm:justify-end"
            method="get"
          >
            <label className="grid min-w-[7.5rem] flex-1 gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:flex-none">
              Período
              <select
                className={selectClassName}
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
            <label className="grid min-w-[7.5rem] flex-1 gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:flex-none">
              Território
              <select
                className={selectClassName}
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
            <label className="grid min-w-[7.5rem] flex-1 gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:flex-none">
              Segmento
              <select
                className={selectClassName}
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
              <label className="grid min-w-[7.5rem] flex-1 gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:flex-none">
                Vendedor
                <select
                  className={selectClassName}
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
              className="inline-flex h-9 cursor-pointer items-center justify-center rounded bg-blue-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
              type="submit"
            >
              Aplicar
            </button>
          </form>
        </div>
      </div>

      <DashboardWidgets metrics={metrics} />
    </div>
  );
}
