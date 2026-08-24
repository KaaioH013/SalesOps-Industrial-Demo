import { EmptyState } from "@/components/ui/empty-state";

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Pedidos</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pedidos confirmados e acompanhamento de entrega.
        </p>
      </div>
      <EmptyState
        title="Nenhum pedido registrado"
        description="Os pedidos comerciais aparecerão aqui após a execução do seed do ambiente de demonstração."
      />
    </div>
  );
}
