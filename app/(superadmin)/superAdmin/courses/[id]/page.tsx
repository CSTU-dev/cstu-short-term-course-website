import { notFound } from "next/navigation";

import { AdminAssignment } from "@/components/courses/admin-assignment";
import { CourseFormDialog } from "@/components/courses/course-form-dialog";
import { EnableToggle } from "@/components/courses/enable-toggle";
import { SectionListEditor } from "@/components/courses/section-list-editor";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { getCourseDetail } from "@/lib/data/course.queries";
import { formatCurrency, formatDateTime, toDateTimeLocal } from "@/lib/format";

export default async function SuperAdminCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("SUPER_ADMIN");
  const { id } = await params;
  const course = await getCourseDetail(id);
  if (!course) notFound();

  const initial = {
    title: course.title,
    slug: course.slug,
    startAt: toDateTimeLocal(course.startAt),
    endAt: toDateTimeLocal(course.endAt),
    isOffline: course.isOffline,
    priceAmount: String(course.priceAmount),
    currency: course.currency,
  };

  const admins = course.assignments.map((a) => ({
    adminId: a.admin.id,
    email: a.admin.email,
    name: a.admin.name,
  }));

  const sections = course.sections.map((s) => ({
    id: s.id,
    title: s.title,
    videoUrl: s.videoUrl,
    position: s.position,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{course.title}</h1>
          <p className="text-muted-foreground text-sm">/{course.slug}</p>
        </div>
        <CourseFormDialog
          mode="edit"
          courseId={course.id}
          initial={initial}
          triggerLabel="Edit course"
          triggerVariant="outline"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <EnableToggle courseId={course.id} enabled={course.enabled} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Detail label="Start" value={formatDateTime(course.startAt)} />
          <Detail label="End" value={formatDateTime(course.endAt)} />
          <Detail label="Format" value={course.isOffline ? "Offline" : "Online"} />
          <Detail
            label="Price"
            value={formatCurrency(Number(course.priceAmount), course.currency)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admins</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminAssignment courseId={course.id} admins={admins} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <SectionListEditor courseId={course.id} sections={sections} />
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
