import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { COURSE_MODE_LABELS, type CourseModeValue } from "@/lib/constants";
import { getMyEnrollment } from "@/lib/data/enrollment.queries";
import {
  formatCurrency,
  formatDateTime,
  formatEnrollmentStatus,
} from "@/lib/format";

const PAID_STATUSES = new Set(["PAID", "PARTIALLY_REFUNDED"]);

export default async function MyCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("USER");
  const { id } = await params;
  const enrollment = await getMyEnrollment(id, session.user.id);
  if (!enrollment) notFound();

  const { course } = enrollment;
  const isPending = enrollment.status === "PENDING";
  const isPaid = PAID_STATUSES.has(enrollment.status);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">{course.title}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Enrollment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Detail label="Start" value={formatDateTime(course.startAt)} />
          <Detail label="End" value={formatDateTime(course.endAt)} />
          <Detail
            label="Format"
            value={COURSE_MODE_LABELS[enrollment.mode as CourseModeValue]}
          />
          <Detail
            label="Price"
            value={formatCurrency(Number(enrollment.listPrice))}
          />
          <Detail
            label="Amount paid"
            value={formatCurrency(Number(enrollment.amountPaid))}
          />
          <Detail
            label="Status"
            value={formatEnrollmentStatus(enrollment.status)}
          />
        </CardContent>
      </Card>

      {isPending ? (
        <div className="flex items-center justify-between rounded-md border p-4">
          <p className="text-sm">This enrollment is awaiting payment.</p>
          <Link
            href={`/enroll?courseId=${course.id}`}
            className={buttonVariants()}
          >
            Pay now
          </Link>
        </div>
      ) : null}

      {isPaid && course.zoomLink ? (
        <Card>
          <CardHeader>
            <CardTitle>Live session</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              Join the course meeting on Zoom.
            </p>
            <a
              href={course.zoomLink}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants()}
            >
              Join Zoom meeting
            </a>
          </CardContent>
        </Card>
      ) : null}

      {isPaid ? (
        <Card>
          <CardHeader>
            <CardTitle>Course content</CardTitle>
          </CardHeader>
          <CardContent>
            {course.sections.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No sections published yet.
              </p>
            ) : (
              <ol className="space-y-2">
                {course.sections.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span className="text-sm font-medium">{s.title}</span>
                    <a
                      href={s.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      Watch
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      ) : null}
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
