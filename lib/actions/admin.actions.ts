"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/auth/access";
import { writeAudit } from "@/lib/audit";
import { ROLE } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { adminInviteEmail } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { rateLimit, RATE_LIMITS, retryAfterMessage } from "@/lib/rate-limit";
import { hashToken } from "@/lib/tokens";

import type { ActionResult } from "./course.actions";

const log = createLogger("admin-action");

const INVITE_TTL_DAYS = 7;

/**
 * Assign an admin to a course by email.
 *
 * Promotion requires proof the target controls the email (N1). A direct promote
 * + assignment happens ONLY for an existing account whose email is already
 * verified. In every other case — no account yet, or an account whose email is
 * unverified — an email-bound AdminInvite is created and emailed; acceptance
 * (`acceptAdminInvite`) additionally requires a verified email, so an unverified
 * account still can't gain ADMIN without proving control first.
 */
export async function assignAdmin(
  courseId: string,
  rawEmail: string,
): Promise<ActionResult<{ message: string }>> {
  const session = await auth();
  if (!isSuperAdmin(session)) return { ok: false, error: "Not authorized" };

  const email = rawEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email address" };
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { ok: false, error: "Course not found" };

  const user = await prisma.user.findUnique({ where: { email } });

  // Existing, email-verified account: control is proven, so assign directly.
  if (user?.emailVerified) {
    const existing = await prisma.courseAssignment.findUnique({
      where: { courseId_adminId: { courseId, adminId: user.id } },
    });
    if (existing) {
      return { ok: false, error: "That admin is already assigned to this course" };
    }

    await prisma.$transaction(async (tx) => {
      if (user.role === ROLE.USER) {
        await tx.user.update({ where: { id: user.id }, data: { role: ROLE.ADMIN } });
        await writeAudit({
          action: "ROLE_CHANGE",
          entityType: "User",
          entityId: user.id,
          before: { role: user.role },
          after: { role: ROLE.ADMIN },
          actorId: session!.user.id,
          client: tx,
        });
      }
      await tx.courseAssignment.create({ data: { courseId, adminId: user.id } });
      await writeAudit({
        action: "COURSE_ADMIN_ASSIGN",
        entityType: "Course",
        entityId: courseId,
        after: { adminId: user.id, email },
        actorId: session!.user.id,
        client: tx,
      });
    });

    log.info({ courseId, adminId: user.id }, "admin assigned");
    revalidatePath(`/superAdmin/courses/${courseId}`);
    return { ok: true, message: `${email} is now an admin for this course.` };
  }

  // No account, or an unverified account → invite flow. Throttle per target
  // email so a repeated submit can't flood one inbox with invitation emails.
  const limit = await rateLimit(`admin-invite:email:${email}`, RATE_LIMITS.adminInvite);
  if (!limit.ok) {
    return {
      ok: false,
      error: `Too many invites sent to ${email}. Try again in ${retryAfterMessage(limit.retryAfterSec)}.`,
    };
  }

  const hasUnverifiedAccount = Boolean(user);
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.adminInvite.create({
    data: {
      email,
      role: ROLE.ADMIN,
      tokenHash: hashToken(token),
      expiresAt,
      courseId,
      createdById: session!.user.id,
    },
  });
  await writeAudit({
    action: "ADMIN_INVITE_SENT",
    entityType: "AdminInvite",
    after: { email, courseId, existingAccount: hasUnverifiedAccount },
    actorId: session!.user.id,
  });

  const inviteUrl = `${env.NEXT_PUBLIC_BASE_URL}/invite/${token}`;
  const sent = await sendEmail({
    to: email,
    ...adminInviteEmail(course.title, inviteUrl, INVITE_TTL_DAYS),
  });
  log.info(
    { courseId, sent, existingAccount: hasUnverifiedAccount },
    "admin invite created",
  );
  revalidatePath(`/superAdmin/courses/${courseId}`);
  if (!sent) {
    return {
      ok: true,
      message: `Invite created for ${email}, but the email could not be sent — check SMTP settings.`,
    };
  }
  return {
    ok: true,
    message: hasUnverifiedAccount
      ? `${email} has an unverified account. An invitation was emailed; they must verify their email, then accept it.`
      : `No account found for ${email}. An invitation has been emailed to them.`,
  };
}

