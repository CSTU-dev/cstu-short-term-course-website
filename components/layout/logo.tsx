import Image from 'next/image';
import Link from "next/link";

import { cn } from "@/lib/utils";


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
          "inline-flex items-center justify-center rounded-full",
          inverted ? "text-cream" : "text-primary",
        )}
      >
        <Image
          src={showWordmark ? '/brand/logo-with-name.jpg' : '/brand/logo.png'}
          alt="logo"
          width={200}
          height={50}
          className="h-10 w-auto"
          priority
        />
      </span>
    </Link>
  );
}
