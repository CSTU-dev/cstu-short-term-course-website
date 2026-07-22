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
    // Staging safety net: comma-separated allowlist of recipients that may
    // receive real mail. Entries are either a full address (alice@x.com) or a
    // domain (@cstu.edu). When set, all other recipients are dropped (logged,
    // not sent). Leave UNSET in production so real users get their mail.
    EMAIL_ALLOWLIST: z.string().optional(),
    // Stripe — server-side secret key + webhook signing secret (whsec_…).
    // The webhook secret is optional so the app still boots before `stripe
    // listen` hands one out; the /webhook/stripe route rejects calls until set.
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .optional(),
    // Shared secret for authenticated cron endpoints (e.g. Cloud Scheduler →
    // /api/cron/*). When unset those routes refuse to run (fail closed).
    CRON_SECRET: z.string().min(1).optional(),
  },
  client: {
    // Base URL used to build absolute referral links / QR codes.
    NEXT_PUBLIC_BASE_URL: z.url().default("http://localhost:3000"),
    // Stripe publishable key. Unused by the redirect-based Checkout flow, kept
    // for a future client-side Stripe.js integration (Elements etc.).
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
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
    EMAIL_ALLOWLIST: process.env.EMAIL_ALLOWLIST,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    LOG_LEVEL: process.env.LOG_LEVEL,
    CRON_SECRET: process.env.CRON_SECRET,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
