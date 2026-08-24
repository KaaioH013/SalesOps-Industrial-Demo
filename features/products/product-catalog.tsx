import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import type { ProductListRow } from "@/db/queries/products";
import { formatBRL } from "@/lib/formatters/currency";
import { formatPercent } from "@/lib/formatters/percent";

type ProductCatalogProps = {
  rows: ProductListRow[];
  options: {
    families: Array<{ id: string; name: string }>;
    applications: string[];
  };
  filters: { q: string; familyId: string; application: string };
  page: number;
  total: number;
  totalPages: number;
  showFinancials: boolean;
};

function pageHref(
  page: number,
  filters: ProductCatalogProps["filters"],
) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.familyId) params.set("familyId", filters.familyId);
  if (filters.application) params.set("application", filters.application);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

export function ProductCatalog({
  rows,
  options,
  filters,
  page,
  total,
  totalPages,
  showFinancials,
}: ProductCatalogProps) {
  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4"
        method="get"
      >
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          Busca
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            defaultValue={filters.q}
            name="q"
            placeholder="SKU ou descrição"
          />
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          Família
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            defaultValue={filters.familyId}
            name="familyId"
          >
            <option value="">Todas</option>
            {options.families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          Aplicação
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            defaultValue={filters.application}
            name="application"
          >
            <option value="">Todas</option>
            {options.applications.map((application) => (
              <option key={application} value={application}>
                {application}
              </option>
            ))}
          </select>
        </label>
        <button
          className="h-10 self-end rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700"
          type="submit"
        >
          Aplicar filtros
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          description="Ajuste os filtros ou execute o seed do ambiente de demonstração."
          title="Nenhum produto encontrado"
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Família</th>
                  <th className="px-4 py-3">Aplicação</th>
                  <th className="px-4 py-3">Preço</th>
                  {showFinancials ? <th className="px-4 py-3">Custo</th> : null}
                  {showFinancials ? <th className="px-4 py-3">Margem</th> : null}
                  <th className="px-4 py-3">Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        className="font-medium text-slate-900 hover:text-blue-700"
                        href={`/products/${product.id}`}
                      >
                        {product.description}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">{product.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{product.family.name}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {product.application ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">
                      {formatBRL(product.listPriceCents / 100)}
                    </td>
                    {showFinancials ? (
                      <td className="px-4 py-3 tabular-nums text-slate-700">
                        {product.standardCostCents == null
                          ? "—"
                          : formatBRL(product.standardCostCents / 100)}
                      </td>
                    ) : null}
                    {showFinancials ? (
                      <td className="px-4 py-3 tabular-nums text-slate-700">
                        {product.grossMarginBps == null
                          ? "—"
                          : formatPercent(product.grossMarginBps / 10_000, 1)}
                      </td>
                    ) : null}
                    <td className="px-4 py-3 text-slate-700">
                      {product.stockQuantity} un.
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>{total} produto(s)</span>
        <div className="flex items-center gap-2">
          <Link
            aria-disabled={page <= 1}
            className="rounded-md border border-slate-300 px-3 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            href={pageHref(Math.max(1, page - 1), filters)}
          >
            Anterior
          </Link>
          <span>
            Página {page} de {Math.max(1, totalPages)}
          </span>
          <Link
            aria-disabled={page >= totalPages}
            className="rounded-md border border-slate-300 px-3 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            href={pageHref(Math.min(totalPages, page + 1), filters)}
          >
            Próxima
          </Link>
        </div>
      </div>
    </div>
  );
}
