export type Role = "admin" | "manager" | "seller";

export function canViewMargin(role: Role): boolean {
  return role !== "seller";
}

export function canEditOpportunity(role: Role): boolean {
  return role === "admin" || role === "manager";
}

export function requireRole(role: Role, allowed: Role[]): void {
  if (!allowed.includes(role)) {
    throw new Error("Insufficient permissions");
  }
}
