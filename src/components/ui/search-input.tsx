"use client";

import { Search, X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

type SearchInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  onClear?: () => void;
  className?: string;
};

/**
 * Campo de búsqueda con la lupa integrada.
 *
 * El icono es un hermano del input dentro de un contenedor flex, no un elemento
 * absoluto sobre él. La versión anterior lo posicionaba con `absolute` y le
 * reservaba lugar al texto con `pl-9`, pero ese padding lo pisaba `.field-base`
 * y la lupa terminaba encima del texto. Con flex el espacio lo reserva el
 * layout: no hay padding que ajustar ni cascada que pueda romperlo.
 *
 * El borde y el fondo viven en el contenedor, así que el anillo de foco rodea
 * todo el campo —icono incluido— en vez de solo el input.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, className, value, ...props }, ref) => {
    const hasValue = typeof value === "string" && value.length > 0;

    return (
      <div
        className={cn(
          "flex min-h-10 w-full items-center gap-2 rounded-xl border border-hairline bg-surface-sunken px-3 transition",
          "hover:border-white/20",
          "focus-within:border-neon/70 focus-within:ring-2 focus-within:ring-neon/25",
          className
        )}
      >
        <Search
          className="h-4 w-4 shrink-0 text-mist"
          aria-hidden="true"
        />
        <input
          ref={ref}
          type="search"
          value={value}
          {...props}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-sand outline-none placeholder:text-mist/50 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {hasValue && onClear ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Limpiar búsqueda"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-mist transition hover:bg-white/10 hover:text-sand"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
