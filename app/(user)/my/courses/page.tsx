import { LogoutButton } from "@/components/auth/logout-button";
import { requireRole } from "@/lib/auth/guards";

// Placeholder — enrolled-courses list lands in P6.
export default async function MyCoursesPage() {
  const session = await requireRole("USER");
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Courses</h1>
        <LogoutButton />
      </div>
      <p className="text-muted-foreground mt-2 text-sm">
        Signed in as {session.user.email}. Your enrollments will appear here.
      </p>
    </div>
  );
}
