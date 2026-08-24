import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import type { OrderListRow } from "@/db/queries/orders";
import { formatBRL } from "@/lib/formatters/currency";
import { formatDatePtBR } from "@/lib/formatters/date";
import { formatPercent } from "@/lib/formatters/percent";

const STATUS_LABELS: Record<OrderListRow["status"], string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_production: "Em produção",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export function OrderTable({
  rows,
  page,
  total,
  totalPages,
  showFinancials,
}: {
  rows: OrderListRow[];
  page: number;
  total: number;
  totalPages: number;
  showFinancials: boolean;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        description="Os pedidos aparecerão aqui após a execução do seed."
        title="Nenhum pedido registrado"
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
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Receita</th>
                {showFinancials ? <th className="px-4 py-3">Custo</th> : null}
                {showFinancials ? <th className="px-4 py-3">Margem</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      className="font-medium text-slate-900 hover:text-blue-700"
                      href={`/orders/${order.id}`}
                    >
                      {order.number}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {order.owner?.name ?? "Sem responsável"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{order.customer.name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatDatePtBR(order.orderedAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {STATUS_LABELS[order.status]}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {formatBRL(order.revenueCents / 100)}
                  </td>
                  {showFinancials ? (
                    <td className="px-4 py-3 tabular-nums text-slate-700">
                      {order.costCents == null
                        ? "—"
                        : formatBRL(order.costCents / 100)}
                    </td>
                  ) : null}
                  {showFinancials ? (
                    <td className="px-4 py-3 tabular-nums text-slate-700">
                      {order.grossMarginBps == null
                        ? "—"
                        : formatPercent(order.grossMarginBps / 10_000, 1)}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>{total} pedido(s)</span>
        <div className="flex items-center gap-2">
          <Link
            aria-disabled={page <= 1}
            className="rounded-md border border-slate-300 px-3 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            href={page > 2 ? `/orders?page=${page - 1}` : "/orders"}
          >
            Anterior
          </Link>
          <span>
            Página {page} de {Math.max(1, totalPages)}
          </span>
          <Link
            aria-disabled={page >= totalPages}
            className="rounded-md border border-slate-300 px-3 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            href={`/orders?page=${page + 1}`}
          >
            Próxima
          </Link>
        </div>
      </div>
    </div>
  );
}
