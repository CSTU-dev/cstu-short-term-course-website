"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { canManageCourse } from "@/lib/auth/access";
import { prisma } from "@/lib/db";
import { recordPayment, recordRefund } from "@/lib/payments/enrollment-state";

import type { ActionResult } from "./course.actions";

/**
 * Stub for third-party payment success. Real integration will move this to a
 * provider redirect + webhook (see /api/webhooks/payment), reusing recordPayment.
 */
export async function completeStubPayment(
  enrollmentId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not signed in" };

  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, userId: session.user.id },
  });
  if (!enrollment) return { ok: false, error: "Enrollment not found" };
  if (enrollment.status !== "PENDING") {
    return { ok: false, error: "This enrollment is already paid." };
  }

  await recordPayment({
    enrollmentId,
    provider: "stub",
    actorId: session.user.id,
  });
  revalidatePath("/my/courses");
  return { ok: true };
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
