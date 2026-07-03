import Link from "next/link";
import { redirect } from "next/navigation";

import { EnrollForm } from "@/components/enroll/enroll-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { COURSE_MODE_LABELS, ROLE } from "@/lib/constants";
import {
  availableModes,
  hasBothModes,
  modeParam,
  modePrice,
  resolveMode,
} from "@/lib/courses";
import { prisma } from "@/lib/db";
import { getEnabledCourseById } from "@/lib/data/public.queries";
import { getMyEnrollmentForCourse } from "@/lib/data/enrollment.queries";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default async function EnrollPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; mode?: string }>;
}) {
  const { courseId, mode } = await searchParams;
  const session = await auth();

  if (!session?.user) {
    const query = new URLSearchParams();
    if (courseId) query.set("courseId", courseId);
    if (mode) query.set("mode", mode);
    const suffix = query.toString();
    const callback = `/enroll${suffix ? `?${suffix}` : ""}`;
    redirect(`/login?redirectTo=${encodeURIComponent(callback)}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Enroll</CardTitle>
          <CardDescription>Confirm your details and enroll.</CardDescription>
        </CardHeader>
        <CardContent>
          <EnrollBody
            userId={session.user.id}
            courseId={courseId}
            requestedMode={mode}
          />
        </CardContent>
      </Card>
    </div>
  );
}

async function EnrollBody({
  userId,
  courseId,
  requestedMode,
}: {
  userId: string;
  courseId?: string;
  requestedMode?: string;
}) {
  const session = await auth();
  if (session?.user?.role !== ROLE.USER) {
    return (
      <p className="text-muted-foreground text-sm">
        You&apos;re signed in with an administrator account, which can&apos;t
        enroll in courses. Sign in with a student account to continue.
      </p>
    );
  }

  const course = courseId ? await getEnabledCourseById(courseId) : null;
  if (!course) {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          That course isn&apos;t available.
        </p>
        <Link href="/courses" className={buttonVariants({ variant: "outline" })}>
          Browse courses
        </Link>
      </div>
    );
  }

  const mode = resolveMode(course, requestedMode);
  if (!mode) {
    return (
      <p className="text-muted-foreground text-sm">
        This course has no pricing available right now.
      </p>
    );
  }
  const price = modePrice(course, mode) ?? 0;

  const existing = await getMyEnrollmentForCourse(course.id, userId);
  if (existing && existing.status !== "PENDING") {
    return (
      <div className="space-y-3 text-sm">
        <p>You&apos;re already enrolled in this course.</p>
        <Link href="/my/courses" className={buttonVariants()}>
          Go to my courses
        </Link>
      </div>
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const defaults = {
    name: existing?.snapshotName ?? user?.profileName ?? user?.name ?? "",
    phone: existing?.snapshotPhone ?? user?.profilePhone ?? "",
    wechat: existing?.snapshotWechat ?? user?.profileWechat ?? "",
    email:
      existing?.snapshotEmail ??
      user?.preferredEmail ??
      user?.email ??
      "",
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/40 rounded-lg border p-4">
        <h2 className="font-semibold">{course.title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {formatDateTime(course.startAt)} – {formatDateTime(course.endAt)}
        </p>
        {!hasBothModes(course) ? (
          <p className="mt-2 text-xl font-semibold">
            {formatCurrency(price)}
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              {COURSE_MODE_LABELS[mode]}
            </span>
          </p>
        ) : null}
      </div>

      {hasBothModes(course) ? (
        <div>
          <p className="mb-2 text-sm font-medium">Choose your format</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {availableModes(course).map((m) => {
              const selected = m === mode;
              const mPrice = modePrice(course, m) ?? 0;
              return (
                <Link
                  replace
                  key={m}
                  href={`/enroll?courseId=${course.id}&mode=${modeParam(m)}`}
                  scroll={false}
                  aria-pressed={selected}
                  className={cn(
                    "flex flex-col gap-1 rounded-lg border p-4 transition-colors",
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:bg-muted/50",
                  )}
                >
                  <span className="text-muted-foreground text-sm font-medium">
                    {COURSE_MODE_LABELS[m]}
                  </span>
                  <span className="text-xl font-semibold">
                    {formatCurrency(mPrice)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <EnrollForm courseId={course.id} mode={mode} defaults={defaults} />
    </div>
  );
}
