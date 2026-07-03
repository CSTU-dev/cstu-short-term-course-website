import { CourseCard, type PublicCourse } from "@/components/courses/course-card";
import { SectionHeader } from "@/components/ui/typography";
import { getEnabledCourses } from "@/lib/data/public.queries";

export const metadata = { title: "Courses" };

export default async function CoursesPage() {
  const courses = await getEnabledCourses();
  const list: PublicCourse[] = courses.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    startAt: c.startAt,
    endAt: c.endAt,
    hasOnline: c.hasOnline,
    hasOffline: c.hasOffline,
    onlinePrice: c.onlinePrice != null ? Number(c.onlinePrice) : null,
    offlinePrice: c.offlinePrice != null ? Number(c.offlinePrice) : null,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeader
        eyebrow="Continuing Education"
        title="Courses"
        description="Professional short courses and continuing education — enroll online or on campus."
        className="mb-10"
      />
      {list.length === 0 ? (
        <p className="text-muted-foreground">
          There are no courses available right now. Please check back soon.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
