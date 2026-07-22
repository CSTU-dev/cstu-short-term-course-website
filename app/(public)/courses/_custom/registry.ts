import type { ComponentType } from "react";

import type { PublicCourseDetail } from "@/lib/data/public.queries";

import { DemoDetail } from "./demo";

/** Props every custom course detail template receives. */
export type CustomDetailProps = { course: PublicCourseDetail };

/**
 * Per-course custom detail pages, keyed by course slug. When a slug is present
 * here, `/courses/[slug]` renders this component instead of the default layout.
 *
 * To add a bespoke page for a course:
 *   1. Copy `demo.tsx` to `<slug>.tsx` and adapt the layout. Only build the
 *      marketing content — the pricing/enroll area is appended automatically
 *      below your template by `/courses/[slug]` (see CoursePaymentSection).
 *   2. Register it below: `"<slug>": YourDetail`.
 */
export const customDetailPages: Record<
  string,
  ComponentType<CustomDetailProps>
> = {
  demo: DemoDetail,
};
