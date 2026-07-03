import Link from "next/link";

import { CourseCard, type PublicCourse } from "@/components/courses/course-card";
import { buttonVariants } from "@/components/ui/button";
import { Eyebrow, PageTitle, SectionTitle } from "@/components/ui/typography";
import { hasBothModes, lowestPrice } from "@/lib/courses";
import { getEnabledCourses } from "@/lib/data/public.queries";
import { formatCurrency, formatDate } from "@/lib/format";

const STATS = [
  { value: "#1", label: "Location for Tech Jobs" },
  { value: "STEM", label: "Designated Programs" },
  { value: "98%", label: "Career Placement Rate" },
];

function toPublic(course: {
  id: string;
  slug: string;
  title: string;
  startAt: Date;
  endAt: Date;
  hasOnline: boolean;
  hasOffline: boolean;
  onlinePrice: unknown;
  offlinePrice: unknown;
}): PublicCourse {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    startAt: course.startAt,
    endAt: course.endAt,
    hasOnline: course.hasOnline,
    hasOffline: course.hasOffline,
    onlinePrice: course.onlinePrice != null ? Number(course.onlinePrice) : null,
    offlinePrice:
      course.offlinePrice != null ? Number(course.offlinePrice) : null,
  };
}

export default async function HomePage() {
  const courses = (await getEnabledCourses(7)).map(toPublic);
  const featured = courses[0];
  const rest = courses.slice(1);

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-ink">
        <span className="absolute inset-x-0 top-0 h-1 bg-primary" />
        <div
          className="pointer-events-none absolute -top-24 -right-24 size-[420px] rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(circle, rgba(168,0,0,0.35) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-1.5 font-mono text-[11px] font-medium tracking-[0.1em] text-white uppercase">
            Enrollment Open · {new Date().getFullYear()}
          </span>
          <PageTitle className="mt-6 max-w-3xl text-cream">
            Advance your career with professional CSTU courses
          </PageTitle>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-neutral-400">
            Industry-aligned short courses and continuing education from
            California Science &amp; Technology University — learn online or on
            campus in Silicon Valley.
          </p>

          {featured ? (
            <div className="mt-10 max-w-xl rounded-md border border-neutral-700 bg-neutral-800/60 p-6 backdrop-blur">
              <Eyebrow className="text-gold-300">Latest course</Eyebrow>
              <h2 className="font-heading mt-2 text-xl font-bold text-cream">
                {featured.title}
              </h2>
              <p className="mt-1 font-mono text-xs tracking-[0.04em] text-neutral-400">
                {formatDate(featured.startAt)} – {formatDate(featured.endAt)} ·{" "}
                {hasBothModes(featured) ? "From " : ""}
                {formatCurrency(lowestPrice(featured) ?? 0)}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/enroll?courseId=${featured.id}`}
                  className={buttonVariants()}
                >
                  Enroll now →
                </Link>
                <Link
                  href={`/courses/${featured.slug}`}
                  className={buttonVariants({ variant: "secondary"})}
                >
                  View details
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-neutral-400">New courses are coming soon.</p>
          )}
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="border-b bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-6 py-8 text-center">
              <div className="font-heading text-4xl font-bold text-primary">
                {stat.value}
              </div>
              <div className="mt-1.5 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MORE COURSES ── */}
      {rest.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="space-y-2">
              <Eyebrow>Continuing Education</Eyebrow>
              <SectionTitle>Explore our courses</SectionTitle>
            </div>
            <Link
              href="/courses"
              className="font-mono text-[11px] font-medium tracking-[0.08em] text-primary uppercase transition-opacity hover:opacity-65"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
