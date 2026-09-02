"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

/**
 * Campo de contraseña con botón de mostrar/ocultar.
 *
 * Estaba duplicado en seis formularios, cada uno con su propio estado y su
 * propio markup. Centralizarlo hace que el `aria-label`, el `aria-pressed` y el
 * anillo de foco del botón sean iguales en todos lados.
 */
export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(({ className, ...props }, ref) => {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        {...props}
        type={isVisible ? "text" : "password"}
        className={cn("pr-12", className)}
      />
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        aria-label={isVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={isVisible}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-2xl text-mist transition hover:text-sand focus:outline-none focus:ring-2 focus:ring-neon/60"
      >
        {isVisible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";
