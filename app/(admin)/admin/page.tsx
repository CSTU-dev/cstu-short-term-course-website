import { RoleLoginCard } from "@/components/auth/role-login-card";

// Middleware redirects an already-authenticated admin to /admin/courses.
export default function AdminLoginPage() {
  return (
    <RoleLoginCard
      title="Admin"
      description="Sign in to manage your assigned courses"
      redirectTo="/admin/courses"
    />
  );
}
