import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button — CSTU Design System V2.
 * Geometry: 4px radius, 500 weight, 0.01em tracking.
 * States: hover darkens + shadow, active nudges down 1px, disabled 0.35 opacity.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-sm border border-transparent bg-clip-padding font-sans text-sm font-medium tracking-[0.01em] whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-35 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary — brand red
        default:
          "bg-primary text-primary-foreground hover:bg-red-600 hover:shadow-md active:bg-red-700",
        // Secondary — red outline on transparent
        secondary:
          "border-[1.5px] border-primary bg-transparent text-primary hover:bg-red-50 active:bg-red-100 dark:hover:bg-primary/15",
        // Ghost-outline — neutral outline (used for tertiary / cancel actions)
        outline:
          "border-[1.5px] border-border bg-transparent text-body hover:border-neutral-300 hover:bg-neutral-50 dark:text-foreground dark:hover:bg-muted/50",
        // Gold accent
        gold: "bg-brand text-white hover:bg-gold-500 hover:shadow-md active:bg-gold-600 dark:text-ink",
        // Borderless ghost — icon triggers, close buttons
        ghost:
          "text-body hover:bg-neutral-100 hover:text-ink dark:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-neutral-100",
        // Destructive — subtle red
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // 10px 20px padding, ~40px tall
        default: "h-10 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        // 7px 14px, 12px text
        sm: "h-8 gap-1 px-3.5 text-xs has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        // 14px 28px, 16px text
        lg: "h-12 gap-2 px-7 text-base has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-10",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
