"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { label: "My Courses", href: "/my/courses" },
  { label: "Info", href: "/my/info" },
  { label: "Referrals", href: "/my/referrals" },
];

export function DashboardTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b" aria-label="Dashboard sections">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary text-primary"
                : "text-ink/70 hover:text-primary hover:border-primary/40 border-transparent",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
