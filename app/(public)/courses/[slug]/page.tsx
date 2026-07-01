import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEnabledCourseBySlug } from "@/lib/data/public.queries";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getEnabledCourseBySlug(slug);
  if (!course) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
        {course.isOffline ? <Badge variant="secondary">Offline</Badge> : null}
      </div>
      <p className="text-muted-foreground mt-2">
        {formatDateTime(course.startAt)} – {formatDateTime(course.endAt)}
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>About this course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {course.sections.length} section
            {course.sections.length === 1 ? "" : "s"}. Full course materials are
            available after enrollment.
          </p>
          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-2xl font-semibold">
              {formatCurrency(Number(course.priceAmount), course.currency)}
            </span>
            <Link
              href={`/enroll?courseId=${course.id}`}
              className={buttonVariants()}
            >
              Enroll now
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
