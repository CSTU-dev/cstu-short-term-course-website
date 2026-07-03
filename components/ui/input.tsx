import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/**
 * Input — CSTU Design System V2.
 * 1.5px neutral border, 4px radius, red focus ring (red-100).
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-sm border-[1.5px] border-input bg-card px-3.5 py-2 text-[15px] text-ink transition-[color,border-color,box-shadow] outline-none",
        "placeholder:text-neutral-300",
        "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-red-100",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-300",
        "aria-invalid:border-red-400 aria-invalid:ring-[3px] aria-invalid:ring-red-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "dark:bg-input/30 dark:text-foreground dark:focus-visible:ring-red-900/40 dark:disabled:bg-input/50",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