export async function unassignAdmin(
  courseId: string,
  adminId: string,
): Promise<ActionResult<{ noCoursesLeft: boolean }>> {
  const session = await auth();
  if (!isSuperAdmin(session)) return { ok: false, error: "Not authorized" };

  await prisma.courseAssignment
    .delete({ where: { courseId_adminId: { courseId, adminId } } })
    .catch(() => null);

  await writeAudit({
    action: "COURSE_ADMIN_UNASSIGN",
    entityType: "Course",
    entityId: courseId,
    before: { adminId },
    actorId: session!.user.id,
  });
  revalidatePath(`/superAdmin/courses/${courseId}`);

  // Signal (don't act) when this admin no longer manages any course but is
  // still ADMIN — the UI prompts the superAdmin to revoke the role explicitly
  // (Z6). We deliberately do NOT auto-demote: removing a course to reassign it
  // shouldn't silently strip the role and sign the person out.
  const [remaining, target] = await Promise.all([
    prisma.courseAssignment.count({ where: { adminId } }),
    prisma.user.findUnique({ where: { id: adminId }, select: { role: true } }),
  ]);
  return {
    ok: true,
    noCoursesLeft: remaining === 0 && target?.role === ROLE.ADMIN,
  };
}

/**
 * Revoke a user's ADMIN role entirely (Z6). SUPER_ADMIN only. Sets role back to
 * USER, removes every course assignment, and bumps `sessionVersion` so their
 * outstanding admin sessions are invalidated on the next request (pairs with
 * the stale-JWT fix). Refuses to touch a SUPER_ADMIN. Idempotent: a user who
 * isn't an ADMIN is reported as already done.
 */
export async function demoteAdmin(adminId: string): Promise<ActionResult> {
  const session = await auth();
  if (!isSuperAdmin(session)) return { ok: false, error: "Not authorized" };

  const user = await prisma.user.findUnique({ where: { id: adminId } });
  if (!user) return { ok: false, error: "User not found" };
  if (user.role === ROLE.SUPER_ADMIN) {
    return { ok: false, error: "Cannot demote a super admin." };
  }
  if (user.role !== ROLE.ADMIN) {
    return { ok: false, error: "This user is not an admin." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: adminId },
      data: { role: ROLE.USER, sessionVersion: { increment: 1 } },
    });
    await tx.courseAssignment.deleteMany({ where: { adminId } });
    await writeAudit({
      action: "ROLE_CHANGE",
      entityType: "User",
      entityId: adminId,
      before: { role: ROLE.ADMIN },
      after: { role: ROLE.USER },
      actorId: session!.user.id,
      client: tx,
    });
  });

  log.info({ adminId }, "admin demoted to user");
  revalidatePath("/superAdmin/courses");
  return { ok: true };
}

/**
 * Accept an admin invite. The signed-in user's email must match the invite.
 * Promotes them to ADMIN and (if the invite carried a course) links the course.
 */
export async function acceptAdminInvite(
  token: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Please sign in to accept." };

  const invite = await prisma.adminInvite.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!invite || invite.acceptedAt) {
    return { ok: false, error: "This invitation is no longer valid." };
  }
  if (invite.expiresAt < new Date()) {
    return { ok: false, error: "This invitation has expired." };
  }
  if (invite.email.toLowerCase() !== session.user.email?.toLowerCase()) {
    return {
      ok: false,
      error: "This invitation was sent to a different email address.",
    };
  }

  // N1: an invite may only elevate an account that has proven it controls the
  // email. Google accounts are verified on sign-in; credential users must click
  // their verification link first.
  const acceptingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  });
  if (!acceptingUser?.emailVerified) {
    return {
      ok: false,
      error: "Please verify your email before accepting this invitation.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: { role: ROLE.ADMIN },
    });
    await tx.adminInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date(), acceptedBy: session.user.id },
    });
    if (invite.courseId) {
      await tx.courseAssignment
        .create({ data: { courseId: invite.courseId, adminId: session.user.id } })
        .catch(() => null);
    }
    await writeAudit({
      action: "ADMIN_INVITE_ACCEPTED",
      entityType: "AdminInvite",
      entityId: invite.id,
      after: { userId: session.user.id, courseId: invite.courseId },
      actorId: session.user.id,
      client: tx,
    });
  });

  log.info({ userId: session.user.id }, "admin invite accepted");
  return { ok: true, redirectTo: "/admin/courses" };
}
