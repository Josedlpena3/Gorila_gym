"use client";

import { X } from "lucide-react";
import { useCatalogParams } from "@/components/catalog/use-catalog-params";
import { OBJECTIVE_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

type ActiveChip = {
  id: string;
  label: string;
  /** Cada chip sabe cómo quitarse a sí mismo sin tocar el resto. */
  remove: () => void;
};

/**
 * Resumen de lo que está filtrando ahora mismo, fuera del panel.
 *
 * Los filtros viven en un panel que se cierra, así que sin esto el usuario no
 * tiene forma de saber por qué ve 12 productos en vez de 156 — ni cómo volver
 * atrás sin abrir el panel de nuevo.
 */
export function ActiveFilters({
  categories
}: {
  categories: Array<{ id: string; name: string }>;
}) {
  const { get, getList, apply, toggleInList, clearAll } = useCatalogParams();

  const query = get("q");
  const categoryId = get("categoryId");
  const brands = getList("brand");
  const objective = get("objective");
  const minPrice = get("minPrice");
  const maxPrice = get("maxPrice");

  const chips: ActiveChip[] = [];

  if (query) {
    chips.push({
      id: "q",
      label: `“${query}”`,
      remove: () => apply({ q: null })
    });
  }

  if (categoryId) {
    const category = categories.find((entry) => entry.id === categoryId);

    if (category) {
      chips.push({
        id: `cat-${category.id}`,
        label: category.name,
        remove: () => apply({ categoryId: null })
      });
    }
  }

  // Una marca, un chip: quitar ENA no debería llevarse también a Mervick.
  for (const brand of brands) {
    chips.push({
      id: `brand-${brand}`,
      label: brand,
      remove: () => toggleInList("brand", brand)
    });
  }

  if (objective) {
    chips.push({
      id: "objective",
      label: OBJECTIVE_LABELS[objective] ?? objective,
      remove: () => apply({ objective: null })
    });
  }

  if (minPrice || maxPrice) {
    const from = minPrice ? formatCurrency(Number(minPrice)) : null;
    const to = maxPrice ? formatCurrency(Number(maxPrice)) : null;

    chips.push({
      id: "price",
      label:
        from && to ? `${from} – ${to}` : from ? `Desde ${from}` : `Hasta ${to}`,
      remove: () => apply({ minPrice: null, maxPrice: null })
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={chip.remove}
          className="group inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-lg border border-hairline bg-surface px-2 py-0.5 text-xs text-mist transition hover:border-white/25 hover:text-sand"
        >
          <span className="truncate">{chip.label}</span>
          <X
            className="h-3 w-3 shrink-0 opacity-50 transition group-hover:opacity-100"
            aria-hidden="true"
          />
          <span className="sr-only">Quitar filtro</span>
        </button>
      ))}

      {chips.length > 1 ? (
        <button
          type="button"
          onClick={clearAll}
          className="min-h-7 px-1 text-xs font-medium text-ember underline-offset-4 transition hover:underline"
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}
