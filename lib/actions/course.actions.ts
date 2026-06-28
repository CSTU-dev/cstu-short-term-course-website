"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { canManageCourse, isSuperAdmin } from "@/lib/auth/access";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import {
  CourseFormSchema,
  SectionFormSchema,
  type CourseInput,
  type SectionInput,
} from "@/lib/validations/course";

const log = createLogger("course-action");

export type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

function revalidateCourse(courseId: string) {
  revalidatePath("/superAdmin/courses");
  revalidatePath(`/superAdmin/courses/${courseId}`);
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function createCourse(
  input: CourseInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!isSuperAdmin(session)) return { ok: false, error: "Not authorized" };

  const parsed = CourseFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const clash = await prisma.course.findUnique({ where: { slug: data.slug } });
  if (clash) return { ok: false, error: "That route address is already in use" };

  const course = await prisma.course.create({
    data: {
      title: data.title,
      slug: data.slug,
      startAt: data.startAt,
      endAt: data.endAt,
      isOffline: data.isOffline,
      priceAmount: data.priceAmount,
      currency: data.currency,
      enabled: false,
    },
  });

  await writeAudit({
    action: "COURSE_CREATE",
    entityType: "Course",
    entityId: course.id,
    after: { title: course.title, slug: course.slug },
    actorId: session!.user.id,
  });
  log.info({ courseId: course.id }, "course created");
  revalidatePath("/superAdmin/courses");
  return { ok: true, id: course.id };
}

export async function updateCourse(
  courseId: string,
  input: CourseInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!(await canManageCourse(session, courseId))) {
    return { ok: false, error: "Not authorized" };
  }

  const parsed = CourseFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const clash = await prisma.course.findFirst({
    where: { slug: data.slug, NOT: { id: courseId } },
  });
  if (clash) return { ok: false, error: "That route address is already in use" };

  await prisma.course.update({
    where: { id: courseId },
    data: {
      title: data.title,
      slug: data.slug,
      startAt: data.startAt,
      endAt: data.endAt,
      isOffline: data.isOffline,
      priceAmount: data.priceAmount,
      currency: data.currency,
    },
  });

  await writeAudit({
    action: "COURSE_UPDATE",
    entityType: "Course",
    entityId: courseId,
    after: { title: data.title, slug: data.slug },
    actorId: session!.user.id,
  });
  revalidateCourse(courseId);
  return { ok: true };
}

export async function toggleCourseEnabled(
  courseId: string,
  enabled: boolean,
): Promise<ActionResult> {
  const session = await auth();
  // Enable/disable is a superAdmin-only control.
  if (!isSuperAdmin(session)) return { ok: false, error: "Not authorized" };

  await prisma.course.update({ where: { id: courseId }, data: { enabled } });
  await writeAudit({
    action: "COURSE_ENABLE_TOGGLE",
    entityType: "Course",
    entityId: courseId,
    after: { enabled },
    actorId: session!.user.id,
  });
  revalidateCourse(courseId);
  return { ok: true };
}

export async function createSection(
  courseId: string,
  input: SectionInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!(await canManageCourse(session, courseId))) {
    return { ok: false, error: "Not authorized" };
  }
  const parsed = SectionFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const last = await prisma.section.findFirst({
    where: { courseId },
    orderBy: { position: "desc" },
  });
  const section = await prisma.section.create({
    data: {
      courseId,
      title: parsed.data.title,
      videoUrl: parsed.data.videoUrl,
      position: (last?.position ?? 0) + 1,
    },
  });
  await writeAudit({
    action: "SECTION_CREATE",
    entityType: "Section",
    entityId: section.id,
    after: { courseId, title: section.title },
    actorId: session!.user.id,
  });
  revalidateCourse(courseId);
  return { ok: true };
}

export async function updateSection(
  sectionId: string,
  input: SectionInput,
): Promise<ActionResult> {
  const session = await auth();
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section) return { ok: false, error: "Section not found" };
  if (!(await canManageCourse(session, section.courseId))) {
    return { ok: false, error: "Not authorized" };
  }
  const parsed = SectionFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.section.update({
    where: { id: sectionId },
    data: { title: parsed.data.title, videoUrl: parsed.data.videoUrl },
  });
  await writeAudit({
    action: "SECTION_UPDATE",
    entityType: "Section",
    entityId: sectionId,
    after: { title: parsed.data.title },
    actorId: session!.user.id,
  });
  revalidateCourse(section.courseId);
  return { ok: true };
}

export async function deleteSection(sectionId: string): Promise<ActionResult> {
  const session = await auth();
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section) return { ok: false, error: "Section not found" };
  if (!(await canManageCourse(session, section.courseId))) {
    return { ok: false, error: "Not authorized" };
  }

  await prisma.section.delete({ where: { id: sectionId } });
  await writeAudit({
    action: "SECTION_DELETE",
    entityType: "Section",
    entityId: sectionId,
    before: { title: section.title, courseId: section.courseId },
    actorId: session!.user.id,
  });
  revalidateCourse(section.courseId);
  return { ok: true };
}
