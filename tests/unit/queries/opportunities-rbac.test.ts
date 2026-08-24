import { describe, expect, it } from "vitest";

import { filterOpportunitiesByAccess } from "@/db/queries/opportunities";

const opportunities = [
  { id: "opp-a", organizationId: "org-a", ownerId: "seller-a" },
  { id: "opp-b", organizationId: "org-a", ownerId: "seller-b" },
  { id: "opp-c", organizationId: "org-b", ownerId: "seller-a" },
  { id: "opp-d", organizationId: "org-a", ownerId: null },
];

describe("filterOpportunitiesByAccess", () => {
  it("limits sellers to their own opportunities in the organization", () => {
    const result = filterOpportunitiesByAccess(opportunities, {
      organizationId: "org-a",
      role: "seller",
      userId: "seller-a",
    });

    expect(result.map(({ id }) => id)).toEqual(["opp-a"]);
  });

  it.each(["admin", "manager"] as const)(
    "allows %s to see all opportunities in the organization",
    (role) => {
      const result = filterOpportunitiesByAccess(opportunities, {
        organizationId: "org-a",
        role,
        userId: "user-a",
      });

      expect(result.map(({ id }) => id)).toEqual(["opp-a", "opp-b", "opp-d"]);
    },
  );
});
