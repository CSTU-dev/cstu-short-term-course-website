import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Typography primitives for the CSTU design system.
 * Roles: Mono eyebrow → Serif headline → Sans body.
 */

/** Mono, uppercase, tracked label placed above a headline. */
function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="eyebrow"
      className={cn(
        "text-primary font-mono text-[11px] font-medium tracking-[0.12em] uppercase",
        className,
      )}
      {...props}
    />
  );
}

/** Serif display headline for page heroes. */
function PageTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="page-title"
      className={cn(
        "font-heading text-3xl leading-[1.05] font-bold tracking-tight text-balance sm:text-4xl md:text-5xl",
        className,
      )}
      {...props}
    />
  );
}

/** Serif section heading. */
function SectionTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="section-title"
      className={cn(
        "font-heading text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl",
        className,
      )}
      {...props}
    />
  );
}

/** Larger intro paragraph. */
function Lead({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="lead"
      className={cn(
        "text-muted-foreground text-lg leading-relaxed text-pretty",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Composed eyebrow + title + optional description block for section headers.
 */
function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <SectionTitle>{title}</SectionTitle>
      {description ? <Lead className="max-w-xl">{description}</Lead> : null}
      {children}
    </div>
  );
}

export { Eyebrow, PageTitle, SectionTitle, Lead, SectionHeader };
