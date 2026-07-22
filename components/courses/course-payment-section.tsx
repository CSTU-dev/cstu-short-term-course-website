import { EnrollOptions } from "@/components/courses/enroll-options";
import type { PublicCourseDetail } from "@/lib/data/public.queries";

/**
 * The pricing + enroll area shown at the bottom of every course detail page
 * (custom or default). Rendered automatically by `/courses/[slug]` — templates
 * should NOT include it themselves.
 */
export function CoursePaymentSection({ course }: { course: PublicCourseDetail }) {
  return (
    <section className="">
      <div className="mx-auto max-w-4xl px-4 py-12 border-t border-border ">
        <h2 className="text-2xl font-semibold">Choose how to attend</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Pick the format that works for you — you can switch before you pay.
        </p>
        <EnrollOptions course={course} className="mt-6" />
      </div>
    </section>
  );
}
