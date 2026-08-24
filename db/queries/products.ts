import { and, asc, count, eq, like, or, type SQL } from "drizzle-orm";

import { grossMargin } from "@/lib/analytics/margin";

import { getDb } from "../client";
import { productFamilies, products } from "../schema";
import type { ProductStatus, ProfileRole } from "../schema/enums";

export type ProductListRow = {
  id: string;
  sku: string;
  description: string;
  application: string | null;
  family: { id: string; name: string };
  listPriceCents: number;
  standardCostCents: number | null;
  grossMarginBps: number | null;
  stockQuantity: number;
  leadTimeDays: number;
  status: ProductStatus;
};

export function presentProductFinancials(
  product: { listPriceCents: number; standardCostCents: number },
  role: ProfileRole,
) {
  if (role === "seller") {
    return { standardCostCents: null, grossMarginBps: null };
  }

  const margin = grossMargin(product.listPriceCents, product.standardCostCents);
  return {
    standardCostCents: product.standardCostCents,
    grossMarginBps: margin == null ? null : Math.round(margin * 10_000),
  };
}

type ProductQueryParams = {
  organizationId: string;
  role: ProfileRole;
  familyId?: string;
  application?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function listProducts(params: ProductQueryParams) {
  const db = getDb();
  const page = Math.max(1, Math.trunc(params.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.trunc(params.pageSize ?? 25)));
  const conditions: SQL[] = [eq(products.organizationId, params.organizationId)];

  if (params.familyId) conditions.push(eq(products.familyId, params.familyId));
  if (params.application)
    conditions.push(eq(products.application, params.application));
  if (params.q?.trim()) {
    const pattern = `%${params.q.trim()}%`;
    conditions.push(
      or(like(products.sku, pattern), like(products.description, pattern))!,
    );
  }

  const where = and(...conditions)!;
  const [rows, totalRows] = await Promise.all([
    db
      .select({
        product: products,
        family: { id: productFamilies.id, name: productFamilies.name },
      })
      .from(products)
      .innerJoin(productFamilies, eq(products.familyId, productFamilies.id))
      .where(where)
      .orderBy(asc(products.description), asc(products.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(products).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;

  return {
    data: rows.map(({ product, family }) => ({
      id: product.id,
      sku: product.sku,
      description: product.description,
      application: product.application,
      family,
      listPriceCents: product.listPriceCents,
      ...presentProductFinancials(product, params.role),
      stockQuantity: product.stockQuantity,
      leadTimeDays: product.leadTimeDays,
      status: product.status,
    })) satisfies ProductListRow[],
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getProduct(
  params: Pick<ProductQueryParams, "organizationId" | "role"> & {
    productId: string;
  },
) {
  const db = getDb();
  const rows = await db
    .select({
      product: products,
      family: productFamilies,
    })
    .from(products)
    .innerJoin(productFamilies, eq(products.familyId, productFamilies.id))
    .where(
      and(
        eq(products.organizationId, params.organizationId),
        eq(products.id, params.productId),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  return {
    ...row.product,
    family: row.family,
    ...presentProductFinancials(row.product, params.role),
  };
}

export async function getProductFilterOptions(organizationId: string) {
  const db = getDb();
  const [families, applicationRows] = await Promise.all([
    db
      .select({ id: productFamilies.id, name: productFamilies.name })
      .from(productFamilies)
      .where(eq(productFamilies.organizationId, organizationId))
      .orderBy(asc(productFamilies.name)),
    db
      .select({ application: products.application })
      .from(products)
      .where(eq(products.organizationId, organizationId))
      .orderBy(asc(products.application)),
  ]);

  return {
    families,
    applications: [
      ...new Set(
        applicationRows
          .map((row) => row.application)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
  };
}
