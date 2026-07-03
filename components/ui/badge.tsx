import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge / Tag — CSTU Design System V2.
 * Mono, uppercase, tracked pill. Variants: red (default), outline (red),
 * gold, neutral, ink.
 */
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-3 py-[5px] font-mono text-[11px] font-medium tracking-[0.06em] whitespace-nowrap uppercase transition-all focus-visible:ring-[3px] focus-visible:ring-ring/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-white [a]:hover:bg-red-600",
        outline:
          "border-[1.5px] border-primary bg-transparent text-primary [a]:hover:bg-red-50",
        gold: "bg-gold-100 text-gold-600 [a]:hover:bg-gold-200",
        neutral:
          "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 [a]:hover:bg-neutral-200",
        secondary:
          "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 [a]:hover:bg-neutral-200",
        ink: "bg-ink text-cream dark:bg-neutral-700 dark:text-cream",
        destructive:
          "bg-destructive/10 text-destructive dark:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
