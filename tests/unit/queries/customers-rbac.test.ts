import { describe, expect, it } from "vitest";

import { filterCustomersByAccess } from "@/db/queries/customers";

const customers = [
  { id: "customer-a", organizationId: "org-a", sellerId: "seller-a" },
  { id: "customer-b", organizationId: "org-a", sellerId: "seller-b" },
  { id: "customer-c", organizationId: "org-b", sellerId: "seller-a" },
  { id: "customer-d", organizationId: "org-a", sellerId: null },
];

describe("filterCustomersByAccess", () => {
  it("limits sellers to customers assigned to them in their organization", () => {
    const result = filterCustomersByAccess(customers, {
      organizationId: "org-a",
      role: "seller",
      userId: "seller-a",
    });

    expect(result.map(({ id }) => id)).toEqual(["customer-a"]);
  });

  it.each(["admin", "manager"] as const)(
    "allows %s to see every customer in the organization",
    (role) => {
      const result = filterCustomersByAccess(customers, {
        organizationId: "org-a",
        role,
        userId: "user-a",
      });

      expect(result.map(({ id }) => id)).toEqual([
        "customer-a",
        "customer-b",
        "customer-d",
      ]);
    },
  );
});
