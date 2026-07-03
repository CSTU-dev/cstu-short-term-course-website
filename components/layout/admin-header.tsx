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
    <header className="relative bg-primary text-primary-foreground">
      <span className="absolute inset-x-0 bottom-0 h-px bg-white/20" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Logo href={dashboardHref} inverted />
          {authed ? (
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-mono text-[10px] tracking-[0.08em] uppercase">
              {label}
            </span>
          ) : null}
        </div>
        {authed ? (
          <LogoutButton
            variant="outline"
            className="border-white/40 bg-transparent text-white hover:border-white/70 hover:bg-white/10 hover:text-white dark:text-white"
          />
        ) : null}
      </div>
    </header>
  );
}
