import {
  getReportFilterOptions,
  listReportRows,
  REPORT_TYPES,
  type ReportType,
} from "@/db/queries/reports";
import {
  ReportPagination,
  ReportTable,
} from "@/features/reports/report-table";
import { auth } from "@/lib/auth/auth";
import { resolveReportPeriod } from "@/lib/reports/period";
import { canViewMargin } from "@/lib/permissions/roles";

const REPORT_LABELS: Record<ReportType, string> = {
  orders: "Receita e pedidos",
  pipeline: "Pipeline comercial",
  customers: "Carteira de clientes",
  territories: "Desempenho por território",
};

type ReportsPageProps = {
  searchParams: Promise<{
    type?: string;
    period?: string;
    territoryId?: string;
    segment?: string;
    sellerId?: string;
    page?: string;
  }>;
};

function parseReportType(value: string | undefined): ReportType {
  if (value && REPORT_TYPES.includes(value as ReportType)) {
    return value as ReportType;
  }
  return "orders";
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user) {
    return null;
  }

  const type = parseReportType(params.type);
  const period = resolveReportPeriod(params.period);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const scope = {
    organizationId: session.user.organizationId,
    role: session.user.role,
    userId: session.user.id,
  };

  const [result, options] = await Promise.all([
    listReportRows({
      ...scope,
      type,
      from: period.from,
      to: period.to,
      territoryId: params.territoryId || undefined,
      segment: params.segment || undefined,
      sellerId:
        session.user.role === "seller"
          ? session.user.id
          : params.sellerId || undefined,
      page,
    }),
    getReportFilterOptions(scope),
  ]);

  const exportParams = new URLSearchParams({
    type,
    period: period.selected,
  });
  if (params.territoryId) exportParams.set("territoryId", params.territoryId);
  if (params.segment) exportParams.set("segment", params.segment);
  if (params.sellerId && session.user.role !== "seller") {
    exportParams.set("sellerId", params.sellerId);
  }

  const paginationParams = new URLSearchParams(exportParams);
  paginationParams.set("page", String(page));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Relatórios</h1>
          <p className="mt-1 text-sm text-slate-600">
            Filtre indicadores comerciais e exporte CSV dentro do seu escopo de
            permissão.
          </p>
        </div>
        <a
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
          href={`/api/reports/export?${exportParams.toString()}`}
        >
          Exportar CSV
        </a>
      </div>

      <form
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-6"
        method="get"
      >
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          Relatório
          <select
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
            defaultValue={type}
            name="type"
          >
            {REPORT_TYPES.map((item) => (
              <option key={item} value={item}>
                {REPORT_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          Período
          <select
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
            defaultValue={period.selected}
            name="period"
          >
            <option value="3m">Últimos 3 meses</option>
            <option value="6m">Últimos 6 meses</option>
            <option value="12m">Últimos 12 meses</option>
            <option value="ytd">Ano atual</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          Território
          <select
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
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
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
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
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
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
          className="min-h-11 cursor-pointer rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 lg:col-start-6"
          type="submit"
        >
          Aplicar filtros
        </button>
      </form>

      <ReportTable
        result={result}
        showFinancials={canViewMargin(session.user.role)}
      />
      <ReportPagination
        page={result.page}
        searchParams={paginationParams}
        total={result.total}
        totalPages={result.totalPages}
      />
    </div>
  );
}
