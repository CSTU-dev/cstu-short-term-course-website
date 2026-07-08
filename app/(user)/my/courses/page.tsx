import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/guards";
import { getMyEnrollments } from "@/lib/data/enrollment.queries";
import { formatEnrollmentStatus } from "@/lib/format";

export default async function MyCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await requireRole("USER");
  const enrollments = await getMyEnrollments(session.user.id);
  const { success } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="space-y-1.5">
        <p className="eyebrow">My Account</p>
        <h1 className="font-heading text-2xl font-bold">My Courses</h1>
      </div>

      {success ? (
        <div className="rounded-md border border-green-600/30 bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-300">
          Payment received — we&apos;re confirming it now. Your enrollment will
          show as paid within a few moments; refresh if it still says pending.
        </div>
      ) : null}


      {enrollments.length === 0 ? (
        <div className="text-muted-foreground space-y-3 text-sm">
          <p>You haven&apos;t enrolled in any courses yet.</p>
          <Link href="/courses" className={buttonVariants()}>
            Browse courses
          </Link>
        </div>
      ) : (
        <ul className="divide-y rounded-md border">
          {enrollments.map((e) => {
            const isPending = e.status === "PENDING";
            return (
              <li
                key={e.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.course.title}</p>
                  <Badge
                    variant={isPending ? "secondary" : "default"}
                    className="mt-1"
                  >
                    {formatEnrollmentStatus(e.status)}
                  </Badge>
                </div>
                <div className="flex shrink-0 gap-2">
                  {isPending ? (
                    <Link
                      href={`/enroll?courseId=${e.course.id}`}
                      className={buttonVariants({ size: "sm" })}
                    >
                      Pay
                    </Link>
                  ) : null}
                  <Link
                    href={`/my/courses/${e.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    View
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
