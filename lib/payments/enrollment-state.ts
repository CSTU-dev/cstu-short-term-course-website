import { writeAudit } from "@/lib/audit";
import { DEFAULT_COMMISSION_RATE } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";

const log = createLogger("enrollment-state");

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Derive the enrollment status from money. Money is truth, status is derived. */
export function deriveStatus(
  amountPaid: number,
  amountRefunded: number,
): "PENDING" | "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED" {
  if (amountPaid <= 0) return "PENDING";
  if (amountRefunded >= amountPaid) return "REFUNDED";
  if (amountRefunded > 0) return "PARTIALLY_REFUNDED";
  return "PAID";
}

/**
 * Record a successful payment. Idempotent per (provider, externalId). On the
 * first transition to PAID with a referral, creates the commission and bumps
 * the referrer's conversion/commission stats — all in one transaction.
 */
export async function recordPayment(params: {
  enrollmentId: string;
  provider: string;
  amount?: number;
  /** ISO currency reported by the provider, for cross-checking (N8). */
  currency?: string;
  externalId?: string;
  actorId?: string | null;
}) {
  const externalId = params.externalId ?? `${params.provider}_${params.enrollmentId}`;

  return prisma.$transaction(async (tx) => {
    const e = await tx.enrollment.findUnique({
      where: { id: params.enrollmentId },
    });
    if (!e) throw new Error("Enrollment not found");

    const existing = await tx.transaction.findFirst({
      where: { provider: params.provider, externalId },
    });
    if (existing && existing.status === "SUCCEEDED") {
      return { alreadyProcessed: true as const };
    }

    const netPrice = round2(Number(e.listPrice) - Number(e.discountAmount));
    const amount = params.amount ?? netPrice;
    const wasPaid = Number(e.amountPaid) > 0;
    const newPaid = round2(Number(e.amountPaid) + amount);
    const status = deriveStatus(newPaid, Number(e.amountRefunded));

    // ---- Reconciliation guards (P6/P7/N8) --------------------------------
    // The money already moved by the time this webhook fires, so we never
    // reject — we record faithfully but flag anomalies loudly for ops. Checkout
    // is server-priced (P3), so any of these signals a bug or tampering.
    const anomalies: string[] = [];
    if (
      params.currency &&
      params.currency.toUpperCase() !== e.currency.toUpperCase()
    ) {
      anomalies.push(
        `currency mismatch: got ${params.currency}, expected ${e.currency}`,
      );
    }
    // Expect the paid amount to match the outstanding net price (± 1 cent).
    if (params.amount != null && Math.abs(amount - netPrice) > 0.01) {
      anomalies.push(
        `amount mismatch: got ${amount}, expected ${netPrice}`,
      );
    }
    // A second successful payment on an already-paid enrollment → likely a
    // duplicate Checkout Session. Recorded truthfully (amountPaid reflects the
    // real charge; commission is not double-counted below), but must be
    // refunded manually in Stripe.
    if (wasPaid) {
      anomalies.push("duplicate payment on an already-paid enrollment");
    }
    if (anomalies.length > 0) {
      log.error(
        { enrollmentId: e.id, externalId, amount, anomalies },
        "payment anomaly — records written, ops action required",
      );
      await writeAudit({
        action: "PAYMENT_ANOMALY",
        entityType: "Enrollment",
        entityId: e.id,
        after: { externalId, amount, currency: params.currency, anomalies },
        actorId: params.actorId ?? null,
        client: tx,
      });
    }

    await tx.transaction.create({
      data: {
        enrollmentId: e.id,
        type: "PAYMENT",
        status: "SUCCEEDED",
        amount,
        currency: e.currency,
        provider: params.provider,
        externalId,
      },
    });
    await tx.enrollment.update({
      where: { id: e.id },
      data: { amountPaid: newPaid, status },
    });

    // First payment reaching PAID + a referral => commission.
    if (!wasPaid && status === "PAID" && e.referralCodeId) {
      const referral = await tx.referralCode.findUnique({
        where: { id: e.referralCodeId },
      });
      if (referral && referral.userId !== e.userId) {
        const course = await tx.course.findUnique({
          where: { id: e.courseId },
          select: { endAt: true },
        });
        const gross = round2(newPaid * DEFAULT_COMMISSION_RATE);
        await tx.commission.create({
          data: {
            enrollmentId: e.id,
            beneficiaryId: referral.userId,
            referralCodeId: referral.id,
            courseId: e.courseId,
            status: "EARNED",
            rate: DEFAULT_COMMISSION_RATE,
            baseAmount: newPaid,
            grossAmount: gross,
            netAmount: gross,
            withdrawableAt: course?.endAt ?? null,
          },
        });
        await tx.referralCourseStat.upsert({
          where: {
            userId_courseId: { userId: referral.userId, courseId: e.courseId },
          },
          create: {
            userId: referral.userId,
            courseId: e.courseId,
            conversions: 1,
            commissionTotal: gross,
          },
          update: {
            conversions: { increment: 1 },
            commissionTotal: { increment: gross },
          },
        });
        await tx.referralEvent.create({
          data: {
            referralCodeId: referral.id,
            courseId: e.courseId,
            type: "CONVERSION",
            enrollmentId: e.id,
          },
        });
      }
    }

    await writeAudit({
      action: "PAYMENT_RECORDED",
      entityType: "Enrollment",
      entityId: e.id,
      after: { amountPaid: newPaid, status },
      actorId: params.actorId ?? null,
      client: tx,
    });
    log.info({ enrollmentId: e.id, status }, "payment recorded");
    return { status };
  });
}

