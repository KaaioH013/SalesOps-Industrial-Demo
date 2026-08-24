export const SEED = 42;

export const DEMO_ORGANIZATION_ID = "org-demo-industrial";

export const DEMO_USER_IDS = {
  admin: "user-demo-admin",
  manager: "user-demo-manager",
  seller: "user-demo-seller",
} as const;

// Credenciais públicas exclusivas para o ambiente demonstrativo.
export const DEMO_PASSWORDS = {
  admin: "DemoAdmin!123",
  manager: "DemoManager!123",
  seller: "DemoSeller!123",
} as const;
