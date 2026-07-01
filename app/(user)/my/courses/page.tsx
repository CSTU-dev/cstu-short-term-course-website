import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/guards";
import { getMyEnrollments } from "@/lib/data/enrollment.queries";
import { formatEnrollmentStatus } from "@/lib/format";

export default async function MyCoursesPage() {
  const session = await requireRole("USER");
  const enrollments = await getMyEnrollments(session.user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">My Courses</h1>

      {enrollments.length === 0 ? (
        <div className="text-muted-foreground space-y-3 text-sm">
          <p>You haven&apos;t enrolled in any courses yet.</p>
          <Link href="/courses" className={buttonVariants()}>
            Browse courses
          </Link>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
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
