import Link from "next/link";

import { CourseCard, type PublicCourse } from "@/components/courses/course-card";
import { buttonVariants } from "@/components/ui/button";
import { hasBothModes, lowestPrice } from "@/lib/courses";
import { getEnabledCourses } from "@/lib/data/public.queries";
import { formatCurrency, formatDate } from "@/lib/format";

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
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="text-primary-foreground/70 text-sm font-medium tracking-wide uppercase">
            California Science and Technology University
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
            Advance your career with professional CSTU courses
          </h1>
          {featured ? (
            <div className="mt-8 max-w-xl rounded-xl bg-white/10 p-6 backdrop-blur">
              <p className="text-primary-foreground/70 text-xs uppercase">
                Latest course
              </p>
              <h2 className="mt-1 text-xl font-semibold">{featured.title}</h2>
              <p className="text-primary-foreground/80 mt-1 text-sm">
                {formatDate(featured.startAt)} – {formatDate(featured.endAt)} ·{" "}
                {hasBothModes(featured) ? "From " : ""}
                {formatCurrency(lowestPrice(featured) ?? 0)}
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/courses/${featured.slug}`}
                  className={buttonVariants({ variant: "secondary" })}
                >
                  View details
                </Link>
                <Link
                  href={`/enroll?courseId=${featured.id}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Enroll
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-primary-foreground/80 mt-6">
              New courses are coming soon.
            </p>
          )}
        </div>
      </section>

      {rest.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">More courses</h2>
            <Link
              href="/courses"
              className={buttonVariants({ variant: "ghost" })}
            >
              Browse all
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
