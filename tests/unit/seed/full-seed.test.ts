import { describe, expect, it } from "vitest";

import { FULL_SEED_VOLUMES, generateFullSeedData } from "../../../db/seed/full";

describe("generateFullSeedData", () => {
  it("gera os volumes completos e aproximadamente dois itens por pedido", () => {
    const data = generateFullSeedData();

    expect(data.territories).toHaveLength(FULL_SEED_VOLUMES.territories);
    expect(data.productFamilies).toHaveLength(FULL_SEED_VOLUMES.productFamilies);
    expect(data.products).toHaveLength(FULL_SEED_VOLUMES.products);
    expect(data.customers).toHaveLength(FULL_SEED_VOLUMES.customers);
    expect(data.contacts).toHaveLength(FULL_SEED_VOLUMES.contacts);
    expect(data.orders).toHaveLength(FULL_SEED_VOLUMES.orders);
    expect(data.orderItems).toHaveLength(FULL_SEED_VOLUMES.orderItems);
    expect(data.quotes).toHaveLength(FULL_SEED_VOLUMES.quotes);
    expect(data.quoteItems).toHaveLength(FULL_SEED_VOLUMES.quoteItems);
    expect(data.opportunities).toHaveLength(FULL_SEED_VOLUMES.opportunities);
    expect(data.activities).toHaveLength(FULL_SEED_VOLUMES.activities);
    expect(data.targets).toHaveLength(15);
  });

  it("é determinístico para a seed fixa 42", () => {
    expect(generateFullSeedData()).toEqual(generateFullSeedData());
  });

  it("respeita o limite de clientes usado no smoke de CI", () => {
    const data = generateFullSeedData({ maxCustomers: 10 });

    expect(data.customers).toHaveLength(10);
    expect(data.contacts).toHaveLength(18);
    expect(data.orders).toHaveLength(72);
    expect(data.orderItems).toHaveLength(144);
  });
});
