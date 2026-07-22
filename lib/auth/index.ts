import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/db";
import {
  ipFromHeaders,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/rate-limit";

import { authConfig } from "./config";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "./password";

// bcrypt caps at 72 bytes; validate here so an over-long password can't be used
// as a cheap DoS and matches the register-side policy (N5).
const CredentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(72),
});

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
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Node override of the Edge jwt callback (lib/auth/config.ts). In addition
     * to seeding the token at sign-in, this re-validates the token against the
     * DB on every request so authorization never trusts a stale token:
     *  - role is refreshed → promotions/demotions take effect within one request
     *  - sessionVersion is compared → bumping it (password change/reset,
     *    demotion) invalidates all outstanding tokens. Returning null signs the
     *    session out.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: typeof token.role }).role ?? "USER";
        token.sessionVersion =
          (user as { sessionVersion?: number }).sessionVersion ?? 0;
        return token;
      }
      const userId = token.id as string | undefined;
      if (!userId) return token;

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, sessionVersion: true },
      });
      // Account deleted, or all sessions revoked since this token was issued.
      if (!dbUser) return null;
      if ((token.sessionVersion ?? 0) !== dbUser.sessionVersion) return null;

      token.role = dbUser.role;
      return token;
    },
    async signIn({ user, account }) {
      // Google asserts email ownership, so a Google login counts as verified.
      // updateMany (not update) is a no-op when already verified or id absent.
      if (account?.provider === "google" && user?.id) {
        await prisma.user.updateMany({
          where: { id: user.id, emailVerified: null },
          data: { emailVerified: new Date() },
        });
      }
      return true;
    },
  },
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const parsed = CredentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Rate-limit the choke point every credential path funnels through
        // (this covers the native /api/auth/callback/credentials POST that the
        // loginWithCredentials server action's limiter can't see). Shares the
        // `login:ip:<ip>` bucket with the action. Fails open on limiter error.
        const ip = ipFromHeaders(request?.headers ?? new Headers());
        const limit = await rateLimit(`login:ip:${ip}`, RATE_LIMITS.login);
        if (!limit.ok) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // Constant-time-ish: always run one bcrypt compare so a missing account
        // and a wrong password cost the same (N4 timing oracle).
        const hash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
        const ok = await verifyPassword(password, hash);
        if (!user?.passwordHash || !ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
});
