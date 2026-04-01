import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[120px] w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-sand placeholder:text-mist/60 focus:border-neon/70 focus:outline-none",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";

