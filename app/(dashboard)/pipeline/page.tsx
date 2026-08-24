import { EmptyState } from "@/components/ui/empty-state";

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Pipeline</h1>
        <p className="mt-1 text-sm text-slate-600">
          Funil comercial e oportunidades em andamento.
        </p>
      </div>
      <EmptyState
        title="Pipeline vazio"
        description="As oportunidades por estágio aparecerão aqui após a execução do seed do ambiente de demonstração."
      />
    </div>
  );
}
