import Stripe from "stripe";

import { env } from "@/lib/env";

/**
 * Server-only Stripe client. Never import this from client components — it
 * holds the secret key. The API version is pinned to the SDK's default.
 *
 * Construction is lazy: the underlying `Stripe` instance is created on first
 * use, not when this module is imported. This matters because `next build`
 * imports server modules to collect page data, and the container build has no
 * STRIPE_SECRET_KEY — eager construction would throw at build time. The
 * instance is cached on globalThis so hot reloads (dev) don't leak connections.
 */
const globalForStripe = globalThis as unknown as { stripe?: Stripe };

function getStripe(): Stripe {
  return (globalForStripe.stripe ??= new Stripe(env.STRIPE_SECRET_KEY, {
    typescript: true,
  }));
}

// Transparent lazy proxy: call sites keep using `stripe.checkout…`,
// `stripe.webhooks…` etc.; the real client is materialized on first access.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = getStripe();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
