import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/db";

import { authConfig } from "./config";
import { verifyPassword } from "./password";

/**
 * Full server-side auth (Node runtime): Prisma adapter for OAuth account
 * persistence + Credentials provider for email/password. JWT strategy means
 * Credentials works without DB-backed sessions.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // The adapter is typed against @prisma/client; our generated client is
  // structurally compatible.
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email =
          typeof credentials?.email === "string" ? credentials.email : null;
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : null;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
});
