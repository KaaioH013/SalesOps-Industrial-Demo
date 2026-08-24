import { EmptyState } from "@/components/ui/empty-state";
import type { ReportResult } from "@/db/queries/reports";
import { formatBRL } from "@/lib/formatters/currency";
import { formatDatePtBR } from "@/lib/formatters/date";
import { formatPercent } from "@/lib/formatters/percent";

type ReportTableProps = {
  result: ReportResult;
  showFinancials: boolean;
};

function money(cents: number) {
  return formatBRL(cents / 100);
}

function margin(bps: number | null) {
  return bps == null ? "—" : formatPercent(bps / 10_000, 1);
}

export function ReportTable({ result, showFinancials }: ReportTableProps) {
  if (result.rows.length === 0) {
    return (
      <EmptyState
        description="Ajuste os filtros ou execute o seed para gerar dados de demonstração."
        title="Nenhum registro no relatório"
      />
    );
  }

  if (result.type === "orders") {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3">Receita</th>
                {showFinancials ? <th className="px-4 py-3">Margem</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.rows.map((row) => (
                <tr className="hover:bg-slate-50" key={row.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{row.number}</p>
                    <p className="text-xs text-slate-500">{row.statusLabel}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatDatePtBR(row.orderedAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.customerName}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.sellerName ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {money(row.revenueCents)}
                  </td>
                  {showFinancials ? (
                    <td className="px-4 py-3 tabular-nums text-slate-700">
                      {margin(row.grossMarginBps)}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (result.type === "pipeline") {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Oportunidade</th>
                <th className="px-4 py-3">Estágio</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Ponderado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.rows.map((row) => (
                <tr className="hover:bg-slate-50" key={row.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.title}</td>
                  <td className="px-4 py-3 text-slate-700">{row.stageLabel}</td>
                  <td className="px-4 py-3 text-slate-700">{row.customerName}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {money(row.estimatedValueCents)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {money(row.weightedValueCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (result.type === "customers") {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Segmento</th>
                <th className="px-4 py-3">Território</th>
                <th className="px-4 py-3">Receita</th>
                <th className="px-4 py-3">Pedidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.rows.map((row) => (
                <tr className="hover:bg-slate-50" key={row.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {row.tradeName}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.segment}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.territoryName ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {money(row.revenueCents)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {row.orders}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Território</th>
              <th className="px-4 py-3">Clientes</th>
              <th className="px-4 py-3">Pedidos</th>
              <th className="px-4 py-3">Receita</th>
              {showFinancials ? <th className="px-4 py-3">Margem</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.rows.map((row) => (
              <tr className="hover:bg-slate-50" key={row.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                <td className="px-4 py-3 tabular-nums text-slate-700">
                  {row.customers}
                </td>
                <td className="px-4 py-3 tabular-nums text-slate-700">
                  {row.orders}
                </td>
                <td className="px-4 py-3 tabular-nums text-slate-700">
                  {money(row.revenueCents)}
                </td>
                {showFinancials ? (
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {margin(row.grossMarginBps)}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ReportPagination({
  page,
  totalPages,
  total,
  searchParams,
}: {
  page: number;
  totalPages: number;
  total: number;
  searchParams: URLSearchParams;
}) {
  if (totalPages <= 1) {
    return (
      <p className="text-sm text-slate-600">
        {total.toLocaleString("pt-BR")} registro(s)
      </p>
    );
  }

  const prev = new URLSearchParams(searchParams);
  prev.set("page", String(Math.max(1, page - 1)));
  const next = new URLSearchParams(searchParams);
  next.set("page", String(Math.min(totalPages, page + 1)));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600">
        {total.toLocaleString("pt-BR")} registro(s) · página {page} de{" "}
        {totalPages}
      </p>
      <div className="flex gap-2">
        <a
          aria-disabled={page <= 1}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 aria-disabled:pointer-events-none aria-disabled:opacity-50"
          href={page <= 1 ? undefined : `?${prev.toString()}`}
        >
          Anterior
        </a>
        <a
          aria-disabled={page >= totalPages}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 aria-disabled:pointer-events-none aria-disabled:opacity-50"
          href={page >= totalPages ? undefined : `?${next.toString()}`}
        >
          Próxima
        </a>
      </div>
    </div>
  );
}
