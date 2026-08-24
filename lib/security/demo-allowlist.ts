/** Contas demo permitidas em ambiente público. Sem cadastro aberto. */
export const DEMO_ALLOWLIST = [
  "admin@demo.local",
  "manager@demo.local",
  "seller@demo.local",
] as const;

export type DemoEmail = (typeof DEMO_ALLOWLIST)[number];

export const DEMO_CREDENTIALS: Array<{
  email: DemoEmail;
  password: string;
  role: string;
  label: string;
}> = [
  {
    email: "admin@demo.local",
    password: "DemoAdmin!123",
    role: "Admin",
    label: "Acesso completo (recomendado para o tour)",
  },
  {
    email: "manager@demo.local",
    password: "DemoManager!123",
    role: "Manager",
    label: "Gestão comercial sem admin",
  },
  {
    email: "seller@demo.local",
    password: "DemoSeller!123",
    role: "Seller",
    label: "Carteira restrita (sem custo/margem)",
  },
];

export function isDemoEmail(email: string): boolean {
  return (DEMO_ALLOWLIST as readonly string[]).includes(email.toLowerCase());
}

/** Em produção o seletor de perfil demo fica desligado por padrão. */
export function isDemoProfileSwitcherEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return process.env.DEMO_PROFILE_SWITCHER === "true";
  }
  return process.env.DEMO_PROFILE_SWITCHER !== "false";
}
