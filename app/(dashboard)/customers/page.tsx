import { Suspense } from "react";

import { CustomerTable } from "@/features/customers/customer-table";
import { listCustomers } from "@/db/queries/customers";
import { auth } from "@/lib/auth/auth";
import { canViewMargin } from "@/lib/permissions/roles";

type CustomersPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
};

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user) {
    return null;
  }

  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const role = session.user.role;

  const result = await listCustomers({
    organizationId: session.user.organizationId,
    role,
    userId: session.user.id,
    q: query || undefined,
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
        <p className="mt-1 text-sm text-slate-600">
          Carteira de clientes e contas estratégicas.
        </p>
      </div>
      <Suspense fallback={null}>
        <CustomerTable
          page={result.page}
          pageSize={result.pageSize}
          query={query}
          rows={result.data}
          showMargin={canViewMargin(role)}
          total={result.total}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  );
}
