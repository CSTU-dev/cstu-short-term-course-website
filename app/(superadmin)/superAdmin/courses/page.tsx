import Link from "next/link";

import { CourseFormDialog } from "@/components/courses/course-form-dialog";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/guards";
import { formatModePricing } from "@/lib/courses";
import { listAllCourses } from "@/lib/data/course.queries";
import { formatDate } from "@/lib/format";

export default async function SuperAdminCoursesPage() {
  await requireRole("SUPER_ADMIN");
  const courses = await listAllCourses();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="eyebrow">Super Admin</p>
          <h1 className="font-heading text-2xl font-bold">Courses</h1>
        </div>
        <CourseFormDialog mode="create" triggerLabel="Add course" />
      </div>

      {courses.length === 0 ? (
        <p className="text-muted-foreground">
          No courses yet. Click “Add course” to create one.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {courses.map((course) => (
            <li key={course.id}>
              <Link
                href={`/superAdmin/courses/${course.id}`}
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
                    /{course.slug} · {formatDate(course.startAt)} –{" "}
                    {formatDate(course.endAt)} · {formatModePricing(course)}
                  </p>
                </div>
                <span className="text-muted-foreground hidden text-xs sm:block">
                  {course._count.sections} sections ·{" "}
                  {course._count.enrollments} enrolled ·{" "}
                  {course._count.assignments} admins
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
