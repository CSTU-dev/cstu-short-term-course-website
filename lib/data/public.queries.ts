import { prisma } from "@/lib/db";

/** Enabled courses, newest first (public catalog + home). */
export function getEnabledCourses(take?: number) {
  return prisma.course.findMany({
    where: { enabled: true },
    orderBy: { createdAt: "desc" },
    ...(take ? { take } : {}),
  });
}

/** A single enabled course by its public slug (route address), with sections. */
export function getEnabledCourseBySlug(slug: string) {
  return prisma.course.findFirst({
    where: { slug, enabled: true },
    include: { sections: { orderBy: { position: "asc" } } },
  });
}

/** An enabled course with sections — the shape passed to detail page templates. */
export type PublicCourseDetail = NonNullable<
  Awaited<ReturnType<typeof getEnabledCourseBySlug>>
>;

/** A single enabled course by id (used by the enroll flow). */
export function getEnabledCourseById(id: string) {
  return prisma.course.findFirst({ where: { id, enabled: true } });
}
