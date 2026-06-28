"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/auth/access";
import { writeAudit } from "@/lib/audit";
import { ROLE } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { hashToken } from "@/lib/tokens";

import type { ActionResult } from "./course.actions";

const log = createLogger("admin-action");

const INVITE_TTL_DAYS = 7;

/**
 * Assign an admin to a course by email. If the user exists they're promoted to
 * ADMIN (if needed) and linked to the course. If not, an AdminInvite is created
 * and the invite link is returned (no SMTP wired up in dev).
 */
export async function assignAdmin(
  courseId: string,
  rawEmail: string,
): Promise<ActionResult<{ message: string; inviteUrl?: string }>> {
  const session = await auth();
  if (!isSuperAdmin(session)) return { ok: false, error: "Not authorized" };

  const email = rawEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email address" };
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { ok: false, error: "Course not found" };

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
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

  // No account yet — create an invite.
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
    after: { email, courseId },
    actorId: session!.user.id,
  });

  const inviteUrl = `${env.NEXT_PUBLIC_BASE_URL}/invite/${token}`;
  log.info({ courseId, email }, "admin invite created");
  revalidatePath(`/superAdmin/courses/${courseId}`);
  return {
    ok: true,
    message: `No account found for ${email}. Share this invite link with them:`,
    inviteUrl,
  };
}

export async function unassignAdmin(
  courseId: string,
  adminId: string,
): Promise<ActionResult> {
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
