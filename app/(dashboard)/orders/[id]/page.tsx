import { notFound } from "next/navigation";

import { getOrder } from "@/db/queries/orders";
import { OrderDetail } from "@/features/orders/order-detail";
import { auth } from "@/lib/auth/auth";
import { canViewMargin } from "@/lib/permissions/roles";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const order = await getOrder({
    organizationId: session.user.organizationId,
    role: session.user.role,
    userId: session.user.id,
    orderId: id,
  });
  if (!order) notFound();

  return (
    <OrderDetail
      order={order}
      showFinancials={canViewMargin(session.user.role)}
    />
  );
}
