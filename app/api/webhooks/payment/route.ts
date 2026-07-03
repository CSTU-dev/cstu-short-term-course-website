import { NextResponse } from "next/server";

import { recordPayment } from "@/lib/payments/enrollment-state";
import { createLogger } from "@/lib/logger";

const log = createLogger("payment-webhook");

/**
 * Reserved integration point for a real payment provider (e.g. Stripe). A
 * production version would verify the signature before trusting the payload.
 * Payment recording is idempotent per (provider, externalId).
 */
export async function POST(req: Request) {
  let body: {
    enrollmentId?: string;
    externalId?: string;
    provider?: string;
    amount?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!body.enrollmentId) {
    return NextResponse.json({ error: "Missing enrollmentId" }, { status: 400 });
  }

  try {
    const result = await recordPayment({
      enrollmentId: body.enrollmentId,
      provider: body.provider ?? "webhook",
      externalId: body.externalId,
      amount: body.amount,
      actorId: null,
    });
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    log.error({ err: error }, "payment webhook failed");
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
