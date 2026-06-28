import { RoleLoginCard } from "@/components/auth/role-login-card";

// Middleware redirects an already-authenticated superAdmin to /superAdmin/courses,
// so this page only renders for unauthenticated / wrong-role visitors.
export default function SuperAdminLoginPage() {
  return (
    <RoleLoginCard
      title="Super Admin"
      description="Sign in to manage all courses"
      redirectTo="/superAdmin/courses"
    />
  );
}
