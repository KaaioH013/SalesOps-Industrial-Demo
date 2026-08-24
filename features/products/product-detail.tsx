import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import type { getProduct } from "@/db/queries/products";
import { formatBRL } from "@/lib/formatters/currency";
import { formatPercent } from "@/lib/formatters/percent";

type ProductDetailData = NonNullable<Awaited<ReturnType<typeof getProduct>>>;

export function ProductDetail({
  product,
  showFinancials,
}: {
  product: ProductDetailData;
  showFinancials: boolean;
}) {
  const metrics = [
    { label: "Preço de lista", value: formatBRL(product.listPriceCents / 100) },
    ...(showFinancials
      ? [
          {
            label: "Custo padrão",
            value:
              product.standardCostCents == null
                ? "—"
                : formatBRL(product.standardCostCents / 100),
          },
          {
            label: "Margem bruta",
            value:
              product.grossMarginBps == null
                ? "—"
                : formatPercent(product.grossMarginBps / 10_000, 1),
          },
        ]
      : []),
    { label: "Estoque", value: `${product.stockQuantity} un.` },
    { label: "Prazo", value: `${product.leadTimeDays} dias` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
          href="/products"
        >
          <ArrowLeft className="size-4" />
          Voltar ao catálogo
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {product.sku}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          {product.description}
        </h1>
      </div>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {metric.label}
              </p>
              <p className="mt-1 font-semibold tabular-nums text-slate-900">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Classificação comercial</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Família</dt>
            <dd className="mt-1 font-medium text-slate-900">{product.family.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Aplicação</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {product.application ?? "Não informada"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {product.status === "active" ? "Ativo" : "Inativo"}
            </dd>
          </div>
          {showFinancials ? (
            <div>
              <dt className="text-slate-500">Meta da família</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {formatPercent(product.family.targetMarginBps / 10_000, 1)}
              </dd>
            </div>
          ) : null}
        </dl>
        {product.family.description ? (
          <p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
            {product.family.description}
          </p>
        ) : null}
      </section>
    </div>
  );
}
