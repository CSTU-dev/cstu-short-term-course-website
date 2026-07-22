import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { BASE_LINKS, ROLE_HOME, type NavLink } from "@/lib/constants";

import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";

const linkClass =
  "text-ink/80 hover:text-primary border-b-2 border-transparent hover:border-primary px-3 py-5 text-sm font-medium transition-colors";

export async function PublicHeader() {
  const session = await auth();
  const role = session?.user?.role;

  let rightLinks: NavLink[] = [];
  let authButtons = false;
  let showLogout = false;

  if (!session) {
    authButtons = true;
  } else {
    rightLinks = [
      { label: "Dashboard", href: role ? ROLE_HOME[role] : "/" },
    ];
    showLogout = true;
  }

  const mobileLinks: NavLink[] = [
    ...BASE_LINKS,
    ...rightLinks,
    ...(authButtons
      ? [
          { label: "Sign up", href: "/signup" },
          { label: "Log in", href: "/login" },
        ]
      : []),
  ];

  return (
    <header className="bg-card sticky top-0 z-40 border-b shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {BASE_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 md:flex">
            {rightLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
          </nav>

          {authButtons ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost" })}
              >
                Log in
              </Link>
              <Link href="/signup" className={buttonVariants()}>
                Sign up
              </Link>
            </div>
          ) : null}

          {showLogout ? (
            <div className="hidden md:block">
              <LogoutButton variant="outline" />
            </div>
          ) : null}

          <MobileNav links={mobileLinks} showLogout={showLogout} />
        </div>
      </div>
    </header>
  );
}
