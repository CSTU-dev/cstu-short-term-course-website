import { REFERRAL_QUERY_PARAM } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

import { generateReferralCode } from "./code";

/** Build a shareable referral URL (per-course, or generic home link). */
export function buildReferralLink(code: string, courseSlug?: string) {
  const path = courseSlug ? `/courses/${courseSlug}` : "/home";
  return `${env.NEXT_PUBLIC_BASE_URL}${path}?${REFERRAL_QUERY_PARAM}=${encodeURIComponent(code)}`;
}

/** Return the user's active "primary" referral code, creating one if needed. */
export async function ensurePrimaryReferralCode(userId: string) {
  const active = await prisma.referralCode.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (active) return active;

  // Create a fresh code, retrying on the (rare) unique collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.referralCode.create({
        data: { userId, code: generateReferralCode(), isActive: true },
      });
    } catch {
      // unique clash — try another code
    }
  }
  throw new Error("Could not generate a unique referral code");
}

/** Resolve any referral code (active or historical) to its owner. */
export async function resolveReferralCode(code: string) {
  return prisma.referralCode.findUnique({ where: { code } });
}

/**
 * Record a referral click. Increments the per-(referrer, course) counter when a
 * course context is present. Returns whether the code was valid.
 */
export async function recordReferralClick(code: string, courseSlug?: string) {
  const referral = await resolveReferralCode(code);
  if (!referral) return { valid: false as const };

  let courseId: string | null = null;
  if (courseSlug) {
    const course = await prisma.course.findFirst({
      where: { slug: courseSlug },
      select: { id: true },
    });
    courseId = course?.id ?? null;
  }

  if (courseId) {
    await prisma.$transaction([
      prisma.referralCourseStat.upsert({
        where: { userId_courseId: { userId: referral.userId, courseId } },
        create: { userId: referral.userId, courseId, clicks: 1 },
        update: { clicks: { increment: 1 } },
      }),
      prisma.referralEvent.create({
        data: { referralCodeId: referral.id, courseId, type: "CLICK" },
      }),
    ]);
  }

  return { valid: true as const };
}

/**
 * Focused referral summary for a single course — powers the share widget shown
 * on the course detail page. Ensures the user has a primary code, builds the
 * course-specific link, and returns this course's stats only.
 */
export async function getCourseReferralSummary(
  userId: string,
  courseId: string,
  courseSlug: string,
) {
  const [primary, stat] = await Promise.all([
    ensurePrimaryReferralCode(userId),
    prisma.referralCourseStat.findUnique({
      where: { userId_courseId: { userId, courseId } },
    }),
  ]);

  return {
    code: primary.code,
    link: buildReferralLink(primary.code, courseSlug),
    stats: {
      clicks: stat?.clicks ?? 0,
      conversions: stat?.conversions ?? 0,
      commission: Number(stat?.commissionTotal ?? 0),
    },
  };
}

/** Full data for the /my/referrals page. */
export async function getReferralOverview(userId: string) {
  const [primary, codes, stats, enabledCourses] = await Promise.all([
    ensurePrimaryReferralCode(userId),
    prisma.referralCode.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.referralCourseStat.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, title: true, slug: true, enabled: true } },
      },
    }),
    prisma.course.findMany({
      where: { enabled: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, slug: true, enabled: true },
    }),
  ]);

  const statByCourse = new Map(stats.map((s) => [s.courseId, s]));

  // Enabled courses (always shown) + disabled courses that have stats.
  const courseList = [...enabledCourses];
  for (const s of stats) {
    if (!s.course.enabled && !courseList.some((c) => c.id === s.courseId)) {
      courseList.push(s.course);
    }
  }

  const rows = courseList.map((course) => {
    const stat = statByCourse.get(course.id);
    return {
      courseId: course.id,
      title: course.title,
      slug: course.slug,
      enabled: course.enabled,
      clicks: stat?.clicks ?? 0,
      conversions: stat?.conversions ?? 0,
      commission: Number(stat?.commissionTotal ?? 0),
      link: buildReferralLink(primary.code, course.slug),
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      clicks: acc.clicks + r.clicks,
      conversions: acc.conversions + r.conversions,
      commission: acc.commission + r.commission,
    }),
    { clicks: 0, conversions: 0, commission: 0 },
  );

  return {
    primaryCode: primary.code,
    codes: codes.map((c) => ({
      code: c.code,
      isActive: c.isActive,
      createdAt: c.createdAt,
    })),
    rows,
    totals,
  };
}
