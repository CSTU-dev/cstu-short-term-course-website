import { CourseCard, type PublicCourse } from "@/components/courses/course-card";
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
    priceAmount: Number(c.priceAmount),
    currency: c.currency,
    isOffline: c.isOffline,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Courses</h1>
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
