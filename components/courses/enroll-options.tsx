import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { COURSE_MODE_LABELS } from "@/lib/constants";
import {
  availableModes,
  modePrice,
  modeParam,
  type CoursePricing,
} from "@/lib/courses";
import { formatCurrency } from "@/lib/format";

type EnrollOptionsCourse = { id: string } & CoursePricing;

/**
 * Renders one price card per delivery mode the course offers, each with an
 * "Enroll" link carrying the mode (`?courseId=…&mode=online|offline`). Shared by
 * the default course detail page and any custom (per-course) detail template.
 */
export function EnrollOptions({
  course,
  className,
}: {
  course: EnrollOptionsCourse;
  className?: string;
}) {
  const modes = availableModes(course);

  return (
    <div className={className}>
      <div className="grid gap-4 sm:grid-cols-2">
        {modes.map((mode) => {
          const price = modePrice(course, mode);
          return (
            <div
              key={mode}
              className="flex flex-col gap-3 rounded-xl border p-5"
            >
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  {COURSE_MODE_LABELS[mode]}
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {price !== null ? formatCurrency(price) : "—"}
                </p>
              </div>
              <Link
                href={`/enroll?courseId=${course.id}&mode=${modeParam(mode)}`}
                className={buttonVariants({ className: "mt-auto w-full" })}
              >
                Enroll {COURSE_MODE_LABELS[mode].toLowerCase()}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
