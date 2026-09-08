"use client";

import { X } from "lucide-react";
import {
  getCategoryDisplayName,
  type CatalogCategory
} from "@/components/catalog/catalog-categories";
import { useCatalogParams } from "@/components/catalog/use-catalog-params";

type ActiveChip = {
  id: string;
  label: string;
  remove: () => void;
};

/**
 * Chips de los filtros que están activos, fuera del menú.
 *
 * El panel se cierra: sin esto no hay forma de ver —ni de sacar— Creatinas o
 * ENA sin volver a abrir el hamburger. La búsqueda no va acá: ya se ve en el
 * input y se limpia con su propia X.
 */
export function ActiveFilters({
  categories
}: {
  categories: CatalogCategory[];
}) {
  const { get, getList, apply, toggleInList, clearFilters } = useCatalogParams();

  const categoryId = get("categoryId");
  const brands = getList("brand");
  const chips: ActiveChip[] = [];

  if (categoryId) {
    const category = categories.find((entry) => entry.id === categoryId);

    if (category) {
      chips.push({
        id: `cat-${category.id}`,
        label: getCategoryDisplayName(category),
        remove: () => apply({ categoryId: null })
      });
    }
  }

  for (const brand of brands) {
    chips.push({
      id: `brand-${brand}`,
      label: brand,
      remove: () => toggleInList("brand", brand)
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
          className="group inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-lg border border-hairline bg-surface px-2.5 py-1 text-xs text-mist transition hover:border-white/25 hover:text-sand"
        >
          <span className="truncate">{chip.label}</span>
          <X
            className="h-3 w-3 shrink-0 opacity-50 transition group-hover:opacity-100"
            aria-hidden="true"
          />
          <span className="sr-only">Quitar filtro {chip.label}</span>
        </button>
      ))}

      <button
        type="button"
        onClick={clearFilters}
        className="min-h-8 px-1 text-xs font-medium text-ember underline-offset-4 transition hover:underline"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
