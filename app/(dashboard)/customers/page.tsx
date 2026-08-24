import { EmptyState } from "@/components/ui/empty-state";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
        <p className="mt-1 text-sm text-slate-600">
          Carteira de clientes e contas estratégicas.
        </p>
      </div>
      <EmptyState
        title="Nenhum cliente cadastrado"
        description="A listagem de clientes aparecerá aqui após a execução do seed do ambiente de demonstração."
      />
    </div>
  );
}
