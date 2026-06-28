import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({
  href = "/home",
  className,
  inverted = false,
}: {
  href?: string;
  className?: string;
  /** Use on dark/primary backgrounds (e.g. the admin header). */
  inverted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-heading flex items-center gap-2 font-bold tracking-tight",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md text-sm font-bold",
          inverted
            ? "bg-primary-foreground text-primary"
            : "bg-primary text-primary-foreground",
        )}
      >
        CS
      </span>
      <span className="text-lg">CSTU</span>
    </Link>
  );
}
