import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/guards";
import { formatModePricing } from "@/lib/courses";
import { listCoursesForAdmin } from "@/lib/data/course.queries";
import { formatDate } from "@/lib/format";

export default async function AdminCoursesPage() {
  const session = await requireRole("ADMIN");
  const courses = await listCoursesForAdmin(session.user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="space-y-1.5">
        <p className="eyebrow">Admin Console</p>
        <h1 className="font-heading text-2xl font-bold">Assigned courses</h1>
      </div>

      {courses.length === 0 ? (
        <p className="text-muted-foreground">
          You have not been assigned to any courses yet.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {courses.map((course) => (
            <li key={course.id}>
              <Link
                href={`/admin/courses/${course.id}`}
                className="hover:bg-muted/50 flex items-center justify-between gap-4 px-4 py-3 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {course.title}
                    </span>
                    <Badge variant={course.enabled ? "default" : "secondary"}>
                      {course.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {formatDate(course.startAt)} – {formatDate(course.endAt)} ·{" "}
                    {formatModePricing(course)}
                  </p>
                </div>
                <span className="text-muted-foreground hidden text-xs sm:block">
                  {course._count.sections} sections ·{" "}
                  {course._count.enrollments} enrolled
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
