import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default"
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "info" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        variant === "default" && "bg-white/10 text-sand",
        variant === "success" && "bg-neon/15 text-neon",
        variant === "warning" && "bg-amber-500/15 text-amber-200",
        variant === "info" && "bg-sky-500/15 text-sky-200",
        variant === "danger" && "bg-red-500/15 text-red-200"
      )}
    >
      {children}
    </span>
  );
}
