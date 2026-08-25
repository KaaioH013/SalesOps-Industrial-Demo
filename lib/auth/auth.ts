import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import { profiles } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { isDemoEmail } from "@/lib/security/demo-allowlist";
import { rateLimit } from "@/lib/security/rate-limit";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
});

const JWT_REVALIDATE_MS = 5 * 60 * 1000;

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8h — sessão curta para demo pública
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.toLowerCase().trim();

        // Demo pública: apenas contas seed — sem cadastro aberto
        if (!isDemoEmail(email)) {
          return null;
        }

        const perEmail = rateLimit(`login-email:${email}`, 10, 15 * 60 * 1000);
        if (!perEmail.ok) {
          return null;
        }

        const profile = await getDb().query.profiles.findFirst({
          where: eq(profiles.email, email),
        });

        if (
          !profile ||
          !(await verifyPassword(parsed.data.password, profile.passwordHash))
        ) {
          return null;
        }

        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          organizationId: profile.organizationId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id ?? "";
        token.email = user.email ?? "";
        token.name = user.name ?? "";
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.rv = Date.now();
        return token;
      }

      if (!token.id) {
        return token;
      }

      const stale =
        trigger === "update" ||
        !token.rv ||
        Date.now() - Number(token.rv) > JWT_REVALIDATE_MS;

      if (!stale) {
        return token;
      }

      const profile = await getDb().query.profiles.findFirst({
        columns: {
          role: true,
          organizationId: true,
          email: true,
          name: true,
        },
        where: eq(profiles.id, String(token.id)),
      });

      if (!profile) {
        return {
          ...token,
          role: undefined,
          organizationId: undefined,
          email: undefined,
          name: undefined,
          rv: Date.now(),
        };
      }

      token.role = profile.role;
      token.organizationId = profile.organizationId;
      token.email = profile.email;
      token.name = profile.name;
      token.rv = Date.now();
      return token;
    },
    session({ session, token }) {
      if (!token.role || !token.organizationId || !token.id) {
        return {
          ...session,
          user: undefined as unknown as typeof session.user,
          expires: new Date(0).toISOString(),
        };
      }

      session.user.id = String(token.id);
      session.user.email = String(token.email ?? "");
      session.user.name = String(token.name ?? "");
      session.user.role = token.role;
      session.user.organizationId = String(token.organizationId);

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
