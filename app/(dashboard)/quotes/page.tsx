import { EmptyState } from "@/components/ui/empty-state";

export default function QuotesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Cotações</h1>
        <p className="mt-1 text-sm text-slate-600">
          Propostas comerciais e cotações enviadas.
        </p>
      </div>
      <EmptyState
        title="Nenhuma cotação registrada"
        description="A listagem de cotações aparecerá aqui após a execução do seed do ambiente de demonstração."
      />
    </div>
  );
}
