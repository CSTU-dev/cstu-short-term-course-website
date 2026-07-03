import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-sm border-[1.5px] border-input bg-card px-3.5 py-2.5 text-[15px] text-ink transition-[color,border-color,box-shadow] outline-none placeholder:text-neutral-300 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-300 aria-invalid:border-red-400 aria-invalid:ring-[3px] aria-invalid:ring-red-50 md:text-sm dark:bg-input/30 dark:text-foreground dark:focus-visible:ring-red-900/40 dark:disabled:bg-input/50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
