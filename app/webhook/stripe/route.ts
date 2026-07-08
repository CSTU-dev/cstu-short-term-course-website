import type Stripe from "stripe";
import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { recordPayment } from "@/lib/payments/enrollment-state";
import { stripe } from "@/lib/payments/stripe";

const log = createLogger("stripe-webhook");

// Stripe signature verification uses Node crypto; force the Node runtime.
export const runtime = "nodejs";

/**
 * Stripe webhook. This is the authoritative path that marks an enrollment PAID
 * — not the browser redirect, which may never arrive. The raw request body is
 * required for signature verification, so we read it as text before parsing.
 * Payment recording is idempotent per (provider, externalId).
 */
export async function POST(req: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    log.error("STRIPE_WEBHOOK_SECRET is not set; cannot verify webhook");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    log.warn({ err: error }, "signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const enrollmentId =
      session.metadata?.enrollmentId ?? session.client_reference_id ?? null;

    // Only act once Stripe reports the money actually landed.
    if (session.payment_status === "paid" && enrollmentId) {
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? session.id);
      try {
        await recordPayment({
          enrollmentId,
          provider: "stripe",
          externalId: paymentIntentId,
          amount:
            session.amount_total != null
              ? session.amount_total / 100
              : undefined,
          actorId: null,
        });
      } catch (error) {
        // Return 500 so Stripe retries the delivery.
        log.error({ err: error, enrollmentId }, "recordPayment failed");
        return NextResponse.json({ error: "Processing failed" }, { status: 500 });
      }
    } else {
      log.warn(
        { sessionId: session.id, enrollmentId, status: session.payment_status },
        "checkout.session.completed ignored (unpaid or no enrollmentId)",
      );
    }
  }

  // Acknowledge everything else so Stripe stops retrying unhandled event types.
  return NextResponse.json({ received: true });
}
