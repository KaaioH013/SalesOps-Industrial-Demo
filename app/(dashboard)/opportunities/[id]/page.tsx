import { EmptyState } from "@/components/ui/empty-state";

type OpportunityDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OpportunityDetailPage({
  params,
}: OpportunityDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Oportunidade {id}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Detalhes da oportunidade comercial.
        </p>
      </div>
      <EmptyState
        title="Oportunidade não encontrada nos dados de demo"
        description="As informações de valor, estágio, atividades e propostas vinculadas serão exibidas após a execução do seed do ambiente de demonstração."
      />
    </div>
  );
}
