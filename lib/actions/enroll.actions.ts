"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { REFERRAL_DISCOUNT_RATE, ROLE } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { resolveReferralCode } from "@/lib/referral/service";
import { EnrollSchema, type EnrollInput } from "@/lib/validations/user";

import type { ActionResult } from "./course.actions";

const log = createLogger("enroll-action");

/**
 * Create or update the user's PENDING enrollment for a course, snapshotting the
 * contact details entered on the enroll page (kept separate from the profile).
 * Payment itself is stubbed until P8.
 */
export async function saveEnrollment(
  input: EnrollInput,
): Promise<ActionResult<{ enrollmentId: string }>> {
  const session = await auth();
  if (session?.user?.role !== ROLE.USER) {
    return { ok: false, error: "Sign in as a student to enroll." };
  }

  const parsed = EnrollSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  const course = await prisma.course.findFirst({
    where: { id: d.courseId, enabled: true },
  });
  if (!course) return { ok: false, error: "Course not available." };

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
  });
  if (existing && existing.status !== "PENDING") {
    return { ok: false, error: "You are already enrolled in this course." };
  }

  // Apply a referral code if present, valid, and not the buyer's own.
  let referralCodeId: string | null = null;
  let discountAmount = 0;
  if (d.ref) {
    const referral = await resolveReferralCode(d.ref);
    if (referral && referral.userId !== session.user.id) {
      referralCodeId = referral.id;
      discountAmount =
        Math.round(Number(course.priceAmount) * REFERRAL_DISCOUNT_RATE * 100) /
        100;
    }
  }

  const snapshot = {
    snapshotName: d.snapshotName || null,
    snapshotPhone: d.snapshotPhone || null,
    snapshotWechat: d.snapshotWechat || null,
    snapshotEmail: d.snapshotEmail || null,
    note: d.note || null,
    listPrice: course.priceAmount,
    discountAmount,
    currency: course.currency,
    referralCodeId,
  };

  const enrollment = existing
    ? await prisma.enrollment.update({ where: { id: existing.id }, data: snapshot })
    : await prisma.enrollment.create({
        data: {
          ...snapshot,
          userId: session.user.id,
          courseId: course.id,
          status: "PENDING",
        },
      });

  await writeAudit({
    action: "ENROLLMENT_CREATE",
    entityType: "Enrollment",
    entityId: enrollment.id,
    after: { courseId: course.id },
    actorId: session.user.id,
  });
  log.info({ enrollmentId: enrollment.id }, "enrollment saved (pending)");
  revalidatePath("/my/courses");
  return { ok: true, enrollmentId: enrollment.id };
}
