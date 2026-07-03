import { notFound } from "next/navigation";

import { EnrollOptions } from "@/components/courses/enroll-options";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { COURSE_MODE_LABELS } from "@/lib/constants";
import { availableModes } from "@/lib/courses";
import {
  getEnabledCourseBySlug,
  type PublicCourseDetail,
} from "@/lib/data/public.queries";
import { formatDateTime } from "@/lib/format";

import { customDetailPages } from "../_custom/registry";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getEnabledCourseBySlug(slug);
  if (!course) notFound();

  // A course may ship its own bespoke detail page (see courses/_custom).
  const Custom = customDetailPages[course.slug];
  if (Custom) return <Custom course={course} />;

  return <DefaultCourseDetail course={course} />;
}

/** The default detail layout, used when a course has no custom template. */
function DefaultCourseDetail({ course }: { course: PublicCourseDetail }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
        {availableModes(course).map((mode) => (
          <Badge key={mode} variant="secondary">
            {COURSE_MODE_LABELS[mode]}
          </Badge>
        ))}
      </div>
      <p className="text-muted-foreground mt-2">
        {formatDateTime(course.startAt)} – {formatDateTime(course.endAt)}
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>About this course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-sm">
            {course.sections.length} section
            {course.sections.length === 1 ? "" : "s"}. Full course materials are
            available after enrollment.
          </p>
          <div className="border-t pt-6">
            <h2 className="mb-4 text-sm font-medium">Choose how to attend</h2>
            <EnrollOptions course={course} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
