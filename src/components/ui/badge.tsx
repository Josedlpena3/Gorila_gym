import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default"
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        variant === "default" && "bg-white/10 text-sand",
        variant === "success" && "bg-neon/15 text-neon",
        variant === "warning" && "bg-ember/15 text-amber-200"
      )}
    >
      {children}
    </span>
  );
}