/**
 * Record a (manual) refund and proportionally claw back any commission. Fully
 * withdrawn commissions are not reversed.
 */
export async function recordRefund(params: {
  enrollmentId: string;
  amount: number;
  reason?: string;
  operatorId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const e = await tx.enrollment.findUnique({
      where: { id: params.enrollmentId },
      include: { commission: true },
    });
    if (!e) throw new Error("NOT_FOUND");

    const paid = Number(e.amountPaid);
    const refundedBefore = Number(e.amountRefunded);
    const amount = round2(params.amount);
    if (amount <= 0) throw new Error("INVALID_AMOUNT");
    if (refundedBefore + amount > paid + 0.001) throw new Error("EXCEEDS");

    const refund = await tx.refund.create({
      data: {
        enrollmentId: e.id,
        amount,
        currency: e.currency,
        reason: params.reason ?? null,
        operatorId: params.operatorId,
      },
    });
    await tx.transaction.create({
      data: {
        enrollmentId: e.id,
        type: "REFUND",
        status: "SUCCEEDED",
        amount,
        currency: e.currency,
        provider: "manual",
        externalId: `refund_${refund.id}`,
      },
    });

    const newRefunded = round2(refundedBefore + amount);
    const status = deriveStatus(paid, newRefunded);
    await tx.enrollment.update({
      where: { id: e.id },
      data: { amountRefunded: newRefunded, status },
    });

    // Proportional commission reversal.
    if (e.commission && e.commission.status !== "WITHDRAWN" && paid > 0) {
      const ratio = amount / paid;
      const gross = Number(e.commission.grossAmount);
      const reverseAmount = round2(gross * ratio);
      const newReversed = round2(
        Number(e.commission.reversedAmount) + reverseAmount,
      );
      const newNet = round2(gross - newReversed);
      await tx.commission.update({
        where: { id: e.commission.id },
        data: {
          reversedAmount: newReversed,
          netAmount: Math.max(0, newNet),
          status: newNet <= 0 ? "REVERSED" : "ADJUSTED",
        },
      });
      await tx.referralCourseStat.updateMany({
        where: { userId: e.commission.beneficiaryId, courseId: e.courseId },
        data: { commissionTotal: { decrement: reverseAmount } },
      });
      await writeAudit({
        action: "COMMISSION_REVERSED",
        entityType: "Commission",
        entityId: e.commission.id,
        after: { reverseAmount, netAmount: Math.max(0, newNet) },
        actorId: params.operatorId,
        client: tx,
      });
    }

    await writeAudit({
      action: "REFUND_RECORDED",
      entityType: "Enrollment",
      entityId: e.id,
      after: { amount, status },
      actorId: params.operatorId,
      client: tx,
    });
    log.info({ enrollmentId: e.id, amount, status }, "refund recorded");
    return { status };
  });
}
