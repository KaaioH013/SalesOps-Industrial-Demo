import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import type { getQuote } from "@/db/queries/quotes";
import { formatBRL } from "@/lib/formatters/currency";
import { formatDatePtBR } from "@/lib/formatters/date";
import { formatPercent } from "@/lib/formatters/percent";

type QuoteDetailData = NonNullable<Awaited<ReturnType<typeof getQuote>>>;

export function QuoteDetail({
  quote,
  showFinancials,
}: {
  quote: QuoteDetailData;
  showFinancials: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Link
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
          href="/quotes"
        >
          <ArrowLeft className="size-4" />
          Voltar às cotações
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Cotação
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{quote.number}</h1>
        <Link
          className="mt-2 inline-flex text-sm font-medium text-blue-700"
          href={`/customers/${quote.customer.id}`}
        >
          {quote.customer.name}
        </Link>
      </div>

      {quote.belowTarget ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Margem abaixo da meta ponderada das famílias desta cotação.
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total" value={formatBRL(quote.totalCents / 100)} />
          {showFinancials ? (
            <Metric
              label="Custo"
              value={quote.costCents == null ? "—" : formatBRL(quote.costCents / 100)}
            />
          ) : null}
          {showFinancials ? (
            <Metric
              label="Margem bruta"
              value={
                quote.grossMarginBps == null
                  ? "—"
                  : formatPercent(quote.grossMarginBps / 10_000, 1)
              }
            />
          ) : null}
          {showFinancials ? (
            <Metric
              label="Meta ponderada"
              value={
                quote.targetMarginBps == null
                  ? "Sem referência"
                  : formatPercent(quote.targetMarginBps / 10_000, 1)
              }
            />
          ) : null}
          <Metric label="Validade" value={formatDatePtBR(quote.validUntil)} />
          <Metric label="Responsável" value={quote.owner?.name ?? "Não atribuído"} />
          <Metric
            label="Desconto geral"
            value={formatPercent(quote.discountBps / 10_000, 1)}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Itens da cotação</h2>
        </div>
        {quote.items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Nenhum item detalhado disponível.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Família</th>
                  <th className="px-4 py-3">Qtd.</th>
                  <th className="px-4 py-3">Preço unitário</th>
                  {showFinancials ? <th className="px-4 py-3">Custo unitário</th> : null}
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quote.items.map((item) => (
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
                    <td className="px-4 py-3 text-slate-700">{item.familyName}</td>
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
        )}
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
