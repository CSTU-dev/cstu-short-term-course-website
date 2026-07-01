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
import { ROLE } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { getEnabledCourseById } from "@/lib/data/public.queries";
import { getMyEnrollmentForCourse } from "@/lib/data/enrollment.queries";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default async function EnrollPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const { courseId } = await searchParams;
  const session = await auth();

  if (!session?.user) {
    const callback = `/enroll${courseId ? `?courseId=${courseId}` : ""}`;
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
          <EnrollBody userId={session.user.id} courseId={courseId} />
        </CardContent>
      </Card>
    </div>
  );
}

async function EnrollBody({
  userId,
  courseId,
}: {
  userId: string;
  courseId?: string;
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
        <p className="mt-2 text-xl font-semibold">
          {formatCurrency(Number(course.priceAmount), course.currency)}
        </p>
      </div>
      <EnrollForm courseId={course.id} defaults={defaults} />
    </div>
  );
}
