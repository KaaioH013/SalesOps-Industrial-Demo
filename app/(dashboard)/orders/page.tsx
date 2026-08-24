import { listOrders } from "@/db/queries/orders";
import { OrderTable } from "@/features/orders/order-table";
import { auth } from "@/lib/auth/auth";
import { canViewMargin } from "@/lib/permissions/roles";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (!session?.user) return null;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const result = await listOrders({
    organizationId: session.user.organizationId,
    role: session.user.role,
    userId: session.user.id,
    page,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Pedidos</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pedidos confirmados e acompanhamento de entrega.
        </p>
      </div>
      <OrderTable
        page={result.page}
        rows={result.data}
        showFinancials={canViewMargin(session.user.role)}
        total={result.total}
        totalPages={result.totalPages}
      />
    </div>
  );
}
