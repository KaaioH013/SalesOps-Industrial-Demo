import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Visão geral comercial e operacional.
        </p>
      </div>
      <EmptyState
        title="Indicadores ainda não disponíveis"
        description="Os cards de KPIs, metas e alertas serão exibidos aqui após a execução do seed do ambiente de demonstração."
      />
    </div>
  );
}
