import { notFound } from "next/navigation";

import { SectionListEditor } from "@/components/courses/section-list-editor";
import { RefundDialog } from "@/components/enroll/refund-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { canManageCourse } from "@/lib/auth/access";
import { requireRole } from "@/lib/auth/guards";
import { getAdminCourseDetail } from "@/lib/data/course.queries";
import {
  formatCurrency,
  formatDateTime,
  formatEnrollmentStatus,
} from "@/lib/format";

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("ADMIN");
  const { id } = await params;

  const course = await getAdminCourseDetail(id);
  if (!course || !(await canManageCourse(session, id))) notFound();

  const sections = course.sections.map((s) => ({
    id: s.id,
    title: s.title,
    videoUrl: s.videoUrl,
    position: s.position,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{course.title}</h1>
        <Badge variant={course.enabled ? "default" : "secondary"}>
          {course.enabled ? "Enabled" : "Disabled"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Detail label="Route address" value={`/${course.slug}`} />
          <Detail label="Format" value={course.isOffline ? "Offline" : "Online"} />
          <Detail label="Start" value={formatDateTime(course.startAt)} />
          <Detail label="End" value={formatDateTime(course.endAt)} />
          <Detail
            label="Price"
            value={formatCurrency(Number(course.priceAmount), course.currency)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Registered students ({course.enrollments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {course.enrollments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No students enrolled yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Wechat</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {course.enrollments.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.snapshotName ?? "—"}</TableCell>
                      <TableCell>{e.snapshotEmail ?? e.user.email}</TableCell>
                      <TableCell>{formatEnrollmentStatus(e.status)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(e.amountPaid), e.currency)}
                      </TableCell>
                      <TableCell>{e.snapshotPhone ?? "—"}</TableCell>
                      <TableCell>{e.snapshotWechat ?? "—"}</TableCell>
                      <TableCell className="max-w-[16rem] truncate">
                        {e.note ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(e.amountPaid) - Number(e.amountRefunded) > 0 ? (
                          <RefundDialog
                            enrollmentId={e.id}
                            maxAmount={
                              Number(e.amountPaid) - Number(e.amountRefunded)
                            }
                            currency={e.currency}
                          />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
