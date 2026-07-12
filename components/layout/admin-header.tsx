import { LogoutButton } from "@/components/auth/logout-button";
import { auth } from "@/lib/auth";
import { BASE_LINKS, ROLE, ROLE_HOME } from "@/lib/constants";
import Link from "next/link";

import { Logo } from "./logo";

const linkClass =
  "border-b-2 border-transparent hover:border-primary px-3 py-5 text-sm font-medium transition-colors";

/** Header for the /admin and /superAdmin domains: logo + role, and log out. */
export async function AdminHeader() {
  const session = await auth();
  const role = session?.user?.role;
  const authed = Boolean(session);
  const isSuper = role === ROLE.SUPER_ADMIN;
  const label = isSuper ? "Super Admin" : "Admin";
  const dashboardHref = role ? ROLE_HOME[role] : "/";

  return (
    <header className="relative bg-primary text-primary-foreground">
      <span className="absolute inset-x-0 bottom-0 h-px bg-white/20" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Logo href="/" inverted showWordmark={false} />
          <nav className="hidden items-center gap-1 md:flex">
            {BASE_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {authed ? (
            <>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-mono text-[10px] tracking-[0.08em] uppercase">
                {label}
              </span>
              <Link href={dashboardHref} className={linkClass}>
                Dashboard
              </Link>
            </>
          ) : null}
          {authed ? (
            <LogoutButton
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:border-white/70 hover:bg-white/10 hover:text-white dark:text-white"
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
