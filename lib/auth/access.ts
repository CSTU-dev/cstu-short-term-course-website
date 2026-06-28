import type { Session } from "next-auth";

import { ROLE } from "@/lib/constants";
import { prisma } from "@/lib/db";

export function isSuperAdmin(session: Session | null): boolean {
  return session?.user?.role === ROLE.SUPER_ADMIN;
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
