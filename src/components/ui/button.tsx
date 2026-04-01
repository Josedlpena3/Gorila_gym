"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-neon text-ink hover:bg-neon/90 disabled:bg-neon/50 disabled:text-ink/60",
  secondary:
    "border border-line bg-white/5 text-sand hover:border-neon/60 hover:bg-white/10",
  ghost: "bg-transparent text-sand hover:bg-white/5",
  danger:
    "border border-red-500/50 bg-red-500/10 text-red-100 hover:bg-red-500/20"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-neon/60 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";

