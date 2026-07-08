import Stripe from "stripe";

import { env } from "@/lib/env";

/**
 * Server-only Stripe client. Reused across hot reloads in development so we
 * don't leak connections. Never import this from client components — it holds
 * the secret key. The API version is pinned to the SDK's default.
 */
const globalForStripe = globalThis as unknown as { stripe?: Stripe };

export const stripe =
  globalForStripe.stripe ??
  new Stripe(env.STRIPE_SECRET_KEY, {
    typescript: true,
  });

if (env.NODE_ENV !== "production") {
  globalForStripe.stripe = stripe;
}
