"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

type FieldProps = {
  label: string;
  /**
   * Recibe los atributos que conectan el control con su etiqueta, su ayuda y su
   * error. Hay que esparcirlos sobre el input: `{(p) => <Input {...p} />}`.
   */
  children: (control: ControlProps) => ReactNode;
  error?: string | null;
  hint?: ReactNode;
  className?: string;
  labelClassName?: string;
};

/**
 * Etiqueta + control + error, con todo cableado entre sí.
 *
 * El `id` sale de useId(), así que el `htmlFor` siempre apunta al control real:
 * tocar la etiqueta enfoca el campo y un lector de pantalla anuncia de qué campo
 * se trata. El mensaje de error va en un contenedor con `role="alert"` para que
 * se lea al aparecer, y queda referenciado desde el input por aria-describedby.
 */
export function Field({
  label,
  children,
  error,
  hint,
  className,
  labelClassName
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={id}
        className={cn("block text-sm font-medium text-mist", labelClassName)}
      >
        {label}
      </label>

      {children({
        id,
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(error ? { "aria-invalid": true as const } : {})
      })}

      {hint ? (
        <p id={hintId} className="text-xs text-mist">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Error de formulario completo (no de un campo puntual). `role="alert"` hace que
 * el lector de pantalla lo anuncie apenas aparece, en vez de que el usuario se
 * quede esperando una respuesta que nunca escucha.
 */
export function FormError({
  children,
  className
}: {
  children?: ReactNode;
  className?: string;
}) {
  if (!children) {
    return null;
  }

  return (
    <p role="alert" className={cn("text-sm text-red-300", className)}>
      {children}
    </p>
  );
}

/**
 * Confirmación de una acción. `role="status"` la anuncia sin interrumpir lo que
 * el lector de pantalla esté leyendo.
 */
export function FormStatus({
  children,
  className
}: {
  children?: ReactNode;
  className?: string;
}) {
  if (!children) {
    return null;
  }

  return (
    <p role="status" className={cn("text-sm text-mist", className)}>
      {children}
    </p>
  );
}
