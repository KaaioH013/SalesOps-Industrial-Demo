import { EmptyState } from "@/components/ui/empty-state";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Produtos</h1>
        <p className="mt-1 text-sm text-slate-600">
          Catálogo de produtos e tabelas de preço.
        </p>
      </div>
      <EmptyState
        title="Catálogo vazio"
        description="Os produtos e famílias comerciais aparecerão aqui após a execução do seed do ambiente de demonstração."
      />
    </div>
  );
}
