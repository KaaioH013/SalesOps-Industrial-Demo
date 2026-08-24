import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import type { QuoteListRow } from "@/db/queries/quotes";
import { formatBRL } from "@/lib/formatters/currency";
import { formatDatePtBR } from "@/lib/formatters/date";
import { formatPercent } from "@/lib/formatters/percent";

const STATUS_LABELS: Record<QuoteListRow["status"], string> = {
  draft: "Rascunho",
  sent: "Enviada",
  approved: "Aprovada",
  rejected: "Rejeitada",
  expired: "Expirada",
  won: "Ganha",
  lost: "Perdida",
};

export function QuoteTable({
  rows,
  page,
  total,
  totalPages,
  showFinancials,
}: {
  rows: QuoteListRow[];
  page: number;
  total: number;
  totalPages: number;
  showFinancials: boolean;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        description="As cotações aparecerão aqui após a execução do seed."
        title="Nenhuma cotação registrada"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Cotação</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Validade</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                {showFinancials ? <th className="px-4 py-3">Margem</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((quote) => (
                <tr key={quote.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      className="font-medium text-slate-900 hover:text-blue-700"
                      href={`/quotes/${quote.id}`}
                    >
                      {quote.number}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {quote.owner?.name ?? "Sem responsável"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{quote.customer.name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatDatePtBR(quote.validUntil)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {STATUS_LABELS[quote.status]}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {formatBRL(quote.totalCents / 100)}
                  </td>
                  {showFinancials ? (
                    <td className="px-4 py-3">
                      <span
                        className={
                          quote.belowTarget
                            ? "inline-flex rounded-full bg-red-50 px-2 py-1 font-medium text-red-700"
                            : "tabular-nums text-slate-700"
                        }
                      >
                        {quote.grossMarginBps == null
                          ? "Sem referência"
                          : formatPercent(quote.grossMarginBps / 10_000, 1)}
                        {quote.belowTarget ? " · abaixo da meta" : ""}
                      </span>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>{total} cotação(ões)</span>
        <div className="flex items-center gap-2">
          <Link
            aria-disabled={page <= 1}
            className="rounded-md border border-slate-300 px-3 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            href={page > 2 ? `/quotes?page=${page - 1}` : "/quotes"}
          >
            Anterior
          </Link>
          <span>
            Página {page} de {Math.max(1, totalPages)}
          </span>
          <Link
            aria-disabled={page >= totalPages}
            className="rounded-md border border-slate-300 px-3 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            href={`/quotes?page=${page + 1}`}
          >
            Próxima
          </Link>
        </div>
      </div>
    </div>
  );
}
