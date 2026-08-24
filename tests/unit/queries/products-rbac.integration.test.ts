import { migrate } from "drizzle-orm/libsql/migrator";
import { beforeAll, describe, expect, it } from "vitest";

import { getDb } from "@/db/client";
import { organizations, productFamilies, products } from "@/db/schema";
import { listProducts } from "@/db/queries/products";

const organizationId = "org-products-rbac-test";

describe("listProducts RBAC", () => {
  beforeAll(async () => {
    process.env.TURSO_DATABASE_URL = "file::memory:";

    const db = getDb();
    await migrate(db, { migrationsFolder: "./db/migrations" });
    await db.insert(organizations).values({
      id: organizationId,
      name: "Organização de teste",
    });
    await db.insert(productFamilies).values({
      id: "family-products-rbac-test",
      organizationId,
      name: "Família de teste",
    });
    await db.insert(products).values({
      id: "product-products-rbac-test",
      organizationId,
      familyId: "family-products-rbac-test",
      sku: "RBAC-001",
      description: "Produto protegido",
      listPriceCents: 100_000,
      standardCostCents: 60_000,
    });
  });

  it("não retorna custo ou margem na consulta feita por vendedor", async () => {
    const result = await listProducts({
      organizationId,
      role: "seller",
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      standardCostCents: null,
      grossMarginBps: null,
    });
  });
});
