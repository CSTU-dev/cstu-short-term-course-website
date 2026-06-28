import { prisma } from "@/lib/db";

/** All courses (superAdmin view), newest first. */
export function listAllCourses() {
  return prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { sections: true, enrollments: true, assignments: true } },
    },
  });
}

/** Courses assigned to a given admin, newest first. */
export function listCoursesForAdmin(adminId: string) {
  return prisma.course.findMany({
    where: { assignments: { some: { adminId } } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { sections: true, enrollments: true } },
    },
  });
}

/** Full course detail with ordered sections and assigned admins. */
export function getCourseDetail(id: string) {
  return prisma.course.findUnique({
    where: { id },
    include: {
      sections: { orderBy: { position: "asc" } },
      assignments: {
        include: {
          admin: { select: { id: true, email: true, name: true, role: true } },
        },
        orderBy: { assignedAt: "asc" },
      },
    },
  });
}

export type CourseDetail = NonNullable<
  Awaited<ReturnType<typeof getCourseDetail>>
>;
