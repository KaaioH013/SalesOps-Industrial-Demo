import { EmptyState } from "@/components/ui/empty-state";

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Insights</h1>
        <p className="mt-1 text-sm text-slate-600">
          Análises e recomendações comerciais.
        </p>
      </div>
      <EmptyState
        title="Insights ainda não gerados"
        description="Os alertas e recomendações inteligentes aparecerão aqui após a execução do seed do ambiente de demonstração."
      />
    </div>
  );
}
