import * as React from "react";
import { cn } from "@/lib/utils";

// Sin "use client": el componente no usa hooks ni maneja eventos por su cuenta,
// solo reenvía props. Con la directiva, cada <Button> renderizado desde un
// componente servidor (los tres del header, por ejemplo) creaba un límite de
// cliente y se hidrataba sin necesidad. Los componentes cliente lo siguen
// importando con normalidad.

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-neon text-white shadow-glow hover:bg-ember disabled:bg-neon/40 disabled:text-white/60 disabled:shadow-none",
  secondary:
    "border border-hairline bg-white/[0.06] text-sand hover:border-white/25 hover:bg-white/10",
  ghost: "bg-transparent text-mist hover:bg-white/5 hover:text-sand",
  danger:
    "border border-red-500/40 bg-red-500/10 text-red-100 hover:border-red-500/60 hover:bg-red-500/20"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        // `active:scale` da respuesta al toque: antes el botón no acusaba
        // recibo del click y se sentía muerto en móvil.
        // `focus-visible` en vez de `focus` evita el anillo al hacer click con
        // el mouse, pero lo mantiene para quien navega con teclado.
        "inline-flex min-h-11 touch-manipulation items-center justify-center gap-2",
        "rounded-full px-5 py-3 text-sm font-semibold",
        "transition duration-200 motion-safe:active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
        "disabled:cursor-not-allowed disabled:opacity-60 motion-safe:disabled:active:scale-100",
        variants[variant],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
