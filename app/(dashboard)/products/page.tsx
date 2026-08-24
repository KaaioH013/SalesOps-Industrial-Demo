import {
  getProductFilterOptions,
  listProducts,
} from "@/db/queries/products";
import { ProductCatalog } from "@/features/products/product-catalog";
import { auth } from "@/lib/auth/auth";
import { canViewMargin } from "@/lib/permissions/roles";

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    familyId?: string;
    application?: string;
    page?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const session = await auth();
  const params = await searchParams;
  if (!session?.user) return null;

  const filters = {
    q: params.q?.trim() ?? "",
    familyId: params.familyId ?? "",
    application: params.application ?? "",
  };
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const [result, options] = await Promise.all([
    listProducts({
      organizationId: session.user.organizationId,
      role: session.user.role,
      ...filters,
      page,
    }),
    getProductFilterOptions(session.user.organizationId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Produtos</h1>
        <p className="mt-1 text-sm text-slate-600">
          Catálogo de produtos e tabelas de preço.
        </p>
      </div>
      <ProductCatalog
        filters={filters}
        options={options}
        page={result.page}
        rows={result.data}
        showFinancials={canViewMargin(session.user.role)}
        total={result.total}
        totalPages={result.totalPages}
      />
    </div>
  );
}
