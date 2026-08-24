import { notFound } from "next/navigation";

import { getProduct } from "@/db/queries/products";
import { ProductDetail } from "@/features/products/product-detail";
import { auth } from "@/lib/auth/auth";
import { canViewMargin } from "@/lib/permissions/roles";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const product = await getProduct({
    organizationId: session.user.organizationId,
    role: session.user.role,
    productId: id,
  });
  if (!product) notFound();

  return (
    <ProductDetail
      product={product}
      showFinancials={canViewMargin(session.user.role)}
    />
  );
}
