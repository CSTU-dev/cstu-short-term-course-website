import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Startup-time environment validation. Importing `env` anywhere guarantees the
 * referenced variables exist and are well-formed, failing fast otherwise.
 * Set SKIP_ENV_VALIDATION=1 to bypass (e.g. during `next build` in CI).
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.url(),
    // NextAuth (Auth.js) — required so sessions are signed consistently.
    AUTH_SECRET: z.string().min(1),
    AUTH_URL: z.url().optional(),
    // Google SSO — optional until OAuth credentials are provisioned.
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    // Cold-start superAdmin seed — only required when running the seed script.
    SUPERADMIN_EMAIL: z.email().optional(),
    SUPERADMIN_PASSWORD: z.string().min(8).optional(),
    // Outbound email (admin invites) — optional in dev.
    SMTP_URL: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .optional(),
  },
  client: {
    // Base URL used to build absolute referral links / QR codes.
    NEXT_PUBLIC_BASE_URL: z.url().default("http://localhost:3000"),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL,
    SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD,
    SMTP_URL: process.env.SMTP_URL,
    EMAIL_FROM: process.env.EMAIL_FROM,
    LOG_LEVEL: process.env.LOG_LEVEL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
