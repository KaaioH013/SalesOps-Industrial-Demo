import type { DefaultSession } from "next-auth";

import type { Role } from "@/lib/permissions/roles";

declare module "next-auth" {
  interface User {
    role: Role;
    organizationId: string;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      organizationId: string;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: Role;
    organizationId: string;
  }
}
