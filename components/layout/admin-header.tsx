import { LogoutButton } from "@/components/auth/logout-button";
import { auth } from "@/lib/auth";
import { ROLE } from "@/lib/constants";

import { Logo } from "./logo";

/** Header for the /admin and /superAdmin domains: logo + role, and log out. */
export async function AdminHeader() {
  const session = await auth();
  const role = session?.user?.role;
  const authed = Boolean(session);
  const isSuper = role === ROLE.SUPER_ADMIN;
  const label = isSuper ? "Super Admin" : "Admin";
  const dashboardHref = !authed
    ? "/"
    : isSuper
      ? "/superAdmin/courses"
      : "/admin/courses";

  return (
    <header className="bg-primary text-primary-foreground border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Logo
            href={dashboardHref}
            inverted
            className="text-primary-foreground"
          />
          {authed ? (
            <span className="bg-primary-foreground/15 rounded px-2 py-0.5 text-xs font-medium">
              {label}
            </span>
          ) : null}
        </div>
        {authed ? <LogoutButton variant="secondary" /> : null}
      </div>
    </header>
  );
}
