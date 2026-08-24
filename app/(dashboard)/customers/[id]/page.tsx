import { notFound } from "next/navigation";

import { getCustomer360 } from "@/db/queries/customers";
import { CustomerDetail } from "@/features/customers/customer-detail";
import { auth } from "@/lib/auth/auth";
import { canViewMargin } from "@/lib/permissions/roles";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const { id } = await params;

  const customer = await getCustomer360({
    organizationId: session.user.organizationId,
    role: session.user.role,
    userId: session.user.id,
    customerId: id,
  });

  if (!customer) {
    notFound();
  }

  return (
    <CustomerDetail
      customer={customer}
      showMargin={canViewMargin(session.user.role)}
    />
  );
}
