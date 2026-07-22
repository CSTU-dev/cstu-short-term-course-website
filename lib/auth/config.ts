import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import type { RoleValue } from "@/lib/constants";

/**
 * Edge-safe base config: no Prisma, no Credentials.authorize (which needs the
 * DB). Used by `middleware.ts` to read/decode the JWT. The full config in
 * `lib/auth/index.ts` extends this with the Prisma adapter + Credentials.
 *
 * Google is only enabled when OAuth credentials are present, so an unconfigured
 * dev environment doesn't surface a broken "Sign in with Google" button.
 */
const providers: NextAuthConfig["providers"] = [];
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google);
}

export const authConfig = {
  // Required for self-hosting behind a reverse proxy (VPS); harmless in dev.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    jwt({ token, user }) {
      // Sign-in: seed the token from the DB user. On the Edge (middleware) this
      // is the only jwt logic; the Node config in lib/auth/index.ts overrides
      // this callback to additionally re-validate the token against the DB on
      // every request (role refresh + sessionVersion revocation).
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: RoleValue }).role ?? "USER";
        token.sessionVersion =
          (user as { sessionVersion?: number }).sessionVersion ?? 0;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as RoleValue;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
