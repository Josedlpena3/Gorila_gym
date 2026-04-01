import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-sand focus:border-neon/70 focus:outline-none",
      className
    )}
    {...props}
  >
    {children}
  </select>
));

Select.displayName = "Select";

