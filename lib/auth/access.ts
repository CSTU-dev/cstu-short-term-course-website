import type { Session } from "next-auth";

import { ROLE } from "@/lib/constants";
import { prisma } from "@/lib/db";

export function isSuperAdmin(session: Session | null): boolean {
  return session?.user?.role === ROLE.SUPER_ADMIN;
}

/**
 * Whether the user has confirmed their email. Read from the DB (not the JWT) so
 * a verification completed mid-session takes effect immediately. Gates
 * high-risk actions: enrolling, paying, and earning referral commissions.
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  return Boolean(user?.emailVerified);
}

/**
 * True if the session may edit a given course: superAdmins may edit any course;
 * admins only courses they are assigned to.
 */
export async function canManageCourse(
  session: Session | null,
  courseId: string,
): Promise<boolean> {
  if (!session?.user) return false;
  if (session.user.role === ROLE.SUPER_ADMIN) return true;
  if (session.user.role === ROLE.ADMIN) {
    const assignment = await prisma.courseAssignment.findUnique({
      where: {
        courseId_adminId: { courseId, adminId: session.user.id },
      },
    });
    return Boolean(assignment);
  }
  return false;
}
