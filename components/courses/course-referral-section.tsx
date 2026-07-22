import Link from "next/link";

import { ReferralShare } from "@/components/referral/referral-share";
import { auth } from "@/lib/auth";
import { ROLE } from "@/lib/constants";
import type { PublicCourseDetail } from "@/lib/data/public.queries";
import { formatCurrency } from "@/lib/format";
import { getCourseReferralSummary } from "@/lib/referral/service";

/**
 * The "refer & earn" area shown below the payment section on every course
 * detail page (custom or default). Rendered automatically by `/courses/[slug]`
 * as a sibling of CoursePaymentSection — templates should NOT include it.
 *
 * Visible only to signed-in regular users (USER role); returns null otherwise,
 * so anonymous visitors and admins see nothing.
 */
export async function CourseReferralSection({
  course,
}: {
  course: PublicCourseDetail;
}) {
  const session = await auth();
  if (session?.user?.role !== ROLE.USER) return null;

  const { link, stats } = await getCourseReferralSummary(
    session.user.id,
    course.id,
    course.slug,
  );

  return (
    <section>
      <div className="mx-auto max-w-4xl border-t border-border px-4 py-12">
        <h2 className="text-2xl font-semibold">Refer &amp; earn</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Share this course with your link — they get a discount at checkout and
          you earn commission on every sale.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <ReferralShare link={link} label={course.slug} />

          <div className="flex flex-col gap-4 rounded-md border p-5">
            <p className="text-muted-foreground text-sm font-medium">
              This course
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Clicks" value={String(stats.clicks)} />
              <Stat label="Sales" value={String(stats.conversions)} />
              <Stat
                label="Commission"
                value={formatCurrency(stats.commission)}
              />
            </div>
            <Link
              href="/my/referrals"
              className="text-primary mt-auto text-sm font-medium hover:underline"
            >
              View all referrals →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}
