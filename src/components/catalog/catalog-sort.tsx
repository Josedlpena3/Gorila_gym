"use client";

import { ArrowDownUp } from "lucide-react";
import { useId } from "react";
import { useCatalogParams } from "@/components/catalog/use-catalog-params";

const OPTIONS = [
  { value: "relevancia", label: "Relevancia" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
  { value: "novedades", label: "Más nuevos" }
] as const;

/**
 * Un `<select>` nativo a propósito: en móvil abre el selector del sistema, que
 * se maneja mejor con el pulgar que cualquier menú propio, y llega gratis con
 * navegación por teclado y lectores de pantalla.
 */
export function CatalogSort() {
  const { get, apply } = useCatalogParams();
  const id = useId();
  const value = get("sort") ?? "relevancia";

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-mist"
      >
        <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Ordenar</span>
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) =>
          apply({
            // "relevancia" es el default: se saca de la URL en vez de escribirlo,
            // para que un enlace compartido sin orden explícito no lo arrastre.
            sort: event.target.value === "relevancia" ? null : event.target.value
          })
        }
        className="min-h-9 rounded-xl border border-hairline bg-surface-sunken px-3 py-1.5 text-sm text-sand transition hover:border-white/20 focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/25"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
