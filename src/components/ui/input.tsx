import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-base text-sand placeholder:text-mist/60 focus:border-neon/70 focus:outline-none sm:text-sm",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";
