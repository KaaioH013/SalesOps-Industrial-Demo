import { describe, expect, it } from "vitest";

import {
  canEditOpportunity,
  canViewMargin,
  requireRole,
  type Role,
} from "@/lib/permissions/roles";

const roles: Role[] = ["admin", "manager", "seller"];

describe("canViewMargin", () => {
  it.each([
    ["admin", true],
    ["manager", true],
    ["seller", false],
  ] satisfies [Role, boolean][])("returns %s for %s", (role, expected) => {
    expect(canViewMargin(role)).toBe(expected);
  });
});

describe("canEditOpportunity", () => {
  it.each([
    ["admin", true],
    ["manager", true],
    ["seller", false],
  ] satisfies [Role, boolean][])("returns %s for %s", (role, expected) => {
    expect(canEditOpportunity(role)).toBe(expected);
  });
});

describe("requireRole", () => {
  it.each(roles)("does not throw when %s is allowed", (role) => {
    expect(() => requireRole(role, [role])).not.toThrow();
  });

  it("throws when the role is not allowed", () => {
    expect(() => requireRole("seller", ["admin", "manager"])).toThrow(
      "Insufficient permissions",
    );
  });
});
