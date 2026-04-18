import Link from "next/link";
import { cn } from "@/lib/utils";

type StatusCardAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

const actionClasses: Record<NonNullable<StatusCardAction["variant"]>, string> = {
  primary:
    "bg-neon text-ink hover:bg-neon/90",
  secondary:
    "border border-line bg-white/5 text-sand hover:border-neon/60 hover:bg-white/10"
};

export function StatusCard({
  eyebrow = "Estado",
  title,
  description,
  actions = [],
  className
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: StatusCardAction[];
  className?: string;
}) {
  return (
    <div className={cn("section-card p-6 sm:p-8", className)}>
      <p className="text-xs uppercase tracking-[0.28em] text-mist">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-black uppercase tracking-[0.08em] text-sand sm:text-3xl">
        {title}
      </h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-mist sm:text-base">
        {description}
      </p>

      {actions.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={cn(
                "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition",
                actionClasses[action.variant ?? "primary"]
              )}
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
