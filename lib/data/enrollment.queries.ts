import { prisma } from "@/lib/db";

/** All of a user's enrollments, newest first. */
export function getMyEnrollments(userId: string) {
  return prisma.enrollment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      course: { select: { id: true, title: true, slug: true } },
    },
  });
}

/** A single enrollment owned by the user, with the course + sections. */
export function getMyEnrollment(enrollmentId: string, userId: string) {
  return prisma.enrollment.findFirst({
    where: { id: enrollmentId, userId },
    include: {
      course: {
        include: { sections: { orderBy: { position: "asc" } } },
      },
    },
  });
}

/** The user's existing enrollment for a course, if any. */
export function getMyEnrollmentForCourse(courseId: string, userId: string) {
  return prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
}
