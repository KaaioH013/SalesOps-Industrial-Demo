import { EmptyState } from "@/components/ui/empty-state";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Cliente {id}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Visão 360° do cliente selecionado.
        </p>
      </div>
      <EmptyState
        title="Detalhes do cliente indisponíveis"
        description="Os dados de contatos, oportunidades e histórico comercial serão carregados após a execução do seed do ambiente de demonstração."
      />
    </div>
  );
}
