import { LogoutButton } from "@/components/auth/logout-button";
import { requireRole } from "@/lib/auth/guards";

// Placeholder — full admin course list lands in P5.
export default async function AdminCoursesPage() {
  const session = await requireRole("ADMIN");
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin · Courses</h1>
        <LogoutButton />
      </div>
      <p className="text-muted-foreground mt-2 text-sm">
        Signed in as {session.user.email}. Assigned courses coming soon.
      </p>
    </div>
  );
}
