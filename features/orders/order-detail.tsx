import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import type { getOrder } from "@/db/queries/orders";
import { formatBRL } from "@/lib/formatters/currency";
import { formatDatePtBR } from "@/lib/formatters/date";
import { formatPercent } from "@/lib/formatters/percent";

type OrderDetailData = NonNullable<Awaited<ReturnType<typeof getOrder>>>;

export function OrderDetail({
  order,
  showFinancials,
}: {
  order: OrderDetailData;
  showFinancials: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Link
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
          href="/orders"
        >
          <ArrowLeft className="size-4" />
          Voltar aos pedidos
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Pedido
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{order.number}</h1>
        <Link
          className="mt-2 inline-flex text-sm font-medium text-blue-700"
          href={`/customers/${order.customer.id}`}
        >
          {order.customer.name}
        </Link>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Receita" value={formatBRL(order.revenueCents / 100)} />
          {showFinancials ? (
            <Metric
              label="Custo"
              value={order.costCents == null ? "—" : formatBRL(order.costCents / 100)}
            />
          ) : null}
          {showFinancials ? (
            <Metric
              label="Margem bruta"
              value={
                order.grossMarginBps == null
                  ? "—"
                  : formatPercent(order.grossMarginBps / 10_000, 1)
              }
            />
          ) : null}
          <Metric label="Data do pedido" value={formatDatePtBR(order.orderedAt)} />
          <Metric label="Responsável" value={order.owner?.name ?? "Não atribuído"} />
          {order.quote ? (
            <Metric
              label="Cotação de origem"
              value={
                <Link className="text-blue-700" href={`/quotes/${order.quote.id}`}>
                  {order.quote.number}
                </Link>
              }
            />
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Itens do pedido</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Qtd.</th>
                <th className="px-4 py-3">Preço unitário</th>
                {showFinancials ? <th className="px-4 py-3">Custo unitário</th> : null}
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <Link
                      className="font-medium text-slate-900 hover:text-blue-700"
                      href={`/products/${item.product.id}`}
                    >
                      {item.product.description}
                    </Link>
                    <p className="text-xs text-slate-500">{item.product.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.quantity}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {formatBRL(item.unitPriceCents / 100)}
                  </td>
                  {showFinancials ? (
                    <td className="px-4 py-3 tabular-nums text-slate-700">
                      {item.unitCostCents == null
                        ? "—"
                        : formatBRL(item.unitCostCents / 100)}
                    </td>
                  ) : null}
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {formatBRL(item.totalCents / 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}
