import type { ProfileRole } from "../schema";
import { hashPassword } from "../../lib/auth/password";
import {
  DEMO_ORGANIZATION_ID,
  DEMO_PASSWORDS,
  DEMO_USER_IDS,
} from "./constants";

const demoUsers = [
  {
    id: DEMO_USER_IDS.admin,
    organizationId: DEMO_ORGANIZATION_ID,
    email: "admin@demo.local",
    name: "Ana Administradora",
    title: "Diretora Comercial",
    role: "admin",
    password: DEMO_PASSWORDS.admin,
  },
  {
    id: DEMO_USER_IDS.manager,
    organizationId: DEMO_ORGANIZATION_ID,
    email: "manager@demo.local",
    name: "Marcos Gerente",
    title: "Gerente Nacional de Vendas",
    role: "manager",
    password: DEMO_PASSWORDS.manager,
  },
  {
    id: DEMO_USER_IDS.seller,
    organizationId: DEMO_ORGANIZATION_ID,
    email: "seller@demo.local",
    name: "Sofia Vendedora",
    title: "Executiva de Contas",
    role: "seller",
    password: DEMO_PASSWORDS.seller,
  },
] satisfies ReadonlyArray<{
  id: string;
  organizationId: string;
  email: string;
  name: string;
  title: string;
  role: ProfileRole;
  password: string;
}>;

export async function createDemoUsers() {
  return Promise.all(
    demoUsers.map(async ({ password, ...user }) => ({
      ...user,
      passwordHash: await hashPassword(password),
    })),
  );
}
