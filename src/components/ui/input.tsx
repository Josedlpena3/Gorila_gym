import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-sand placeholder:text-mist/60 focus:border-neon/70 focus:outline-none",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";

