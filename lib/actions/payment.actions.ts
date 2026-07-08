"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { canManageCourse } from "@/lib/auth/access";
import { COURSE_MODE_LABELS, type CourseModeValue } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { recordRefund } from "@/lib/payments/enrollment-state";
import { stripe } from "@/lib/payments/stripe";

import type { ActionResult } from "./course.actions";

const log = createLogger("payment-action");

/**
 * Start a Stripe Checkout Session for the user's PENDING enrollment and return
 * the hosted-checkout URL to redirect to. The enrollment is only marked PAID
 * once Stripe confirms via the webhook (POST /webhook/stripe) — never here,
 * never on the success redirect. The enrollmentId travels in the session
 * metadata so the webhook can find it.
 */
export async function createCheckoutSession(
  enrollmentId: string,
): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not signed in" };

  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, userId: session.user.id },
    include: { course: { select: { id: true, title: true } } },
  });
  if (!enrollment) return { ok: false, error: "Enrollment not found" };
  if (enrollment.status !== "PENDING") {
    return { ok: false, error: "This enrollment is already paid." };
  }

  // Charge the referral-discounted price; both amounts are snapshots on the
  // enrollment. Stripe expects the smallest currency unit (cents).
  const netPrice =
    Number(enrollment.listPrice) - Number(enrollment.discountAmount);
  const unitAmount = Math.round(netPrice * 100);
  if (unitAmount <= 0) {
    return { ok: false, error: "This enrollment has nothing to pay." };
  }

  const modeLabel = COURSE_MODE_LABELS[enrollment.mode as CourseModeValue];

  let checkout;
  try {
    checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: enrollment.id,
      // Mirror the id onto the PaymentIntent so it's on the object the webhook
      // ultimately reconciles against, too.
      payment_intent_data: { metadata: { enrollmentId: enrollment.id } },
      metadata: { enrollmentId: enrollment.id },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: enrollment.currency.toLowerCase(),
            unit_amount: unitAmount,
            product_data: {
              name: enrollment.course.title,
              description: `${modeLabel} enrollment`,
            },
          },
        },
      ],
      success_url: `${env.NEXT_PUBLIC_BASE_URL}/my/courses?success=1`,
      cancel_url: `${env.NEXT_PUBLIC_BASE_URL}/enroll?courseId=${enrollment.courseId}`,
    });
  } catch (error) {
    log.error({ err: error, enrollmentId }, "failed to create checkout session");
    return { ok: false, error: "Could not start checkout. Please try again." };
  }

  if (!checkout.url) {
    return { ok: false, error: "Could not start checkout. Please try again." };
  }
  log.info({ enrollmentId, sessionId: checkout.id }, "checkout session created");
  return { ok: true, url: checkout.url };
}

export async function recordManualRefund(
  enrollmentId: string,
  amount: number,
  reason: string,
): Promise<ActionResult> {
  const session = await auth();
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
  });
  if (!enrollment) return { ok: false, error: "Enrollment not found" };
  if (!(await canManageCourse(session, enrollment.courseId))) {
    return { ok: false, error: "Not authorized" };
  }

  try {
    await recordRefund({
      enrollmentId,
      amount,
      reason,
      operatorId: session!.user.id,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "EXCEEDS") {
      return { ok: false, error: "Refund exceeds the amount paid." };
    }
    if (msg === "INVALID_AMOUNT") {
      return { ok: false, error: "Enter a refund amount greater than zero." };
    }
    throw error;
  }

  revalidatePath(`/admin/courses/${enrollment.courseId}`);
  revalidatePath(`/superAdmin/courses/${enrollment.courseId}`);
  return { ok: true };
}
