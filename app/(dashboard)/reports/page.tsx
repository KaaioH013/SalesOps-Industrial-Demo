import { EmptyState } from "@/components/ui/empty-state";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Relatórios</h1>
        <p className="mt-1 text-sm text-slate-600">
          Relatórios gerenciais e exportações.
        </p>
      </div>
      <EmptyState
        title="Relatórios indisponíveis"
        description="Os relatórios consolidados aparecerão aqui após a execução do seed do ambiente de demonstração."
      />
    </div>
  );
}
