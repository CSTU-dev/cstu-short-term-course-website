import Link from "next/link";

import { cn } from "@/lib/utils";

import { CstuSeal } from "./cstu-seal";

export function Logo({
  href = "/home",
  className,
  inverted = false,
  showWordmark = true,
}: {
  href?: string;
  className?: string;
  /** Use on dark/primary backgrounds (e.g. the admin header). */
  inverted?: boolean;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-3", className)}
      aria-label="CSTU — California Science and Technology University"
    >
      <span
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-full",
          inverted ? "text-cream" : "text-primary",
        )}
      >
        <CstuSeal className="size-10" />
      </span>
      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-heading text-lg font-bold tracking-tight",
              inverted ? "text-cream" : "text-ink",
            )}
          >
            CSTU
          </span>
          <span
            className={cn(
              "mt-0.5 font-mono text-[8px] tracking-[0.1em] uppercase",
              inverted ? "text-cream/60" : "text-muted-foreground",
            )}
          >
            California Science &amp; Technology
          </span>
        </span>
      ) : null}
    </Link>
  );
}
